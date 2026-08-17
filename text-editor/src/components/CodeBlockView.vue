<template>
  <!--
    contenteditable="false" on the whole node view is what keeps ProseMirror out of it. Without it
    the wrapper inherits the outer editable, so a click landing anywhere that is not CodeMirror's
    own `.cm-content` — the padding, the gutter margin — leaves the caret in ProseMirror, and the
    next Enter splits the document there, appending a paragraph after the block instead of a
    newline inside it. CodeMirror re-enables editing on its own content.
  -->
  <node-view-wrapper
    class="cern-code-block"
    :class="{ 'cern-code-block-selected': selected }"
    contenteditable="false"
    @focusout="onFocusOut"
  >
    <div class="cern-code-block-header" contenteditable="false">
      <oc-button
        v-if="isMermaid"
        v-oc-tooltip="showDiagram ? $gettext('Show the source') : $gettext('Show the diagram')"
        :aria-label="showDiagram ? $gettext('Show the source') : $gettext('Show the diagram')"
        :aria-pressed="showDiagram"
        appearance="raw"
        class="cern-code-block-chip"
        @click="showDiagram = !showDiagram"
      >
        <oc-icon
          :name="showDiagram ? 'code-s-slash' : 'flow-chart'"
          :fill-type="showDiagram ? 'line' : 'none'"
          size="xsmall"
        />
      </oc-button>
      <oc-button
        v-if="canFormat"
        v-oc-tooltip="$gettext('Format code')"
        :aria-label="$gettext('Format code')"
        appearance="raw"
        class="cern-code-block-chip"
        @click="format"
      >
        <oc-icon name="code-box" fill-type="line" size="xsmall" />
      </oc-button>
      <language-menu
        v-if="!isReadOnly"
        :value="language"
        :label="languageLabel"
        :options="languageOptions"
        @select="setLanguage"
      />
      <span v-else class="cern-code-block-chip cern-code-block-language">{{ languageLabel }}</span>
    </div>

    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions,vuejs-accessibility/click-events-have-key-events -->
    <div
      v-show="!isMermaid || !showDiagram"
      ref="host"
      class="cern-code-block-host"
      @mousedown="focusEditor"
    />
    <div
      v-if="isMermaid && showDiagram"
      class="cern-code-block-diagram"
      :class="{ 'cern-code-block-diagram-failed': diagramError }"
      contenteditable="false"
      role="button"
      tabindex="0"
      :aria-label="$gettext('Double-click to edit')"
      @dblclick="editDiagram"
      @keydown.enter.prevent="editDiagram"
    >
      <p v-if="diagramError" class="cern-code-block-diagram-error">
        <oc-icon name="error-warning" fill-type="line" size="small" />
        {{ diagramError }}
      </p>
      <!-- Mermaid renders with securityLevel 'strict', which sanitises its own SVG output and
           disables click handlers and inline scripts in diagram definitions. -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-else class="cern-code-block-diagram-svg" v-html="diagramSvg" />
    </div>
  </node-view-wrapper>
</template>

<script lang="ts" setup>
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  unref,
  watch,
  type Ref
} from 'vue'
import { useGettext } from 'vue3-gettext'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/vue-3'
import { Selection } from '@tiptap/pm/state'
import { exitCode } from '@tiptap/pm/commands'
import { Compartment, EditorState, type Extension } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands'
import { StreamLanguage, bracketMatching, indentUnit } from '@codemirror/language'
import { codemirrorTheme } from '../helpers/codemirrorTheme'
import LanguageMenu from './LanguageMenu.vue'
import { fenceLanguages, grammarForLanguage, loadLanguage } from '../helpers/fileTypes'
import { renderMermaid, resetMermaidTheme } from '../helpers/mermaid'
import { formatCode, isFormattable } from '../helpers/format'

const props = defineProps<NodeViewProps>()

const { $gettext } = useGettext()

const host = ref<HTMLElement>()
let view: EditorView | null = null

// Guards the two-way sync: while one side is applying the other's change, its own change
// listener must not bounce the edit straight back.
let syncing = false

const language = computed(() => (props.node.attrs.language as string) || '')
const languageLabel = computed(() => unref(language) || $gettext('Plain text'))

const languageOptions = computed(() => [
  { value: '', label: $gettext('Plain text') },
  ...fenceLanguages.map((option) => ({ value: option, label: option }))
])

const isMermaid = computed(() => unref(language) === 'mermaid')
// A diagram is more useful than its source most of the time, so it opens rendered.
const showDiagram = ref(true)
const diagramSvg = ref('')
const diagramError = ref('')

let diagramTimer: ReturnType<typeof setTimeout> | null = null

const renderDiagram = async () => {
  const code = props.node.textContent.trim()
  if (!code) {
    diagramSvg.value = ''
    diagramError.value = ''
    return
  }
  try {
    diagramSvg.value = await renderMermaid(code, unref(isDark))
    diagramError.value = ''
  } catch (error) {
    // Invalid syntax is the normal state while a diagram is being written, so the message is
    // shown in place rather than clearing the last good render silently.
    diagramError.value = (error as Error).message || $gettext('This diagram could not be rendered.')
  }
}

/**
 * Switch a rendered diagram back to its source and put the caret in it.
 *
 * Bound to double-click and to Enter, so the diagram is reachable without a pointer. The header
 * toggle does the same thing, but it is only visible on hover — double-clicking the drawing is the
 * obvious gesture when the diagram is what you are looking at.
 */
const editDiagram = async () => {
  showDiagram.value = false
  await nextTick()
  view?.focus()
}

/**
 * Go back to the rendered diagram once focus leaves the block entirely.
 *
 * Deliberately not keyed on `event.relatedTarget`: that is null whenever focus moves to something
 * unfocusable, which is most of a document, so clicking ordinary text elsewhere left the block
 * stuck in source mode. Reading `document.activeElement` after the event settles reports where
 * focus actually ended up in every case.
 */
const onFocusOut = (event: FocusEvent) => {
  if (!unref(isMermaid) || unref(showDiagram)) {
    return
  }
  const wrapper = event.currentTarget as HTMLElement
  setTimeout(() => {
    if (!wrapper.isConnected || wrapper.contains(document.activeElement)) {
      return
    }
    showDiagram.value = true
  })
}

// Mermaid parses and lays out the whole diagram, which is far too slow to run per keystroke.
const scheduleDiagram = () => {
  if (diagramTimer) {
    clearTimeout(diagramTimer)
  }
  diagramTimer = setTimeout(() => {
    diagramTimer = null
    renderDiagram()
  }, 300)
}

// Provided by MarkdownEditor, which reads it from the host theme store. A node view cannot take
// props of its own, so the theme reaches it by injection rather than through NodeViewProps.
const isDark = inject<Ref<boolean>>('cern-editor-is-dark', ref(false))

// Same injection route as the theme: the read-only flag has to reach the header controls, which
// tiptap's own `editable` handling does not cover.
const isReadOnly = inject<Ref<boolean>>('cern-editor-is-read-only', ref(false))

const languageCompartment = new Compartment()
const themeCompartment = new Compartment()
const editableCompartment = new Compartment()

const resolveLanguage = (name: string): Extension => {
  const support = loadLanguage(grammarForLanguage(name))
  if (!support) {
    return []
  }
  return 'token' in support ? StreamLanguage.define(support) : support
}

/**
 * Put the caret in the embedded editor when the click landed in the block but outside CodeMirror's
 * content — the padding below the last line, say. Otherwise focus goes nowhere and the next
 * keystroke is handled by whatever ProseMirror still had selected.
 */
const focusEditor = (event: MouseEvent) => {
  if (!view || view.hasFocus) {
    return
  }
  if (view.contentDOM.contains(event.target as Node)) {
    // CodeMirror handles this one itself, and doing it here would fight its own placement.
    return
  }
  view.focus()
}

const canFormat = computed(() => !unref(isReadOnly) && isFormattable(unref(language)))

/**
 * Re-indent the block. The edit goes through CodeMirror rather than ProseMirror so it lands in the
 * embedded editor's undo history, and the existing sync carries it back into the document.
 */
const format = () => {
  if (!view) {
    return
  }
  const current = view.state.doc.toString()
  const { text } = formatCode(current, unref(language))
  if (text === undefined || text === current) {
    return
  }
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } })
}

const setLanguage = (value: string) => {
  props.updateAttributes({ language: value || null })
}

/**
 * Push CodeMirror's text into the ProseMirror document.
 *
 * The node's content is replaced wholesale rather than diffed: a fenced block is small, and a
 * single replacement keeps the two documents in step without reimplementing a diff.
 */
const pushToProseMirror = (text: string) => {
  if (syncing) {
    return
  }
  const pos = props.getPos()
  if (typeof pos !== 'number') {
    return
  }
  const { state, dispatch } = props.editor.view

  // Read the node out of the live state rather than trusting `props.node`. The prop only updates
  // once Vue re-renders, so during fast typing it still describes the previous revision — and
  // computing the replace range from its stale `nodeSize` corrupts the document.
  const current = state.doc.nodeAt(pos)
  if (!current) {
    return
  }

  const start = pos + 1
  const end = pos + current.nodeSize - 1
  if (state.doc.textBetween(start, end) === text) {
    return
  }

  const tr = state.tr.replaceWith(start, end, text ? state.schema.text(text) : ([] as never[]))
  syncing = true
  dispatch(tr)
  syncing = false
}

/**
 * Move the selection out of this block and back into the outer document. Without this the
 * embedded editor traps the caret: arrow keys at the edges would do nothing.
 */
const escapeToProseMirror = (dir: -1 | 1) => {
  const pos = props.getPos()
  if (typeof pos !== 'number') {
    return false
  }
  const outer = props.editor.view
  const target = dir === -1 ? pos - 1 : pos + props.node.nodeSize
  const selection = Selection.near(outer.state.doc.resolve(target), dir)
  outer.dispatch(outer.state.tr.setSelection(selection).scrollIntoView())
  outer.focus()
  return true
}

const boundaryKeymap = keymap.of([
  {
    key: 'ArrowUp',
    run: (cm) => {
      const { state } = cm
      if (state.selection.main.from > 0) {
        return false
      }
      return escapeToProseMirror(-1)
    }
  },
  {
    key: 'ArrowLeft',
    run: (cm) => (cm.state.selection.main.from === 0 ? escapeToProseMirror(-1) : false)
  },
  {
    key: 'ArrowDown',
    run: (cm) => {
      const { state } = cm
      if (state.selection.main.to < state.doc.length) {
        return false
      }
      return escapeToProseMirror(1)
    }
  },
  {
    key: 'ArrowRight',
    run: (cm) =>
      cm.state.selection.main.to === cm.state.doc.length ? escapeToProseMirror(1) : false
  },
  {
    key: 'Backspace',
    run: (cm) => {
      if (cm.state.doc.length !== 0) {
        return false
      }
      // An empty block is removed entirely, which is what pressing backspace into it implies.
      props.deleteNode()
      return true
    }
  },
  {
    // Leaves the block and starts a paragraph after it, the standard way out of a code block.
    key: 'Mod-Enter',
    run: () => {
      const { state, dispatch } = props.editor.view
      exitCode(state, dispatch)
      props.editor.view.focus()
      return true
    }
  }
])

onMounted(() => {
  view = new EditorView({
    parent: unref(host),
    state: EditorState.create({
      doc: props.node.textContent,
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        // Boundary handling must win over the default bindings, so it comes first.
        boundaryKeymap,
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        indentUnit.of('  '),
        EditorView.lineWrapping,
        editableCompartment.of(EditorView.editable.of(props.editor.isEditable)),
        languageCompartment.of(resolveLanguage(unref(language))),
        themeCompartment.of(codemirrorTheme(unref(isDark))),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            pushToProseMirror(update.state.doc.toString())
          }
        })
      ]
    })
  })
})

onBeforeUnmount(() => {
  if (diagramTimer) {
    clearTimeout(diagramTimer)
  }
  view?.destroy()
  view = null
})

watch(language, (value) => {
  view?.dispatch({ effects: languageCompartment.reconfigure(resolveLanguage(value)) })
})

watch(isDark, (dark) => {
  view?.dispatch({ effects: themeCompartment.reconfigure(codemirrorTheme(dark)) })
  if (unref(isMermaid)) {
    resetMermaidTheme()
    renderDiagram()
  }
})

watch(
  [isMermaid, showDiagram, () => props.node.textContent],
  ([mermaidBlock, visible]) => {
    if (mermaidBlock && visible) {
      scheduleDiagram()
    }
  },
  { immediate: true }
)

watch(
  () => props.editor.isEditable,
  (editable) =>
    view?.dispatch({
      effects: editableCompartment.reconfigure(EditorView.editable.of(editable))
    })
)

// External edits — undo, "Save as", a conflict resolution — arrive as a new node.
watch(
  () => props.node.textContent,
  (text) => {
    if (!view || syncing || text === view.state.doc.toString()) {
      return
    }
    syncing = true
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } })
    syncing = false
  }
)

// Focus the embedded editor when ProseMirror puts the selection inside this node.
watch(
  () => props.selected,
  (selected) => {
    if (selected && view && !view.hasFocus) {
      view.focus()
    }
  }
)
</script>

<style lang="scss">
.cern-code-block {
  background-color: var(--oc-color-background-muted);
  border: 1px solid var(--oc-color-border);
  border-radius: 5px;
  margin: var(--oc-space-small) 0;
  overflow: hidden;
  position: relative;

  &-selected {
    border-color: var(--oc-color-swatch-primary-default);
  }

  // A slim row of its own at the top, in normal flow. Floating it over the content meant it sat
  // on the first line — and on an empty block, on the only line there was. The row always reserves
  // its (small) height so revealing the chip never shifts the code.
  &-header {
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    gap: 2px;
    height: 1.4rem;
    justify-content: flex-end;
    overflow: hidden;
    padding: 0 var(--oc-space-xsmall);
  }

  &-header > * {
    opacity: 0;
    transition: opacity 0.1s ease-in-out;
  }

  &:hover &-header > *,
  &:focus-within &-header > *,
  &.cern-code-block-selected &-header > * {
    opacity: 1;
  }

  &-chip {
    align-items: center;
    border-radius: 3px;
    color: var(--oc-color-text-muted);
    display: inline-flex;
    font-size: var(--oc-font-size-xsmall, 0.75rem);
    gap: 2px;
    line-height: 1.2;
    padding: 1px var(--oc-space-xsmall);
    text-transform: lowercase;

    &:hover {
      background-color: var(--oc-color-background-hover);
      color: var(--oc-color-text-default);
    }
  }

  &-language {
    cursor: default;

    &:hover {
      background-color: transparent;
      color: var(--oc-color-text-muted);
    }
  }

  &-host .cm-editor {
    background: transparent;
  }

  &-host .cm-editor.cm-focused {
    outline: none;
  }

  &-host .cm-gutters {
    background: transparent;
    border-right: 1px solid var(--oc-color-border);
  }

  &-diagram {
    cursor: pointer;
    overflow-x: auto;
    padding: var(--oc-space-medium);
    text-align: center;

    &:focus-visible {
      outline: 2px solid var(--oc-color-swatch-primary-default);
      outline-offset: -2px;
    }

    // A diagram that failed to parse is not worth pretending about: show the source cursor, since
    // editing is the only useful action.
    &-failed {
      cursor: text;
    }

    &-error {
      align-items: center;
      color: var(--oc-color-swatch-danger-default);
      display: flex;
      font-family:
        ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
      font-size: calc(var(--oc-font-size-small, 0.875rem) * var(--cern-md-font-scale, 1));
      gap: var(--oc-space-xsmall);
      justify-content: center;
      text-align: left;
      white-space: pre-wrap;
    }

    &-svg svg {
      height: auto;
      max-width: 100%;
    }
  }

  // Tracks the Markdown editor's zoom, which sets --cern-md-font-scale on the content pane. A
  // fixed size here meant zooming grew the prose but left every code block behind.
  &-host .cm-scroller {
    font-size: calc(var(--oc-font-size-small, 0.875rem) * var(--cern-md-font-scale, 1));
  }
}
</style>
