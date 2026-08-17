import type { MarkdownStorage } from 'tiptap-markdown'

/**
 * tiptap-markdown attaches itself to `editor.storage.markdown` at runtime but ships no
 * augmentation for TipTap 3's `Storage` interface, so `getMarkdown()` is invisible to the
 * compiler without this.
 */
declare module '@tiptap/core' {
  interface Storage {
    markdown: MarkdownStorage
  }
}
