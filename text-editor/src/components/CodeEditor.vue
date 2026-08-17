<template>
  <div class="cern-code-editor oc-flex oc-flex-column">
    <editor-toolbar :groups="toolbarGroups">
      <template #right>
        <oc-button
          v-if="previewKind"
          v-oc-tooltip="previewLabel"
          :aria-label="previewLabel"
          class="cern-editor-toolbar-button"
          appearance="raw"
          @click="emit('showPreview')"
        >
          <oc-icon :name="previewIcon" size="small" />
          <span class="oc-ml-xs">{{ $gettext('Preview') }}</span>
        </oc-button>
        <oc-button
          v-if="showSourceToggle"
          v-oc-tooltip="$gettext('Switch back to the rich text editor')"
          :aria-label="$gettext('Switch back to the rich text editor')"
          class="cern-editor-toolbar-button"
          appearance="raw"
          @click="emit('toggleSource')"
        >
          <oc-icon name="article" size="small" fill-type="line" />
          <span class="oc-ml-xs">{{ $gettext('Rich text') }}</span>
        </oc-button>
      </template>
    </editor-toolbar>
    <p v-if="formatError" class="cern-code-editor-error">
      <oc-icon name="error-warning" fill-type="line" size="small" />
      {{ formatError }}
    </p>
    <div ref="host" class="cern-code-editor-host" />
    <footer v-if="!isReadOnly" class="cern-code-editor-footer oc-text-muted">
      {{ documentSummary }}
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import { Compartment, EditorState, type Extension } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { indentWithTab, redo, redoDepth, undo, undoDepth } from '@codemirror/commands'
import { StreamLanguage, indentUnit } from '@codemirror/language'
import { basicSetup } from 'codemirror'
import { closeSearchPanel, searchPanelOpen } from '@codemirror/search'
import { codemirrorTheme } from '../helpers/codemirrorTheme'
import EditorToolbar from './EditorToolbar.vue'
import { grammarFor, loadLanguage, type PreviewKind } from '../helpers/fileTypes'
import { formatCode, isFormattable } from '../helpers/format'
import type { ToolbarGroup } from '../helpers/toolbar'

interface Props {
  currentContent: string
  extension?: string
  isReadOnly?: boolean
  isDark?: boolean
  /** Shown when the Markdown editor delegated here for raw source editing. */
  showSourceToggle?: boolean
  /** Set when this file type has a rendered view to offer alongside the text. */
  previewKind?: PreviewKind
}
interface Emits {
  (e: 'update:currentContent', value: string): void
  (e: 'toggleSource'): void
  (e: 'showPreview'): void
}

const {
  currentContent,
  extension = undefined,
  isReadOnly = false,
  isDark = false,
  showSourceToggle = false,
  previewKind = undefined
} = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $gettext, interpolate } = useGettext()

const formatError = ref('')

const previewLabel = computed(() =>
  previewKind === 'csv' ? $gettext('Show as a table') : $gettext('Show as a tree')
)

const previewIcon = computed(() => (previewKind === 'csv' ? 'table-2' : 'node-tree'))

const documentSummary = computed(() => {
  // Depends on `revision`, which the update listener bumps; the view itself is not reactive.
  void unref(revision)
  const doc = view?.state.doc
  if (!doc) {
    return ''
  }
  const text = doc.toString()
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return interpolate($gettext('%{lines} lines, %{words} words, %{characters} characters'), {
    lines: doc.lines,
    words,
    characters: doc.length
  })
})

const host = ref<HTMLElement>()
let view: EditorView | null = null

const MIN_FONT_SIZE = 10
const MAX_FONT_SIZE = 28
const DEFAULT_FONT_SIZE = 14
const fontSize = ref(DEFAULT_FONT_SIZE)

// Bumped on every transaction so the toolbar's undo/redo enabled state recomputes. Reading
// `undoDepth(view.state)` inside a computed cannot track on its own, because the view is not
// reactive.
const revision = ref(0)

// Compartments let the language, theme, font size and read-only state be reconfigured on an
// existing view. Rebuilding the state instead would discard the undo history and the cursor.
const language = new Compartment()
const theme = new Compartment()
const editable = new Compartment()
const fontTheme = new Compartment()

const themeExtension = (dark: boolean): Extension => codemirrorTheme(dark)

const editableExtension = (readOnly: boolean): Extension => [
  EditorState.readOnly.of(readOnly),
  EditorView.editable.of(!readOnly)
]

const fontExtension = (size: number): Extension =>
  EditorView.theme({ '.cm-scroller': { fontSize: `${size}px` } })

const resolveLanguage = (ext?: string): Extension => {
  const support = loadLanguage(grammarFor(ext))
  if (!support) {
    return []
  }
  // Legacy modes are stream parsers and need wrapping; Lezer-based ones are already extensions.
  return 'token' in support ? StreamLanguage.define(support) : support
}

/**
 * Re-indent the document in place, as a single transaction so one undo reverts it.
 */
const format = () => {
  if (!view) {
    return
  }
  const current = view.state.doc.toString()
  const { text, error } = formatCode(current, extension)
  if (error) {
    formatError.value = error
    return
  }
  formatError.value = ''
  if (text === undefined || text === current) {
    return
  }
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } })
}

const setFontSize = (size: number) => {
  fontSize.value = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, size))
  view?.dispatch({ effects: fontTheme.reconfigure(fontExtension(unref(fontSize))) })
}

// Zoom changes how the document is displayed, not what it contains, so it stays available on a
// file that cannot be edited.
const zoomGroup = (): ToolbarGroup => [
  {
    id: 'zoom-out',
    label: $gettext('Decrease font size'),
    icon: 'zoom-out',
    fillType: 'line',
    run: () => setFontSize(unref(fontSize) - 2),
    isDisabled: () => unref(fontSize) <= MIN_FONT_SIZE
  },
  {
    id: 'zoom-reset',
    label: $gettext('Reset font size'),
    icon: 'font-size',
    run: () => setFontSize(DEFAULT_FONT_SIZE),
    isDisabled: () => unref(fontSize) === DEFAULT_FONT_SIZE
  },
  {
    id: 'zoom-in',
    label: $gettext('Increase font size'),
    icon: 'zoom-in',
    fillType: 'line',
    run: () => setFontSize(unref(fontSize) + 2),
    isDisabled: () => unref(fontSize) >= MAX_FONT_SIZE
  }
]

const toolbarGroups = computed<ToolbarGroup[]>(() => {
  // Referenced so the enabled state recomputes when the document changes.
  void unref(revision)

  if (isReadOnly) {
    return [zoomGroup()]
  }

  return [
    [
      {
        id: 'undo',
        label: $gettext('Undo'),
        icon: 'arrow-go-back',
        fillType: 'line',
        run: () => view && undo(view),
        isDisabled: () => !view || undoDepth(view.state) === 0
      },
      {
        id: 'redo',
        label: $gettext('Redo'),
        icon: 'arrow-go-forward',
        fillType: 'line',
        run: () => view && redo(view),
        isDisabled: () => !view || redoDepth(view.state) === 0
      }
    ],
    ...(isFormattable(extension)
      ? [
          [
            {
              id: 'format',
              label: $gettext('Format document'),
              icon: 'code-box',
              fillType: 'line' as const,
              run: () => format()
            }
          ]
        ]
      : []),
    zoomGroup()
  ]
})

/**
 * Close the search panel on Escape without the key reaching the application.
 *
 * This is a native capture-phase listener rather than a CodeMirror keymap or
 * `EditorView.domEventHandlers`, because both of those bind to the editor's `contentDOM` while the
 * search field lives in `.cm-panels`, a sibling. A keypress in the search box therefore never
 * reached them, and Escape fell through to the app's global handler, which closes the file.
 *
 * Capture on the editor's root element runs before the event can bubble out. Propagation is
 * stopped only while a panel is open, so Escape still closes the file the rest of the time.
 */
const onKeydownCapture = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !view || !searchPanelOpen(view.state)) {
    return
  }
  closeSearchPanel(view)
  event.preventDefault()
  event.stopPropagation()
}

onMounted(() => {
  view = new EditorView({
    parent: unref(host),
    state: EditorState.create({
      doc: currentContent ?? '',
      extensions: [
        // basicSetup already brings line numbers, fold gutter, history, search and
        // bracket matching; adding them again would render a second gutter.
        basicSetup,
        keymap.of([indentWithTab]),
        indentUnit.of('  '),
        EditorView.lineWrapping,
        language.of(resolveLanguage(extension)),
        theme.of(themeExtension(isDark)),
        editable.of(editableExtension(isReadOnly)),
        fontTheme.of(fontExtension(unref(fontSize))),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            emit('update:currentContent', update.state.doc.toString())
          }
          if (update.docChanged || update.selectionSet) {
            revision.value++
          }
        })
      ]
    })
  })

  view.dom.addEventListener('keydown', onKeydownCapture, true)
})

onBeforeUnmount(() => {
  view?.dom.removeEventListener('keydown', onKeydownCapture, true)
  view?.destroy()
  view = null
})

watch(
  () => extension,
  (ext) => view?.dispatch({ effects: language.reconfigure(resolveLanguage(ext)) })
)

watch(
  () => isDark,
  (dark) => view?.dispatch({ effects: theme.reconfigure(themeExtension(dark)) })
)

watch(
  () => isReadOnly,
  (readOnly) => view?.dispatch({ effects: editable.reconfigure(editableExtension(readOnly)) })
)

// The wrapper owns the content, and rewrites it on "Save as" and on conflict resolution. Only
// apply an incoming value when it actually differs, or every keystroke would round-trip through
// the parent and reset the cursor to the end of the document.
watch(
  () => currentContent,
  (value) => {
    if (!view || value === view.state.doc.toString()) {
      return
    }
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value ?? '' }
    })
  }
)
</script>

<style lang="scss">
.cern-code-editor {
  height: 100%;

  &-host {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  &-error {
    align-items: center;
    background-color: var(--oc-color-background-highlight, transparent);
    color: var(--oc-color-swatch-danger-default);
    display: flex;
    font-size: var(--oc-font-size-small, 0.875rem);
    gap: var(--oc-space-xsmall);
    padding: var(--oc-space-xsmall) var(--oc-space-medium);
  }

  &-footer {
    border-top: 1px solid var(--oc-color-border);
    font-size: var(--oc-font-size-small, 0.875rem);
    padding: var(--oc-space-xsmall) var(--oc-space-medium);
    text-align: right;
  }

  .cm-editor {
    height: 100%;
  }

  .cm-editor.cm-focused {
    // The design system already marks the focused region; CodeMirror's own outline doubles it up.
    outline: none;
  }
}
</style>
