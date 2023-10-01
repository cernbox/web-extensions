<template>
  <main id="rootjs-main" class="oc-height-1-1">
    <div class="oc-flex root-viewer oc-height-1-1">
      <div id="web-nav-sidebar" class="root-sidebar app-navigation oc-app-navigation-expanded">
        <select id="mode-select" v-model="viewMode" @change="renderViewer">
          <option v-for="item in items" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
        <div id="treeViewer"></div>
      </div>
      <div id="mainViewer" class="oc-flex oc-height-1-1 app-content oc-width-1-1"></div>
    </div>
  </main>
</template>
<script lang="ts">
import { computed, defineComponent } from 'vue'

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

    return {
      davURL
    }
  },
  data: () => ({
    loading: true,
    error: false,
    items: ['simple', 'tabs', 'collapsible', 'grid 2x2', 'grid 3x3', 'grid 4x4'],
    viewMode: null,
    painter: null,
    isPublic: false
  }),
  created() {
    this.viewMode = this.items[0]
  },
  mounted: function () {
    require.config({
      onNodeCreated: function(node){
        node.setAttribute('crossorigin', 'anonymous')
      }
    })
    require(['//root.cern/js/7.8.2/scripts/JSRoot.core.min.js'], this.renderViewer, this.showError)
  },
  methods: {
    rootFile() {
      return fetch(this.davURL).then((resp) => {
        if (resp.ok) {
          return resp.arrayBuffer()
        } else {
          return Promise.reject('error code: ' + resp.status)
        }
      })
    },
    renderViewer: function () {
      if (this.painter !== null) {
        this.painter.cleanup()
      }
      this.rootFile()
        .then((file) => {
          JSROOT.require('hierarchy').then(() => {
            this.painter = new JSROOT.HierarchyPainter('treeViewer', 'treeViewer')
            this.painter.setDisplay(this.viewMode, 'mainViewer')
            this.painter.openRootFile(file).then(() => (this.loading = false))
          })
        })
        .catch((error) => {
          this.showError()
          console.log(error)
        })
    },
    showError: function () {
      // FIXME waiting for owncloud to implement a way to show error
      console.error('showError')
    }
  }
})
</script>

<style>
#rootjs-main {
  /* FIXME make app compatible with dark mode */
  background-color: white !important;
}
.root-sidebar {
  display: block !important;
  padding: 10px;
  overflow: auto !important;
  box-sizing: border-box;
}
#mainViewer {
  padding: 10px;
}
</style>
