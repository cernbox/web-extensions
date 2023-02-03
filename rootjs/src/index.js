import App from './App.vue'
import logo from './img/logo.svg'

const name = 'ROOT Viewer'

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
  img: logo,
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
