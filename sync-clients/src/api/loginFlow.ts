import type { ClientService } from '@ownclouders/web-pkg'
import type { FlowInfo } from '../types'
import { ocsUrl, unwrapOcs } from '../helpers/ocs'

/**
 * The browser half of the login flow lives under OCS, alongside the connected-clients endpoints.
 * Only the endpoints the sync client itself calls (init and poll) have to sit on the
 * `/index.php/login/v2` prefix those clients hard-code; this side is our own code, so it uses the
 * natural OCS path.
 *
 * Relative on purpose: httpAuthenticated is based at `configStore.serverUrl`.
 */
const flowPath = (logintoken: string) =>
  `/ocs/v2.php/cloud/user/login-flow/${encodeURIComponent(logintoken)}`

export const getFlowInfo = (
  clientService: ClientService,
  logintoken: string,
  signal?: AbortSignal
): Promise<FlowInfo> =>
  clientService.httpAuthenticated
    .get(ocsUrl(flowPath(logintoken)), { signal })
    .then(({ data }) => unwrapOcs<FlowInfo>(data))

export const grantFlow = async (
  clientService: ClientService,
  logintoken: string,
  name: string,
  signal?: AbortSignal
): Promise<void> => {
  await clientService.httpAuthenticated.post(
    ocsUrl(`${flowPath(logintoken)}/grant`),
    { name },
    { signal }
  )
}

export const denyFlow = async (
  clientService: ClientService,
  logintoken: string,
  signal?: AbortSignal
): Promise<void> => {
  await clientService.httpAuthenticated.post(ocsUrl(`${flowPath(logintoken)}/deny`), {}, { signal })
}
