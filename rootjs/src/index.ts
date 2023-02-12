import App from './App.vue'
import { encode } from 'js-base64'
import logo from './img/logo.svg?raw'

const name = 'ROOT Viewer'

const svg = `data:image/svg+xml;base64,${encode(logo)}`

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

const appInfo = {
  name: name,
  id: 'rootjs',
  img: svg,
  extensions: [
    {
      extension: 'root',
      newTab: true,
      routeName: 'rootjs-view',
      canBeDefault: true
    }
  ]
}

export default {
  appInfo,
  routes
}
