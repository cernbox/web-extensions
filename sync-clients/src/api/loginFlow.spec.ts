import type { ClientService } from '@ownclouders/web-pkg'
import { denyFlow, getFlowInfo, grantFlow } from './loginFlow'

const TOKEN = 'aGVsbG8td29ybGQ'

const clientServiceMock = (infoData: unknown = { client_id: 'cid' }) => {
  const get = vi.fn().mockResolvedValue({ data: infoData })
  const post = vi.fn().mockResolvedValue({ data: { status: 'ok' } })
  return { httpAuthenticated: { get, post } } as unknown as ClientService & {
    httpAuthenticated: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }
  }
}

describe('loginFlow api', () => {
  it('reads flow info from the OCS login-flow endpoint', async () => {
    const clientService = clientServiceMock()
    await expect(getFlowInfo(clientService, TOKEN)).resolves.toEqual({ client_id: 'cid' })
    expect(clientService.httpAuthenticated.get).toHaveBeenCalledWith(
      `/ocs/v2.php/cloud/user/login-flow/${TOKEN}?format=json`,
      { signal: undefined }
    )
  })

  it('unwraps an OCS envelope around the flow info', async () => {
    const clientService = clientServiceMock({ ocs: { meta: {}, data: { client_id: 'cid' } } })
    await expect(getFlowInfo(clientService, TOKEN)).resolves.toEqual({ client_id: 'cid' })
  })

  it('sends the device name in the grant body', async () => {
    const clientService = clientServiceMock()
    await grantFlow(clientService, TOKEN, "Diogo's laptop")
    expect(clientService.httpAuthenticated.post).toHaveBeenCalledWith(
      `/ocs/v2.php/cloud/user/login-flow/${TOKEN}/grant?format=json`,
      { name: "Diogo's laptop" },
      { signal: undefined }
    )
  })

  it('posts an empty body on deny', async () => {
    const clientService = clientServiceMock()
    await denyFlow(clientService, TOKEN)
    expect(clientService.httpAuthenticated.post).toHaveBeenCalledWith(
      `/ocs/v2.php/cloud/user/login-flow/${TOKEN}/deny?format=json`,
      {},
      { signal: undefined }
    )
  })

  it('escapes a token that would otherwise break out of the path', async () => {
    const clientService = clientServiceMock()
    await getFlowInfo(clientService, '../../evil')
    expect(clientService.httpAuthenticated.get).toHaveBeenCalledWith(
      '/ocs/v2.php/cloud/user/login-flow/..%2F..%2Fevil?format=json',
      { signal: undefined }
    )
  })
})
