<template>
  <main>
    <div class="uk-position-center" v-if="loading">
      <oc-spinner size="xlarge" />
      <p v-translate class="oc-invisible">Loading app</p>
    </div>
    <canvas id="threeCanvas"></canvas>
  </main>
</template>

<script>
import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { IFCLoader } from 'web-ifc-three/IFCLoader'
import { getFileUrl, getHeadersWithAuth } from '../../common/fileAccess.js'

export default {
  name: 'IFCViewer',
  data() {
    return {
      loading: true,
      camera: null,
      scene: null,
      renderer: null,
      controls: null
    }
  },
  mounted() {
    this.init()
    this.addGrid()
    this.addAxes()
    this.addIFCModel()
    this.animate()
  },
  methods: {
    init: function () {
      const threeCanvas = document.getElementById('threeCanvas')

      this.scene = new Scene()
      const lightColor = 0xffffff

      const ambientLight = new AmbientLight(lightColor, 0.5)
      this.scene.add(ambientLight)

      const directionalLight = new DirectionalLight(lightColor, 1)
      directionalLight.position.set(0, 10, 0)
      directionalLight.target.position.set(-5, 0, 0)
      this.scene.add(directionalLight)
      this.scene.add(directionalLight.target)

      this.camera = new PerspectiveCamera(75, threeCanvas.clientWidth / threeCanvas.clientHeight)
      this.camera.position.z = 15
      this.camera.position.y = 13
      this.camera.position.x = 8

      this.renderer = new WebGLRenderer({ canvas: threeCanvas, alpha: true })
      this.renderer.setSize(threeCanvas.clientWidth, threeCanvas.clientHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      this.controls = new OrbitControls(this.camera, threeCanvas)
      this.controls.enableDamping = true
      this.controls.target.set(-2, 0, 0)
    },
    addGrid: function () {
      const grid = new GridHelper(50, 30)
      this.scene.add(grid)
    },
    addAxes: function () {
      const axes = new AxesHelper()
      axes.material.depthTest = false
      axes.renderOrder = 1
      this.scene.add(axes)
    },
    animate: function () {
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
      requestAnimationFrame(this.animate)
    },
    addIFCModel: function () {
      const isPublic = this.$route.name === 'ifc-js-public'
      const ifcLoader = new IFCLoader()
      // FIXME hack to load the wasm... should not be needed
      ifcLoader.ifcManager.setWasmPath(
        '../../../../../../../../../../../../../../../../cernbox/ifc-js-0.1.3/'
      )
      const headers = getHeadersWithAuth(isPublic, this.getToken, this.publicLinkPassword)
      ifcLoader.setRequestHeader(headers)
      const filePath = `/${this.$route.params.filePath.split('/').filter(Boolean).join('/')}`
      const url = getFileUrl(this.$client, isPublic, filePath)
      ifcLoader.load(url, (ifcModel) => {
        ifcModel.mesh.onAfterRender = (renderer, scene, camera, geometry, material, group) => {
          if (this.loading === true) {
            this.loading = false
          }
        }
        this.scene.add(ifcModel.mesh)
      })
    }
  }
}
</script>

<style>
main {
  width: 100%;
  height: 100%;
}
#threeCanvas {
  width: 100%;
  height: 100%;
}
</style>
