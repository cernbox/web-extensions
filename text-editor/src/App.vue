<template>
  <div class="cern-text-editor oc-width-1-1 oc-height-1-1">
    <markdown-editor
      v-if="showRichTextEditor"
      :current-content="currentContent"
      :is-read-only="isReadOnly"
      :is-dark="isDark"
      :direct-link="resource?.privateLink"
      @update:current-content="$emit('update:currentContent', $event)"
      @toggle-source="sourceMode = true"
    />
    <div v-else-if="showPreview" class="cern-text-editor-preview oc-flex oc-flex-column">
      <editor-toolbar :groups="[]">
        <template #right>
          <oc-button
            v-oc-tooltip="backLabel"
            :aria-label="backLabel"
            appearance="raw"
            size="small"
            @click="previewMode = false"
          >
            <oc-icon :name="isReadOnly ? 'file-text' : 'edit'" size="small" fill-type="line" />
            <span class="oc-ml-xs">{{ backText }}</span>
          </oc-button>
        </template>
      </editor-toolbar>
      <structured-preview
        :content="currentContent"
        :kind="previewKind"
        :delimiter="resource?.extension?.toLowerCase() === 'tsv' ? '\t' : ','"
      />
    </div>
    <code-editor
      v-else
      :current-content="currentContent"
      :extension="codeExtension"
      :is-read-only="isReadOnly"
      :is-dark="isDark"
      :show-source-toggle="sourceMode"
      :preview-kind="previewKind"
      @update:current-content="$emit('update:currentContent', $event)"
      @toggle-source="sourceMode = false"
      @show-preview="previewMode = true"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, unref } from 'vue'
import { storeToRefs } from 'pinia'
import { useGettext } from 'vue3-gettext'
import { Resource } from '@ownclouders/web-client'
import { AppConfigObject, useThemeStore } from '@ownclouders/web-pkg'
import MarkdownEditor from './components/MarkdownEditor.vue'
import CodeEditor from './components/CodeEditor.vue'
import EditorToolbar from './components/EditorToolbar.vue'
import StructuredPreview from './components/StructuredPreview.vue'
import { isMarkdownExtension, previewFor } from './helpers/fileTypes'

interface Props {
  applicationConfig?: AppConfigObject
  currentContent: string
  isReadOnly?: boolean
  resource?: Resource
}
interface Emits {
  (e: 'update:currentContent', value: string): void
}

const {
  applicationConfig = undefined,
  currentContent,
  isReadOnly = false,
  resource = undefined
} = defineProps<Props>()
defineEmits<Emits>()

const { $gettext } = useGettext()

// storeToRefs, not destructuring: a pinia setup store is reactive()-wrapped, so plain
// destructuring yields the unwrapped value and the editor would keep the theme it mounted with.
const { currentTheme } = storeToRefs(useThemeStore())

/**
 * Follows the host theme, which itself falls back to the system `prefers-color-scheme` when the
 * user has not pinned a theme, so this inherits from the OS without asking for it directly.
 */
const isDark = computed(() => Boolean(unref(currentTheme)?.isDark))

/** Set from the Markdown toolbar to edit the raw source rather than the rendered document. */
const sourceMode = ref(false)

/** Set from the code toolbar to render a JSON tree or a CSV table instead of the text. */
const previewMode = ref(false)

const backLabel = computed(() =>
  isReadOnly ? $gettext('Back to the text') : $gettext('Back to editing')
)

const backText = computed(() => (isReadOnly ? $gettext('Text') : $gettext('Edit')))

/**
 * Markdown gets the rich-text editor; everything else gets CodeMirror. `markdownForAll` exists
 * because the built-in app had a `showPreviewOnlyMd: false` escape hatch that rendered every
 * file as markdown, and a deployment relying on it needs a way to keep that behaviour.
 */
const isMarkdownFile = computed(() => {
  if (applicationConfig?.markdownForAll) {
    return true
  }
  return isMarkdownExtension(resource?.extension)
})

const previewKind = computed(() =>
  unref(isMarkdownFile) ? undefined : previewFor(resource?.extension)
)

const showRichTextEditor = computed(() => unref(isMarkdownFile) && !unref(sourceMode))

const showPreview = computed(() => Boolean(unref(previewKind)) && unref(previewMode))

// In source mode the file is Markdown, so highlight it as Markdown even when the extension is
// something `markdownForAll` swept in.
const codeExtension = computed(() => (unref(isMarkdownFile) ? 'md' : resource?.extension))
</script>

<style lang="scss">
.cern-text-editor {
  // The only painted surface in the editor. Every pane inside stays transparent: the prose column
  // is narrower than its scroll container, and any descendant that painted its own background
  // produced a visible seam down both sides of the text.
  background-color: var(--oc-color-background-default);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  > * {
    flex: 1;
    min-height: 0;
  }

  // The design system draws a focus ring on every :focus-visible element, exempting the text
  // inputs whose caret already indicates focus (helper.scss:121). A contenteditable is the same
  // kind of surface but is not an <input>, so the exemption misses it: ProseMirror's editable and
  // CodeMirror's content each picked up `box-shadow: 0 0 0 4px`, which drew a band down both
  // sides of the prose column. `outline: none` does not remove it — it is a box-shadow.
  //
  // The ring is dropped only for these editing surfaces, where the caret is the focus indicator.
  // Every button and menu in the editor keeps it.
  .tiptap:focus-visible,
  .cm-content:focus-visible,
  .cm-editor:focus-visible {
    box-shadow: none !important;
    outline: none !important;
  }

  &-preview {
    height: 100%;

    > :last-child {
      flex: 1;
      min-height: 0;
    }
  }
}
</style>
