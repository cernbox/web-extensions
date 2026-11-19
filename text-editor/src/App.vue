<template>
  <div class="cern-text-editor oc-width-1-1 oc-height-1-1">
    <div
      v-if="isBinary"
      class="cern-text-editor-binary-notice oc-flex oc-flex-middle oc-px-m oc-py-s"
      role="status"
    >
      <oc-icon name="error-warning" fill-type="line" size="small" class="oc-mr-s" />
      <span
        v-text="
          $gettext(
            'This file does not appear to be text. It is opened read-only to avoid damaging it.'
          )
        "
      />
    </div>
    <div v-if="joining" class="oc-flex oc-flex-center oc-flex-middle">
      <oc-spinner size="large" :aria-label="$gettext('Joining the file')" />
    </div>
    <markdown-editor
      v-else-if="showRichTextEditor"
      :current-content="currentContent"
      :is-read-only="readOnly"
      :is-dark="isDark"
      :direct-link="resource?.privateLink"
      @update:current-content="$emit('update:currentContent', $event)"
      @toggle-source="sourceMode = true"
    />
    <structured-preview
      v-else-if="showPreview"
      :content="currentContent"
      :kind="previewKind"
      :delimiter="resource?.extension?.toLowerCase() === 'tsv' ? '\t' : ','"
      :is-read-only="readOnly"
      @hide-preview="previewMode = false"
    />
    <code-editor
      v-else
      :current-content="currentContent"
      :extension="codeExtension"
      :is-read-only="readOnly"
      :is-dark="isDark"
      :show-source-toggle="sourceMode"
      :preview-kind="previewKind"
      :collab="collab"
      @update:current-content="$emit('update:currentContent', $event)"
      @toggle-source="sourceMode = false"
      @show-preview="previewMode = true"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, unref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGettext } from 'vue3-gettext'
import { Resource } from '@ownclouders/web-client'
import { AppConfigObject, useAuthStore, useMessages, useThemeStore } from '@ownclouders/web-pkg'
import MarkdownEditor from './components/MarkdownEditor.vue'
import CodeEditor from './components/CodeEditor.vue'
import StructuredPreview from './components/StructuredPreview.vue'
import { isMarkdownExtension, looksBinary, previewFor } from './helpers/fileTypes'
import { sharedText } from './collab/document'
import { joinRoom, type Collab, type Room } from './collab/room'
import { syncWithWrapper } from './collab/saves'

interface Props {
  applicationConfig?: AppConfigObject
  currentContent: string
  isReadOnly?: boolean
  isDirty?: boolean
  resource?: Resource
  // CERNBox's AppWrapper passes the etag it saves with. Without it the clients could not hand
  // each other their saves, so the file is not edited together.
  currentETag?: string
}
interface Emits {
  (e: 'update:currentContent', value: string): void
  (e: 'update:serverState', value: { etag: string; content?: string }): void
}

const {
  applicationConfig = undefined,
  currentContent,
  isReadOnly = false,
  isDirty = false,
  resource = undefined,
  currentETag = undefined
} = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $gettext } = useGettext()
const authStore = useAuthStore()
const { showErrorMessage } = useMessages()

// storeToRefs, not destructuring: a pinia setup store is reactive()-wrapped, so plain
// destructuring yields the unwrapped value and the editor would keep the theme it mounted with.
const { currentTheme } = storeToRefs(useThemeStore())

/**
 * Follows the host theme, which itself falls back to the system `prefers-color-scheme` when the
 * user has not pinned a theme, so this inherits from the OS without asking for it directly.
 */
const isDark = computed(() => Boolean(unref(currentTheme)?.isDark))

const isBinary = computed(() => looksBinary(currentContent))

const readOnly = computed(() => isReadOnly || unref(isBinary))

/** Set from the Markdown toolbar to edit the raw source rather than the rendered document. */
const sourceMode = ref(false)

/** Set from the code toolbar to render a JSON tree or a CSV table instead of the text. */
const previewMode = ref(false)

/**
 * Markdown gets the rich-text editor; everything else gets CodeMirror. `markdownForAll` exists
 * because the built-in app had a `showPreviewOnlyMd: false` escape hatch that rendered every
 * file as markdown, and a deployment relying on it needs a way to keep that behaviour.
 */
const isMarkdownFile = computed(() => {
  // TipTap normalises the document on load and emits it, which would mark a binary file dirty
  // and let autosave write the mangled content back. CodeMirror only emits on user edits.
  if (unref(isBinary)) {
    return false
  }
  if (applicationConfig?.markdownForAll) {
    return true
  }
  return isMarkdownExtension(resource?.extension)
})

const previewKind = computed(() =>
  unref(isMarkdownFile) || unref(isBinary) ? undefined : previewFor(resource?.extension)
)

const showRichTextEditor = computed(() => unref(isMarkdownFile) && !unref(sourceMode))

const showPreview = computed(() => Boolean(unref(previewKind)) && unref(previewMode))

// In source mode the file is Markdown, so highlight it as Markdown even when the extension is
// something `markdownForAll` swept in.
const codeExtension = computed(() => {
  if (unref(isBinary)) {
    return undefined
  }
  return unref(isMarkdownFile) ? 'md' : resource?.extension
})

// ---------------------------------------------------------------------------------------------
// Editing together, through a room on the Yjs server that y-codemirror keeps in step with the
// editor. Only for files CodeMirror edits: the Markdown editor holds a document tree, not the
// text, and its source mode cannot share a room with it.

const yjsServerUrl = applicationConfig?.yjsServerUrl
const joining = ref(
  typeof yjsServerUrl === 'string' &&
    currentETag !== undefined &&
    resource !== undefined &&
    !unref(isMarkdownFile) &&
    !unref(isBinary)
)
let room: Room | null = null
let sync: ReturnType<typeof syncWithWrapper> | undefined
const collab = shallowRef<Collab>()

const join = async () => {
  room = await joinRoom({
    url: yjsServerUrl as string,
    fileId: resource.fileId ?? resource.id,
    token: () => authStore.accessToken,
    content: currentContent,
    etag: currentETag,
    canWrite: !isReadOnly
  })
  if (!room) {
    if (!isReadOnly) {
      showErrorMessage({
        title: $gettext('Live editing is not available'),
        desc: $gettext('Others who open this file will not see your changes until you save.')
      })
    }
    return
  }

  if (!isReadOnly) {
    sync = syncWithWrapper(room.doc, {
      isDirty: () => isDirty,
      content: () => currentContent,
      setContent: (content) => emit('update:currentContent', content),
      setServerState: (state) => emit('update:serverState', state)
    })
  }
  collab.value = { text: sharedText(room.doc), awareness: room.provider.awareness }
}

watch(
  () => currentETag,
  (etag) => sync?.etagChanged(etag ?? '')
)

onMounted(async () => {
  if (unref(joining)) {
    await join()
    joining.value = false
  }
})

onBeforeUnmount(() => {
  sync?.stop()
  room?.provider.destroy()
  room?.doc.destroy()
})
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

  > .cern-text-editor-binary-notice {
    flex: 0 0 auto;
    background-color: var(--oc-color-background-highlight);
    border-left: 4px solid var(--oc-color-swatch-warning-default);
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
}
</style>
