import { defineConfig } from '@ownclouders/extension-sdk'

export default defineConfig({
  server: { port: 9226 },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'main.js',
        // Mermaid lazy-loads each diagram renderer with import(), which makes rollup split the
        // build into chunks. The web runtime loads an extension as a single AMD module and does
        // not resolve sibling chunks at runtime — no extension in this repo ships any — so the
        // dynamic imports are inlined and everything stays in one file.
        //
        // The cost is bundle size: this is what takes the output past 5 MB.
        inlineDynamicImports: true
      }
    }
  }
})
