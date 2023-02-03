import App from './App.vue'
import logo from './img/logo.svg'

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

const appInfo = {
  name: name,
  id: 'ifc-js',
  img: logo,
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
