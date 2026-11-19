declare global {
  interface Window {
    /** Base URL that Excalidraw loads its fonts from. */
    EXCALIDRAW_ASSET_PATH?: string | string[]
  }
}

export {}
