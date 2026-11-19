# web-app-excalidraw

Opens, creates and edits `.excalidraw` files with the [Excalidraw](https://github.com/excalidraw/excalidraw) editor, which is bundled into `main.js`. The drawing is saved as a normal file in CERNBox, so sharing and versions work as for any other file.

The build copies Excalidraw's fonts to `dist/fonts`, next to `main.js`, because Excalidraw otherwise loads them from esm.sh, which the CERNBox CSP blocks.

## Live co-editing

With `yjsServerUrl` in the app config, everyone who opens the same drawing edits it together and sees the others' cursors:

```json
{ "id": "excalidraw", "path": "...", "config": { "yjsServerUrl": "wss://cernbox.cern.ch/yjs" } }
```

It needs two things:

- [OpenCloud's Yjs server](https://github.com/opencloud-eu/web/tree/main/services/yjs) (`opencloudeu/yjs`), with `OPENCLOUD_URL` set to the CERNBox URL. It relays the edits and checks every user against reva's Graph API. It keeps each drawing in memory, so all users must reach the same instance.
- A CERNBox web whose AppWrapper passes `currentETag` and takes `update:serverState`. Without them the clients could not hand each other their saves, so the drawing is not shared.

The file is still saved by the browsers, over WebDAV. After a save, the others take its etag, and are clean again if they hold the same drawing. If the server cannot be reached, the editor falls back to editing alone.

Known limits: edits that nobody saved are lost when the last user leaves. A user who may only read the file sees changes live only if someone with write access already has it open. If the file changes outside the editor while the drawing is open, the next save fails as a conflict.
