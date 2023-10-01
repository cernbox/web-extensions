import App from './App.vue'
import { AppWrapperRoute } from '@ownclouders/web-pkg'

import { encode } from 'js-base64'
import logo from './img/logo.svg?raw'

const name = 'ROOT Viewer'
const appId = 'rootjs'

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
      extension: 'root',
      routeName: appId
    }
  ]
}

export default {
  appInfo,
  routes
}
