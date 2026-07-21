<template>
  <div class="office-app-switcher-modal">
    <p class="oc-mb-m">
      {{ $gettext('Do you want to try a different app to edit office files?') }}
    </p>
    <oc-select
      v-model="selectedOption"
      class="oc-mb-s"
      :searchable="false"
      :clearable="false"
      :options="switchOptions"
    />
    <oc-checkbox
      v-model="makeDefaultForBrowser"
      class="oc-mb-m"
      :label="$gettext('Make this the default for this browser')"
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
        {{ $gettext('Switch') }}
      </oc-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, unref } from 'vue'
import { Modal, useRoute, useRouter } from '@ownclouders/web-pkg'

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
    const route = useRoute()
    const router = useRouter()

    const selectedOption = ref<SwitchOption | null>(props.switchOptions[0] || null)
    const makeDefaultForBrowser = ref(false)

    const onSwitchApp = () => {
      const option = unref(selectedOption)
      if (!option) {
        return
      }
      if (unref(makeDefaultForBrowser)) {
        // TEMPORARY: same raw localStorage key useFileActions.ts reads inline on the web side
        // to decide which app opens a file by default - not wired through a shared store on
        // purpose, this whole mechanism is meant to be removed again in a couple of months.
        localStorage.setItem('preferredOfficeAppName', option.value)
      }
      router.push({
        name: `external-${option.value.toLowerCase()}-apps`,
        params: unref(route).params,
        query: unref(route).query
      })
      emit('cancel')
    }

    return { selectedOption, makeDefaultForBrowser, onSwitchApp }
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
