import App from './App.vue'
import store from './store.js'
import { encode } from 'js-base64'

import './css/notebook.min.css'
import './css/default.min.css'
import './css/katex.min.css'
import logo from './img/logo.svg?raw'

const name = 'Jupyter Viewer'

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
  id: 'jupyter',
  img: svg,
  extensions: [
    {
      extension: 'ipynb',
      newTab: true,
      routeName: 'jupyter-view',
      canBeDefault: true
    }
  ]
}

export default {
  appInfo,
  routes,
  store
}
