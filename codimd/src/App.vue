<template>
  <main>
    <div class="oc-position-center">
      <oc-spinner size="xlarge" />
      <p v-translate class="oc-invisible">Loading document...</p>
    </div>
  </main>
</template>
<script lang="ts">
import { isShareSpaceResource, Resource, SpaceResource, urlJoin } from '@ownclouders/web-client'
import {
  useRoute,
  useRouter,
  useSpacesStore,
  useResourcesStore,
  useGetMatchingSpace,
  useClientService,
  useFileActions,
  resolveFileNameDuplicate,
  useAppsStore,
  EDITOR_MODE_EDIT,
  ApplicationFileExtension,
  useConfigStore,
  useWindowOpen,
  useAppConfig
} from '@ownclouders/web-pkg'
import { computed, defineComponent, onMounted, PropType, ref, unref } from 'vue'
import { useGettext } from 'vue3-gettext'

// https://cernbox.cern.ch/codimd -> https://cernbox.cern.ch/external-codimd/eos/user/<letter>/<username>/<default_folder>/New file.md

export default defineComponent({
  name: 'CodiMD Redirector',
  props: {
    resource: {
      type: Object as PropType<Resource>,
      required: true
    }
  },

  setup(props) {
    const configStore = useConfigStore()
    const appsStore = useAppsStore()
    const resourcesStore = useResourcesStore()

    const resources = computed(() => resourcesStore.resources)
    const currentFolder = computed(() => resourcesStore.currentFolder)

    const spacesStore = useSpacesStore()
    const clientService = useClientService()

    const { getMatchingSpace } = useGetMatchingSpace()
    const { $gettext } = useGettext()
    const { getEditorRouteOpts } = useFileActions()

    const { openUrl } = useWindowOpen()

    const config = computed(() => {
      const { defaultFolder = '' } = unref(
        useAppConfig({ appsStore, applicationId: 'codimd' }).applicationConfig
      )
      return { defaultFolder }
    })

    const router = useRouter()
    const route = useRoute()

    // ------------------------------------------------------------------------
    // Duplicated from useOpenEmptyEditor composable
    // Extra features: default destination folder from app config and force same tab option
    const openEditor = (
      appFileExtension: ApplicationFileExtension,
      space: SpaceResource,
      resource: Resource,
      mode: string,
      forceSameTab: boolean = false
    ) => {
      const remoteItemId = isShareSpaceResource(space) ? space.id : undefined
      const routeName = appFileExtension.routeName || appFileExtension.app
      const routeOpts = getEditorRouteOpts(routeName, space, resource, mode, remoteItemId)
      routeOpts.query = {
        ...routeOpts.query,
        // @ts-ignore
        contextRouteName: 'files-spaces-generic'
      }

      if (!forceSameTab && configStore.options.cernFeatures) {
        const editorRoute = router.resolve(routeOpts)
        const editorRouteUrl = new URL(editorRoute.href, window.location.origin)
        openUrl(editorRouteUrl.toString(), '_blank', true)
      } else {
        router.push(routeOpts)
      }
    }

    const openEmptyEditor = async (
      appId: string,
      extension: string,
      forceSameTab: boolean = false
    ) => {
      let destinationSpace = unref(currentFolder) ? getMatchingSpace(unref(currentFolder)) : null
      let destinationFiles = unref(resources)
      let filePath = unref(currentFolder)?.path

      if (!destinationSpace || !unref(currentFolder).canCreate()) {
        destinationSpace = spacesStore.personalSpace
        destinationFiles = (await clientService.webdav.listFiles(destinationSpace)).children
        filePath = ''
      }

      let fileName = $gettext('New file') + `.${extension}`

      if (destinationFiles.some((f) => f.name === fileName)) {
        fileName = resolveFileNameDuplicate(fileName, extension, destinationFiles)
      }

      const emptyResource = await clientService.webdav.putFileContents(destinationSpace, {
        path: urlJoin(filePath, fileName)
      })

      const space = getMatchingSpace(emptyResource)
      const appFileExtension = appsStore.fileExtensions.find(
        ({ app, extension: ext }) => app === appId && ext === extension
      )

      openEditor(appFileExtension, space, emptyResource, EDITOR_MODE_EDIT, forceSameTab)
    }
    // End duplicated code
    // ------------------------------------------------------------------------

    onMounted(async () => {
      if (!unref(route).params || !unref(route).params['driveAliasAndItem']) {
        // set default folder if configured
        if (unref(config) && unref(config).defaultFolder) {
          const rootFolderResources = await clientService.webdav.listFiles(
            spacesStore.personalSpace
          )
          let defaultFolderResource = rootFolderResources.children.find(
            (res) => res.isFolder && res.name === unref(config).defaultFolder
          )
          // if default folder not found, we create in personal space root
          if (!defaultFolderResource) {
            defaultFolderResource = await clientService.webdav.createFolder(
              spacesStore.personalSpace,
              {
                path: unref(config).defaultFolder
              }
            )
          }
          const resources = await clientService.webdav.listFiles(spacesStore.personalSpace, {
            path: defaultFolderResource.path
          })
          resourcesStore.clearResourceList()
          resourcesStore.initResourceList({
            resources: resources.children,
            currentFolder: defaultFolderResource
          })
        }
        openEmptyEditor('codimd', 'md', true)
      } else {
        router.replace({
          path: `/external-codimd/${spacesStore.personalSpace.driveAlias}${props.resource.path}`,
          query: unref(route).query,
          replace: true
        })
      }
    })
  }
})
</script>
