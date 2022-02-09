import App from './App.vue'
import logo from './img/logo.svg'

const name = 'ROOT Viewer'

const routes = [
  {
    name: 'view',
    path: '/:contextRouteName/:filePath*',
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
