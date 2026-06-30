import {
  buildIncomingShareResource,
  IncomingShareResource,
  Resource,
  SpaceResource
} from '@ownclouders/web-client'
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

// Builds the absolute EOS destination path for the picked target folder.
// In CERNBox the space `driveAlias` already is the EOS path without the leading
// slash, e.g. `eos/project/c/cernbox` or `eos/user/r/rwelande`. `folder.path` is
// relative to the space root (with a leading slash).
const buildDestination = (folder: Resource, space: SpaceResource): string => {
  return `/${space.driveAlias}${folder?.path ?? ''}`
}

const processShare = (
  resource: IncomingEmbeddedShareResource,
  destination: string,
  clientService: ClientService
) => {
  // `destination` is the full absolute EOS path (see buildDestination). It is empty
  // when un-processing a share (process=false), where the destination is ignored.
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

export { loadResources, processShare, buildDestination }
export type { IncomingEmbeddedShareResource }
