import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'
import {
  ApplicationSetupOptions, 
  SidebarNavExtension, 
  useUserStore, 
  useSpacesStore 
} from '@ownclouders/web-pkg'
import { isPersonalSpaceResource } from '@ownclouders/web-client'

export const extensions = ({ applicationConfig }: ApplicationSetupOptions) => {
  const userStore = useUserStore()
  const spacesStore = useSpacesStore()
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
              const userHasPersonalSpace = !!spacesStore.spaces.find(
                (drive) => isPersonalSpaceResource(drive) && drive.isOwner(userStore.user)
              )
              // Lightweight accounts do not have personal spaces
              return !userHasPersonalSpace
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
