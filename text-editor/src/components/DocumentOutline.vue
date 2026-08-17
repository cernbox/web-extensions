<template>
  <aside class="cern-md-outline" :aria-label="$gettext('Document outline')">
    <p class="cern-md-outline-title oc-text-muted">{{ $gettext('Outline') }}</p>
    <p v-if="!items.length" class="cern-md-outline-empty oc-text-muted">
      {{ $gettext('Add a heading to build the outline.') }}
    </p>
    <nav v-else ref="nav">
      <ul class="cern-md-outline-list">
        <li v-for="item in items" :key="item.id" :data-active="item.isActive || undefined">
          <oc-button
            :class="{
              'cern-md-outline-active': item.isActive,
              'cern-md-outline-read': item.isScrolledOver && !item.isActive
            }"
            :style="{ paddingLeft: `${(item.level - 1) * 0.75}rem` }"
            appearance="raw"
            justify-content="left"
            @click="emit('select', item)"
          >
            <span class="cern-md-outline-text">{{ item.textContent || $gettext('Untitled') }}</span>
          </oc-button>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script lang="ts" setup>
import { nextTick, ref, unref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import type { TableOfContentDataItem } from '@tiptap/extension-table-of-contents'

interface Props {
  items: TableOfContentDataItem[]
}
interface Emits {
  (e: 'select', item: TableOfContentDataItem): void
}
const { items } = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $gettext } = useGettext()

const nav = ref<HTMLElement>()

/**
 * Keep the active entry in view as the document scrolls. `block: 'nearest'` scrolls only the
 * panel, and only when the entry is actually off-screen, so a long outline follows along without
 * yanking the list on every heading change.
 */
watch(
  () => items.find((item) => item.isActive)?.id,
  async (activeId) => {
    if (!activeId) {
      return
    }
    await nextTick()
    unref(nav)?.querySelector('li[data-active] > button')?.scrollIntoView({ block: 'nearest' })
  }
)
</script>

<style lang="scss">
.cern-md-outline {
  border-left: 1px solid var(--oc-color-border);
  flex: 0 0 15rem;
  overflow-y: auto;
  padding: var(--oc-space-small);

  &-title {
    font-size: var(--oc-font-size-xsmall, 0.75rem);
    letter-spacing: 0.05em;
    margin: 0 0 var(--oc-space-xsmall);
    text-transform: uppercase;
  }

  &-empty {
    font-size: var(--oc-font-size-small, 0.875rem);
    margin: 0;
  }

  &-list {
    list-style: none;
    margin: 0;
    padding: 0;

    li > button {
      border-radius: 3px;
      font-size: var(--oc-font-size-small, 0.875rem);
      text-align: left;
      width: 100%;

      &:hover {
        background-color: var(--oc-color-background-hover);
      }
    }
  }

  &-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &-active {
    background-color: var(--oc-color-background-hover);
    font-weight: bold;
  }

  // Headings already scrolled past, so the outline shows reading position rather than just a
  // single highlighted row.
  &-read {
    opacity: 0.65;
  }
}
</style>
