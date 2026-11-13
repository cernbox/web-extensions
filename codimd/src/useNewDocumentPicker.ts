import { Resource, SpaceResource, urlJoin } from '@ownclouders/web-client'
import {
  EDITOR_MODE_EDIT,
  resolveFileNameDuplicate,
  useAppsStore,
  useClientService,
  useFileActions,
  useGetMatchingSpace,
  useMessages,
  useModals,
  useRouter,
  useSpacesStore
} from '@ownclouders/web-pkg'
import { unref } from 'vue'
import { useGettext } from 'vue3-gettext'
import LocationPickerModal from './components/LocationPickerModal.vue'

// The folder's path within `space`, or null when it does not live there. Taken from the
// webdav paths rather than `folder.path`, because a share root reports the owner's path.
const pathInSpace = (folder: Resource, space: SpaceResource): string | null => {
  const spaceRoot = space?.webDavPath?.replace(/\/+$/, '')
  const folderPath = folder?.webDavPath?.replace(/\/+$/, '')
  if (!spaceRoot || !folderPath) {
    return null
  }
  if (folderPath === spaceRoot) {
    return '/'
  }
  return folderPath.startsWith(`${spaceRoot}/`) ? folderPath.slice(spaceRoot.length) : null
}

// Lets the user pick a folder in the embedded file picker, then creates an empty document
// there and opens it.
export const useNewDocumentPicker = ({
  appId,
  extension
}: {
  appId: string
  extension: string
}) => {
  const { $gettext } = useGettext()
  const router = useRouter()
  const appsStore = useAppsStore()
  const spacesStore = useSpacesStore()
  const clientService = useClientService()
  const { dispatchModal } = useModals()
  const { showErrorMessage } = useMessages()
  const { getMatchingSpace } = useGetMatchingSpace()
  const { openEditor } = useFileActions()

  const resolveDestination = async (folder: Resource) => {
    // Project spaces and share roots are only in the store once visited, and for a space it
    // cannot find getMatchingSpace invents (and stores) a share space instead.
    if (!spacesStore.spaces.some(({ id }) => id === folder.storageId)) {
      const graphClient = clientService.graphAuthenticated
      await Promise.allSettled([
        spacesStore.reloadProjectSpaces({ graphClient }),
        spacesStore.loadMountPoints({ graphClient })
      ])
    }

    // Folders below a share root carry no share id, so getMatchingSpace cannot place them.
    // The share's space is in the store if the user browsed it here, so fall back to that.
    const space = [getMatchingSpace(folder), ...spacesStore.spaces].find(
      (candidate) => pathInSpace(folder, candidate) !== null
    )
    return space ? { space, path: pathInSpace(folder, space) } : null
  }

  const createDocument = async (space: SpaceResource, path: string) => {
    const { children } = await clientService.webdav.listFiles(space, { path })

    let fileName = `${$gettext('New file')}.${extension}`
    if (children.some(({ name }) => name === fileName)) {
      fileName = resolveFileNameDuplicate(fileName, extension, children)
    }

    return clientService.webdav.putFileContents(space, { path: urlJoin(path, fileName) })
  }

  const onLocationSelected = async (folder: Resource) => {
    try {
      const destination = await resolveDestination(folder)
      if (!destination) {
        showErrorMessage({
          title: $gettext('Could not determine the location of the selected folder.'),
          desc: $gettext('Please try again, or select a different folder.')
        })
        return
      }

      const resource = await createDocument(destination.space, destination.path)
      const appFileExtension = appsStore.fileExtensions.find(
        ({ app, extension: ext }) => app === appId && ext === extension
      )
      openEditor(appFileExtension, destination.space, resource, EDITOR_MODE_EDIT)
    } catch (e) {
      console.error(e)
      showErrorMessage({
        title: $gettext('Failed to create the document'),
        errors: [e]
      })
    }
  }

  const openNewDocumentPicker = () => {
    // Open the picker where the user is browsing, which is where the document used to go.
    const route = unref(router.currentRoute)
    const startPath =
      route.name === 'files-spaces-generic' ? router.resolve(route.fullPath).href : '/'

    dispatchModal({
      title: $gettext('Select a location for the new document'),
      elementClass: 'location-picker-modal',
      hideActions: true,
      customComponent: LocationPickerModal,
      customComponentAttrs: () => ({
        startPath,
        selectLocation: onLocationSelected
      })
    })
  }

  return { openNewDocumentPicker }
}
