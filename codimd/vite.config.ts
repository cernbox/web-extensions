import { defineConfig } from '@ownclouders/extension-sdk'

export default defineConfig({
  server: { port: 9212 },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'main.js'
      }
    }
  }
})

