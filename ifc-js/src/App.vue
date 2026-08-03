<template>
  <main id="ifc-main">
    <canvas id="threeCanvas"></canvas>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Components, IfcLoader } from '@thatopen/components'

import webIfcWasmUrl from 'web-ifc/web-ifc.wasm?url'

// web-ifc resolves its wasm file by literal filename via a `locateFile(path)` callback.
// Mapping that exact name to our bundled, hashed asset URL keeps everything self-contained
// instead of falling back to fetching from unpkg.com at runtime. The multi-threaded variant
// (web-ifc-mt.wasm) is intentionally not bundled: it only kicks in when the page is
// cross-origin-isolated (COOP/COEP), which this app doesn't set up, and its worker script
// isn't exposed as an importable package subpath.
const webIfcFileMap: Record<string, string> = {
  'web-ifc.wasm': webIfcWasmUrl
}

export default defineComponent({
  name: 'IFC Viewer',
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
  async mounted() {
    this.init()
    this.addGrid()
    this.addAxes()
    await this.addIFCModel()
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

      this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight)
      this.camera.position.z = 15
      this.camera.position.y = 13
      this.camera.position.x = 8

      this.renderer = new WebGLRenderer({ canvas: threeCanvas, alpha: true })
      this.renderer.setSize(window.innerWidth, window.innerHeight)
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
    addIFCModel: async function () {
      const components = new Components()
      components.init()
      const loader = components.get(IfcLoader)

      await loader.setup({
        autoSetWasm: false,
        customLocateFileHandler: (path) => webIfcFileMap[path] || path
      })

      const file = await fetch(this.davURL)
      const data = await file.arrayBuffer()
      const buffer = new Uint8Array(data)
      const model = await loader.load(buffer)

      model.name = 'IFC Model'
      this.scene.add(model)
    }
  }
})
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
