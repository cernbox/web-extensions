import Redirect from './Redirect.vue'
import Error from './Error.vue'

const routes = [
  {
    name: 'personal',
    path: '/apps/files/',
    component: Redirect,
    meta: {
      auth: true
    }
  },
  {
    name: 'public',
    path: '/s/:token',
    component: Redirect,
    meta: {
      auth: false
    }
  },
  {
    name: 'error',
    path: '*',
    component: Error,
    meta: {
      auth: false
    }
  }
]

const appInfo = {
  name: 'Redirector',
  id: 'index.php'
}

export default {
  appInfo,
  routes
}
