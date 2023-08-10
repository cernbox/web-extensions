import App from './App.vue'

const appInfo = {
  name: 'Survey',
  id: 'survey'
}

export default {
  appInfo,
  mounted({ portal }) {
    portal.open('runtime', 'header.right', 60, [App])
  }
}
