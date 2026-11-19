import * as Y from 'yjs'
import {
  hashContent,
  observeSaved,
  readSaved,
  SavedState,
  serializeScene,
  writeSaved
} from './scene'

/** What the extension sees of CERNBox's AppWrapper, which loads and saves the file. */
export interface Wrapper {
  isDirty: () => boolean
  content: () => string
  setContent: (content: string) => void
  setServerState: (state: { etag: string; content?: string }) => void
}

/**
 * Keeps AppWrapper in step with the room: it gets the room's drawing as its content, so a save
 * writes what everyone sees, and the clients pass each other their saves through the room.
 */
export const syncWithWrapper = (doc: Y.Doc, wrapper: Wrapper) => {
  let reported: string | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  // The etag taken from another client's save, which AppWrapper then hands back to us.
  let adoptedEtag: string | undefined

  const flush = () => {
    clearTimeout(timer)
    const content = serializeScene(doc)
    if (content !== reported) {
      reported = content
      wrapper.setContent(content)
    }
    return content
  }

  // Serialising the whole drawing on every stroke is too much, so it waits for a pause.
  const onUpdate = () => {
    clearTimeout(timer)
    timer = setTimeout(flush, 300)
  }

  // Takes over a save made elsewhere: its etag, so that our next save does not conflict, and its
  // content if we hold the same drawing, so that we have nothing left to save.
  const adopt = ({ etag, hash }: SavedState) => {
    const content = flush()
    adoptedEtag = etag
    wrapper.setServerState({ etag, content: hash === hashContent(content) ? content : undefined })
  }

  // Start from the room's last save. With its etag, a save conflicts if the file changed outside
  // the room since, instead of overwriting that change.
  const saved = readSaved(doc)
  if (saved) {
    adopt(saved)
  } else {
    flush()
  }

  doc.on('update', onUpdate)
  const unobserve = observeSaved(doc, adopt)

  return {
    flush,
    /** Tells the others about our own saves, when AppWrapper's etag changes after one. */
    etagChanged(etag: string) {
      if (!etag || etag === adoptedEtag || etag === readSaved(doc)?.etag) {
        return
      }
      // When AppWrapper is dirty again, something changed during the save and we do not know
      // what was written, so the others only take the etag.
      const hash = wrapper.isDirty() ? undefined : hashContent(wrapper.content())
      writeSaved(doc, { etag, hash })
    },
    stop() {
      clearTimeout(timer)
      doc.off('update', onUpdate)
      unobserve()
    }
  }
}
