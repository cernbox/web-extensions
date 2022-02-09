<template>
  <div id="text-editor-app-bar" class="oc-container oc-app-bar oc-width-1-1">
    <oc-grid flex gutter="small">
      <div class="oc-width-auto">
        <oc-button
          id="text-editor-controls-save"
          :disabled="!isTouched || isReadOnly"
          @click="saveContent"
        >
          <oc-icon name="save" />
        </oc-button>
        <oc-spinner v-if="isLoading" :aria-label="$gettext('Loading editor content')" />
      </div>
      <div class="oc-width-expand oc-text-center">
        <span id="text-editor-file-path">{{ fileCleaned }}</span>
      </div>
      <div class="oc-width-auto oc-text-right">
        <oc-button id="text-editor-controls-close" @click="closeApp">
          <oc-icon name="close" />
        </oc-button>
      </div>
    </oc-grid>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    ...mapGetters(['activeFile']),
    ...mapGetters('Text Editor', [
      'isTouched',
      'isLoading',
      'isReadOnly',
      'currentFile',
      'isPublicLink',
      'plToken'
    ]),
    fileCleaned() {
      
      return this.currentFile.split('/').pop()
    }
  },
  methods: {
    ...mapActions('Text Editor', ['saveFile']),
    closeApp() {
      if (this.isPublicLink) {
        const folderPath = this.currentFile.substring(0, this.currentFile.lastIndexOf('/'))
        this.$router.push({
          path: '/files/public/show/' + this.plToken + folderPath
        })
      } else {
        let folderPath = this.currentFile.split('/')
        folderPath.splice(0, 3)
        folderPath.pop()
        folderPath = folderPath.join('/')
        this.$router.push({
          path: '/files/spaces/personal/home/' + folderPath
        })
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
<style>
#text-editor-app-bar {
  padding-top: 15px;
  padding-bottom: 15px;
}
</style>
