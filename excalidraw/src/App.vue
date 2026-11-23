<template>
  <p
    v-if="!initialData"
    class="oc-p-m"
    v-text="$gettext('This file is not a valid Excalidraw drawing.')"
  />
  <!-- Excalidraw uses Escape to deselect and leave tools, so it must not reach the app
       wrapper, which closes the file on Escape. The handler only watches events from the
       editor inside; the div itself is not interactive. -->
  <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <div v-else class="excalidraw-app" @keydown.esc.stop>
    <div ref="editorEl" class="excalidraw-app" />
  </div>
</template>

<script setup lang="ts">
import { Excalidraw, languages } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type {
  AppState,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  ExcalidrawProps
} from '@excalidraw/excalidraw/types'
import { Resource } from '@ownclouders/web-client'
import { useThemeStore } from '@ownclouders/web-pkg'
import { createElement } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import { ExcalidrawBinding, yjsToExcalidraw } from 'y-excalidraw'
import type { Awareness } from 'y-protocols/awareness'
import * as Y from 'yjs'
import {
  observeSettings,
  parseScene,
  readSettings,
  sceneElements,
  sceneFiles,
  SceneSettings,
  writeSettings
} from './collab/scene'
import './fonts'

type OnChangeArgs = Parameters<NonNullable<ExcalidrawProps['onChange']>>

// CERNBox's AppWrapper shares the drawing through the Yjs server (`sceneAdapter`). It mounts the
// app once the Y.Doc is synced and holds the drawing, and saves what the Y.Doc holds.
const props = defineProps<{
  resource: Resource
  currentContent: string
  isReadOnly: boolean
  ydoc: Y.Doc
  awareness: Awareness
  yjsStatus: string | null
}>()

const language = useGettext()
const { $gettext } = language
const themeStore = useThemeStore()

// A file that is not a drawing never reaches the Y.Doc, so the file itself decides.
const initialData = parseScene(props.currentContent)

const editorEl = ref<HTMLElement>()
let root: Root | undefined
let binding: ExcalidrawBinding | undefined
let undoManager: Y.UndoManager | undefined
let unobserveSettings: (() => void) | undefined

const bind = (api: ExcalidrawImperativeAPI) => {
  const doc = props.ydoc
  // y-excalidraw undoes only the local user's own changes, through its own undo manager.
  undoManager = props.isReadOnly ? undefined : new Y.UndoManager(sceneElements(doc))
  binding = new ExcalidrawBinding(
    sceneElements(doc),
    sceneFiles(doc),
    api,
    props.awareness,
    undoManager && unref(editorEl) ? { excalidrawDom: unref(editorEl), undoManager } : undefined
  )
  unobserveSettings = observeSettings(doc, (settings) =>
    // Excalidraw keeps the settings missing from the drawing as they are.
    api.updateScene({ appState: settings as Pick<AppState, keyof SceneSettings> })
  )
}

const onChange = (...[, appState]: OnChangeArgs) => {
  if (!props.isReadOnly) {
    writeSettings(props.ydoc, appState)
  }
}

const langCode = computed(() => {
  const current = language.current
  const match = languages.find(({ code }) => code === current || code.startsWith(`${current}-`))
  return match?.code ?? 'en'
})

const render = () => {
  const doc = props.ydoc
  root?.render(
    createElement(Excalidraw, {
      initialData: {
        elements: yjsToExcalidraw(sceneElements(doc)) as ExcalidrawInitialDataState['elements'],
        appState: readSettings(doc),
        files: Object.fromEntries(sceneFiles(doc).entries()),
        scrollToContent: true
      },
      onChange,
      // The binding updates the scene, which Excalidraw only takes once it has mounted.
      excalidrawAPI: (api) => setTimeout(() => bind(api)),
      onPointerUpdate: (payload) => binding?.onPointerUpdate(payload),
      // Without a Yjs server the session runs locally, and nobody else can join
      isCollaborating: props.yjsStatus !== 'local',
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

onMounted(() => {
  if (!unref(editorEl)) {
    return
  }
  root = createRoot(unref(editorEl))
  render()
})

onBeforeUnmount(() => {
  root?.unmount()
  unobserveSettings?.()
  binding?.destroy()
  undoManager?.destroy()
})
</script>

<style scoped>
.excalidraw-app {
  width: 100%;
  height: 100%;
}
</style>
