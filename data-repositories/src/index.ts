import { computed, unref } from 'vue'
import App from './App.vue'
import { defineWebApplication, SidebarNavExtension, useRouter } from '@ownclouders/web-pkg'

const appInfo = {
  name: 'Data repositories',
  id: 'data-repositories'
}

export default defineWebApplication({
  setup() {
    const router = useRouter()

    // if the route starts with /files, it has the other sidebar options
    router.addRoute({
      name: `${appInfo.id}-dashboard`,
      path: `/files/${appInfo.id}`,
      component: App,
      meta: {
        title: `${appInfo.name}`,
        authContext: 'user',
        patchCleanPath: true
      }
    })

    const menuItems = computed(
      () =>
        [
          {
            id: `com.github.cernbox.web-extensions.nav.${appInfo.id}`,
            type: 'sidebarNav',
            navItem: {
              icon: 'inbox',
              name: `${appInfo.name}`,
              activeFor: [{ path: `/files/${appInfo.id}` }],
              route: {
                path: `/files/${appInfo.id}`
              },
              isVisible: () => unref(router.currentRoute).path.startsWith('/files'),
              priority: 30
            }
          }
        ] satisfies SidebarNavExtension[]
    )

    return {
      appInfo,
      extensions: menuItems
    }
  }
})
