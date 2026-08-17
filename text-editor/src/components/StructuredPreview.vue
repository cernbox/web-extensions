<template>
  <div class="cern-preview">
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

    <json-node v-else-if="kind === 'json'" :value="parsed" :name="null" :depth="0" />

    <p v-else class="oc-text-muted">{{ $gettext('Nothing to preview.') }}</p>

    <p v-if="truncated" class="cern-preview-truncated oc-text-muted">
      {{ truncatedNotice }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed, unref } from 'vue'
import { useGettext } from 'vue3-gettext'
import JsonNode from './JsonNode.vue'
import { parseDelimited } from '../helpers/delimited'
import type { PreviewKind } from '../helpers/fileTypes'

interface Props {
  content: string
  kind: PreviewKind
  /** Column delimiter for the table view. Tabs for .tsv, commas otherwise. */
  delimiter?: string
}
const { content, kind, delimiter = ',' } = defineProps<Props>()

const { $gettext, interpolate } = useGettext()

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
</script>

<style lang="scss">
.cern-preview {
  height: 100%;
  overflow: auto;
  padding: var(--oc-space-small);

  &-error {
    align-items: center;
    color: var(--oc-color-swatch-danger-default);
    display: flex;
    gap: var(--oc-space-xsmall);
  }

  &-truncated {
    font-size: var(--oc-font-size-small, 0.875rem);
    margin-top: var(--oc-space-small);
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
