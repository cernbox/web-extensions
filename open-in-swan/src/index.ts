import { defineWebApplication, ActionExtension, FileActionOptions } from '@ownclouders/web-pkg'
import { computed, unref } from 'vue'

import logo from './img/logo-swan.svg?raw'
import { encode } from 'js-base64'

const svg = `data:image/svg+xml;base64,${encode(logo)}`

const trimSlashes = (path: string) => path.replace(/^\/+|\/+$/g, '')

export default defineWebApplication({
  setup({ applicationConfig }) {
    const {
      serverUrl = 'https://swan.cern.ch',
      serverPath = 'user-redirect/download',
      // Only files under this root are offered, as SWAN cannot open anything else
      serverRootPath = '/eos'
    } = applicationConfig || {}
    const rootPath = trimSlashes(serverRootPath)

    const getPath = ({ space, resources }: FileActionOptions) =>
      trimSlashes(`${space.driveAlias}${resources[0].path}`)

    const extension = computed<ActionExtension>(() => ({
      id: 'com.github.cernbox.web-extensions.open-in-swan',
      scopes: ['resource'],
      type: 'action',
      extensionPointIds: ['global.files.context-actions'],
      action: {
        name: 'open-in-swan',
        img: svg,
        category: 'context',
        label: () => 'Open in SWAN',
        isVisible: (options: FileActionOptions) => {
          const { resources } = options
          if (resources.length !== 1 || resources[0].extension.toLowerCase() !== 'ipynb') {
            return false
          }
          return !rootPath || getPath(options).startsWith(`${rootPath}/`)
        },
        // Not an href, which the host opens in the same tab
        handler: (options: FileActionOptions) => {
          // SWAN takes file://eos/..., i.e. the path without its leading slash
          const projurl = encodeURIComponent(`file://${getPath(options)}`)
          const url = `${trimSlashes(serverUrl)}/${trimSlashes(serverPath)}?projurl=${projurl}`
          console.debug('Opening in SWAN...', url)
          window.open(url, '_blank')
        }
      }
    }))

    return {
      appInfo: {
        name: 'SWAN',
        id: 'swan'
      },
      extensions: computed(() => [unref(extension)])
    }
  }
})
