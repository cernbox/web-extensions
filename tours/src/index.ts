import App from './App.vue'
import { useToursStore } from './store'
import { loadTours } from './helpers'
import { CustomComponentExtension, defineWebApplication, useUserStore } from '@ownclouders/web-pkg'
import { computed } from 'vue'

export default defineWebApplication({
  setup({ applicationConfig }) {
    const userStore = useUserStore()
    const config = applicationConfig || {}

    const appInfo = {
      id: 'tours',
      name: 'Tours',
    }

    const mounted = async function ({ portal = null }) {
      portal.open('runtime', 'header.right', 1, [App])
      const toursStore = useToursStore()

      const { tours } = await loadTours(config.tours || [])

      toursStore.setAllTranslatedTourInfos(tours)
      toursStore.setCurrentTranslatedTourInfos()
    }

    return {
      appInfo,
      mounted,
    }
  }
})
