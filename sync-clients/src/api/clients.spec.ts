import type { ClientService } from '@ownclouders/web-pkg'
import { listClients, renameClient, revokeClient } from './clients'

const rows = [
  {
    id: 'cid',
    name: 'Office desktop',
    description: 'Nextcloud-Desktop',
    created_at: 'x',
    last_seen_at: null
  }
]

const clientServiceMock = (data: unknown) => {
  const get = vi.fn().mockResolvedValue({ data })
  const del = vi.fn().mockResolvedValue({})
  const patch = vi.fn().mockResolvedValue({})
  return { httpAuthenticated: { get, delete: del, patch } } as unknown as ClientService & {
    httpAuthenticated: {
      get: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
      patch: ReturnType<typeof vi.fn>
    }
  }
}

describe('listClients', () => {
  it('unwraps an OCS envelope', async () => {
    const clientService = clientServiceMock({ ocs: { meta: {}, data: rows } })
    await expect(listClients(clientService)).resolves.toEqual(rows)
  })

  it('accepts a bare array', async () => {
    const clientService = clientServiceMock(rows)
    await expect(listClients(clientService)).resolves.toEqual(rows)
  })

  it('returns an empty list when the body is empty', async () => {
    const clientService = clientServiceMock(null)
    await expect(listClients(clientService)).resolves.toEqual([])
  })
})

describe('revokeClient', () => {
  it('escapes the client id', async () => {
    const clientService = clientServiceMock(rows)
    await revokeClient(clientService, 'a/b')
    expect(clientService.httpAuthenticated.delete).toHaveBeenCalledWith(
      '/ocs/v2.php/cloud/user/clients/a%2Fb?format=json',
      { signal: undefined }
    )
  })
})

describe('renameClient', () => {
  // the endpoint itself is backend ticket #6 and 404s today; this pins the request shape
  it('patches the name', async () => {
    const clientService = clientServiceMock(rows)
    await renameClient(clientService, 'cid', 'new')
    expect(clientService.httpAuthenticated.patch).toHaveBeenCalledWith(
      '/ocs/v2.php/cloud/user/clients/cid?format=json',
      { name: 'new' },
      { signal: undefined }
    )
  })
})
