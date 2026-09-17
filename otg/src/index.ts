import App from './App.vue'

const appInfo = {
  name: 'OTG',
  id: 'otg'
}

export default {
  appInfo,
  mounted({ portal }) {
    portal.open('runtime', 'allPages', 1, [App])
  }
}
