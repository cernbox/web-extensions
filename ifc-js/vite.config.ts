import { defineConfig } from '@ownclouders/extension-sdk'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  server: {},
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'main.js'
      }
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [{ src: 'node_modules/web-ifc-three/web-ifc.wasm', dest: './' }]
    })
  ]
})
