import App from './App.vue'
import logo from './img/logo.svg'

const name = 'IFC Viewer'

const routes = [
  {
    name: 'view',
    path: '/view/:filePath*',
    components: {
      fullscreen: App
    },
    meta: {
      title: name,
      hideHeadbar: true,
      patchCleanPath: true
    }
  },
  {
    name: 'public',
    path: '/public/:filePath*',
    components: {
      fullscreen: App
    },
    meta: {
      title: name,
      patchCleanPath: true,
      hideHeadbar: true,
      auth: false
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
      canBeDefault: true,
      routes: [
        'files-personal',
        'files-favorites',
        'files-shared-with-others',
        'files-shared-with-me'
      ]
    },
    {
      extension: 'ifc',
      newTab: true,
      routeName: 'ifc-js-public',
      canBeDefault: true,
      routes: ['files-public-list']
    }
  ]
}

export default {
  appInfo,
  routes
}
