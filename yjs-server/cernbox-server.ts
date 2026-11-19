// CERNBox's entry point for OpenCloud's Yjs server: OpenCloud's src/server.ts
// of 1.1.1, plus live editing for public link visitors. It takes the place of
// the image's src/server.ts, see patch-container.sh.
//
// OpenCloud's server only lets in users with a bearer token, which it checks
// against Graph. A public link visitor has none, and Graph does not accept the
// link's token. So the browser sends `publiclink:{"token","password","path"}`
// instead, and this server checks it with the WebDAV request web makes on a
// public link: the link must reach the file of the room, and lets the visitor
// write if it has write permission there. The visitor joins as a guest.
//
// Environment: OPENCLOUD_URL (required), PORT (1234), ADDRESS (0.0.0.0) and
// SHUTDOWN_GRACE_PERIOD_MS (15000).
import { Server } from '@hocuspocus/server'
import { deterministicColor } from './lib/color.ts'
import { parsePositiveInt } from './lib/env.ts'
import { DeniedReason, isRefusal, refuse } from './lib/errors.ts'
import { MAX_DOCUMENT_NAME_LENGTH, parseDocumentId } from './lib/graph.ts'
import { createHooks } from './lib/hooks.ts'
import type { AuthenticatePayload, YjsContext } from './lib/hooks.ts'
import { createShutdownController, installSignalHandlers } from './lib/shutdown.ts'

const opencloudUrl = (process.env.OPENCLOUD_URL ?? '').replace(/\/$/, '')
const address = process.env.ADDRESS || '0.0.0.0'

let isServerReady = false

if (!opencloudUrl) {
  console.error('OPENCLOUD_URL is required, e.g. https://cloud.example.com')
  process.exit(1)
}

let port: number
let SHUTDOWN_GRACE_PERIOD_MS: number
try {
  port = parsePositiveInt('PORT', 1234)
  SHUTDOWN_GRACE_PERIOD_MS = parsePositiveInt('SHUTDOWN_GRACE_PERIOD_MS', 15000)
} catch (e: unknown) {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
}

// ---------------------------------------------------------------------------------------------
// Public links

const PUBLIC_LINK_PREFIX = 'publiclink:'
const WEBDAV_TIMEOUT_MS = 10_000

type PublicLink = { token: string; password?: string; path: string }

/** The public link in a `publiclink:` handshake token. */
function parsePublicLink(token: string): PublicLink {
  let link: Partial<PublicLink>
  try {
    link = JSON.parse(token.slice(PUBLIC_LINK_PREFIX.length))
  } catch {
    throw refuse(DeniedReason.TokenInvalid, 'public link token is not JSON')
  }
  const segments = typeof link.path === 'string' ? link.path.split('/').filter(Boolean) : []
  if (
    typeof link.token !== 'string' ||
    !/^[A-Za-z0-9_-]+$/.test(link.token) ||
    segments.length === 0 ||
    segments.some((s) => s === '.' || s === '..')
  ) {
    throw refuse(DeniedReason.TokenInvalid, 'malformed public link token')
  }
  return {
    token: link.token,
    password: typeof link.password === 'string' ? link.password : undefined,
    path: segments.map(encodeURIComponent).join('/')
  }
}

const PROPFIND_BODY =
  '<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">' +
  '<d:prop><oc:fileid/><oc:permissions/></d:prop></d:propfind>'

function webdavProp(body: string, name: string): string | undefined {
  return new RegExp(`<(?:[\\w-]+:)?${name}>([^<]*)</`).exec(body)?.[1]
}

async function authenticatePublicLink(
  link: PublicLink,
  { documentName, connectionConfig }: AuthenticatePayload
): Promise<YjsContext> {
  if (documentName.length > MAX_DOCUMENT_NAME_LENGTH) {
    throw refuse(DeniedReason.MalformedDocument, `documentName too long (${documentName.length})`)
  }
  const { itemId } = parseDocumentId(documentName)

  const headers: Record<string, string> = {
    'public-token': link.token,
    Depth: '0',
    'Content-Type': 'application/xml'
  }
  if (link.password) {
    headers.Authorization = 'Basic ' + Buffer.from(`public:${link.password}`).toString('base64')
  }
  const res = await fetch(`${opencloudUrl}/remote.php/dav/public-files/${link.token}/${link.path}`, {
    method: 'PROPFIND',
    headers,
    body: PROPFIND_BODY,
    signal: AbortSignal.timeout(WEBDAV_TIMEOUT_MS)
  })
  if (res.status !== 207) {
    const reason =
      res.status === 401 || res.status === 403
        ? DeniedReason.TokenInvalid
        : res.status === 404
          ? DeniedReason.AccessDenied
          : DeniedReason.ServerError
    throw refuse(reason, `public link PROPFIND returned ${res.status}`)
  }

  const body = await res.text()
  const fileId = webdavProp(body, 'fileid')
  if (fileId !== itemId) {
    throw refuse(DeniedReason.AccessDenied, `the link reaches ${fileId}, not the file of the room`)
  }
  const readOnly = !(webdavProp(body, 'permissions') ?? '').includes('W')
  connectionConfig.readOnly = readOnly

  const id = `publiclink-guest:${crypto.randomUUID()}`
  console.log(
    `[onAuthenticate] document=${JSON.stringify(documentName)} public link guest readOnly=${readOnly}`
  )
  return { readOnly, user: { id, displayName: 'Guest', color: deterministicColor(id) } }
}

// ---------------------------------------------------------------------------------------------

const shutdownController = createShutdownController({
  destroy: () => server.destroy(),
  gracePeriodMs: SHUTDOWN_GRACE_PERIOD_MS,
  onForceExit: () => process.exit(1),
  onShutdownStart: () => {
    isServerReady = false
  }
})

const hooks = createHooks({
  opencloudUrl,
  lifecycle: {
    isReady: () => isServerReady,
    isShuttingDown: () => shutdownController.isShuttingDown()
  }
})

const server = new Server({
  port,
  address,
  stopOnSignals: false,
  ...hooks,
  async onAuthenticate(payload: AuthenticatePayload): Promise<YjsContext> {
    if (!payload.token?.startsWith(PUBLIC_LINK_PREFIX)) {
      return hooks.onAuthenticate(payload)
    }
    const doc = JSON.stringify(payload.documentName)
    try {
      return await authenticatePublicLink(parsePublicLink(payload.token), payload)
    } catch (e) {
      if (isRefusal(e)) {
        console.warn(`[onAuthenticate] refused public link document=${doc} reason=${e.reason}: ${e.message}`)
        throw e
      }
      console.error(`[onAuthenticate] unexpected error for a public link, document=${doc}:`, e)
      throw refuse(DeniedReason.ServerError, e instanceof Error ? e.message : String(e))
    }
  }
})

installSignalHandlers(shutdownController)

server.listen().then(
  () => {
    isServerReady = true
    console.log(`yjs server listening on ${address}:${port}, oc=${opencloudUrl}`)
  },
  (err: unknown) => {
    isServerReady = false
    console.error(`yjs server failed to listen on ${address}:${port}:`, err)
    process.exit(1)
  }
)
