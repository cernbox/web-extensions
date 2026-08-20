import type { ClientService } from '@ownclouders/web-pkg'
import type { ConnectedClient, FlowInfo } from '../types'
import * as fixtures from './__fixtures__'
import * as clientsApi from './clients'
import * as loginFlowApi from './loginFlow'

/**
 * Mock mode exists so the UI can be built and demoed before the Reva endpoints land. It is
 * opt-in per deployment via the external app's config, and the switch lives only here so the
 * production path carries no mock branches:
 *
 *   { "id": "sync-clients", "path": "...", "config": { "mock": true } }
 */
let mockEnabled = false

export const setMockMode = (enabled: boolean) => {
  mockEnabled = enabled
}

export const isMockMode = () => mockEnabled

export const getFlowInfo = (
  clientService: ClientService,
  logintoken: string,
  signal?: AbortSignal
): Promise<FlowInfo> =>
  mockEnabled
    ? fixtures.getFlowInfo(logintoken)
    : loginFlowApi.getFlowInfo(clientService, logintoken, signal)

export const grantFlow = (
  clientService: ClientService,
  logintoken: string,
  name: string,
  signal?: AbortSignal
): Promise<void> =>
  mockEnabled
    ? fixtures.grantFlow(logintoken, name)
    : loginFlowApi.grantFlow(clientService, logintoken, name, signal)

export const denyFlow = (
  clientService: ClientService,
  logintoken: string,
  signal?: AbortSignal
): Promise<void> =>
  mockEnabled ? fixtures.denyFlow() : loginFlowApi.denyFlow(clientService, logintoken, signal)

export const listClients = (
  clientService: ClientService,
  signal?: AbortSignal
): Promise<ConnectedClient[]> =>
  mockEnabled ? fixtures.listClients() : clientsApi.listClients(clientService, signal)

export const revokeClient = (
  clientService: ClientService,
  id: string,
  signal?: AbortSignal
): Promise<void> =>
  mockEnabled ? fixtures.revokeClient(id) : clientsApi.revokeClient(clientService, id, signal)

export { renameClient } from './clients'
