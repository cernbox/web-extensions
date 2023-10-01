import App from './App.vue'
import { AppWrapperRoute } from '@ownclouders/web-pkg'

import logo from './img/logo.svg?raw'
import { encode } from 'js-base64'

const name = 'IFC Viewer'
const appId = 'ifc-js'

const svg = `data:image/svg+xml;base64,${encode(logo)}`

const routes = [
  {
    path: '/:driveAliasAndItem(.*)?',
    component: AppWrapperRoute(App, {
      applicationId: appId,
      urlForResourceOptions: {
        // Use blob so that the loading screen
        // represents the loading of the resource
        disposition: 'inline'
      }
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
      extension: 'ifc',
      routeName: appId
    }
  ]
}

export default {
  appInfo,
  routes
}
