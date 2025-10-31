<template>
  <main></main>
</template>
<script lang="ts">
import { useAuthStore, useMessages } from '@ownclouders/web-pkg'

export default {
  name: 'OTG',

  computed: {
    otgStyle() {
      return {
        'background-color': 'var(--oc-color-swatch-warning-default) !important'
      }
    }
  },

  async mounted() {
    const authStore = useAuthStore()
    const { showMessage } = useMessages()
    const accessToken = authStore.accessToken

    const link = document.createElement('span')

    const headers = new Headers()
    headers.append('Authorization', 'Bearer ' + accessToken)
    headers.append('X-Requested-With', 'XMLHttpRequest')
    const response = await fetch('otg', {
      method: 'GET',
      headers
    })
    if (response.status === 200) {
      const data = await response.json()
      if (data.message && data.number) {
        showMessage({
          title: `${data.number}`,
          desc: data.message,
          timeout: 10,
          status: 'otg'
        })
        link.classList.add('oc-icon', 'oc-icon-m', 'oc-icon-otg', 'oc-ml-xs')
        link.innerHTML = `
          <a href="https://cern.service-now.com/service-portal?id=outage&n=${data.number}" target="_blank" rel="noopener noreferrer" class="oc-icon-link oc-icon-link-otg" title="Open in SNOW">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z"></path>
            </svg>
          </a>
        `
      }
    }

    // Notification header is not available immediately, so we use a timeout
    setTimeout(() => {
      const otgTitle = document.querySelector(
        '.oc-notification-message-otg .oc-notification-message-title'
      )
      if (!otgTitle) {
        return
      }

      const otgNotificationHeaders = otgTitle.parentElement
      if (otgNotificationHeaders && link) {
        otgNotificationHeaders.append(link)
      }
    }, 100)
  }
}
</script>

<style lang="scss">
.oc-notification-message.oc-notification-message-otg {
  background-color: var(--oc-color-swatch-warning-default) !important;
}
.oc-notification-message-otg a:hover {
  color: var(--oc-color-swatch-primary-hover);
}
.oc-notification-message-otg a {
  color: var(--oc-color-text-default);
}
</style>
