import { computed } from 'vue'
import { ApplicationSetupOptions, Extension, useStore, useRouter } from '@ownclouders/web-pkg'
import { Provider } from './provider'

export const extensions = ({ applicationConfig }: ApplicationSetupOptions) => {
  const store = useStore()
  const router = useRouter()

  return computed(
    () =>
      [
        {
          id: 'com.github.owncloud.web.search-in-folder',
          type: 'search',
          searchProvider: new Provider(store, router)
        }
      ] satisfies Extension[]
  )
}
