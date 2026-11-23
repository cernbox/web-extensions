import * as Y from 'yjs'
import type { Awareness } from 'y-protocols/awareness'
import { looksBinary } from '../helpers/fileTypes'

// y-codemirror keeps the file's text in one Y.Text. The rest of the room is ours.
export const sharedText = (doc: Y.Doc) => doc.getText('content')
const meta = (doc: Y.Doc) => doc.getMap<unknown>('cernbox')

/** What CodeMirror binds to when the file is edited together. */
export interface Collab {
  text: Y.Text
  awareness: Awareness
}

/**
 * Moves a file between its text and the Y.Doc that CERNBox's AppWrapper shares through the Yjs
 * server. The same interface as `YjsAdapter` in CERNBox's web-pkg, whose published types do not
 * have it yet.
 */
export interface YjsAdapter {
  hydrate(doc: Y.Doc, content: string): void
  serialize(doc: Y.Doc): string
  hasContent(doc: Y.Doc): boolean
  reset(doc: Y.Doc): void
}

export const textAdapter: YjsAdapter = {
  hydrate(doc, content) {
    // A binary file is shown read-only from the file itself, and never shared.
    if (looksBinary(content) || textAdapter.hasContent(doc)) {
      return
    }
    sharedText(doc).insert(0, content)
    // An empty file has no text, so this marks the room as loaded
    meta(doc).set('seeded', true)
  },
  serialize: (doc) => sharedText(doc).toString(),
  hasContent: (doc) => meta(doc).get('seeded') === true,
  reset(doc) {
    sharedText(doc).delete(0, sharedText(doc).length)
    meta(doc).clear()
  }
}
