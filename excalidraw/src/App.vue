<template>
  <p
    v-if="!initialData"
    class="oc-p-m"
    v-text="$gettext('This file is not a valid Excalidraw drawing.')"
  />
  <div v-else-if="joining" class="oc-flex oc-flex-center oc-flex-middle oc-height-1-1">
    <oc-spinner size="large" :aria-label="$gettext('Joining the drawing')" />
  </div>
  <!-- Excalidraw uses Escape to deselect and leave tools, so it must not reach the app
       wrapper, which closes the file on Escape. The handlers only watch events from the
       editor inside; the div itself is not interactive. -->
  <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <div
    v-else
    class="excalidraw-app"
    @keydown.esc.stop
    @keydown.capture="onKeydown"
    @pointerdown.capture="touch"
    @paste.capture="touch"
    @drop.capture="touch"
  >
    <div ref="editorEl" class="excalidraw-app" />
  </div>
</template>

<script setup lang="ts">
import { Excalidraw, languages, serializeAsJSON } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type {
  AppState,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  ExcalidrawProps
} from '@excalidraw/excalidraw/types'
import { Resource } from '@ownclouders/web-client'
import { useAuthStore, useMessages, useThemeStore } from '@ownclouders/web-pkg'
import { createElement } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import { ExcalidrawBinding, yjsToExcalidraw } from 'y-excalidraw'
import * as Y from 'yjs'
import { joinRoom, Room } from './collab/room'
import { syncWithWrapper } from './collab/saves'
import {
  observeSettings,
  readSettings,
  sceneElements,
  sceneFiles,
  SceneSettings,
  writeSettings
} from './collab/scene'
import './fonts'

type OnChangeArgs = Parameters<NonNullable<ExcalidrawProps['onChange']>>

const props = defineProps<{
  resource: Resource
  currentContent: string
  isReadOnly: boolean
  isDirty: boolean
  applicationConfig?: Record<string, unknown>
  // CERNBox's AppWrapper passes the etag it saves with. Without it the clients could not hand
  // each other their saves, so the drawing is not shared.
  currentETag?: string
}>()
const emit = defineEmits<{
  'update:currentContent': [content: string]
  'update:serverState': [state: { etag: string; content?: string }]
}>()

const language = useGettext()
const { $gettext } = language
const themeStore = useThemeStore()
const authStore = useAuthStore()
const { showErrorMessage } = useMessages()

const parseScene = (content: string): ExcalidrawInitialDataState | null => {
  // A file created with "New" stays empty until it is first saved.
  if (!content.trim()) {
    return {}
  }
  try {
    const { elements, appState, files } = JSON.parse(content)
    if (!Array.isArray(elements)) {
      return null
    }
    return { elements, appState, files, scrollToContent: true }
  } catch {
    return null
  }
}

const loadedContent = props.currentContent
const initialData = parseScene(loadedContent)

// ---------------------------------------------------------------------------------------------
// Editing alone: the content comes from Excalidraw itself.

// Excalidraw normalises a drawing when it loads it, and again once its fonts arrive, so what it
// serialises differs from the file before anyone has edited it. Until the user touches the
// editor, every serialised scene is taken as the unchanged file.
let touched = false
let loadedScene: string | undefined
let lastEmitted = loadedContent

// onChange fires on every pointer move, so serialising waits until the user pauses.
let pendingChange: OnChangeArgs | undefined
let flushTimer: ReturnType<typeof setTimeout> | undefined

const flushLocal = () => {
  clearTimeout(flushTimer)
  if (!pendingChange) {
    return
  }
  const [elements, appState, files] = pendingChange
  pendingChange = undefined
  const scene = serializeAsJSON(elements, appState, files, 'local')

  if (!touched || loadedScene === undefined) {
    loadedScene = scene
    return
  }
  // When undo takes the scene back to exactly what was loaded, hand back the file as it was, so
  // it is no longer dirty.
  const content = scene === loadedScene ? loadedContent : scene
  if (content !== lastEmitted) {
    lastEmitted = content
    emit('update:currentContent', content)
  }
}

const onLocalChange = (...args: OnChangeArgs) => {
  if (props.isReadOnly) {
    return
  }
  pendingChange = args
  clearTimeout(flushTimer)
  flushTimer = setTimeout(flushLocal, 300)
}

// The scene Excalidraw has settled on before the first input is the unchanged file, even if the
// pause that would serialise it has not passed yet.
const touch = () => {
  if (!touched) {
    flushLocal()
    touched = true
  }
}

// ---------------------------------------------------------------------------------------------
// Editing together: the content comes from the room on the Yjs server, which y-excalidraw keeps
// in step with Excalidraw.

const yjsServerUrl = props.applicationConfig?.yjsServerUrl
const joining = ref(
  Boolean(initialData && typeof yjsServerUrl === 'string' && props.currentETag !== undefined)
)
let room: Room | null = null
let roomInitialData: ExcalidrawInitialDataState | undefined
let sync: ReturnType<typeof syncWithWrapper> | undefined
let binding: ExcalidrawBinding | undefined
let undoManager: Y.UndoManager | undefined
let unobserveSettings: (() => void) | undefined

const join = async () => {
  room = await joinRoom({
    url: yjsServerUrl as string,
    fileId: props.resource.fileId ?? props.resource.id,
    token: () => authStore.accessToken,
    content: loadedContent,
    etag: props.currentETag as string,
    canWrite: !props.isReadOnly
  }).catch((e) => {
    console.error('excalidraw: cannot join the drawing', e)
    return null
  })
  if (!room) {
    if (!props.isReadOnly) {
      showErrorMessage({
        title: $gettext('Live editing is not available'),
        desc: $gettext('Others who open this drawing will not see your changes until you save.')
      })
    }
    return
  }

  const { doc } = room
  roomInitialData = {
    elements: yjsToExcalidraw(sceneElements(doc)) as ExcalidrawInitialDataState['elements'],
    appState: readSettings(doc),
    files: Object.fromEntries(sceneFiles(doc).entries()),
    scrollToContent: true
  }
  if (!props.isReadOnly) {
    sync = syncWithWrapper(doc, {
      isDirty: () => props.isDirty,
      content: () => props.currentContent,
      setContent: (content) => emit('update:currentContent', content),
      setServerState: (state) => emit('update:serverState', state)
    })
  }
}

watch(
  () => props.currentETag,
  (etag) => sync?.etagChanged(etag ?? '')
)

const bindRoom = (api: ExcalidrawImperativeAPI) => {
  if (!room) {
    return
  }
  const { doc, provider } = room
  // y-excalidraw undoes only the local user's own changes, through its own undo manager.
  undoManager = props.isReadOnly ? undefined : new Y.UndoManager(sceneElements(doc))
  binding = new ExcalidrawBinding(
    sceneElements(doc),
    sceneFiles(doc),
    api,
    provider.awareness,
    undoManager && unref(editorEl) ? { excalidrawDom: unref(editorEl), undoManager } : undefined
  )
  unobserveSettings = observeSettings(doc, (settings) =>
    // Excalidraw keeps the settings missing from the drawing as they are.
    api.updateScene({ appState: settings as Pick<AppState, keyof SceneSettings> })
  )
}

const onRoomChange = (...[, appState]: OnChangeArgs) => {
  if (room && !props.isReadOnly) {
    writeSettings(room.doc, appState)
  }
}

// ---------------------------------------------------------------------------------------------

const onKeydown = (event: KeyboardEvent) => {
  touch()
  // The app wrapper saves on Ctrl+S further up, so the last change must be in before it does.
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    if (sync) {
      sync.flush()
    } else {
      flushLocal()
    }
  }
}

const langCode = computed(() => {
  const current = language.current
  const match = languages.find(({ code }) => code === current || code.startsWith(`${current}-`))
  return match?.code ?? 'en'
})

const editorEl = ref<HTMLElement>()
let root: Root | undefined

const render = () => {
  root?.render(
    createElement(Excalidraw, {
      initialData: roomInitialData ?? initialData,
      onChange: room ? onRoomChange : onLocalChange,
      // The binding updates the scene, which Excalidraw only takes once it has mounted.
      excalidrawAPI: (api) => setTimeout(() => bindRoom(api)),
      onPointerUpdate: (payload) => binding?.onPointerUpdate(payload),
      isCollaborating: Boolean(room),
      name: props.resource.name.replace(/\.excalidraw$/, ''),
      theme: themeStore.currentTheme.isDark ? 'dark' : 'light',
      langCode: unref(langCode),
      viewModeEnabled: props.isReadOnly,
      autoFocus: true,
      UIOptions: {
        canvasActions: {
          // CERNBox opens and saves the file; Excalidraw's own open and save would bypass it.
          loadScene: false,
          saveToActiveFile: false,
          // The theme follows CERNBox.
          toggleTheme: false
        }
      }
    })
  )
}

watch(() => [themeStore.currentTheme.isDark, unref(langCode)], render)

onMounted(async () => {
  if (unref(joining)) {
    await join()
    joining.value = false
    await nextTick()
  }
  if (!unref(editorEl)) {
    return
  }
  root = createRoot(unref(editorEl))
  render()
})

onBeforeUnmount(() => {
  clearTimeout(flushTimer)
  root?.unmount()
  sync?.stop()
  unobserveSettings?.()
  binding?.destroy()
  undoManager?.destroy()
  room?.provider.destroy()
  room?.doc.destroy()
})
</script>

<style scoped>
.excalidraw-app {
  width: 100%;
  height: 100%;
}
</style>
