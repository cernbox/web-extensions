<template>
  <form class="sync-clients-decision" @submit.prevent="emit('grant', deviceName)">
    <oc-text-input
      v-model="deviceName"
      class="oc-mb-m"
      :label="$gettext('Name for this device')"
      :description-message="$gettext('Shown in your list of connected devices.')"
      :disabled="disabled"
      :clear-button-enabled="true"
      :clear-button-accessible-label="$gettext('Clear device name')"
    />
    <div class="sync-clients-decision-actions">
      <oc-button
        variation="primary"
        appearance="filled"
        submit="submit"
        :disabled="disabled"
        :show-spinner="submitting"
      >
        <span v-text="$gettext('Connect device')" />
      </oc-button>
      <oc-button :disabled="disabled" @click="emit('deny')">
        <span v-text="$gettext('Deny')" />
      </oc-button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  /** Prefilled default, and the fallback when the user clears the field. */
  defaultName: string
  submitting: boolean
  isExpired: boolean
}>()

const emit = defineEmits<{
  (event: 'grant', name: string): void
  (event: 'deny'): void
}>()

const deviceName = ref(props.defaultName)

const disabled = computed(() => props.submitting || props.isExpired)
</script>

<style lang="scss" scoped>
// .oc-login-card extends .oc-text-center, so the field label and its hint would otherwise sit
// centred above a full-width input
.sync-clients-decision {
  text-align: left;
}

.sync-clients-decision-actions {
  display: flex;
  gap: var(--oc-space-small);
  justify-content: center;
  flex-wrap: wrap;
}
</style>
