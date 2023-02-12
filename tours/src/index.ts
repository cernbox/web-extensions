import App from './App.vue'
import store from './store'
import { loadTours } from './helpers'

const appInfo = {
  name: 'Tours',
  id: 'tours'
}

const mounted = async function ({ instance, portal, router, store }) {
  portal.open('runtime', 'header.right', 1, [App])

  const { tours } = await loadTours(store.getters.configuration?.options?.tours)
  await store.dispatch('setAllTranslatedTourInfos', tours)
  await store.dispatch('setCurrentTranslatedTourInfos')
}

export default {
  appInfo,
  mounted,
  store
}
