<template>
  <div class="office-app-switcher-modal">
    <p class="oc-mb-m">
      {{ $gettext('Do you want to change the default Office app for this browser?') }}
    </p>
    <oc-select
      v-model="selectedOption"
      class="oc-mb-s"
      :searchable="false"
      :clearable="false"
      :options="switchOptions"
    />
    <div class="office-app-switcher-modal-actions">
      <oc-button appearance="outline" variation="passive" @click="$emit('cancel')">
        {{ $gettext('Cancel') }}
      </oc-button>
      <oc-button
        appearance="filled"
        variation="primary"
        :disabled="!selectedOption"
        @click="onSwitchApp"
      >
        {{ $gettext('Change') }}
      </oc-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, unref } from 'vue'
import { Modal } from '@ownclouders/web-pkg'

interface SwitchOption {
  label: string
  value: string
}

export default defineComponent({
  name: 'OfficeAppSwitcherModal',
  props: {
    modal: { type: Object as PropType<Modal>, required: true },
    switchOptions: { type: Array as PropType<SwitchOption[]>, default: () => [] }
  },
  emits: ['cancel'],
  setup(props, { emit }) {

    const selectedOption = ref<SwitchOption | null>(props.switchOptions[0] || null)

    const onSwitchApp = () => {
      const option = unref(selectedOption)
      if (!option) {
        return
      }
      localStorage.setItem('preferredOfficeAppName', option.value)
      emit('cancel')
    }

    return { selectedOption, onSwitchApp }
  }
})
</script>

<style lang="scss" scoped>
.office-app-switcher-modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
