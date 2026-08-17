<template>
  <oc-list class="cern-insert-menu">
    <li v-if="!commands.length" class="cern-insert-menu-empty oc-text-muted">
      {{ $gettext('No matching block.') }}
    </li>
    <li v-for="(command, index) in commands" :key="command.id">
      <oc-button
        :class="{ 'cern-insert-menu-selected': index === selectedIndex }"
        appearance="raw"
        justify-content="left"
        @click="emit('select', command)"
      >
        <oc-icon :name="command.icon" :fill-type="command.fillType || 'none'" size="small" />
        <span class="cern-insert-menu-text">
          <span class="cern-insert-menu-label">{{ command.label }}</span>
          <span class="cern-insert-menu-description oc-text-muted">{{ command.description }}</span>
        </span>
      </oc-button>
    </li>
  </oc-list>
</template>

<script lang="ts" setup>
import { useGettext } from 'vue3-gettext'
import type { InsertCommand } from '../helpers/insertCommands'

interface Props {
  commands: InsertCommand[]
  selectedIndex?: number
}
interface Emits {
  (e: 'select', command: InsertCommand): void
}
defineProps<Props>()
const emit = defineEmits<Emits>()

const { $gettext } = useGettext()
</script>

<style lang="scss">
.cern-insert-menu {
  max-height: 20rem;
  min-width: 17rem;
  overflow-y: auto;

  &-empty {
    padding: var(--oc-space-small);
  }

  li > button {
    align-items: flex-start;
    border-radius: 4px;
    gap: var(--oc-space-small);
    padding: var(--oc-space-xsmall) var(--oc-space-small);
    width: 100%;

    &:hover {
      background-color: var(--oc-color-background-hover);
    }
  }

  &-selected {
    background-color: var(--oc-color-background-hover);
  }

  &-text {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  &-description {
    font-size: var(--oc-font-size-xsmall, 0.75rem);
  }
}
</style>
