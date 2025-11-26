<template>
  <main>
    <div class="oc-position-center">
      <oc-spinner size="xlarge" />
      <p v-translate class="oc-invisible">Loading document...</p>
    </div>
  </main>
</template>
<script lang="ts">
import { Resource } from '@ownclouders/web-client'
import { AppConfigObject, useRoute, useRouter, useSpacesStore } from '@ownclouders/web-pkg'
import { defineComponent, onMounted, PropType, ref, unref } from 'vue'

// https://cernbox.cern.ch/codimd -> https://cernbox.cern.ch/external-codimd/eos/user/<letter>/<username>/New file.md

export default defineComponent({
  name: 'CodiMD Redirector',
  props: {
    applicationConfig: { type: Object as PropType<AppConfigObject>, required: true },
    currentContent: {
      type: String,
      required: true
    },
    isReadOnly: { type: Boolean, required: false },
    resource: { type: Object as PropType<Resource>, required: true }
  },

  setup(props) {
    const spacesStore = useSpacesStore()
    const router = useRouter()
    const route = useRoute()

    onMounted(async () => {
      if (!unref(route).params || !unref(route).params['driveAliasAndItem']) {
        openEmptyEditor('codimd', 'md', true)
      } else {
        router.replace({
          path: `/external-codimd/${spacesStore.personalSpace.driveAlias}${props.resource.path}`,
          query: unref(route).query,
          replace: true
        })
      }
    })
  }
})
</script>
