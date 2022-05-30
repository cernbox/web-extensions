<template>
  <main>
    <div class="oc-position-center" v-if="loading">
      <oc-spinner size="xlarge" />
      <p v-translate class="oc-invisible">Loading app</p>
    </div>
    <div class="oc-flex root-viewer">
      <div id="web-nav-sidebar" class="root-sidebar app-navigation oc-app-navigation-expanded">
        <select id="mode-select" v-model="viewMode" @change="renderViewer">
          <option v-for="item in items" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
        <button @click="exit">Exit</button>
        <div id="treeViewer"></div>
      </div>
      <div id="mainViewer" class="oc-flex oc-height-1-1 app-content oc-width-1-1"></div>
    </div>
  </main>
</template>
<script>
import 'https://root.cern/js/latest/scripts/JSRoot.core.min.js'
import { getFileUrl, getHeadersWithAuth } from '../../common/fileAccess.js'

export default {
  name: 'ROOTJSViewer',
  data: () => ({
    loading: true,
    url: '',
    items: ['simple', 'tabs', 'collapsible', 'grid 2x2', 'grid 3x3', 'grid 4x4'],
    viewMode: null,
    painter: null,
    isPublic: false
  }),
  computed: {
    rootFile() {
      const headers = getHeadersWithAuth(this.isPublic, this.getToken, this.publicLinkPassword)
      return fetch(this.url, { headers }).then((resp) => {
        if (resp.ok) {
          return resp.arrayBuffer()
        } else {
          return Promise.reject('error code: ' + resp.status)
        }
      })
    }
  },
  created() {
    this.isPublic = this.$route.query["contextRouteName"] === 'files-public-files'
    const filePath = `/${this.$route.params.filePath.split('/').filter(Boolean).join('/')}`
    this.url = getFileUrl(this.$client, this.isPublic, filePath)
    this.viewMode = this.items[0]
  },
  mounted: function () {
    this.renderViewer()
  },
  methods: {
    renderViewer: function () {
      if (this.painter !== null) {
        this.painter.cleanup()
      }
      this.rootFile
        .then((file) => {
          JSROOT.require('hierarchy').then(() => {
            this.painter = new JSROOT.HierarchyPainter('treeViewer', 'treeViewer')
            this.painter.setDisplay(this.viewMode, 'mainViewer')
            this.painter.openRootFile(file).then(() => (this.loading = false))
          })
        })
        .catch((error) => {
          console.log(error)
        })
    },
    exit: function () {
      window.close()
    }
  }
}
</script>

<style>
.app-container {
  /* FIXME make app compatible with dark mode */
  background-color: white !important;
}
.root-viewer {
  height: 100%;
}
.root-sidebar {
  /* FIXME make app compatible with dark mode */
  background-color: white !important;
  display: block !important;
  padding: 10px;
  overflow: scroll !important;
  box-sizing: border-box;
}
#mainViewer {
  padding: 10px;
}
</style>
