// The build copies Excalidraw's fonts next to main.js. import.meta.url goes through a variable
// because vite would take new URL('./', import.meta.url) for an asset to bundle.
const scriptUrl = import.meta.url
const assetPath = new URL('./', scriptUrl).href

window.EXCALIDRAW_ASSET_PATH = assetPath

// The UI font, whose @font-face rules the build drops from Excalidraw's CSS.
const uiFontWeights = { Regular: '400', Medium: '500', SemiBold: '600', Bold: '700' }
for (const [name, weight] of Object.entries(uiFontWeights)) {
  const url = `${assetPath}fonts/Assistant/Assistant-${name}.woff2`
  document.fonts.add(new FontFace('Assistant', `url(${url})`, { weight, display: 'swap' }))
}
