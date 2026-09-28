import type { RouteLocationNamedRaw } from 'vue-router'
import {
  createFileRouteOptions,
  createLocationSpaces,
  useClientService,
  useConfigStore,
  useGetMatchingSpace,
  useSharesStore,
  useSpacesStore
} from '@ownclouders/web-pkg'
import { buildIncomingShareResource } from '@ownclouders/web-client'
import type { DriveItem } from '@ownclouders/web-client/graph/generated'

// only a found home is kept: one that shows up later (e.g. its creation failed on a previous
// login) must still be picked up on the next visit
let cachedHomeShare: { username: string; driveItem: DriveItem }

export const useHomeShare = () => {
  const clientService = useClientService()
  const configStore = useConfigStore()
  const sharesStore = useSharesStore()
  const spacesStore = useSpacesStore()
  const { getMatchingSpace } = useGetMatchingSpace()

  /**
   * Finds the home of a lightweight account: reva's create_lightweight_home_hook creates a
   * folder named after the account and shares it with the account on behalf of `owner`, the
   * account owning all lightweight homes.
   */
  const findHomeShare = async ({
    username,
    owner
  }: {
    username: string
    owner: string
  }): Promise<DriveItem> => {
    if (cachedHomeShare?.username === username) {
      return cachedHomeShare.driveItem
    }

    const driveItems = await clientService.graphAuthenticated.driveItems.listSharedWithMe()
    const driveItem = driveItems.find(
      ({ name, folder, remoteItem }) =>
        !!folder &&
        name === username &&
        remoteItem?.permissions?.some(
          ({ invitation }) => invitation?.invitedBy?.user?.id === owner
        )
    )

    if (driveItem) {
      cachedHomeShare = { username, driveItem }
    }
    return driveItem
  }

  // the same location "Shared with me" links the share to
  const createHomeShareLocation = async (driveItem: DriveItem): Promise<RouteLocationNamedRaw> => {
    if (configStore.options.routing?.fullShareOwnerPaths) {
      // shares are then routed by their owner's full path, through spaces built from the
      // mount points
      await spacesStore.loadMountPoints({ graphClient: clientService.graphAuthenticated })
    }

    const resource = buildIncomingShareResource({
      driveItem,
      graphRoles: sharesStore.graphRoles,
      serverUrl: configStore.serverUrl
    })

    return createLocationSpaces(
      'files-spaces-generic',
      createFileRouteOptions(getMatchingSpace(resource), {
        path: resource.path,
        fileId: resource.fileId
      })
    )
  }

  return { findHomeShare, createHomeShareLocation }
}
