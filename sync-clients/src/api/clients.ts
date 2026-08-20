import type { ClientService } from '@ownclouders/web-pkg'
import type { ConnectedClient } from '../types'
import { ocsUrl, unwrapOcs } from '../helpers/ocs'

const CLIENTS_PATH = '/ocs/v2.php/cloud/user/clients'

export const listClients = (
  clientService: ClientService,
  signal?: AbortSignal
): Promise<ConnectedClient[]> =>
  clientService.httpAuthenticated
    .get(ocsUrl(CLIENTS_PATH), { signal })
    .then(({ data }) => unwrapOcs<ConnectedClient[]>(data) ?? [])

export const revokeClient = async (
  clientService: ClientService,
  id: string,
  signal?: AbortSignal
): Promise<void> => {
  await clientService.httpAuthenticated.delete(
    ocsUrl(`${CLIENTS_PATH}/${encodeURIComponent(id)}`),
    { signal }
  )
}

/**
 * Renaming a client after enrolment. The endpoint does not exist server-side yet - it is
 * backend ticket #6 - so this currently 404s and nothing calls it. Written out in full so the
 * phase 3 UI work is only about the UI.
 */
export const renameClient = async (
  clientService: ClientService,
  id: string,
  name: string,
  signal?: AbortSignal
): Promise<void> => {
  await clientService.httpAuthenticated.patch(
    ocsUrl(`${CLIENTS_PATH}/${encodeURIComponent(id)}`),
    { name },
    { signal }
  )
}
