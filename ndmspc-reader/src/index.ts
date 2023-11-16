import App from './App.vue'
import { AppWrapperRoute } from '@ownclouders/web-pkg'

import { encode } from 'js-base64'

import logo from './img/logo.svg?raw'

const name = 'Ndmspc Viewer'
const appId = 'ndmspc-reader'

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
      extension: 'ndmspc',
      routeName: appId
    }
  ]
}

export default {
  appInfo,
  routes
}
