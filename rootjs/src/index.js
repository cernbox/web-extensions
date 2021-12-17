import App from './App.vue'
import logo from './img/logo.svg'

const name = 'ROOT Viewer'

const routes = [
  {
    name: 'view',
    path: '/view/:filePath*',
    components: {
      fullscreen: App
    },
    meta: {
      title: name,
      patchCleanPath: true,
      hideHeadbar: true
    }
  },
  {
    path: '/public/:filePath*',
    components: {
      fullscreen: App
    },
    name: 'public',
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
  id: 'rootjs',
  img: logo,
  extensions: [
    {
      extension: 'root',
      newTab: true,
      routeName: 'rootjs-view',
      canBeDefault: true,
      routes: [
        'files-personal',
        'files-favorites',
        'files-shared-with-others',
        'files-shared-with-me'
      ]
    },
    {
      extension: 'root',
      newTab: true,
      routeName: 'rootjs-public',
      canBeDefault: true,
      routes: ['files-public-list']
    }
  ]
}

export default {
  appInfo,
  routes
}
