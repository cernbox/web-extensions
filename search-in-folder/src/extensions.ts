import { computed } from 'vue'
import { ApplicationSetupOptions, SearchExtension, useResourcesStore, useRouter } from '@ownclouders/web-pkg'
import { Provider } from './provider'

export const extensions = ({ applicationConfig }: ApplicationSetupOptions) => {
  const store = useResourcesStore()
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
