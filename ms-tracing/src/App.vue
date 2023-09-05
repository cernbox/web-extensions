<template>
  <main></main>
</template>
<script lang="ts">
export default {
  name: 'MS Monitoring',

  data: () => ({
    func: undefined,
    events: []
  }),

  computed: {},
  watch: {
    $route(to, from) {
      if (to.name !== 'web-app-external' && from.name === 'web-app-external')
        window.removeEventListener('message', this.func)
      else this.listenToMSEvents()
    }
  },

  mounted() {
    this.listenToMSEvents()
  },

  beforeUnmount() {
    window.removeEventListener('message', this.func)
  },
  methods: {
    listenToMSEvents() {
      if (window.location.href.includes('app=MS') && this.$route.query?.fileId) {
        this.func = (event) => {
          if (JSON.parse(event.data).MessageId === 'App_LoadingStatus') {
            this.sendReport()
          }
        }
        window.addEventListener('message', this.func)
      }
    },
    async sendReport() {
      const accessToken = this.$store.getters['runtime/auth/accessToken']
      const headers = new Headers()
      headers.append('Authorization', 'Bearer ' + accessToken)
      headers.append('X-Requested-With', 'XMLHttpRequest')
      const response = await fetch(`/app/notify?file_id=${this.$route.query.fileId}`, {
        method: 'POST',
        headers
      })
      if (response.status !== 200) {
        console.error('Error sending notify feedback about MS')
      }
    }
  }
}
</script>



/*     catchMicrosoftError() {
  if (this.wordExtensions.some((e) => this.fileName.endsWith(e))) {
    this.events = []
    if (!this.func)
      this.func = (event) => {
        this.events.push(JSON.parse(event.data))
      }
    window.removeEventListener('message', this.func)
    if (
      window.location.href.includes('app=MS') &&
      this.writePermissions &&
      !this.debugMicrosoft
    ) {
      const timeInterval = 7 * 1000
      // (this.fileName && this.fileName.endsWith('.ppt')) ||
      // this.fileName.endsWith('.pptx') ||
      // this.fileName.endsWith('.odp')
      //   ? 13 * 1000
      //   :
      window.addEventListener('message', this.func)

      setTimeout(() => {
        if (
          !this.events.some((e) => {
            return e.MessageId === 'App_LoadingStatus'
          })
        ) {
          this.modal = true
          setTimeout(() => {
            if (
              this.events.some((e) => {
                return e.MessageId === 'App_LoadingStatus'
              })
            )
              this.modal = false
            window.removeEventListener('message', this.func)
          }, timeInterval)
        }
      }, timeInterval)
    }
  }
},
async catchClickMicrosoftEdit() {
  if (!this.func2)
    this.func2 = async (event) => {
      if (JSON.parse(event.data).MessageId === 'UI_Edit') {
        await this.onCreate(true)
        this.catchMicrosoftError()
      }
    }
  window.removeEventListener('message', this.func2)
  window.addEventListener('message', await this.func2)
},*/