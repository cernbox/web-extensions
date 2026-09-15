import { defineWebApplication, ActionExtension } from '@ownclouders/web-pkg'
import { computed, unref } from 'vue'

import logo from './img/logo-swan.svg?raw'
import { encode } from 'js-base64'

const svg = `data:image/svg+xml;base64,${encode(logo)}`

const getPath = (space, resource) => {
  return `/${space.driveAlias}${resource.path}`
}

export default defineWebApplication({
  setup({ applicationConfig }) {
    const { url = 'https://cern.ch/swanserver/cgi-bin/go' } = applicationConfig || {}

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
        isVisible: ({ space, resources }) => {
          if (resources.length !== 1) {
            return false
          }
          if (resources[0].extension.toLowerCase() === 'ipynb'){
            const path = getPath(space, resources)
            return path.startsWith('/eos/')
          }
          return false
        },
        handler: ({ space, resources }) => {
          const path = getPath(space, resources[0])
          console.debug('Opening in SWAN...', path)
          window.open(`${url}?projurl=file:/${path}`, '_blank')
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