<template>
  <div
    class="oc-flex oc-flex-middle oc-flex-between oc-width-1-1 oc-p-xs oc-mb-m link-name-container"
  >
    <div class="oc-flex oc-flex-middle oc-text-truncate">
      <oc-icon name="link" fill-type="line" />
      <p class="oc-files-file-link-url oc-ml-s oc-text-truncate oc-my-rm" v-text="directLink" />
    </div>
    <oc-button
      v-if="isClipboardCopySupported"
      v-oc-tooltip="$gettext('Copy')"
      class="oc-ml-s"
      size="small"
      :aria-label="$gettext('Copy')"
      @click="copyLinkToClipboard"
    >
      <span v-text="$gettext('Copy')" />
    </oc-button>
  </div>
</template>
<script lang="ts">
import { defineComponent, unref } from 'vue'
import { Resource, SpaceResource } from '@ownclouders/web-client'
import { PropType } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useAuthStore, useMessages, useRouter } from '@ownclouders/web-pkg'
import { useGettext } from 'vue3-gettext'

export default defineComponent({
  props: {
    space: { type: Object as PropType<SpaceResource>, required: true },
    resource: { type: Object as PropType<Resource>, required: true }
  },
  setup(props) {
    const authStore = useAuthStore()
    const messageStore = useMessages()

    const isPublicLinkContext = authStore.publicLinkContextReady

    const router = useRouter()
    const { $gettext } = useGettext()

    const directLink = !unref(isPublicLinkContext)
      ? props.resource.privateLink
      : props.resource.downloadURL

    const { copy, isSupported: isClipboardCopySupported } = useClipboard({
      legacy: true,
      copiedDuring: 550
    })

    const copyLinkToClipboard = () => {
      copy(unref(directLink))
      messageStore.showMessage({
        title: $gettext('The link has been copied to your clipboard.')
      })
    }

    return { directLink, copyLinkToClipboard, isClipboardCopySupported }
  }
})
</script>
