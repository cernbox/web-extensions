<template>
  <!--
    /account is authContext 'hybrid', so a public-link visitor reaches it with no user context.
    userContextReady also guards the polling GET in takeout-export's onMounted.
  -->
  <div v-if="userContextReady" class="account-table takeout-section">
    <h2 v-text="$gettext('Takeout')" />
    <p
      class="takeout-section-lede oc-text-muted"
      v-text="$gettext('Export all your files from CERNBox as a downloadable archive.')"
    />
    <takeout-export />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useGettext } from 'vue3-gettext'
import { useAuthStore } from '@ownclouders/web-pkg'
import TakeoutExport from './TakeoutExport.vue'

const { $gettext } = useGettext()

const authStore = useAuthStore()
const { userContextReady } = storeToRefs(authStore)
</script>

<style lang="scss" scoped>
.takeout-section-lede {
  margin-top: 0;
}
</style>
