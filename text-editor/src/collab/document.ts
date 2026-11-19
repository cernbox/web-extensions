import * as Y from 'yjs'

// y-codemirror keeps the file's text in one Y.Text. The rest of the room is ours.
export const sharedText = (doc: Y.Doc) => doc.getText('content')
const meta = (doc: Y.Doc) => doc.getMap<unknown>('cernbox')

/** Whether a client has loaded the file into the room yet. */
export const isSeeded = (doc: Y.Doc) => meta(doc).get('seeded') === true

/**
 * Loads the file into an empty room, together with its etag. Both land in one update, so a client
 * that joins never sees the text without the save it came from.
 */
export const seedText = (doc: Y.Doc, content: string, etag: string) => {
  doc.transact(() => {
    sharedText(doc).insert(0, content)
    meta(doc).set('seeded', true)
    writeSaved(doc, { etag, hash: hashContent(content) })
  })
}

/** The file content for the room's text. */
export const serializeText = (doc: Y.Doc) => sharedText(doc).toString()

/** The last save the room knows of: the file's etag, and a hash of the text that was saved. */
export interface SavedState {
  etag: string
  hash?: string
}

export const readSaved = (doc: Y.Doc) => meta(doc).get('saved') as SavedState | undefined

export const writeSaved = (doc: Y.Doc, saved: SavedState) => meta(doc).set('saved', saved)

/** Calls onChange when another client saves the file. */
export const observeSaved = (doc: Y.Doc, onChange: (saved: SavedState) => void) => {
  const handler = (event: Y.YMapEvent<unknown>) => {
    const saved = readSaved(doc)
    if (!event.transaction.local && event.keysChanged.has('saved') && saved) {
      onChange(saved)
    }
  }
  meta(doc).observe(handler)
  return () => meta(doc).unobserve(handler)
}

/** cyrb53 (public domain), with the length: enough to tell two versions of a file apart. */
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
