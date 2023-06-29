<template>
  <main></main>
</template>
<script lang="ts">
import { mapActions } from 'vuex'

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
    const accessToken = this.$store.getters['runtime/auth/accessToken']
    const headers = new Headers()
    headers.append('Authorization', 'Bearer ' + accessToken)
    headers.append('X-Requested-With', 'XMLHttpRequest')
    const response = await fetch('otg', {
      method: 'GET',
      headers
    })
    if (response.status === 200) {
      const data = await response.json()
      if (data.message)
        this.showMessage({
          title: 'OTG',
          desc: data.message,
          timeout: 10,
          status: 'warning',
          style: this.otgStyle
        })
    }
  },
  methods: {
    ...mapActions(['showMessage'])
  }
}
</script>