import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'
import { ApplicationSetupOptions, SidebarNavExtension, useUserStore } from '@ownclouders/web-pkg'

export const extensions = ({ applicationConfig }: ApplicationSetupOptions) => {
  const userStore = useUserStore()
  const { $gettext } = useGettext()

  return computed(
    () =>
      [
        {
          id: 'com.github.owncloud.web.nav.lightweight-accounts-home',
          type: 'sidebarNav',
          navItem: {
            activeFor: [{ path: '/files/lightweight-accounts-home' }],
            isVisible: () => {
              const user = userStore.user
              const roles = user.appRoleAssignments as any[] // types don't match
              return roles?.some((role) => role.name === 'user-light')
            },
            name: () => $gettext('Home'),
            icon: 'home',
            route: {
              path: '/files/lightweight-accounts-home'
            },
            priority: 10
          }
        }
      ] satisfies SidebarNavExtension[]
  )
}
