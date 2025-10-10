<template>
  <tr v-if="!isPublicLinkContext && !isTrashbinContext" data-testid="eosPath">
    <th scope="col" class="oc-pr-s oc-font-semibold" v-text="$gettext('FUSE Path')" />
    <td>
      <div class="oc-flex oc-flex-middle oc-flex-between">
        <p
          ref="filePath"
          v-oc-tooltip="eosPath"
          class="oc-my-rm oc-text-truncate"
          v-text="eosPath"
        />
        <oc-button
          v-if="isClipboardCopySupported"
          v-oc-tooltip="copyEosPathLabel"
          :aria-label="copyEosPathLabel"
          appearance="raw"
          :variation="copiedEos ? 'success' : 'passive'"
          @click="copyEosPathToClipboard"
        >
          <oc-icon
            v-if="copiedEos"
            key="oc-copy-to-clipboard-copied"
            name="checkbox-circle"
            class="_clipboard-success-animation"
          />
          <oc-icon v-else key="oc-copy-to-clipboard-copy" name="file-copy" />
        </oc-button>
      </div>
    </td>
  </tr>
  <tr v-if="sambaPath && !isPublicLinkContext && !isTrashbinContext" data-testid="sambaPath">
    <th scope="col" class="oc-pr-s oc-font-semibold" v-text="$gettext('Windows Path')" />
    <td>
      <div class="oc-flex oc-flex-middle oc-flex-between">
        <p
          ref="sambaFilePath"
          v-oc-tooltip="sambaPath"
          class="oc-my-rm oc-text-truncate"
          v-text="sambaPath"
        />
        <oc-button
          v-oc-tooltip="copySambaPathLabel"
          :aria-label="copySambaPathLabel"
          appearance="raw"
          :variation="copiedSamba ? 'success' : 'passive'"
          @click="copySambaPathToClipboard"
        >
          <oc-icon
            v-if="copiedSamba"
            key="oc-copy-to-clipboard-copied"
            name="checkbox-circle"
            class="_clipboard-success-animation"
          />
          <oc-icon v-else key="oc-copy-to-clipboard-copy" name="file-copy" />
        </oc-button>
      </div>
    </td>
  </tr>
  <tr v-if="!isTrashbinContext && !isPublicLinkContext" data-testid="eosDirectLink">
    <th scope="col" class="oc-pr-s oc-font-semibold" v-text="$gettext('Direct link')" />
    <td>
      <div class="oc-flex oc-flex-middle oc-flex-between">
        <p v-oc-tooltip="directLink" class="oc-my-rm oc-text-truncate" v-text="directLink" />
        <oc-button
          v-if="isClipboardCopySupported"
          v-oc-tooltip="copyDirectLinkLabel"
          :aria-label="copyDirectLinkLabel"
          appearance="raw"
          :variation="copiedDirect ? 'success' : 'passive'"
          @click="copyDirectLinkToClipboard"
        >
          <oc-icon
            v-if="copiedDirect"
            key="oc-copy-to-clipboard-copied"
            name="checkbox-circle"
            class="_clipboard-success-animation"
          />
          <oc-icon v-else key="oc-copy-to-clipboard-copy" name="file-copy" />
        </oc-button>
      </div>
    </td>
  </tr>
  <tr v-if="isPublicLinkContext" data-testid="eosDownloadLink">
    <th scope="col" class="oc-pr-s oc-font-semibold" v-text="$gettext('Download link')" />
    <td>
      <div class="oc-flex oc-flex-middle oc-flex-between">
        <p v-oc-tooltip="downloadLink" class="oc-my-rm oc-text-truncate" v-text="downloadLink" />
        <oc-button
          v-if="isClipboardCopySupported"
          v-oc-tooltip="copyDownloadLinkLabel"
          :aria-label="copyDownloadLinkLabel"
          appearance="raw"
          :variation="copiedDownload ? 'success' : 'passive'"
          @click="copyDownloadLinkToClipboard"
        >
          <oc-icon
            v-if="copiedDownload"
            key="oc-copy-to-clipboard-copied"
            name="checkbox-circle"
            class="_clipboard-success-animation"
          />
          <oc-icon v-else key="oc-copy-to-clipboard-copy" name="file-copy" />
        </oc-button>
      </div>
    </td>
  </tr>
</template>
<script lang="ts">
import { computed, defineComponent, unref, ref } from 'vue'
import { Resource, SpaceResource } from '@ownclouders/web-client'
import { PropType } from 'vue'
import { useClipboard } from '@vueuse/core'
import { isLocationTrashActive, useAuthStore, useRouter, useMessages } from '@ownclouders/web-pkg'
import { useGettext } from 'vue3-gettext'

export default defineComponent({
  props: {
    space: { type: Object as PropType<SpaceResource>, required: true },
    resource: { type: Object as PropType<Resource>, required: true }
  },
  setup(props) {
    const authStore = useAuthStore()
    const messageStore = useMessages()

    const router = useRouter()
    const { $gettext } = useGettext()
    const isPublicLinkContext = authStore.publicLinkContextReady

    const copiedDirect = ref(false)
    const copiedDownload = ref(false)
    const copiedEos = ref(false)
    const copiedSamba = ref(false)
    const {
      copy,
      copied,
      isSupported: isClipboardCopySupported
    } = useClipboard({ legacy: true, copiedDuring: 550 })

    const isTrashbinContext = computed(() => {
      return isLocationTrashActive(router, 'files-trash-generic')
    })

    const directLink = computed(() => props.resource.privateLink)

    const downloadLink = computed(() => props.resource.downloadURL)

    const copyEosPathToClipboard = () => {
      copy(unref(eosPath))
      copiedEos.value = unref(copied)
      messageStore.showMessage({
        title: $gettext('FUSE path copied'),
        desc: $gettext('The FUSE path has been copied to your clipboard.')
      })
    }

    const copySambaPathToClipboard = () => {
      copy(unref(sambaPath))
      copiedSamba.value = unref(copied)
      messageStore.showMessage({
        title: $gettext('Windows path copied'),
        desc: $gettext('The Windows path has been copied to your clipboard.')
      })
    }

    const getSambaPath = (path: string) => {
      const pathMappings = {
        user: '\\\\cernbox-smb\\eos\\user\\',
        project: '\\\\eosproject-smb\\eos\\project\\',
        public: '\\\\eospublic-smb\\eos\\',
        media: '\\\\eosmedia-smb\\eos\\'
      }
      const pathComponents = path?.split('/').filter(Boolean)
      if (pathComponents.length > 1 && pathComponents[0] === 'eos') {
        const translated = pathMappings[pathComponents[1]]
        return translated && `${translated}${pathComponents.slice(2).join('\\')}`
      }
    }
    const sambaPath = computed(() => {
      return getSambaPath(
        props.space.driveAlias.concat(
          props.resource.path.startsWith('/') ? props.resource.path : '/' + props.resource.path
        )
      )
    })
    const eosPath = computed(() => {
      return props.space.path.concat(
        props.space.driveAlias,
        props.resource.path.startsWith('/') ? props.resource.path : '/' + props.resource.path
      )
    })

    const copyDirectLinkToClipboard = () => {
      copy(unref(directLink))
      copiedDirect.value = unref(copied)
      messageStore.showMessage({
        title: $gettext('Direct link copied'),
        desc: $gettext('The direct link has been copied to your clipboard.')
      })
    }

    const copyDownloadLinkToClipboard = () => {
      copy(unref(downloadLink))
      copiedDirect.value = unref(copied)
      messageStore.showMessage({
        title: $gettext('Download link copied'),
        desc: $gettext('The download link has been copied to your clipboard.')
      })
    }

    return {
      isPublicLinkContext,
      isTrashbinContext,
      isClipboardCopySupported,
      directLink,
      copiedDirect,
      downloadLink,
      copiedDownload,
      copiedEos,
      copiedSamba,
      sambaPath,
      eosPath,
      copyDirectLinkToClipboard,
      copyDownloadLinkToClipboard,
      copyEosPathToClipboard,
      copySambaPathToClipboard,
      copyDirectLinkLabel: computed(() => $gettext('Copy direct link')),
      copyDownloadLinkLabel: computed(() => $gettext('Copy download link')),
      copyEosPathLabel: computed(() => $gettext('Copy FUSE path')),
      copySambaPathLabel: computed(() => $gettext('Copy Windows path'))
    }
  }
})
</script>
<style lang="scss" scoped>
.details-table {
  text-align: left;

  tr {
    height: 1.5rem;

    td {
      max-width: 0;
      width: 100%;
      overflow-wrap: break-word;

      div {
        min-width: 0;
      }
    }
  }

  th {
    white-space: nowrap;
  }
}
</style>
