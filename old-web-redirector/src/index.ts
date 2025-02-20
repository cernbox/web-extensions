import Redirect from './Redirect.vue'
import Error from './Error.vue'

const routes = [
  {
    name: 'personal',
    path: '/apps/files/',
    component: Redirect,
    meta: {
      authContext: 'user'
    }
  },
  {
    name: 'public',
    path: '/s/:token',
    component: Redirect,
    meta: {
      authContext: 'anonymous'
    }
  },
  {
    name: 'error',
    path: '/*',
    component: Error,
    meta: {
      authContext: 'anonymous'
    }
  }
]

const appInfo = {
  name: 'Redirector',
  id: 'index.php' // it doesn't work with 'index.php' as id, it needs to be alphanumeric
}

export default {
  appInfo,
  routes
}
