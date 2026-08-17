<template>
  <div class="cern-editor-toolbar">
    <div class="cern-editor-toolbar-groups">
      <slot name="left" />
      <template v-for="(group, groupIndex) in groups" :key="`group-${groupIndex}`">
        <span v-if="groupIndex > 0" class="cern-editor-toolbar-separator" aria-hidden="true" />
        <div class="cern-editor-toolbar-group">
          <template v-for="entry in group" :key="entry.id">
            <template v-if="isMenu(entry)">
              <oc-button
                :id="`${entry.id}-toggle`"
                v-oc-tooltip="entry.label"
                :aria-label="entry.label"
                :class="[
                  'cern-editor-toolbar-button',
                  { 'cern-editor-toolbar-active': entry.isActive?.() }
                ]"
                appearance="raw"
              >
                <oc-icon :name="entry.icon" :fill-type="entry.fillType || 'none'" size="small" />
                <oc-icon name="arrow-down-s" fill-type="line" size="xsmall" />
              </oc-button>
              <oc-drop
                :toggle="`#${entry.id}-toggle`"
                mode="click"
                padding-size="small"
                close-on-click
              >
                <oc-list class="cern-editor-toolbar-menu">
                  <li v-for="item in entry.items" :key="item.id">
                    <oc-button
                      :class="{ 'cern-editor-toolbar-active': item.isActive?.() }"
                      :disabled="item.isDisabled?.()"
                      appearance="raw"
                      justify-content="left"
                      @click="item.run"
                    >
                      <oc-icon
                        :name="item.icon"
                        :fill-type="item.fillType || 'none'"
                        size="small"
                      />
                      <span>{{ item.label }}</span>
                    </oc-button>
                  </li>
                </oc-list>
              </oc-drop>
            </template>

            <oc-button
              v-else
              v-oc-tooltip="entry.label"
              :aria-label="entry.label"
              :aria-pressed="entry.isActive ? entry.isActive() : undefined"
              :disabled="entry.isDisabled?.()"
              :class="[
                'cern-editor-toolbar-button',
                { 'cern-editor-toolbar-active': entry.isActive?.() }
              ]"
              appearance="raw"
              @click="entry.run"
            >
              <oc-icon :name="entry.icon" :fill-type="entry.fillType || 'none'" size="small" />
            </oc-button>
          </template>
        </div>
      </template>
    </div>
    <div class="cern-editor-toolbar-right">
      <slot name="right" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { isMenu, type ToolbarItem, type ToolbarMenu } from '../helpers/toolbar'

interface Props {
  groups: (ToolbarItem | ToolbarMenu)[][]
}
defineProps<Props>()
</script>

<style lang="scss">
.cern-editor-toolbar {
  align-items: center;
  border-bottom: 1px solid var(--oc-color-border);
  display: flex;
  gap: var(--oc-space-small);
  justify-content: space-between;
  padding: var(--oc-space-small) var(--oc-space-medium);

  &-groups,
  &-right {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: var(--oc-space-xsmall);
  }

  &-group {
    align-items: center;
    display: flex;
    gap: var(--oc-space-xsmall);
  }

  &-separator {
    background-color: var(--oc-color-border);
    height: 1.5rem;
    margin: 0 var(--oc-space-xsmall);
    width: 1px;
  }

  // oc-button's raw appearance has no padding, which left the icons crowded against each other
  // and gave nothing to aim at. These are the toolbar's hit targets, so they get a real size.
  &-button {
    align-items: center;
    border-radius: 4px;
    display: inline-flex;
    gap: 2px;
    justify-content: center;
    min-height: 2.25rem;
    min-width: 2.25rem;
    padding: 0 var(--oc-space-small) !important;
    transition: background-color 0.1s ease-in-out;

    &:hover:not([disabled]) {
      background-color: var(--oc-color-background-hover);
    }

    &[disabled] {
      opacity: 0.4;
    }
  }

  &-active {
    background-color: var(--oc-color-background-hover);
    color: var(--oc-color-swatch-primary-default);
  }
}

// Dropdown contents are relocated into a tippy popper on document.body, so they are no longer
// inside .cern-editor-toolbar and cannot be styled as its descendants.
.cern-editor-toolbar-menu {
  min-width: 12rem;

  li > button {
    border-radius: 4px;
    gap: var(--oc-space-small);
    justify-content: flex-start;
    padding: var(--oc-space-xsmall) var(--oc-space-small);
    transition: background-color 0.1s ease-in-out;
    width: 100%;

    &:hover:not([disabled]) {
      background-color: var(--oc-color-background-hover);
    }

    &[disabled] {
      cursor: default;
      opacity: 0.4;
    }
  }

  .cern-editor-toolbar-active {
    background-color: var(--oc-color-background-hover);
    color: var(--oc-color-swatch-primary-default);
  }
}
</style>
