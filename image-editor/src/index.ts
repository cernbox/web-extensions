import App from './App.vue'
import { AppWrapperRoute } from '@ownclouders/web-pkg'
import store from './store/index.js'

// just a dummy function to trick gettext tools
function $gettext(msg) {
  return msg
}

const routes = [
  {
    path: '/:driveAliasAndItem(.*)?',
    component: App,
    meta: {
      authContext: 'hybrid',
      title: name,
      patchCleanPath: true
    }
  }
]

const routes = [
  {
    path: '/:driveAliasAndItem(.*)?',
    component: AppWrapperRoute(App, {
      applicationId: 'image-editor',
      urlForResourceOptions: {
        // Use blob so that the loading screen
        // represents the loading of the resource
        disposition: 'inline'
      }
    }),
    name: 'image-editor',
    meta: {
      authContext: 'hybrid',
      title: name,
      patchCleanPath: true
    }
  }
]

// todo: add more
const appInfo = {
  name: 'Image Editor',
  id: 'image-editor',
  icon: 'edit-2',
  extensions: [
    {
      extension: 'png',
      newTab: true,
      routeName: 'image-editor-view',
      canBeDefault: true
    },
    {
      extension: 'jpeg',
      newTab: true,
      routeName: 'image-editor-view',
      canBeDefault: true
    },
    ,
    {
      extension: 'jpg',
      newTab: true,
      routeName: 'image-editor-view',
      canBeDefault: true
    }
  ]
}

export default {
  appInfo,
  routes,
  store
}
