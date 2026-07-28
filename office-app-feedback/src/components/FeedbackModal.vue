<template>
  <div class="office-app-feedback-modal">
    <oc-textarea
      v-model="feedbackMessage"
      :label="$gettext('What do you think so far?')"
      :rows="4"
      :disabled="isSubmitting"
    />
    <div class="office-app-feedback-modal-actions oc-mt-s">
      <oc-button appearance="outline" variation="passive" @click="$emit('cancel')">
        {{ $gettext('Cancel') }}
      </oc-button>
      <oc-button
        appearance="filled"
        variation="primary"
        :disabled="!feedbackMessage.trim() || isSubmitting"
        @click="onSubmitFeedback"
      >
        {{ $gettext('Submit') }}
      </oc-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, unref } from 'vue'
import { useGettext } from 'vue3-gettext'
import { Modal, useConfigStore, useMessages, useRequest, useUserStore } from '@ownclouders/web-pkg'
import { submitFeedback } from '../helpers/submitFeedback'

export default defineComponent({
  name: 'OfficeAppFeedbackModal',
  props: {
    modal: { type: Object as PropType<Modal>, required: true }
  },
  emits: ['cancel'],
  setup(_, { emit }) {
    const { $gettext } = useGettext()
    const { showMessage, showErrorMessage } = useMessages()
    const { makeRequest } = useRequest()
    const configStore = useConfigStore()
    const { user } = useUserStore()

    const feedbackMessage = ref('')
    const isSubmitting = ref(false)

    const onSubmitFeedback = async () => {
      const message = feedbackMessage.value.trim()
      if (!message || unref(isSubmitting)) {
        return
      }
      isSubmitting.value = true
      try {
        await submitFeedback(message, {
          makeRequest,
          serverUrl: configStore.serverUrl,
          username: user.onPremisesSamAccountName || user.id
        })
        showMessage({ title: $gettext('Thanks for your feedback!') })
        feedbackMessage.value = ''
        emit('cancel')
      } catch (error) {
        showErrorMessage({ title: $gettext('Failed to send feedback'), errors: [error] })
      } finally {
        isSubmitting.value = false
      }
    }

    return { feedbackMessage, isSubmitting, onSubmitFeedback }
  }
})
</script>

<style lang="scss" scoped>
.office-app-feedback-modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
