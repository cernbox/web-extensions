import type { ConnectedClient, FlowInfo } from '../../types'

/** Mimics an axios rejection closely enough for `statusOf()` in ../../helpers/http. */
const httpError = (status: number) =>
  Object.assign(new Error(`mock http ${status}`), { response: { status } })

const isoIn = (seconds: number) => new Date(Date.now() + seconds * 1000).toISOString()

/** Mirrors the length cap asked for in backend ticket #1. */
const MAX_NAME_LENGTH = 64

/**
 * The mock reads the login token to decide which branch to exercise, so the whole manual test
 * matrix is reachable without a backend:
 *
 *   /login-flow/expired    flow is already gone     -> expired screen on load
 *   /login-flow/short      expires in 20 seconds    -> watch it lapse while open
 *   /login-flow/conflict   grant loses the CAS race -> expired screen on submit
 *   /login-flow/boom       server error             -> error screen
 *   anything else          healthy 20 minute flow
 */
export const getFlowInfo = (logintoken: string): Promise<FlowInfo> => {
  if (logintoken.includes('expired')) {
    return Promise.reject(httpError(404))
  }
  if (logintoken.includes('boom')) {
    return Promise.reject(httpError(500))
  }
  return Promise.resolve({
    client_id: '9c5a1f2e-4b7d-4a2e-9f31-0c7a1b2d3e4f',
    client_label: 'Nextcloud-Desktop 3.16.0 (Linux)',
    created_at: isoIn(-120),
    expires_at: isoIn(logintoken.includes('short') ? 20 : 1200),
    server_time: isoIn(0)
  })
}

export const grantFlow = (logintoken: string, name: string): Promise<void> => {
  if (logintoken.includes('conflict')) {
    return Promise.reject(httpError(409))
  }
  if (!name || name.length > MAX_NAME_LENGTH) {
    return Promise.reject(httpError(400))
  }
  return Promise.resolve()
}

export const denyFlow = (): Promise<void> => Promise.resolve()

const clients: ConnectedClient[] = [
  {
    id: '9c5a1f2e-4b7d-4a2e-9f31-0c7a1b2d3e4f',
    name: 'Office desktop',
    description: 'Nextcloud-Desktop 3.16.0 (Linux)',
    created_at: isoIn(-60 * 60 * 24 * 30),
    last_seen_at: isoIn(-60 * 12)
  },
  {
    id: 'ab1c3d5e-7f90-4a2b-8c1d-2e3f4a5b6c7d',
    name: 'Laptop',
    description: 'Nextcloud-Desktop 3.15.2 (Windows)',
    created_at: isoIn(-60 * 60 * 24 * 200),
    last_seen_at: null
  }
]

export const listClients = (): Promise<ConnectedClient[]> => Promise.resolve([...clients])

export const revokeClient = (id: string): Promise<void> => {
  const index = clients.findIndex((client) => client.id === id)
  if (index === -1) {
    return Promise.reject(httpError(404))
  }
  clients.splice(index, 1)
  return Promise.resolve()
}
