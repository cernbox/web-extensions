import { serializeAsJSON } from '@excalidraw/excalidraw'
import type { AppState, BinaryFiles, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types'
import { generateKeyBetween } from 'fractional-indexing'
import { yjsToExcalidraw } from 'y-excalidraw'
import * as Y from 'yjs'

type Elements = Parameters<typeof serializeAsJSON>[0]

// y-excalidraw's binding keeps the shapes as an array of { el, pos } maps, ordered by the
// fractional index in pos, and the images as a map by file id. The rest of the room is ours.
export const sceneElements = (doc: Y.Doc) => doc.getArray<Y.Map<unknown>>('elements')
export const sceneFiles = (doc: Y.Doc) => doc.getMap<BinaryFiles[string]>('assets')
const sceneMeta = (doc: Y.Doc) => doc.getMap<unknown>('cernbox')

// The part of Excalidraw's appState that belongs to the drawing and is saved with it. Scroll,
// zoom, selection and the active tool stay with each user. The order is Excalidraw's own, so the
// file reads the same whether it was saved alone or together.
const settingKeys = ['gridSize', 'gridStep', 'gridModeEnabled', 'viewBackgroundColor'] as const
export type SceneSettings = Partial<Pick<AppState, (typeof settingKeys)[number]>>

const pickSettings = (appState?: Partial<AppState>): SceneSettings =>
  Object.fromEntries(
    settingKeys.filter((key) => appState?.[key] !== undefined).map((key) => [key, appState[key]])
  )

export const readSettings = (doc: Y.Doc) => (sceneMeta(doc).get('settings') ?? {}) as SceneSettings

/** Shares a change of the drawing's settings, if the local user made one. */
export const writeSettings = (doc: Y.Doc, appState: AppState) => {
  const next = pickSettings(appState)
  const current = readSettings(doc)
  if (settingKeys.every((key) => next[key] === current[key])) {
    return
  }
  sceneMeta(doc).set('settings', next)
}

/** Calls onChange when another user changes the drawing's settings. */
export const observeSettings = (doc: Y.Doc, onChange: (settings: SceneSettings) => void) => {
  const handler = (event: Y.YMapEvent<unknown>) => {
    if (!event.transaction.local && event.keysChanged.has('settings')) {
      onChange(readSettings(doc))
    }
  }
  sceneMeta(doc).observe(handler)
  return () => sceneMeta(doc).unobserve(handler)
}

/** The drawing in a file, or null if the file is not one. */
export const parseScene = (content: string): ExcalidrawInitialDataState | null => {
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

/** The file content for the room's drawing. Clients that hold the same state get the same text. */
export const serializeScene = (doc: Y.Doc) => {
  const files: BinaryFiles = Object.fromEntries(sceneFiles(doc).entries())
  const elements = yjsToExcalidraw(sceneElements(doc)) as Elements
  return serializeAsJSON(elements, readSettings(doc), files, 'local')
}

/**
 * Moves a drawing between its file and the Y.Doc that CERNBox's AppWrapper shares through the
 * Yjs server. The same interface as `YjsAdapter` in CERNBox's web-pkg, whose published types do
 * not have it yet.
 */
export interface YjsAdapter {
  hydrate(doc: Y.Doc, content: string): void
  serialize(doc: Y.Doc): string
  hasContent(doc: Y.Doc): boolean
  reset(doc: Y.Doc): void
}

export const sceneAdapter: YjsAdapter = {
  hydrate(doc, content) {
    // A file that is not a drawing stays out of the room, and App.vue says so.
    const scene = parseScene(content)
    if (!scene || sceneAdapter.hasContent(doc)) {
      return
    }
    const { elements = [], appState, files = {} } = scene
    let pos: string | null = null
    for (const el of elements) {
      pos = generateKeyBetween(pos, null)
      sceneElements(doc).push([
        new Y.Map<unknown>([
          ['el', el],
          ['pos', pos]
        ])
      ])
    }
    for (const [id, file] of Object.entries(files)) {
      sceneFiles(doc).set(id, file)
    }
    sceneMeta(doc).set('settings', pickSettings(appState))
    // An empty drawing has no shapes, so this marks the room as loaded
    sceneMeta(doc).set('seeded', true)
  },
  serialize: serializeScene,
  hasContent: (doc) => sceneMeta(doc).get('seeded') === true,
  reset(doc) {
    sceneElements(doc).delete(0, sceneElements(doc).length)
    sceneFiles(doc).clear()
    sceneMeta(doc).clear()
  }
}
