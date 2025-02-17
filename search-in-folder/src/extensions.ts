import { computed } from 'vue'
import { createStore } from 'vuex'
import { ApplicationSetupOptions, SearchExtension, useRouter } from '@ownclouders/web-pkg'
import { Provider } from './provider'

export const extensions = ({ applicationConfig }: ApplicationSetupOptions) => {
  const store = createStore({
    state: {
      files: [],
      areHiddenFilesShown: false,
      currentFolder: null
    },
    getters: {
      files: (state) => state.files,
      areHiddenFilesShown: (state) => state.areHiddenFilesShown,
      currentFolder: (state) => state.currentFolder
    }
  })
  const router = useRouter()

  return computed(
    () =>
      [
        {
          id: 'com.github.cernbox.web-extensions.search-in-folder',
          type: 'search',
          searchProvider: new Provider(store, router)
        }
      ] satisfies SearchExtension[]
  )
}
