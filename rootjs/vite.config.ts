import { defineConfig } from '@ownclouders/extension-sdk'

export default defineConfig({
  server: { port: 9222 },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'main.js'
      }
    }
  }
})