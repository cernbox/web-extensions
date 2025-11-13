import App from './App.vue'
import { useToursStore } from './store'
import { loadTours } from './helpers'
import { useConfigStore, defineWebApplication } from '@ownclouders/web-pkg'
import { unref } from 'vue'

export default defineWebApplication({
  setup({ applicationConfig }) {
    const configStore = useConfigStore()
    const config = applicationConfig || {}

    const appInfo = {
      id: 'tours',
      name: 'Tours',
    }

    const mounted = async function ({ portal = null }) {
      if (unref(configStore).options.embed?.enabled === true) {
        return
      }
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
