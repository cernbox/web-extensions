# web-app-excalidraw

Opens, creates and edits `.excalidraw` files with the [Excalidraw](https://github.com/excalidraw/excalidraw) editor, which is bundled into `main.js`. The drawing is saved as a normal file in CERNBox, so sharing and versions work as for any other file.

The build copies Excalidraw's fonts to `dist/fonts`, next to `main.js`, because Excalidraw otherwise loads them from esm.sh, which the CERNBox CSP blocks.

## Live co-editing

Everyone who opens the same drawing edits it together and sees the others' cursors, through CERNBox's web, which owns the live editing session. The app only says how a drawing moves between its file and the shared Y.Doc (`sceneAdapter` in `src/collab/scene.ts`), and binds Excalidraw to the Y.Doc web hands it.

It needs:

- A CERNBox web with the Yjs session in its AppWrapper, and `yjsServerUrl` in its options, for example `wss://cernbox.cern.ch/yjs`. Without the URL, the drawing is edited alone.
- [OpenCloud's Yjs server](https://github.com/opencloud-eu/web/tree/main/services/yjs) (`opencloudeu/yjs`), with `OPENCLOUD_URL` set to the CERNBox URL, run with CERNBox's entry point from `yjs-server/` so that public links can join. It keeps each drawing in memory, so all users must reach the same instance.

The build leaves `yjs` out of `main.js`: the Y.Doc comes from web, and only works with web's own copy.

The file is still saved by the browsers, over WebDAV. Edits that nobody saved are lost when the last user leaves.
