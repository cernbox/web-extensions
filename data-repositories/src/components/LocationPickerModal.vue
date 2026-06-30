<template>
  <div class="oc-height-1-1" tabindex="0">
    <app-loading-spinner v-if="isLoading" />
    <iframe
      v-show="!isLoading"
      ref="iframeRef"
      class="oc-width-1-1 oc-height-1-1"
      :title="iframeTitle"
      :src="iframeSrc"
      tabindex="0"
      @load="onLoad"
    ></iframe>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, PropType, ref, unref } from 'vue'
import { AppLoadingSpinner, Modal, useConfigStore, useModals } from '@ownclouders/web-pkg'
import { Resource } from '@ownclouders/web-client'
import { useGettext } from 'vue3-gettext'

export default defineComponent({
  name: 'LocationPickerModal',
  components: { AppLoadingSpinner },
  props: {
    modal: { type: Object as PropType<Modal>, required: true },
    selectLocation: {
      type: Function as PropType<(folder: Resource) => void>,
      required: true
    }
  },
  setup(props) {
    const iframeRef = ref<HTMLIFrameElement>()
    const isLoading = ref(true)
    const configStore = useConfigStore()
    const { removeModal } = useModals()
    const { $gettext } = useGettext()

    const trustedOrigin = configStore.serverUrl.replace(/\/+$/, '')

    const iframeUrl = new URL(configStore.serverUrl)
    iframeUrl.searchParams.append('embed', 'true')
    iframeUrl.searchParams.append('embed-target', 'location')
    iframeUrl.searchParams.append('hide-logo', 'true')

    const onLoad = () => {
      isLoading.value = false
      unref(iframeRef)?.contentWindow?.focus()
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== trustedOrigin) {
        return
      }

      if (event.data?.name === 'owncloud-embed:select') {
        // In location-picker mode the payload is the selected (current) folder resource.
        const folder = event.data.data?.[0] as Resource

        if (folder) {
          removeModal(props.modal.id)
          props.selectLocation(folder)
        }
        return
      }

      if (event.data?.name === 'owncloud-embed:cancel') {
        removeModal(props.modal.id)
      }
    }

    onMounted(() => {
      window.addEventListener('message', onMessage)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('message', onMessage)
    })

    return {
      isLoading,
      onLoad,
      iframeRef,
      iframeTitle: $gettext('Select a location to process the share'),
      iframeSrc: iframeUrl.href
    }
  }
})
</script>

<style lang="scss">
.oc-modal.location-picker-modal {
  max-width: 80vw;
  border: none;
  overflow: hidden;

  .oc-modal-body {
    padding: 0;

    &-message {
      height: 60vh;
      margin: 0;
    }
  }
}
</style>
