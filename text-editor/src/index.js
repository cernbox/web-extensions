// --- Components --------------------------------------------------------------

import App from './App.vue'
import t from '../l10n/translations'

// --- Routing -----------------------------------------------------------------

import store from './store.js'

const name = 'Text Editor'

const routes = [
  {
    path: '/:filePath*',
    component: App,
    name: 'editor',
    meta: {
      title: name,
      patchCleanPath: true,
      auth: false
    }
  }
]

const appInfo = {
  name: name,
  id: 'text-editor',
  icon: 'file-text',
  isFileEditor: true,
  extensions: [
    {
      extension: 'txt',
      routeName: 'text-editor-editor',
      canBeDefault: true,
      // newTab: true,
      newFileMenu: {
        menuTitle($gettext) {
          return $gettext('Plain text file')
        }
      }
    }
  ]
}

for (const ext of ['js', 'json', 'xml', 'py', 'php', 'yaml']) {
  appInfo.extensions.push({
    extension: ext,
    routeName: 'text-editor-editor',
    canBeDefault: true
    // newTab: true,
  })
}

const translations = t
export default {
  appInfo,
  routes,
  store,
  translations
}
