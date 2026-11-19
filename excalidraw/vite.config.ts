import { defineConfig } from '@ownclouders/extension-sdk'
import { cpSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  server: { port: 9229 },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'main.js',
        // Excalidraw lazy-loads its locales and export helpers with import(). The web runtime
        // loads an extension as a single AMD module and does not resolve sibling chunks, so the
        // dynamic imports are inlined and everything stays in one file.
        inlineDynamicImports: true
      }
    }
  },
  plugins: [
    {
      // Excalidraw's CSS loads its UI font from a path relative to the stylesheet, which no
      // longer exists once the CSS is bundled into main.js. App.vue loads it instead.
      name: 'drop-excalidraw-ui-font-faces',
      enforce: 'pre',
      transform(code, id) {
        if (/@excalidraw\/excalidraw\/dist\/(prod|dev)\/index\.css/.test(id)) {
          return code.replace(/@font-face\s*\{[^}]*font-family:\s*"?Assistant"?;[^}]*\}/g, '')
        }
      }
    },
    {
      // Excalidraw fetches its fonts at runtime from window.EXCALIDRAW_ASSET_PATH and otherwise
      // from esm.sh, which the CERNBox CSP blocks. Ship them next to main.js instead.
      name: 'copy-excalidraw-fonts',
      writeBundle({ dir }) {
        cpSync('node_modules/@excalidraw/excalidraw/dist/prod/fonts', join(dir, 'fonts'), {
          recursive: true
        })
      }
    }
  ]
})
