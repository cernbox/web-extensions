import App from './App.vue'
import logo from './img/logo.svg?raw'
import { encode } from 'js-base64'

const name = 'IFC Viewer'

const routes = [
  {
    name: 'view',
    path: '/:driveAliasAndItem(.*)?',
    component: App,
    meta: {
      authContext: 'hybrid',
      title: name,
      patchCleanPath: true
    }
  }
]

const svg = `data:image/svg+xml;base64,${encode(logo)}`

const appInfo = {
  name: name,
  id: 'ifc-js',
  img: svg,
  extensions: [
    {
      extension: 'ifc',
      newTab: true,
      routeName: 'ifc-js-view',
      canBeDefault: true
    }
  ]
}

export default {
  appInfo,
  routes
}
