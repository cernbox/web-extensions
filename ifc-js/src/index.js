import App from './App.vue'

const name = 'IFC.js'

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
  icon: 'grid_on',
  extensions: [
    {
      extension: 'ifc',
      newTab: true,
      routeName: 'ifc-js-view',
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
      routes: ['files-public-list']
    }
  ]
}

export default {
  appInfo,
  routes
}
