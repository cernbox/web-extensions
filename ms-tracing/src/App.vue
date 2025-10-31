<template>
  <main></main>
</template>
<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, watch, unref } from 'vue'
import { useResourcesStore, useAuthStore, useRoute } from '@ownclouders/web-pkg'

export default defineComponent({
  name: 'MS Monitoring',
  data: () => ({
    func: undefined,
    events: []
  }),

  setup() {
    const resourcesStore = useResourcesStore()
    const authStore = useAuthStore()
    const route = useRoute()

    const listenToMSEvents = (event: MessageEvent) => {
      if (JSON.parse(event.data).MessageId === 'App_LoadingStatus') {
        sendReport()
      }
    }

    const sendReport = async () => {
      const accessToken = authStore.accessToken
      const headers = new Headers()
      headers.append('Authorization', `Bearer ${accessToken}`)
      headers.append('X-Requested-With', 'XMLHttpRequest')
      const response = await fetch(`/app/notify?file_id=${resourcesStore.resources[0].id}`, {
        method: 'POST',
        headers
      })
      if (response.status !== 200) {
        console.error('Error sending notify feedback about MS')
      }
    }

    // because of the leading slash, the first element after splitting the path is always empty
    // path: /external-xxx/file/... -> ['', 'external-xxx', 'file', ...]
    // path: /files/... -> ['', 'files', ...]
    const isExternalApp = (path: string) => {
      const validSegments = path.split('/').filter(Boolean)
      return validSegments[0].includes('external-')
    }

    onMounted(() => {
      if (isExternalApp(unref(route).path)) {
        window.addEventListener('message', listenToMSEvents)
      }
    })

    watch(
      () => unref(route).path,
      (to, from) => {
        if (!isExternalApp(from) && isExternalApp(to)) {
          window.addEventListener('message', listenToMSEvents)
        }
        if (isExternalApp(from) && !isExternalApp(to)) {
          window.removeEventListener('message', listenToMSEvents)
        }
      }
    )

    onBeforeUnmount(() => {
      window.removeEventListener('message', listenToMSEvents)
    })
  }
})
</script>
