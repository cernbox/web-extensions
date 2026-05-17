import { defineConfig } from '@ownclouders/extension-sdk'

export default defineConfig({
  server: { port: 9218 },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'main.js'
      }
    }
  }
})