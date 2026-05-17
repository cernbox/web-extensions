import { defineConfig } from '@ownclouders/extension-sdk'

export default defineConfig({
  server: { port: 9223 },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'main.js'
      }
    }
  }
})