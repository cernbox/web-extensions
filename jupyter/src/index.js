import App from './App.vue'
import store from './store.js'

import './css/notebook.min.css'
import './css/default.min.css'
import './css/katex.min.css'
import logo from './img/logo.svg'

const name = 'Jupyter Viewer'

const routes = [
  {
    name: 'view',
    path: '/:filePath*',
    component: App,
    meta: {
      title: name,
      patchCleanPath: true,
      auth: false
    }
  }
]

const appInfo = {
  name: name,
  id: 'jupyter',
  img: logo,
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
