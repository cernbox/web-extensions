import App from './App.vue'
import { useToursStore } from './store'
import { loadTours } from './helpers'
import { useConfigStore } from '@ownclouders/web-pkg'

const appInfo = {
  name: 'Tours',
  id: 'tours'
}

const mounted = async function ({ instance, portal, router }) {
  portal.open('runtime', 'header.right', 1, [App])

  const store = useToursStore()

  const { tours } = await loadTours(store.tours)

  store.setAllTranslatedTourInfos(tours)
  store.setCurrentTranslatedTourInfos()
}

export default {
  appInfo,
  mounted
}
