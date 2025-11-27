<template>
  <iframe
    id="drawio-editor"
    ref="drawIoEditor"
    :src="iframeSource"
    :title="$gettext('Draw.io editor')"
  />
</template>

<script lang="ts">
import { isShareSpaceResource, Resource, SpaceResource, urlJoin } from '@ownclouders/web-client'
import {
  AppConfigObject,
  ApplicationFileExtension,
  EDITOR_MODE_EDIT,
  resolveFileNameDuplicate,
  useAppsStore,
  useClientService,
  useConfigStore,
  useFileActions,
  useGetMatchingSpace,
  useResourcesStore,
  useRoute,
  useRouter,
  useSpacesStore,
  useThemeStore,
  useWindowOpen
} from '@ownclouders/web-pkg'
import qs from 'qs'
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
  unref,
  watch
} from 'vue'
import { useGettext } from 'vue3-gettext'

export default defineComponent({
  name: 'DrawIoEditor',
  props: {
    resource: {
      type: Object as PropType<Resource>,
      required: true
    },
    applicationConfig: {
      type: Object as PropType<AppConfigObject>,
      required: true,
      // hack so the correct type is being used for the app config
      default: (): AppConfigObject => undefined
    },
    currentContent: {
      type: String,
      required: true
    },
    isReadOnly: {
      type: Boolean,
      required: true
    },
    isDirty: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:currentContent', 'save', 'close'],
  setup(props, { emit }) {
    const language = useGettext()
    const { $gettext } = language
    const themeStore = useThemeStore()

    // Only used for opening empty editor in same tab if needed
    const configStore = useConfigStore()
    const appsStore = useAppsStore()
    const resourcesStore = useResourcesStore()
    const resources = ref(resourcesStore.resources)
    const currentFolder = ref(resourcesStore.currentFolder)
    const spacesStore = useSpacesStore()
    const clientService = useClientService()
    const { getMatchingSpace } = useGetMatchingSpace()
    const { getEditorRouteOpts } = useFileActions()
    const { openUrl } = useWindowOpen()
    const router = useRouter()
    const route = useRoute()

    const drawIoEditor = ref<HTMLElement>()

    const config = computed(() => {
      const { url = 'https://embed.diagrams.net', theme = 'minimal' } = props.applicationConfig
      return { url, theme }
    })

    const urlHost = computed(() => {
      const url = new URL(unref(config).url)
      const urlHost = `${url.protocol}//${url.hostname}`
      return url.port ? `${urlHost}:${url.port}` : urlHost
    })

    const iframeSource = computed(() => {
      const query = qs.stringify({
        embed: 1,
        chrome: props.isReadOnly ? 0 : 1,
        picker: 0,
        stealth: 1,
        spin: 1,
        splash: 0,
        saveAndExit: 0,
        noSaveBtn: 1,
        noExitBtn: 1,
        proto: 'json',
        lang: language.current,
        dark: themeStore.currentTheme.isDark ? 1 : 0,
        ui: unref(config).theme
      })

      return `${unref(config).url}?${query}`
    })

    const loadCurrentContent = () => {
      postMessage({
        action: 'load',
        xml: props.currentContent,
        autosave: true
      })
    }

    watch(
      () => props.isDirty,
      () => {
        postMessage({
          action: 'status',
          modified: props.isDirty
        })
      }
    )

    watch(
      () => props.resource,
      () => {
        loadCurrentContent()
      }
    )

    const postMessage = (
      payload:
        | { action: string; xml: string; autosave?: boolean }
        | { action: 'status'; modified: boolean }
    ) => {
      try {
        if (!unref(drawIoEditor)) {
          return
        }
        return (unref(drawIoEditor) as HTMLIFrameElement).contentWindow.postMessage(
          JSON.stringify(payload),
          unref(urlHost)
        )
      } catch (e) {
        console.error(e)
      }
    }

    const handleMessage = async (event: MessageEvent) => {
      if (event.data.length > 0) {
        if (event.origin !== unref(config).url) {
          return
        }
        await nextTick()
        const payload = JSON.parse(event.data)
        switch (payload?.event) {
          case 'init':
            loadCurrentContent()
            break
          case 'autosave':
            emit('update:currentContent', payload.xml)
            break
          case 'save':
            emit('save')
            break
          case 'exit':
            emit('close')
            break
        }
      }
    }

    // ------------------------------------------------------------------------
    // Duplicated from useOpenEmptyEditor composable to force same tab opening
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

    onMounted(() => {
      window.addEventListener('message', handleMessage)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('message', handleMessage)
    })

    return {
      config,
      drawIoEditor,
      iframeSource,
      $gettext
    }
  }
})
</script>
<style scoped>
#drawio-editor {
  width: 100%;
  height: 100%;
  border: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
