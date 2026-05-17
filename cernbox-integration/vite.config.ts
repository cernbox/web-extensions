import { defineConfig } from '@ownclouders/extension-sdk'

export default defineConfig({
    server: { port: 9211 },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'main.js'
        }
      }
    }
  })
