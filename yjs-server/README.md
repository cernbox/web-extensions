# Yjs server

The extensions with live editing edit together through OpenCloud's Yjs server,
image `opencloudeu/yjs`. That server only lets in logged-in users, so CERNBox
runs it with its own entry point, `cernbox-server.ts`, which also lets in public
link visitors. On a public link the extensions send
`publiclink:{"token","password","path"}` as the token (`roomToken` in
`excalidraw/src/App.vue`), and the server checks it with the same WebDAV
request as web. The visitor joins as a guest, and may write if the link may.

`patch-container.sh` puts `cernbox-server.ts` in place of the image's
`src/server.ts` in a running container and restarts it:

```sh
./patch-container.sh                                  # container yjs
DOCKER=podman ./patch-container.sh cernbox-local_yjs_1
```

Run it again whenever the container is recreated. It refuses an image whose
`server.ts` is not the one of 1.1.1, which `cernbox-server.ts` is based on:
check a new version against it first, then update the hash in the script.
