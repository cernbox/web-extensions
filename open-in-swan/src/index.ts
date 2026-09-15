import { defineWebApplication, ActionExtension, FileActionOptions } from '@ownclouders/web-pkg'
import { computed, unref } from 'vue'

import logo from './img/logo-swan.svg?raw'
import { encode } from 'js-base64'

const svg = `data:image/svg+xml;base64,${encode(logo)}`

const trimSlashes = (path: string) => path.replace(/^\/+|\/+$/g, '')

export default defineWebApplication({
  setup({ applicationConfig }) {
    // SWAN's JupyterLab tree is rooted at /eos
    const {
      serverUrl = 'https://swan.cern.ch',
      serverPath = 'hub/user-redirect/lab/tree',
      serverRootPath = '/eos'
    } = applicationConfig || {}
    const rootPath = trimSlashes(serverRootPath)

    const getTreePath = ({ space, resources }: FileActionOptions) => {
      const path = trimSlashes(`${space.driveAlias}${resources[0].path}`)
      if (!rootPath) {
        return path
      }
      if (!path.startsWith(`${rootPath}/`)) {
        return undefined
      }
      return path.slice(rootPath.length + 1)
    }

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
          return getTreePath(options) !== undefined
        },
        // Not an href, which the host opens in the same tab
        handler: (options: FileActionOptions) => {
          // encodeURI would leave '#' and '?' unescaped
          const treePath = getTreePath(options).split('/').map(encodeURIComponent).join('/')
          const url = [trimSlashes(serverUrl), trimSlashes(serverPath), treePath]
            .filter(Boolean)
            .join('/')
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
