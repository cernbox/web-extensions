<template>
  <div class="cern-json-node" :style="{ paddingLeft: depth ? '1rem' : '0' }">
    <template v-if="isBranch">
      <button class="cern-json-toggle" type="button" :aria-expanded="open" @click="open = !open">
        <oc-icon :name="open ? 'arrow-down-s' : 'arrow-right-s'" size="small" fill-type="line" />
        <span v-if="name !== null" class="cern-json-key">{{ name }}</span>
        <span class="cern-json-summary">{{ summary }}</span>
      </button>
      <div v-if="open">
        <json-node
          v-for="entry in entries"
          :key="entry.key"
          :name="entry.key"
          :value="entry.value"
          :depth="depth + 1"
        />
      </div>
    </template>

    <p v-else class="cern-json-leaf">
      <span v-if="name !== null" class="cern-json-key">{{ name }}:</span>
      <span :class="`cern-json-${valueType}`">{{ formatted }}</span>
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, unref } from 'vue'

interface Props {
  value: unknown
  /** Object key or array index. `null` at the document root, which has no name. */
  name: string | null
  depth: number
}
const { value, name, depth } = defineProps<Props>()

// Deep documents collapse below the second level so a large config opens readable.
const open = ref(depth < 2)

const isBranch = computed(() => typeof value === 'object' && value !== null)

const entries = computed(() => {
  if (!unref(isBranch)) {
    return []
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => ({ key: String(index), value: item }))
  }
  return Object.entries(value as Record<string, unknown>).map(([key, val]) => ({
    key,
    value: val
  }))
})

const summary = computed(() => {
  const count = unref(entries).length
  return Array.isArray(value) ? `[${count}]` : `{${count}}`
})

const valueType = computed(() => {
  if (value === null) {
    return 'null'
  }
  return typeof value
})

const formatted = computed(() => (typeof value === 'string' ? `"${value}"` : String(value)))
</script>

<style lang="scss">
.cern-json-node {
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: var(--oc-font-size-small, 0.875rem);
  line-height: 1.6;
}

.cern-json-toggle {
  align-items: center;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  gap: var(--oc-space-xsmall);
  padding: 0;

  &:hover {
    background-color: var(--oc-color-background-hover);
  }
}

.cern-json-leaf {
  margin: 0;
}

.cern-json-key {
  color: var(--oc-color-swatch-primary-default);
  margin-right: var(--oc-space-xsmall);
}

.cern-json-summary {
  color: var(--oc-color-text-muted);
}

.cern-json-string {
  color: var(--oc-color-swatch-success-default);
}

.cern-json-number,
.cern-json-boolean {
  color: var(--oc-color-swatch-warning-default);
}

.cern-json-null {
  color: var(--oc-color-text-muted);
}
</style>
