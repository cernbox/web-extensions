import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * GitHub's heading slug: lowercased, punctuation dropped, whitespace collapsed into hyphens.
 * Matching that rule is what makes a `[link](#some-heading)` written elsewhere resolve here.
 */
export const slugify = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-')

interface HeadingSlug {
  pos: number
  end: number
  slug: string
}

/** Repeated headings get `-1`, `-2`, … suffixes, again following GitHub. */
const headingSlugs = (doc: ProseMirrorNode): HeadingSlug[] => {
  const seen = new Map<string, number>()
  const slugs: HeadingSlug[] = []

  doc.descendants((node, pos) => {
    if (node.type.name !== 'heading') {
      return
    }
    const base = slugify(node.textContent)
    if (!base) {
      return
    }
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    slugs.push({ pos, end: pos + node.nodeSize, slug: count ? `${base}-${count}` : base })
  })

  return slugs
}

export const TARGET_CLASS = 'cern-md-anchor-target'

/**
 * Scroll a heading into view by its slug and flash it, so a jump that moved the page very little
 * is still noticeable. Returns false when the document holds no such heading.
 */
export const revealHeading = (heading: HTMLElement, behavior: ScrollBehavior = 'smooth') => {
  heading.scrollIntoView({ behavior, block: 'start' })
  heading.classList.remove(TARGET_CLASS)
  // Restarting the animation needs a reflow between the two class changes.
  void heading.offsetWidth
  heading.classList.add(TARGET_CLASS)
}

export const revealAnchor = (
  root: HTMLElement,
  slug: string,
  behavior: ScrollBehavior = 'smooth'
): boolean => {
  const heading = root.querySelector<HTMLElement>(`#${CSS.escape(slug)}`)
  if (!heading) {
    return false
  }
  revealHeading(heading, behavior)
  return true
}

const decodeAnchor = (href: string): string => {
  const raw = href.slice(1)
  try {
    return decodeURIComponent(raw)
  } catch {
    // A malformed escape sequence is not a reason to lose the link; the literal text may still
    // match a heading.
    return raw
  }
}

/**
 * Heading ids and in-document link navigation.
 *
 * The ids are decorations rather than node attributes, so they never reach the document and
 * tiptap-markdown keeps serialising plain `## Heading` lines. They are recomputed from the text on
 * every transaction, which is also what keeps a renamed heading addressable under its new slug.
 */
export interface HeadingAnchorsOptions {
  /** Called with the slug of the heading whose anchor was clicked. */
  onAnchorClick: ((slug: string) => void) | null
  /** Tooltip and accessible name of the anchor button. */
  anchorLabel: string
}

export const HeadingAnchors = Extension.create<HeadingAnchorsOptions>({
  name: 'headingAnchors',

  addOptions() {
    return { onAnchorClick: null, anchorLabel: 'Copy link to this section' }
  },

  addProseMirrorPlugins() {
    const { onAnchorClick, anchorLabel } = this.options

    /**
     * The button is a widget decoration rather than markup in the document, for the same reason
     * the ids are: nothing here may end up in the serialised Markdown. `contenteditable=false`
     * and `ignoreSelection` keep ProseMirror from treating it as text the caret can enter.
     */
    const anchorButton = (slug: string) => () => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'cern-md-anchor'
      button.contentEditable = 'false'
      button.textContent = '#'
      button.title = anchorLabel
      button.setAttribute('aria-label', anchorLabel)
      // Without this the press moves the selection into the heading first, which scrolls the
      // document under the pointer before the click even lands.
      button.addEventListener('mousedown', (event) => event.preventDefault())
      button.addEventListener('click', (event) => {
        event.preventDefault()
        onAnchorClick?.(slug)
      })
      return button
    }

    return [
      new Plugin({
        key: new PluginKey('headingAnchors'),
        props: {
          decorations: (state) =>
            DecorationSet.create(
              state.doc,
              headingSlugs(state.doc).flatMap(({ pos, end, slug }) => [
                Decoration.node(pos, end, { id: slug }),
                // Trailing rather than leading: the drag handle already occupies the left
                // margin of every block, and the two would sit on top of each other.
                Decoration.widget(end - 1, anchorButton(slug), {
                  // Keyed so an unrelated transaction reuses the existing button instead of
                  // rebuilding it, which would drop it out from under a pointer mid-hover.
                  key: `anchor-${slug}`,
                  side: 1,
                  ignoreSelection: true
                })
              ])
            ),

          handleClick: (view, _pos, event) => {
            const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]')
            if (!anchor) {
              return false
            }
            const slug = decodeAnchor(anchor.getAttribute('href') || '')
            if (!revealAnchor(view.dom as HTMLElement, slug)) {
              return false
            }
            event.preventDefault()
            return true
          }
        }
      })
    ]
  }
})
