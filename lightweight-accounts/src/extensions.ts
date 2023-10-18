import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'
import { ApplicationSetupOptions, Extension, useStore } from '@ownclouders/web-pkg'
import { User } from '@ownclouders/web-client'

export const extensions = ({ applicationConfig }: ApplicationSetupOptions) => {
  const store = useStore()
  const { $gettext } = useGettext()

  return computed(
    () =>
      [
        {
          id: 'com.github.owncloud.web.nav.lightweight-accounts-home',
          type: 'sidebarNav',
          scopes: ['files'],
          navItem: {
            activeFor: [{ path: '/files/lightweight-accounts-home' }],
            enabled: () => {
              const user = store.getters.user as User
              return user.role?.name === 'user-light'
            },
            name: () => $gettext('Home'),
            icon: 'home',
            route: {
              path: '/files/lightweight-accounts-home'
            },
            priority: 10
          }
        }
      ] satisfies Extension[]
  )
}
