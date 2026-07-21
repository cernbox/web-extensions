<template>
  <div class="office-app-feedback-modal">
    <div v-if="switchOptions.length" class="office-app-feedback-modal-switch oc-mb-l">
      <h3 class="oc-text-bold oc-mb-xs">
        {{ $gettext('Do you want to try a different app to edit office files?') }}
      </h3>
      <oc-select
        v-model="selectedSwitchOption"
        class="oc-mb-s"
        :searchable="false"
        :clearable="false"
        :options="switchOptions"
      />
      <oc-checkbox
        v-model="makeDefaultForBrowser"
        class="oc-mb-s"
        :label="$gettext('Make this the default for this browser')"
      />
      <oc-button
        appearance="filled"
        variation="primary"
        :disabled="!selectedSwitchOption"
        @click="onSwitchApp"
      >
        {{ $gettext('Switch') }}
      </oc-button>
    </div>

    <div class="office-app-feedback-modal-feedback">
      <h3 class="oc-text-bold oc-mb-xs">{{ $gettext('Send feedback') }}</h3>
      <oc-textarea
        v-model="feedbackMessage"
        :label="$gettext('What do you think so far?')"
        :rows="4"
        :disabled="isSubmitting"
      />
      <div class="office-app-feedback-modal-feedback-actions oc-mt-s">
        <oc-button appearance="outline" variation="passive" @click="$emit('cancel')">
          {{ $gettext('Cancel') }}
        </oc-button>
        <oc-button
          appearance="filled"
          variation="primary"
          :disabled="!feedbackMessage.trim() || isSubmitting"
          @click="onSubmitFeedback"
        >
          {{ $gettext('Submit feedback') }}
        </oc-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, unref } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useAppProviderService, useMessages, useRoute, useRouter, Modal } from '@ownclouders/web-pkg'
import { submitFeedback } from '../helpers/submitFeedback'

interface SwitchOption {
  label: string
  value: string
}

// display names for apps under test; anything not listed here falls back to the raw
// app-provider name, so e.g. EuroOffice shows up automatically once it's registered.
const APP_DISPLAY_NAMES: Record<string, string> = {
  ms365: 'Microsoft Office Online',
  collabora: 'Collabora',
  onlyoffice: 'EuroOffice',
  eurooffice: 'EuroOffice'
}

export default defineComponent({
  name: 'OfficeAppFeedbackModal',
  props: {
    modal: { type: Object as PropType<Modal>, required: true },
    currentAppSlug: { type: String as PropType<string | null>, default: null }
  },
  emits: ['cancel'],
  setup(props, { emit }) {
    const { $gettext } = useGettext()
    const route = useRoute()
    const router = useRouter()
    const { showMessage, showErrorMessage } = useMessages()
    const appProviderService = useAppProviderService()

    const feedbackMessage = ref('')
    const isSubmitting = ref(false)

    const switchOptions = computed<SwitchOption[]>(() =>
      (appProviderService.appNames || [])
        .filter((name) => name.toLowerCase() !== props.currentAppSlug)
        .map((name) => ({
          label: APP_DISPLAY_NAMES[name.toLowerCase()] || name,
          value: name
        }))
    )

    const selectedSwitchOption = ref<SwitchOption | null>(unref(switchOptions)[0] || null)
    const makeDefaultForBrowser = ref(false)

    const onSwitchApp = () => {
      const option = unref(selectedSwitchOption)
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

    const onSubmitFeedback = async () => {
      const message = feedbackMessage.value.trim()
      if (!message || unref(isSubmitting)) {
        return
      }
      isSubmitting.value = true
      try {
        await submitFeedback(message)
        showMessage({ title: $gettext('Thanks for your feedback!') })
        feedbackMessage.value = ''
      } catch (error) {
        showErrorMessage({ title: $gettext('Failed to send feedback'), errors: [error] })
      } finally {
        isSubmitting.value = false
      }
    }

    return {
      feedbackMessage,
      isSubmitting,
      switchOptions,
      selectedSwitchOption,
      makeDefaultForBrowser,
      onSwitchApp,
      onSubmitFeedback
    }
  }
})
</script>

<style lang="scss" scoped>
.office-app-feedback-modal-feedback-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
