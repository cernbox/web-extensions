import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { isSeeded, seedScene } from './scene'

// Stateless messages of OpenCloud's Yjs server (services/yjs/src/lib/grants.ts and identity.ts).
const SEED_REQUEST = '_oc_grant_request:seed'
const SEED_GRANTED = '_oc_grant_granted:seed'
const IDENTITY_PREFIX = '_oc_identity:'

export interface Room {
  doc: Y.Doc
  provider: HocuspocusProvider
}

export interface JoinOptions {
  url: string
  fileId: string
  token: () => string
  /** The file as loaded, and its etag, for an empty room. */
  content: string
  etag: string
  canWrite: boolean
  timeoutMs?: number
}

/**
 * Joins the room of a file on the Yjs server. Resolves to null when the room cannot be used: the
 * server does not answer or refuses us, or the room is empty and we may not write to it.
 */
export const joinRoom = ({
  url,
  fileId,
  token,
  content,
  etag,
  canWrite,
  timeoutMs = 10_000
}: JoinOptions) =>
  new Promise<Room | null>((resolve, reject) => {
    const doc = new Y.Doc()
    let done = false

    const finish = (joined: boolean, reason?: string, error?: unknown) => {
      if (done) {
        return
      }
      done = true
      clearTimeout(timer)
      doc.off('update', onUpdate)
      if (!joined) {
        console.warn(`excalidraw: no live editing for ${fileId}: ${reason}`)
        provider.destroy()
        doc.destroy()
      }
      if (error) {
        reject(error)
      } else {
        resolve(joined ? { doc, provider } : null)
      }
    }

    // Another client may load the file while we wait to be picked.
    const onUpdate = () => {
      if (isSeeded(doc)) {
        finish(true)
      }
    }

    const seed = () => {
      if (isSeeded(doc)) {
        return
      }
      try {
        seedScene(doc, content, etag)
        finish(true)
      } catch (e) {
        finish(false, 'the file is not a valid drawing', e)
      }
    }

    const provider = new HocuspocusProvider({
      url,
      // The prefix keeps apps with another document layout out of this room, and the suffix is
      // the layout's version. The server strips both before it asks reva about the file.
      name: `excalidraw::${fileId}:1`,
      document: doc,
      token,
      onAuthenticationFailed: ({ reason }) => finish(false, `refused by the server (${reason})`),
      onStateless: ({ payload }) => {
        if (payload.startsWith(IDENTITY_PREFIX)) {
          // The server never echoes our own awareness back, so it tells us who we are this way.
          provider.setAwarenessField('user', JSON.parse(payload.slice(IDENTITY_PREFIX.length)))
        } else if (payload === SEED_GRANTED) {
          seed()
        }
      },
      onSynced: () => {
        if (isSeeded(doc)) {
          finish(true)
        } else if (!canWrite) {
          finish(false, 'nobody with write access has the drawing open')
        } else {
          // Only one client may load the file into an empty room, or the drawing lands twice.
          // The server picks one, and passes the job on if that client leaves first.
          doc.on('update', onUpdate)
          provider.sendStateless(SEED_REQUEST)
        }
      }
    })

    const timer = setTimeout(() => finish(false, `no answer in ${timeoutMs / 1000} s`), timeoutMs)
  })
