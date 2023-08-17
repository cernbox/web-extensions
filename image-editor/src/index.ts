import App from './App.vue'

import store from './store/index.js'

// just a dummy function to trick gettext tools
function $gettext(msg) {
  return msg
}

const name = 'Image Editor'

const routes = [
  {
    path: '/:driveAliasAndItem(.*)?',
    component: App,
    meta: {
      authContext: 'hybrid',
      title: name,
      patchCleanPath: true
    }
  }
]

const appInfo = {
  name: name,
  id: 'image-editor',
  icon: 'edit-2',
  extensions: [
    {
      extension: 'png',
      newTab: true,
      routeName: 'image-editor-view',
      canBeDefault: true
    }
  ]
}

export default {
  appInfo,
  routes,
  store
}
