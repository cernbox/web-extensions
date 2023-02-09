import { defineConfig } from '@ownclouders/extension-vite-config'
import { readFileSync } from 'fs'

const https = {
  key: readFileSync('/Users/jannik/projects/owncloud/web/dev/docker/ocis-ca/server.key'),
  cert: readFileSync('/Users/jannik/projects/owncloud/web/dev/docker/ocis-ca/server.crt')
}

export default defineConfig({
  server: {
    port: 9223,
    https
  }
})
