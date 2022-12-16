import App from './App.vue'

const appInfo = {
  name: 'TopBar',
  id: 'top-bar'
}

export default {
  appInfo,
  mounted({ portal }) {
    portal.open('runtime', 'header.right', 60, [App])
  }
}
