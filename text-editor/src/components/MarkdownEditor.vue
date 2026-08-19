<template>
  <div class="cern-md-editor oc-height-1-1 oc-flex oc-flex-column">
    <markdown-toolbar
      v-if="editor"
      :editor="editor"
      :is-read-only="isReadOnly"
      :outline-visible="outlineVisible"
      :can-zoom-in="fontScale < MAX_SCALE"
      :can-zoom-out="fontScale > MIN_SCALE"
      :can-reset-zoom="fontScale !== DEFAULT_SCALE"
      @toggle-source="emit('toggleSource')"
      @toggle-outline="outlineVisible = !outlineVisible"
      @zoom-in="setScale(fontScale + SCALE_STEP)"
      @zoom-out="setScale(fontScale - SCALE_STEP)"
      @reset-zoom="setScale(DEFAULT_SCALE)"
    />

    <div class="cern-md-editor-body oc-flex">
      <editor-content
        ref="contentRef"
        class="cern-md-editor-content"
        :editor="editor"
        :style="{ '--cern-md-font-scale': fontScale, '--cern-md-trailing-space': trailingSpace }"
      />
      <document-outline v-if="outlineVisible" :items="outlineItems" @select="scrollToHeading" />
    </div>

    <template v-if="editor && !isReadOnly">
      <!-- Formatting on a selection, and a block menu on an empty line. Both come from
           @tiptap/vue-3/menus, which bundles their plugins - the standalone extension packages
           are not needed. -->
      <bubble-menu :editor="editor" class="cern-md-editor-floating">
        <oc-button
          v-for="item in bubbleItems"
          :key="item.id"
          v-oc-tooltip="item.label"
          :aria-label="item.label"
          :class="{ 'cern-md-editor-floating-active': item.isActive?.() }"
          appearance="raw"
          size="small"
          @click="item.run"
        >
          <oc-icon :name="item.icon" :fill-type="item.fillType || 'none'" size="small" />
        </oc-button>
      </bubble-menu>

      <floating-menu :editor="editor" class="cern-md-editor-floating">
        <oc-button
          v-for="item in floatingItems"
          :key="item.id"
          v-oc-tooltip="item.label"
          :aria-label="item.label"
          appearance="raw"
          size="small"
          @click="item.run"
        >
          <oc-icon :name="item.icon" :fill-type="item.fillType || 'none'" size="small" />
        </oc-button>
      </floating-menu>

      <drag-handle :editor="editor" class="cern-md-gutter">
        <span class="cern-md-gutter-grip" :title="$gettext('Drag to move')">
          <oc-icon name="draggable" size="small" fill-type="none" />
        </span>
      </drag-handle>
    </template>

    <footer v-if="editor && !isReadOnly" class="cern-md-editor-footer oc-text-muted">
      {{ characterSummary }}
    </footer>
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  provide,
  ref,
  shallowRef,
  unref,
  watch
} from 'vue'
import { useGettext } from 'vue3-gettext'
import { useMessages, useRoute, useRouter } from '@ownclouders/web-pkg'
import { EditorContent, VueNodeViewRenderer, useEditor } from '@tiptap/vue-3'
import { BubbleMenu, FloatingMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import { CodeBlock } from '@tiptap/extension-code-block'
import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
import { Link } from '@tiptap/extension-link'
import { TableKit } from '@tiptap/extension-table'
import {
  TableOfContents,
  getHierarchicalIndexes,
  type TableOfContentDataItem
} from '@tiptap/extension-table-of-contents'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import Typography from '@tiptap/extension-typography'
import { Markdown } from 'tiptap-markdown'
import { createSlashCommand } from '../helpers/slashCommand'
import { HeadingAnchors, revealAnchor, revealHeading } from '../helpers/headingAnchors'
import { LinkClick } from '../helpers/linkClick'
import { useLinkDialog } from '../composables/useLinkDialog'
import MarkdownToolbar from './MarkdownToolbar.vue'
import DocumentOutline from './DocumentOutline.vue'
import CodeBlockView from './CodeBlockView.vue'
import type { ToolbarItem } from '../helpers/toolbar'

interface Props {
  currentContent: string
  isReadOnly?: boolean
  /** The resource's own permalink, used as the base of a copied section link. */
  directLink?: string
  isDark?: boolean
}
interface Emits {
  (e: 'update:currentContent', value: string): void
  (e: 'toggleSource'): void
}

const {
  currentContent,
  isReadOnly = false,
  isDark = false,
  directLink = undefined
} = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $gettext, interpolate } = useGettext()

// Node views are constructed by ProseMirror, not by this template, so they cannot receive props.
// Injection is how the embedded CodeMirror instances learn about the theme.
provide(
  'cern-editor-is-dark',
  computed(() => isDark)
)

// Same reason: the code block node views own their own CodeMirror instances and their own header
// controls, neither of which tiptap's `editable` flag reaches.
provide(
  'cern-editor-is-read-only',
  computed(() => isReadOnly)
)

// Body text scale, applied as a multiplier on the content so headings keep their relative size.
const MIN_SCALE = 0.8
const MAX_SCALE = 1.6
const SCALE_STEP = 0.1
const DEFAULT_SCALE = 1
const fontScale = ref(DEFAULT_SCALE)
const setScale = (value: number) => {
  fontScale.value = Math.round(Math.min(MAX_SCALE, Math.max(MIN_SCALE, value)) * 10) / 10
}

// The insert popup renders outside this component's tree, so it needs the app context to resolve
// the host's globally registered components.
const appContext = getCurrentInstance()?.appContext ?? null

const router = useRouter()
const route = useRoute()
const { showMessage } = useMessages()

/**
 * Absolute link to one heading of this document.
 *
 * The resource's own permalink is preferred when the server provides one: it is the link that
 * keeps working once the file is moved or renamed, which the editor's current route is not.
 *
 * The fallback is resolved through the router rather than assembled from `window.location`,
 * because the runtime picks between history and hash mode depending on whether a `<base href>` is
 * set - and in hash mode the route itself already lives in the fragment, where a naively appended
 * `#slug` would land in the wrong place.
 */
const anchorUrl = (slug: string) => {
  if (directLink) {
    const link = new URL(directLink, window.location.origin)
    link.hash = slug
    return link.href
  }

  const current = unref(route)
  const { href } = router.resolve({
    name: current.name,
    params: current.params,
    query: current.query,
    hash: `#${slug}`
  })
  return new URL(href, window.location.origin).href
}

const copyAnchorLink = async (slug: string) => {
  try {
    await navigator.clipboard.writeText(anchorUrl(slug))
    showMessage({ title: $gettext('Link to this section copied') })
  } catch (error) {
    // Clipboard access needs a secure context and, in some browsers, a permission the user can
    // refuse, so the link is shown instead of being lost.
    showMessage({
      title: $gettext('The link could not be copied.'),
      status: 'danger',
      desc: anchorUrl(slug)
    })
    console.error(error)
  }
}

/**
 * The fragment this document was opened with.
 *
 * Falls back to the raw location because the runtime's `patchCleanPath` router wrapper rebuilds a
 * push as `{ path, query }` and drops the hash on the way; when that has happened the route no
 * longer carries it but the address bar still does. In hash mode the leading `#` belongs to the
 * route itself, so only a second one counts.
 */
const routeAnchor = (): string => {
  const fromRoute = unref(route).hash
  if (fromRoute) {
    return fromRoute.slice(1)
  }
  const raw = window.location.hash
  const separator = raw.lastIndexOf('#')
  return separator > 0 ? raw.slice(separator + 1) : ''
}

/**
 * Honour a `#section` fragment the document was opened with, and any later change to it.
 *
 * Retried rather than done once: at load the document is still settling - code blocks mount their
 * own editors, diagrams render, and the trailing space that lets a late heading reach the top is
 * only measured once the content has a height. A single scroll therefore lands short. The jump is
 * instant on purpose; a smooth one would be interrupted by exactly that reflow.
 */
const revealRouteAnchor = async () => {
  const slug = routeAnchor()
  if (!slug) {
    return
  }
  const target = decodeURIComponent(slug)
  await nextTick()
  for (const delay of [0, 120, 400]) {
    await new Promise((resolve) => setTimeout(resolve, delay))
    const dom = unref(editor)?.view.dom
    if (!dom) {
      return
    }
    updateTrailingSpace()
    revealAnchor(dom as HTMLElement, target, 'auto')
  }
}


watch(() => unref(route).hash, revealRouteAnchor)

const { openLinkDialog } = useLinkDialog(() => unref(editor))

/**
 * Serialising to Markdown walks the whole document, so doing it on every keystroke made typing
 * visibly lag. Two things fix that:
 *
 *   - the emit is debounced, so a burst of typing serialises once at the end rather than per key;
 *   - `lastEmitted` records what was sent, so the `currentContent` watch below can tell "this is
 *     our own value coming back" by string comparison instead of serialising a second time.
 *
 * Before this, one keystroke cost two full serialisations of the document.
 */
const EMIT_DEBOUNCE_MS = 300
let lastEmitted: string | null = null
let emitTimer: ReturnType<typeof setTimeout> | null = null

const flushEmit = () => {
  const instance = unref(editor)
  if (!instance) {
    return
  }
  const markdown = instance.storage.markdown.getMarkdown()
  if (markdown === lastEmitted) {
    return
  }
  lastEmitted = markdown
  emit('update:currentContent', markdown)
}

/**
 * Record what the document serialises to before anyone has touched it, so that a transaction
 * which changes nothing the file can hold does not count as an edit.
 *
 * Two things make this necessary. TableOfContents stamps an `id` and a `data-toc-id` onto every
 * heading right after the document loads, which is a real ProseMirror change and therefore fires
 * `onUpdate`. And the Markdown serialiser does not round-trip byte for byte - it wraps bare URLs
 * in angle brackets, pads table delimiter rows, drops the trailing newline - so the emit that
 * followed differed from the file and the wrapper, which decides dirtiness by comparing strings,
 * flagged an untouched document as modified.
 *
 * Comparing against the serialised baseline rather than the file's own text is the point: it is
 * the only form in which "unchanged" is expressible on this side of the parser.
 */
const captureBaseline = () => {
  const instance = unref(editor)
  if (instance) {
    lastEmitted = instance.storage.markdown.getMarkdown()
  }
}

const scheduleEmit = () => {
  if (emitTimer) {
    clearTimeout(emitTimer)
  }
  emitTimer = setTimeout(() => {
    emitTimer = null
    flushEmit()
  }, EMIT_DEBOUNCE_MS)
}

// The document scrolls inside this element, not the window. TableOfContents defaults its
// scrollParent to `window`, so without this it never receives a scroll event and `isActive` stays
// on whichever heading the cursor last touched instead of following the view.
const contentRef = ref<{ $el?: HTMLElement } | null>(null)
const scrollParent = () => unref(contentRef)?.$el ?? window

/**
 * Empty room below the last block, so that a heading near the end of the document can still be
 * scrolled to the top of the view. Without it the scroll clamps at the bottom of the content and
 * a jump to one of the last few headings leaves them in the middle of the screen.
 *
 * Sized from the viewport and only applied while the document actually scrolls, so a file that
 * fits on screen does not grow a scrollbar into blank space.
 */
const trailingSpace = ref('0px')

const updateTrailingSpace = () => {
  const scroller = unref(contentRef)?.$el
  if (!scroller) {
    return
  }
  const applied = parseFloat(unref(trailingSpace)) || 0
  const contentHeight = scroller.scrollHeight - applied
  trailingSpace.value =
    contentHeight > scroller.clientHeight ? `${Math.round(scroller.clientHeight * 0.75)}px` : '0px'
}

let resizeObserver: ResizeObserver | null = null

const outlineVisible = ref(false)
// shallowRef: these items carry the editor instance and a live DOM node, which must not be
// made deeply reactive.
const outlineItems = shallowRef<TableOfContentDataItem[]>([])

const editor = useEditor({
  content: currentContent ?? '',
  onCreate: () => {
    captureBaseline()
    const scroller = unref(contentRef)?.$el
    const editorDom = unref(editor)?.view.dom
    if (scroller && editorDom) {
      // The scroller covers a window resize; the document itself covers content that changes
      // height without a transaction, such as a mermaid diagram finishing its render.
      resizeObserver = new ResizeObserver(() => updateTrailingSpace())
      resizeObserver.observe(scroller)
      resizeObserver.observe(editorDom)
    }
    revealRouteAnchor()
  },
  editable: !isReadOnly,
  extensions: [
    // A fenced block is edited by a real CodeMirror instance rather than highlighted statically,
    // so it gets the same grammars, line numbers and bracket matching as a source file. This also
    // means one grammar set for the whole app instead of CodeMirror's plus highlight.js'.
    //
    // Only the rendering changes: the node is still `codeBlock` with a `language` attribute, which
    // is what tiptap-markdown serialises, so ```python round-trips exactly as before.
    StarterKit.configure({ codeBlock: false, link: false }),
    CodeBlock.extend({
      addNodeView() {
        return VueNodeViewRenderer(CodeBlockView, {
          // The embedded CodeMirror owns everything inside this node. Without these, ProseMirror
          // competes for the same events — swallowing clicks on the language picker and garbling
          // typing — and tries to reinterpret CodeMirror's DOM writes as document changes.
          //
          // Drag events are still handed back, so the block remains draggable by its gutter grip.
          stopEvent: ({ event }) => !(event.type.startsWith('drag') || event.type === 'drop'),
          ignoreMutation: () => true
        })
      }
    }),
    // `openOnClick` stays off: in an editable document a plain click has to place the caret.
    // LinkClick below follows the link instead, on a plain click when read-only and on
    // Cmd/Ctrl-click when editable.
    Link.configure({ openOnClick: false, autolink: true }),
    LinkClick,
    TableKit.configure({ table: { resizable: true } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder: () => $gettext('Start writing…') }),
    CharacterCount,
    // Smart quotes, dashes and ellipses. Safe for Markdown: the input rules produce plain
    // characters rather than nodes, so nothing extra has to be serialised.
    Typography,
    TableOfContents.configure({
      getIndex: getHierarchicalIndexes,
      scrollParent,
      onUpdate: (items) => {
        outlineItems.value = [...items]
      }
    }),
    // Slug ids on every heading, so `[see below](#the-heading)` resolves inside the document.
    HeadingAnchors.configure({
      anchorLabel: $gettext('Copy link to this section'),
      onAnchorClick: (slug) => copyAnchorLink(slug)
    }),
    Markdown.configure({ html: true, linkify: true, breaks: false, transformPastedText: true }),
    createSlashCommand({ $gettext, appContext })
  ],
  onUpdate: () => {
    scheduleEmit()
    updateTrailingSpace()
  }
})

const characterSummary = computed(() => {
  const instance = unref(editor)
  if (!instance) {
    return ''
  }
  return interpolate($gettext('%{words} words, %{characters} characters'), {
    words: instance.storage.characterCount.words(),
    characters: instance.storage.characterCount.characters()
  })
})

const bubbleItems = computed<ToolbarItem[]>(() => {
  const instance = unref(editor)
  if (!instance) {
    return []
  }
  return [
    {
      id: 'bubble-bold',
      label: $gettext('Bold'),
      icon: 'bold',
      run: () => instance.chain().focus().toggleBold().run(),
      isActive: () => instance.isActive('bold')
    },
    {
      id: 'bubble-italic',
      label: $gettext('Italic'),
      icon: 'italic',
      run: () => instance.chain().focus().toggleItalic().run(),
      isActive: () => instance.isActive('italic')
    },
    {
      id: 'bubble-strike',
      label: $gettext('Strikethrough'),
      icon: 'strikethrough',
      run: () => instance.chain().focus().toggleStrike().run(),
      isActive: () => instance.isActive('strike')
    },
    {
      id: 'bubble-code',
      label: $gettext('Inline code'),
      icon: 'code-s-slash',
      fillType: 'line',
      run: () => instance.chain().focus().toggleCode().run(),
      isActive: () => instance.isActive('code')
    },
    {
      id: 'bubble-link',
      label: $gettext('Add or edit link'),
      icon: 'link',
      run: () => openLinkDialog(),
      isActive: () => instance.isActive('link')
    }
  ]
})

// Shown on an empty line, for starting a block without reaching for the toolbar.
const floatingItems = computed<ToolbarItem[]>(() => {
  const instance = unref(editor)
  if (!instance) {
    return []
  }
  return [
    {
      id: 'floating-h1',
      label: $gettext('Heading %{level}').replace('%{level}', '1'),
      icon: 'h-1',
      run: () => instance.chain().focus().toggleHeading({ level: 1 }).run()
    },
    {
      id: 'floating-h2',
      label: $gettext('Heading %{level}').replace('%{level}', '2'),
      icon: 'h-2',
      run: () => instance.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      id: 'floating-bullet-list',
      label: $gettext('Bullet list'),
      icon: 'list-unordered',
      run: () => instance.chain().focus().toggleBulletList().run()
    },
    {
      id: 'floating-task-list',
      label: $gettext('Task list'),
      icon: 'list-check-2',
      run: () => instance.chain().focus().toggleTaskList().run()
    },
    {
      id: 'floating-code-block',
      label: $gettext('Code block'),
      icon: 'code-box',
      fillType: 'line',
      run: () => instance.chain().focus().toggleCodeBlock().run()
    },
    {
      id: 'floating-table',
      label: $gettext('Insert table'),
      icon: 'table-2',
      run: () =>
        instance.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }
  ]
})

/**
 * Deliberately does not move the caret. Any selection change inside a focused editor makes the
 * browser scroll the caret into view under its own "nearest" rule, which fired a frame after the
 * smooth scroll started and left the heading wherever it first became visible - the reason most
 * outline entries appeared to stop halfway.
 */
const scrollToHeading = (item: TableOfContentDataItem) => {
  // `item.dom` was captured when the outline was last built, so it can describe an element
  // ProseMirror has since replaced. Resolving the position against the live view is what keeps
  // the jump working after the document has been edited.
  const live = unref(editor)?.view.nodeDOM(item.pos)
  const heading = live instanceof HTMLElement ? live : (item.dom as HTMLElement)
  if (heading?.isConnected) {
    revealHeading(heading)
  }
}

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  // Anything typed inside the debounce window would otherwise be lost when switching to the
  // source view or closing the app.
  if (emitTimer) {
    clearTimeout(emitTimer)
    flushEmit()
  }
  unref(editor)?.destroy()
})

watch(
  () => isReadOnly,
  (readOnly) => unref(editor)?.setEditable(!readOnly)
)

// Only reset the document when the wrapper hands back content we did not produce — our own
// emits come straight back through this prop, and reparsing them would drop the selection.
watch(
  () => currentContent,
  (value) => {
    const instance = unref(editor)
    if (!instance || value === lastEmitted) {
      return
    }
    instance.commands.setContent(value ?? '', { emitUpdate: false })
    captureBaseline()
  }
)
</script>

<style lang="scss">
.cern-md-editor {
  &-body {
    flex: 1;
    min-height: 0;
  }

  &-content {
    flex: 1;
    min-width: 0;
    overflow: auto;
  }

  &-footer {
    border-top: 1px solid var(--oc-color-border);
    font-size: var(--oc-font-size-small, 0.875rem);
    padding: var(--oc-space-xsmall) var(--oc-space-small);
    text-align: right;
  }

  &-floating {
    background-color: var(--oc-color-background-default);
    border: 1px solid var(--oc-color-border);
    border-radius: 5px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
    display: flex;
    gap: var(--oc-space-xsmall);
    padding: var(--oc-space-xsmall);

    &-active {
      background-color: var(--oc-color-background-hover);
      border-radius: 3px;
    }
  }

  .tiptap {
    color: var(--oc-color-text-default);
    // A full-width line of prose is hard to read on a wide screen; cap the measure and centre it,
    // the way a document editor does. Code blocks and tables still fill this column.
    font-size: calc(1rem * var(--cern-md-font-scale, 1));
    margin: 0 auto;
    max-width: 48rem;
    min-height: 100%;
    outline: none;
    padding: var(--oc-space-medium) var(--oc-space-large);
    padding-bottom: calc(var(--oc-space-medium) + var(--cern-md-trailing-space, 0px));

    > * + * {
      margin-top: var(--oc-space-small);
    }

    // Placeholder, shown on the first empty block only.
    p.is-editor-empty:first-child::before {
      color: var(--oc-color-text-muted);
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      color: var(--oc-color-text-default);
      line-height: 1.25;
      margin-top: var(--oc-space-medium);

      // Flashed after a jump from an in-document link, so the heading that was landed on is
      // obvious even when the scroll moved the page very little.
      &.cern-md-anchor-target {
        animation: cern-md-anchor-flash 1.2s ease-out;
      }

      &:hover .cern-md-anchor,
      .cern-md-anchor:focus-visible {
        opacity: 1;
      }
    }

    // Trails the heading text and only fades in on hover. It keeps its space at all times, so
    // revealing it never reflows the line.
    .cern-md-anchor {
      background: none;
      border: none;
      color: var(--oc-color-text-muted);
      cursor: pointer;
      font: inherit;
      line-height: inherit;
      margin-left: 0.35em;
      opacity: 0;
      padding: 0;
      transition: opacity 0.1s ease-in-out;
      user-select: none;

      &:hover {
        color: var(--oc-color-swatch-primary-default);
      }
    }

    code {
      background-color: var(--oc-color-background-muted);
      border-radius: 3px;
      font-size: 0.9em;
      padding: 0.1em 0.3em;
    }

    pre {
      background-color: var(--oc-color-background-muted);
      border-radius: 5px;
      overflow-x: auto;
      padding: var(--oc-space-small);

      code {
        background: none;
        padding: 0;
      }
    }

    blockquote {
      border-left: 3px solid var(--oc-color-border);
      color: var(--oc-color-text-muted);
      padding-left: var(--oc-space-small);
    }

    hr {
      border: none;
      border-top: 1px solid var(--oc-color-border);
    }

    a {
      color: var(--oc-color-swatch-primary-default);
      text-decoration: underline;
    }

    a[href^='#'] {
      cursor: pointer;
    }

    ul[data-type='taskList'] {
      list-style: none;
      padding-left: 0;

      li {
        align-items: flex-start;
        display: flex;
        gap: var(--oc-space-xsmall);

        > div {
          flex: 1;
        }
      }
    }

    table {
      border-collapse: collapse;
      table-layout: fixed;
      width: 100%;

      td,
      th {
        border: 1px solid var(--oc-color-border);
        padding: var(--oc-space-xsmall) var(--oc-space-small);
      }

      th {
        background-color: var(--oc-color-background-muted);
        font-weight: bold;
        text-align: left;
      }
    }

    // Highlighted fenced code blocks. Driven by CSS variables so the palette follows the
    // active theme instead of shipping a fixed highlight.js stylesheet.
    .hljs-comment,
    .hljs-quote {
      color: var(--oc-color-text-muted);
      font-style: italic;
    }

    .hljs-keyword,
    .hljs-selector-tag,
    .hljs-literal,
    .hljs-section,
    .hljs-doctag,
    .hljs-name,
    .hljs-type {
      color: var(--oc-color-swatch-primary-default);
    }

    .hljs-string,
    .hljs-title,
    .hljs-attr,
    .hljs-addition,
    .hljs-meta-string {
      color: var(--oc-color-swatch-success-default);
    }

    .hljs-number,
    .hljs-symbol,
    .hljs-bullet,
    .hljs-link,
    .hljs-regexp,
    .hljs-template-variable,
    .hljs-variable {
      color: var(--oc-color-swatch-warning-default);
    }

    .hljs-built_in,
    .hljs-builtin-name,
    .hljs-class .hljs-title,
    .hljs-function .hljs-title {
      color: var(--oc-color-swatch-brand-default, var(--oc-color-swatch-primary-default));
    }

    .hljs-deletion,
    .hljs-meta,
    .hljs-selector-id,
    .hljs-selector-class {
      color: var(--oc-color-swatch-danger-default);
    }

    .hljs-emphasis {
      font-style: italic;
    }

    .hljs-strong {
      font-weight: bold;
    }
  }
}

// The slash-command popup is appended to document.body, outside .cern-md-editor, so it needs a
// top-level rule.
.cern-insert-menu-popup {
  background-color: var(--oc-color-background-default);
  border: 1px solid var(--oc-color-border);
  left: 0;
  position: absolute;
  top: 0;
  z-index: 1000;
}

@keyframes cern-md-anchor-flash {
  from {
    background-color: var(--oc-color-background-highlight, var(--oc-color-background-hover));
  }

  to {
    background-color: transparent;
  }
}

.cern-md-gutter {
  align-items: center;
  display: flex;
  gap: 2px;
  padding-right: var(--oc-space-xsmall);

  &-grip {
    align-items: center;
    border-radius: 4px;
    color: var(--oc-color-text-muted);
    cursor: grab;
    display: inline-flex;
    justify-content: center;
    min-height: 1.5rem;
    min-width: 1.5rem;

    &:hover {
      background-color: var(--oc-color-background-hover);
      color: var(--oc-color-text-default);
    }

    &:active {
      cursor: grabbing;
    }
  }
}
</style>
