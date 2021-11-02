# web-extensions

This repo contains all the CERNBox web extensions for OCIS Web.

## Development

When developing on an extension, just `yarn serve` on it. This will build in watch mode and create a web server to expose the files in `dist`.
To enable the extension in the Web, just add the following to the config:

```json
{
  (...)
  "external_apps": [
    {
      "id": "ifc-js",
      "path": "http://localhost:9101/main.js"
    }
  ]
}
```

The remaining extensions will have a different port (just look at the output of the `yarn serve` command).