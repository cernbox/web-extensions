import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

// `javascript:` and friends are never followed. The Link extension sanitises what it *stores*,
// but a document can also arrive with raw HTML in it, and the href is used verbatim here.
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:']

/**
 * Follow links from the rich text view.
 *
 * The Link extension is configured with `openOnClick: false` because in an editable document a
 * plain click has to place the caret - otherwise a link cannot be edited at all. That left no way
 * to follow one, which is the whole point of a link in a document being read rather than written.
 *
 * So: a plain click follows the link while the document is read-only, and Cmd/Ctrl-click follows
 * it while it is editable, matching what an editor is expected to do. In-document `#anchor` links
 * are handled by the heading anchors extension and are deliberately left alone here.
 */
export const LinkClick = Extension.create({
  name: 'linkClick',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('linkClick'),
        props: {
          handleClick: (view, _pos, event) => {
            const anchor = (event.target as HTMLElement | null)?.closest?.('a[href]')
            const href = anchor?.getAttribute('href')
            if (!href || href.startsWith('#')) {
              return false
            }
            if (view.editable && !event.metaKey && !event.ctrlKey) {
              return false
            }

            let url: URL
            try {
              url = new URL(href, window.location.href)
            } catch {
              return false
            }
            if (!SAFE_PROTOCOLS.includes(url.protocol)) {
              return false
            }

            window.open(url.href, '_blank', 'noopener,noreferrer')
            event.preventDefault()
            return true
          }
        }
      })
    ]
  }
})
