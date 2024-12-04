import App from './App.vue'
import { AppWrapperRoute } from '@ownclouders/web-pkg'

import { encode } from 'js-base64'

import './css/notebook.min.css'
import './css/default.min.css'
import './css/katex.min.css'
import logo from './img/logo.svg?raw'

const name = 'Jupyter Viewer'
const appId = 'jupyter'

const svg = `data:image/svg+xml;base64,${encode(logo)}`

const routes = [
  {
    path: '/:driveAliasAndItem(.*)?',
    component: AppWrapperRoute(App, {
      applicationId: appId
    }),
    name: appId,
    meta: {
      authContext: 'hybrid',
      title: name,
      patchCleanPath: true
    }
  }
]


const appInfo = {
  name: name,
  id: appId,
  img: svg,
  extensions: [
    {
      extension: 'ipynb',
      HasPriority: true,
      routeName: appId
    }
  ]
}

export default {
  appInfo,
  routes
}
