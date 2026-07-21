import { unref } from 'vue'
import { defineWebApplication, useConfigStore } from '@ownclouders/web-pkg'
import TopBarButton from './components/TopBarButton.vue'

export default defineWebApplication({
  setup() {
    const configStore = useConfigStore()

    return {
      appInfo: {
        id: 'office-app-feedback',
        name: 'Office App Feedback'
      },
      mounted({ portal }) {
        if (unref(configStore).options.embed?.enabled === true) {
          return
        }
        portal.open('runtime', 'header.right', 55, [TopBarButton])
      }
    }
  }
})
