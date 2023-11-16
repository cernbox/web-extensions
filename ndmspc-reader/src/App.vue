<template>
  <iframe id="ndmspc-viewer" ref="ndmspcViewer" :src="iframeSource" />
</template>

<script lang="ts">
import {
  computed,
  unref,
  defineComponent,
  VNodeRef,
  ref,
  watch,
  PropType,
  onMounted,
  onBeforeUnmount,
  nextTick
} from 'vue'
import { Resource } from '@ownclouders/web-client/src'
import { AppConfigObject } from '@ownclouders/web-pkg/src/apps'

export default defineComponent({
  name: 'NdmspcViewer',
  props: {
    resource: {
      type: Object as PropType<Resource>,
      required: true
    },
    applicationConfig: { type: Object as PropType<AppConfigObject>, required: true },
    currentContent: {
      type: String,
      required: true
    },
    isReadOnly: { type: Boolean, required: false }
  },
  emits: ['update:currentContent'],
  setup(props, { emit }) {
    const ndmspcViewer: VNodeRef = ref()

    const config = computed(() => {
      const { url = 'https://ndmspc.gitlab.io/react-ndmspc/' } = props.applicationConfig as any
      return { url }
    })
    const origin = computed(() => {
      const url = new URL(unref(config).url)
      return url.origin
    })

    const iframeSource = computed(() => {
      return unref(config).url
    })

    const loadCurrentContent = () => {
      console.log('NdmspcViewer: loading content')
      console.debug('NdmspcViewer: content', props.currentContent)
      postMessage({
        action: 'load',
        type: 'string',
        content: props.currentContent,
        mode: props.isReadOnly ? 'r' : 'rw',
        app: 'cernbox'
      })
    }

    watch(
      () => props.resource,
      () => {
        loadCurrentContent()
      }
    )

    const postMessage = (payload) => {
      try {
        if (!unref(ndmspcViewer)) {
          return
        }
        return (unref(ndmspcViewer) as HTMLIFrameElement).contentWindow.postMessage(
          payload,
          unref(origin)
        )
      } catch (e) {
        console.error(e)
      }
    }

    const handleMessage = async (event) => {
      console.log('NdmspcViewer: received an event', event)
      if (event.origin !== unref(origin)) {
        console.error('NdmspcViewer: invalid origin')
        return
      }
      await nextTick()
      switch (event.data?.event) {
        case 'init':
          loadCurrentContent()
          break
        case 'upload':
          emit('update:currentContent', event.data.content)
          break
      }
    }

    onMounted(() => {
      console.debug('NdmspcViewer: registering event listener')
      window.addEventListener('message', handleMessage)
    })

    onBeforeUnmount(() => {
      console.debug('NdmspcViewer: remove event listener')
      window.removeEventListener('message', handleMessage)
    })

    return {
      config,
      ndmspcViewer,
      iframeSource
    }
  }
})
</script>
<style>
#ndmspc-viewer {
  width: 100%;
  height: 100%;
  border: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
