<template>
  <main id="text-editor">
    <text-editor-app-bar ref="bar_comp" />
    <oc-notifications>
      <oc-notification-message
        v-if="lastError"
        :message="lastError"
        status="danger"
        @close="clearLastError"
      />
    </oc-notifications>
    <div class="oc-flex">
      <div class="oc-container oc-width-1-1">
        <oc-textarea
          id="text-editor-input"
          label=""
          name="input"
          full-width
          :value="currentContent"
          class="oc-height-1-1"
          :rows="20"
          :disabled="isReadOnly"
          @input="onType"
        />
      </div>
    </div>
  </main>
</template>
<script>
import TextEditorAppBar from './TextEditorAppBar.vue'
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'Text Editor',
  components: {
    TextEditorAppBar
  },
  beforeRouteLeave(to, from, next) {
    if (this.isTouched) {
      const modal = {
        variation: 'danger',
        icon: 'warning',
        title: this.$gettext('Changes not saved'),
        message: this.$gettext('Your changes were not saved. Do you want to save them?'),
        cancelText: this.$gettext('Not Save'),
        confirmText: this.$gettext('Save'),
        onCancel: () => {
          this.hideModal()
          next()
        },
        onConfirm: () => {
          this.saveContent()
          this.hideModal()
          next()
        }
      }
      this.createModal(modal)
    } else {
      next()
    }
  },
  computed: {
    ...mapGetters(['activeFile']),
    ...mapGetters('Files', ['publicLinkPassword']),
    ...mapGetters('Text Editor', ['currentContent', 'lastError', 'isReadOnly', 'isTouched'])
  },
  mounted() {
    const filePath = `/${this.$route.params.filePath.split('/').filter(Boolean).join('/')}`
    if (filePath === '') {
      this.$router.push({
        path: '/'
      })
      return
    }
    this.loadFile({
      filePath: filePath,
      client: this.$client,
      public: this.$route.params.contextRouteName === 'files-public-files',
      publicLinkPassword: this.publicLinkPassword

    })
    document.addEventListener('keydown', this.handleSKey, false)
    window.addEventListener('beforeunload', this.handleUnload)
  },
  beforeDestroy() {
    window.removeEventListener('beforeunload', this.handleUnload)
    document.removeEventListener('keydown', this.handleSKey, false)
    this.resetState()
  },
  methods: {
    ...mapActions(['createModal', 'hideModal']),
    ...mapActions('Text Editor', [
      'updateText',
      'loadFile',
      'clearLastError',
      'saveFile',
      'resetState'
    ]),
    onType(e) {
      this.updateText(e)
    },
    handleUnload(e) {
      if (this.isTouched) {
        e.preventDefault()
        e.returnValue = ''
      }
    },
    handleSKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault()
        this.saveContent()
      }
    },
    saveContent() {
      this.saveFile({
        client: this.$client
      })
    }
  }
}
</script>
