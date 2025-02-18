<template>
  <div class="oc-flex oc-flex-middle oc-flex-between oc-width-1-1 oc-p-xs oc-mb-m link-name-container">
    <div class="oc-flex oc-flex-middle oc-text-truncate">
      <oc-icon name="link" fill-type="line" />
      <p class="oc-files-file-link-url oc-ml-s oc-text-truncate oc-my-rm" v-text="directLink" />
    </div>
    <oc-button v-if="isClipboardCopySupported" v-oc-tooltip="$gettext('Copy')" class="oc-ml-s" size="small"
      :aria-label="$gettext('Copy')" @click="copyLinkToClipboard">
      <span v-text="$gettext('Copy')" />
    </oc-button>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, unref } from 'vue'
import { Resource, SpaceResource } from '@ownclouders/web-client'
import { PropType } from 'vue'
import { useClipboard } from '@vueuse/core'
import { createFileRouteOptions, useConfigStore, useMessages, useRouter } from '@ownclouders/web-pkg'
import { useGettext } from 'vue3-gettext'
import { urlJoin } from '@ownclouders/web-client'

export default defineComponent({
  props: {
    space: { type: Object as PropType<SpaceResource>, required: true },
    resource: { type: Object as PropType<Resource>, required: true }
  },
  setup(props) {
    const configStore = useConfigStore()
    const messageStore = useMessages()

    const router = useRouter()
    const { $gettext } = useGettext()

    const serverUrl = computed(() => configStore.serverUrl)

    const directLink = computed(() => {
      const routeOpts = createFileRouteOptions(props.space, props.resource)
      return urlJoin(unref(serverUrl), router.resolve(routeOpts).fullPath)
    })

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
