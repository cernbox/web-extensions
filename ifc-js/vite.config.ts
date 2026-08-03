import { defineConfig } from '@ownclouders/extension-sdk'

export default defineConfig({
  base: './',
  server: { port: 9210 },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'main.js'
      }
    }
  },
})
