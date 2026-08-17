<template>
  <div class="cern-link-modal">
    <oc-text-input
      v-if="textEditable"
      v-model="text"
      :label="$gettext('Text to display')"
      :description-message="$gettext('Leave empty to show the address itself.')"
      @keydown.enter.prevent="emit('confirm')"
    />
    <oc-text-input
      ref="urlInput"
      v-model="href"
      type="url"
      :label="$gettext('Link address')"
      :description-message="$gettext('Leave empty to remove the link.')"
      @keydown.enter.prevent="emit('confirm')"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, unref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import type { Modal } from '@ownclouders/web-pkg'

export interface LinkModalResult {
  href: string
  text: string
}

interface Props {
  modal: Modal
  initialHref?: string
  initialText?: string
  /** False when text is already selected in the document: that selection is the link text. */
  textEditable?: boolean
  /** Called on every edit. The dialog applies the last reported value when confirmed. */
  onChange: (result: LinkModalResult) => void
}
const { initialHref = '', initialText = '', textEditable = true, onChange } = defineProps<Props>()

const emit = defineEmits<{ confirm: [] }>()

const { $gettext } = useGettext()

const href = ref(initialHref)
const text = ref(initialText)
const urlInput = ref<{ focus?: () => void } | null>(null)

/**
 * Report edits upward instead of acting on confirm here.
 *
 * The work is done by the modal's own `onConfirm`, which ModalWrapper checks first and always
 * follows with `removeModal`. Driving it from this component meant relying on ModalWrapper
 * reaching an exposed method, and anything that goes wrong on that path leaves the dialog open
 * with its loading flag set — which looks exactly like the app hanging.
 */
watch([href, text], () => {
  onChange({ href: unref(href).trim(), text: unref(text).trim() })
})

onMounted(() => {
  unref(urlInput)?.focus?.()
})
</script>

<style lang="scss">
.cern-link-modal {
  display: flex;
  flex-direction: column;
  gap: var(--oc-space-medium);
}
</style>
