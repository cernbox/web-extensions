import { defineConfig } from '@ownclouders/extension-sdk'

export default defineConfig({
  server: { port: 9228 },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'main.js'
      }
    }
  }
})
