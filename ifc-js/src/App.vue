<template>
  <main id="ifc-main">
    <canvas id="threeCanvas"></canvas>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { AppConfigObject } from '@ownclouders/web-pkg/src/apps'
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

export default defineComponent({
  name: 'IFC Viewer',
  props: {
    applicationConfig: { type: Object as PropType<AppConfigObject>, required: true },
    url: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const config = computed(() => {
      const { wasmPath = "" } = props.applicationConfig as AppConfigObject
      return { wasmPath }
    })

    const davURL = computed(() => {
      return props.url
    })

    return {
      config,
      davURL
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
      const ifcLoader = new IFCLoader()
      ifcLoader.ifcManager.setWasmPath(this.config.wasmPath)
      ifcLoader.load(this.davURL, (ifcModel) => {
        this.scene.add(ifcModel)
      })
    }
  }
})
</script>

<style>
#ifc-main {
  background-color: white !important;
}
main {
  width: 100%;
  height: 100%;
}
#threeCanvas {
  width: 100%;
  height: 100%;
}
</style>
