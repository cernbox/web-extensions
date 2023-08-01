import App from './App.vue'

const appInfo = {
  name: 'MS tracing',
  id: 'ms-tracing'
}

export default {
  appInfo,
  mounted({ portal }) {
    portal.open('runtime', 'header.right', 1, [App])
  }
}
