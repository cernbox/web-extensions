<template>
  <div class="cern-preview oc-flex oc-flex-column">
    <editor-toolbar :groups="toolbarGroups">
      <template #right>
        <oc-button
          v-oc-tooltip="backLabel"
          :aria-label="backLabel"
          class="cern-editor-toolbar-button"
          appearance="raw"
          @click="emit('hidePreview')"
        >
          <oc-icon :name="isReadOnly ? 'file-text' : 'edit'" size="small" fill-type="line" />
          <span class="oc-ml-xs">{{ backText }}</span>
        </oc-button>
      </template>
    </editor-toolbar>
    <div class="cern-preview-body">
      <p v-if="error" class="cern-preview-error">
        <oc-icon name="error-warning" size="small" fill-type="line" />
        {{ error }}
      </p>

      <table v-else-if="kind === 'csv' && rows.length" class="cern-preview-table">
        <thead>
          <tr>
            <th class="cern-preview-rownum" scope="col">#</th>
            <th v-for="(cell, index) in rows[0]" :key="`h-${index}`" scope="col">{{ cell }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in rows.slice(1)" :key="`r-${rowIndex}`">
            <td class="cern-preview-rownum">{{ rowIndex + 1 }}</td>
            <td v-for="(cell, cellIndex) in row" :key="`c-${cellIndex}`">{{ cell }}</td>
          </tr>
        </tbody>
      </table>

      <json-node v-else-if="kind === 'json'" :value="parsed" :name="null" :depth="0" :fold="fold" />

      <p v-else class="cern-preview-empty oc-text-muted">{{ $gettext('Nothing to preview.') }}</p>

      <p v-if="truncated" class="cern-preview-truncated oc-text-muted">
        {{ truncatedNotice }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, unref } from 'vue'
import { useGettext } from 'vue3-gettext'
import EditorToolbar from './EditorToolbar.vue'
import JsonNode from './JsonNode.vue'
import { parseDelimited } from '../helpers/delimited'
import type { PreviewKind } from '../helpers/fileTypes'
import type { ToolbarGroup } from '../helpers/toolbar'

interface Props {
  content: string
  kind: PreviewKind
  /** Column delimiter for the table view. Tabs for .tsv, commas otherwise. */
  delimiter?: string
  isReadOnly?: boolean
}
interface Emits {
  (e: 'hidePreview'): void
}
const { content, kind, delimiter = ',', isReadOnly = false } = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $gettext, interpolate } = useGettext()

const backLabel = computed(() =>
  isReadOnly ? $gettext('Back to the text') : $gettext('Back to editing')
)

const backText = computed(() => (isReadOnly ? $gettext('Text') : $gettext('Edit')))

/** Last "Collapse all" or "Expand all", handed down the tree for every node to follow. */
const fold = ref<{ expanded: boolean }>()

// Rendering an unbounded table locks the tab up on a large export. The raw editor has no such
// limit, so the file is always fully editable — only this preview is capped.
const MAX_ROWS = 500

const parsedCsv = computed(() => (kind === 'csv' ? parseDelimited(content ?? '', delimiter) : []))

const rows = computed(() => unref(parsedCsv).slice(0, MAX_ROWS + 1))

const truncated = computed(() => kind === 'csv' && unref(parsedCsv).length > MAX_ROWS + 1)

const truncatedNotice = computed(() =>
  interpolate($gettext('Showing the first %{shown} of %{total} rows.'), {
    shown: MAX_ROWS,
    total: unref(parsedCsv).length - 1
  })
)

const parsedJson = computed(() => {
  if (kind !== 'json') {
    return { value: null as unknown, error: '' }
  }
  try {
    return { value: JSON.parse(content || 'null') as unknown, error: '' }
  } catch (e) {
    return { value: null as unknown, error: (e as Error).message }
  }
})

const parsed = computed(() => unref(parsedJson).value)

const error = computed(() => {
  const message = unref(parsedJson).error
  if (!message) {
    return ''
  }
  return interpolate($gettext('This file is not valid JSON: %{message}'), { message })
})

const toolbarGroups = computed<ToolbarGroup[]>(() => {
  if (kind !== 'json' || unref(error)) {
    return []
  }
  return [
    [
      {
        id: 'collapse-all',
        label: $gettext('Collapse all'),
        icon: 'contract-up-down',
        fillType: 'line',
        run: () => (fold.value = { expanded: false })
      },
      {
        id: 'expand-all',
        label: $gettext('Expand all'),
        icon: 'expand-up-down',
        fillType: 'line',
        run: () => (fold.value = { expanded: true })
      }
    ]
  ]
})
</script>

<style lang="scss">
.cern-preview {
  height: 100%;

  &-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  // The table and the tree run edge to edge; only the text notices are inset.
  &-error,
  &-empty,
  &-truncated {
    margin: 0;
    padding: var(--oc-space-small) var(--oc-space-medium);
  }

  &-error {
    align-items: center;
    color: var(--oc-color-swatch-danger-default);
    display: flex;
    gap: var(--oc-space-xsmall);
  }

  &-truncated {
    font-size: var(--oc-font-size-small, 0.875rem);
  }

  &-table {
    border-collapse: collapse;
    font-size: var(--oc-font-size-small, 0.875rem);
    width: 100%;

    td,
    th {
      border: 1px solid var(--oc-color-border);
      padding: var(--oc-space-xsmall) var(--oc-space-small);
      text-align: left;
      vertical-align: top;
    }

    // Flush against the pane, the outer borders would double the toolbar's and the pane edge.
    thead th {
      border-top: none;
    }

    tr > :first-child {
      border-left: none;
    }

    tr > :last-child {
      border-right: none;
    }

    th {
      background-color: var(--oc-color-background-muted);
      font-weight: bold;
      position: sticky;
      top: 0;
    }
  }

  &-rownum {
    color: var(--oc-color-text-muted);
    text-align: right;
    user-select: none;
    width: 1%;
  }
}
</style>
