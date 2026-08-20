<template>
  <div class="sync-clients-outcome">
    <oc-icon :name="icon" :variation="variation" size="xlarge" fill-type="line" />
    <p class="sync-clients-outcome-text" v-text="text" />
    <oc-button type="router-link" :to="{ path: '/account' }" appearance="raw" variation="primary">
      <span v-text="$gettext('View your connected devices')" />
    </oc-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'
import type { FlowOutcomeKind } from '../types'

const props = defineProps<{
  outcome: FlowOutcomeKind
}>()

const { $gettext } = useGettext()

const icon = computed(
  () =>
    ({
      granted: 'checkbox-circle',
      denied: 'close-circle',
      expired: 'time',
      error: 'error-warning'
    })[props.outcome]
)

const variation = computed(
  () =>
    ({
      granted: 'success',
      denied: 'passive',
      expired: 'warning',
      error: 'danger'
    })[props.outcome]
)

const text = computed(
  () =>
    ({
      granted: $gettext('Your device is connected. You can close this window.'),
      denied: $gettext('Request denied. Nothing was shared with that device.'),
      expired: $gettext(
        'This request has expired or was already handled. Start the connection again from your sync client.'
      ),
      error: $gettext('Something went wrong. Start the connection again from your sync client.')
    })[props.outcome]
)
</script>

<style lang="scss" scoped>
.sync-clients-outcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--oc-space-small);
}

.sync-clients-outcome-text {
  margin: 0;
}
</style>
