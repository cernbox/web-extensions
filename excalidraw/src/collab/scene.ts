import { serializeAsJSON } from '@excalidraw/excalidraw'
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types'
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

/** Whether a client has loaded the file into the room yet. */
export const isSeeded = (doc: Y.Doc) => sceneMeta(doc).get('seeded') === true

/**
 * Loads the file into an empty room, together with its etag. Both land in one update, so a client
 * that joins never sees the drawing without the save it came from. Throws if the file is not JSON.
 */
export const seedScene = (doc: Y.Doc, content: string, etag: string) => {
  const { elements = [], appState, files = {} } = content.trim() ? JSON.parse(content) : {}
  doc.transact(() => {
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
      sceneFiles(doc).set(id, file as BinaryFiles[string])
    }
    sceneMeta(doc).set('settings', pickSettings(appState))
    sceneMeta(doc).set('seeded', true)
    writeSaved(doc, { etag, hash: hashContent(serializeScene(doc)) })
  })
}

/** The file content for the room's drawing. Clients that hold the same state get the same text. */
export const serializeScene = (doc: Y.Doc) => {
  const files: BinaryFiles = Object.fromEntries(sceneFiles(doc).entries())
  const elements = yjsToExcalidraw(sceneElements(doc)) as Elements
  return serializeAsJSON(elements, readSettings(doc), files, 'local')
}

/** The last save the room knows of: the file's etag, and a hash of the drawing that was saved. */
export interface SavedState {
  etag: string
  hash?: string
}

export const readSaved = (doc: Y.Doc) => sceneMeta(doc).get('saved') as SavedState | undefined

export const writeSaved = (doc: Y.Doc, saved: SavedState) => sceneMeta(doc).set('saved', saved)

/** Calls onChange when another client saves the file. */
export const observeSaved = (doc: Y.Doc, onChange: (saved: SavedState) => void) => {
  const handler = (event: Y.YMapEvent<unknown>) => {
    const saved = readSaved(doc)
    if (!event.transaction.local && event.keysChanged.has('saved') && saved) {
      onChange(saved)
    }
  }
  sceneMeta(doc).observe(handler)
  return () => sceneMeta(doc).unobserve(handler)
}

/** cyrb53 (public domain), with the length: enough to tell two versions of a drawing apart. */
export const hashContent = (content: string) => {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return `${content.length}:${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)}`
}
