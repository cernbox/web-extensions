<template>
  <iframe id="rootjs-viewer" ref="rootJsViewer" :src="iframeSource" title="ROOTJS Viewer" />
</template>
<script type="module"></script>
<script lang="ts">
import { computed, defineComponent, unref } from 'vue'

export default defineComponent({
  name: 'ROOTJSViewer',
  props: {
    url: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const davURL = computed(() => {
      return props.url
    })

    const iframeSource = computed(() => {
      const url = 'https://root.cern/js/latest'

      return `${url}?file=${unref(davURL)}`
    })

    const frame = document.getElementById('rootjs-viewer')
    frame.contentWindow.postMessage({}, unref(iframeSource))

    return {
      davURL,
      iframeSource
    }
  },
  mounted: function () {},
  methods: {
    showError: function () {
      console.error('showError')
    }
  }
})
</script>

<style></style>
