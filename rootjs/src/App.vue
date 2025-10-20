<template>
  <iframe id="rootjs-viewer" ref="rootJsViewer" :src="iframeSource" title="ROOTJS Viewer" />
</template>
<script type="module"></script>
<script lang="ts">
import { defineComponent, unref, ref, onMounted } from 'vue'
import { Resource, SpaceResource } from '@ownclouders/web-client'
import { useClientService, useAuthStore, useUserStore } from '@ownclouders/web-pkg'

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
    }
  },
  setup(props) {
    const clientService = useClientService()
    const { user } = useUserStore()
    const authStore = useAuthStore()

    const rootUrl = 'https://root.cern/js/latest'
    const iframeSource = ref('')

    onMounted(async () => {
      // get direct url to file and clean query parameters
      const signedUrl = await clientService.webdav.getFileUrl(props.space, props.resource, {
        isUrlSigningEnabled: true,
        username: user.id
      })
      const fileUrl = new URL(signedUrl)
      fileUrl.search = ''
      iframeSource.value = `${rootUrl}?file=${fileUrl.href}?access_token=${authStore.accessToken}`
    })

    return {
      iframeSource
    }
  },
  methods: {
    showError: function () {
      console.error('showError')
    }
  }
})
</script>

<style></style>
