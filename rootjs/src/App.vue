<template>
  <iframe id="rootjs-viewer" ref="rootJsViewer" :src="iframeSource" title="ROOTJS Viewer" />
</template>
<script lang="ts">
import qs from 'qs'
import { defineComponent, unref, ref, onMounted, PropType } from 'vue'
import { Resource, SpaceResource } from '@ownclouders/web-client'
import { useClientService, useAuthStore, useUserStore, AppConfigObject } from '@ownclouders/web-pkg'

export default defineComponent({
  name: 'ROOTJSViewer',
  props: {
    space: {
      type: SpaceResource,
      required: true
    },
    resource: {
      type: Resource,
      required: true
    },
    applicationConfig: {
      type: Object as PropType<AppConfigObject>,
      required: true,
      // hack so the correct type is being used for the app config
      default: (): AppConfigObject => undefined
    },
  },
  setup(props) {
    const clientService = useClientService()
    const { user } = useUserStore()
    const authStore = useAuthStore()

    const { url = 'https://root.cern/js/latest/' } = props.applicationConfig

    const iframeSource = ref('')

    onMounted(async () => {
      // get direct url to file and clean query parameters
      const signedUrl = await clientService.webdav.getFileUrl(props.space, props.resource, {
        isUrlSigningEnabled: true,
        username: user.id
      })
      const fileUrl = new URL(signedUrl)
      fileUrl.search = '' // remmove signature...

      const query = qs.stringify({
        // file: `${fileUrl.href}?access_token=${authStore.accessToken}`,
        noselect: 'file',
        topname: props.resource.name,
        info: 'ROOT viewer',
      })
      iframeSource.value = `${url}?${query}&file=${fileUrl.href}?access_token=${authStore.accessToken}`
      // iframeSource.value = `${url}?${query}`
    })

    return {
      iframeSource
    }
  }
})
</script>