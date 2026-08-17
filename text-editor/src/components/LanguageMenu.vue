<template>
  <span class="cern-language-menu">
    <oc-button
      ref="trigger"
      v-oc-tooltip="$gettext('Code block language')"
      :aria-label="$gettext('Code block language')"
      :aria-expanded="open"
      aria-haspopup="listbox"
      appearance="raw"
      class="cern-code-block-chip"
      @click="toggle"
    >
      <span>{{ label }}</span>
      <oc-icon name="arrow-down-s" fill-type="line" size="xsmall" />
    </oc-button>

    <teleport to="body">
      <div
        v-if="open"
        ref="menu"
        class="cern-language-menu-popup oc-box-shadow-medium oc-rounded"
        role="listbox"
        :style="position"
      >
        <button
          v-for="option in options"
          :key="option.value"
          class="cern-language-menu-option"
          :class="{ 'cern-language-menu-selected': option.value === value }"
          role="option"
          :aria-selected="option.value === value"
          type="button"
          @click="choose(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </teleport>
  </span>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, ref, unref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom'

interface Option {
  value: string
  label: string
}
interface Props {
  value: string
  label: string
  options: Option[]
}
interface Emits {
  (e: 'select', value: string): void
}
const { value, label, options } = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $gettext } = useGettext()

const open = ref(false)
const trigger = ref<{ $el?: HTMLElement } | null>(null)
const menu = ref<HTMLElement>()
const position = ref<Record<string, string>>({ left: '0', top: '0' })

let stopAutoUpdate: (() => void) | null = null

/**
 * Teleported to the body and positioned with floating-ui rather than rendered in place.
 *
 * This menu belongs to a ProseMirror node view living inside two nested `overflow` containers —
 * the code block and the editor's scroll pane — either of which clips a popup laid out in flow.
 * `size` also caps the height to what is actually on screen, so a long list scrolls instead of
 * running off the viewport.
 */
const reposition = async () => {
  const anchor = unref(trigger)?.$el
  const floating = unref(menu)
  if (!anchor || !floating) {
    return
  }
  const { x, y } = await computePosition(anchor, floating, {
    placement: 'bottom-end',
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply: ({ availableHeight, elements }) => {
          elements.floating.style.maxHeight = `${Math.max(120, availableHeight)}px`
        }
      })
    ]
  })
  position.value = { left: `${x}px`, top: `${y}px` }
}

const onPointerDown = (event: PointerEvent) => {
  const target = event.target as Node
  if (unref(menu)?.contains(target) || unref(trigger)?.$el?.contains(target)) {
    return
  }
  close()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') {
    return
  }
  // The editor closes the file on Escape; this must not reach it while the menu is open.
  event.stopPropagation()
  close()
}

const close = () => {
  open.value = false
}

const toggle = async () => {
  open.value = !unref(open)
  if (!unref(open)) {
    return
  }
  await nextTick()
  await reposition()
  const anchor = unref(trigger)?.$el
  const floating = unref(menu)
  if (anchor && floating) {
    // Keeps the menu attached while the document behind it scrolls.
    stopAutoUpdate = autoUpdate(anchor, floating, reposition)
  }
}

const choose = (next: string) => {
  emit('select', next)
  close()
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeydown, true)
    return
  }
  document.removeEventListener('pointerdown', onPointerDown, true)
  document.removeEventListener('keydown', onKeydown, true)
  stopAutoUpdate?.()
  stopAutoUpdate = null
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown, true)
  document.removeEventListener('keydown', onKeydown, true)
  stopAutoUpdate?.()
})

defineExpose({ close })
</script>

<style lang="scss">
.cern-language-menu {
  display: inline-flex;

  &-popup {
    background-color: var(--oc-color-background-default);
    border: 1px solid var(--oc-color-border);
    display: flex;
    flex-direction: column;
    min-width: 10rem;
    overflow-y: auto;
    padding: var(--oc-space-xsmall);
    position: absolute;
    z-index: 1000;
  }

  &-option {
    background: none;
    border: none;
    border-radius: 4px;
    color: var(--oc-color-text-default);
    cursor: pointer;
    font: inherit;
    padding: var(--oc-space-xsmall) var(--oc-space-small);
    text-align: left;
    transition: background-color 0.1s ease-in-out;
    white-space: nowrap;

    &:hover {
      background-color: var(--oc-color-background-hover);
    }
  }

  &-selected {
    color: var(--oc-color-swatch-primary-default);
    font-weight: bold;
  }
}
</style>
