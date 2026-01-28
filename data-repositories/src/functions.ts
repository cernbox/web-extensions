import { buildIncomingShareResource, IncomingShareResource } from '@ownclouders/web-client'
import {
  ClientService,
  useConfigStore,
  useResourcesStore,
  useSharesStore
} from '@ownclouders/web-pkg'

const sharesStore = useSharesStore()
const configStore = useConfigStore()
const resourcesStore = useResourcesStore()

interface IncomingEmbeddedShareResource extends IncomingShareResource {
  status: string
}

const firstLetterUppercase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const loadResources = (clientService: ClientService) => {
  clientService.httpAuthenticated.get('sciencemesh/embedded-shares').then((response: any) => {
    const resources: IncomingEmbeddedShareResource[] = response.data.value.map((driveItem: any) => {
      return {
        ...buildIncomingShareResource({
          driveItem,
          graphRoles: sharesStore.graphRoles,
          serverUrl: configStore.serverUrl
        }),
        status: response.data.state
          ? firstLetterUppercase(response.data.state[driveItem.id])
          : 'unknown'
      }
    })
    resourcesStore.initResourceList({
      currentFolder: null,
      resources
    })
  })
}

const processShare = (resource: IncomingEmbeddedShareResource, clientService: ClientService) => {
  console.log('Processing share:', resource)
  clientService.httpAuthenticated
    .post(
      'sciencemesh/process-embedded-share',
      {},
      {
        params: {
          destination: resource.path,
          share_id: resource.id,
          process: resource.status.toLowerCase() === 'pending' ? 'true' : 'false'
        }
      }
    )
    .then(() => {
      loadResources(clientService)
    })
}

export { loadResources, processShare }
export type { IncomingEmbeddedShareResource }
