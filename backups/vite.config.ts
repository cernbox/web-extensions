import { defineConfig } from '@ownclouders/extension-sdk'

export default defineConfig({
  server: {},
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'main.js'
      }
    }
  }
})