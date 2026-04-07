import { buildIncomingShareResource, IncomingShareResource } from '@ownclouders/web-client'
import {
  ClientService,
  useUserStore, 
  useConfigStore,
  useResourcesStore,
  useSharesStore
} from '@ownclouders/web-pkg'

const sharesStore = useSharesStore()
const configStore = useConfigStore()
const resourcesStore = useResourcesStore()
const userStore = useUserStore()

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

const processShare = (
  resource: IncomingEmbeddedShareResource,
  destination: string,
  clientService: ClientService
) => {
  // The destination has to be set to /eos/user/<first_letter_of_username>/<username><destination>
  // note that the destination has a leading slash.
  // TODO(rawe0): obtain the full path, don't hardcore /eos/user/...
  const username = userStore.user.id
  destination = `/eos/user/${username.charAt(0).toLowerCase()}/${username}${destination}`
  clientService.httpAuthenticated
    .post(
      'sciencemesh/process-embedded-share',
      {},
      {
        params: {
          destination,
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
