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
  useSharesStore,
  useSpacesStore
} from '@ownclouders/web-pkg'

const sharesStore = useSharesStore()
const configStore = useConfigStore()
const resourcesStore = useResourcesStore()
const spacesStore = useSpacesStore()

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

let spacesLoaded: Promise<unknown> | undefined

// Project spaces and share roots are not in the store on this page, but
// getMatchingSpace needs them. Pass force to pick up a space added since.
const ensureSpacesLoaded = (clientService: ClientService, force = false) => {
  if (!spacesLoaded || force) {
    const graphClient = clientService.graphAuthenticated
    spacesLoaded = Promise.allSettled([
      spacesStore.reloadProjectSpaces({ graphClient }),
      spacesStore.loadMountPoints({ graphClient })
    ])
  }

  return spacesLoaded
}

// Builds the absolute EOS destination path for the picked target folder.
// In CERNBox the space `driveAlias` already is the EOS path without the leading
// slash, e.g. `eos/project/c/cernbox` or `eos/user/r/rwelande`. `folder.path` is
// relative to the space root (with a leading slash).
// Null when the folder was not listed in `space`, as getMatchingSpace invents a
// share space when it cannot resolve one, which yields a path that does not exist.
const buildDestination = (folder: Resource, space: SpaceResource): string | null => {
  if (!space?.driveAlias || !folder?.storageId || space.id !== folder.storageId) {
    return null
  }
  if (folder.webDavPath && space.webDavPath && !folder.webDavPath.startsWith(space.webDavPath)) {
    return null
  }

  return `/${space.driveAlias}${folder.path ?? ''}`
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

export { loadResources, processShare, buildDestination, ensureSpacesLoaded }
export type { IncomingEmbeddedShareResource }
