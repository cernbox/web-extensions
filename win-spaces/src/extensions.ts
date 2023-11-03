import { computed } from 'vue'
import { ApplicationSetupOptions, Extension } from '@ownclouders/web-pkg'

export const extensions = ({ applicationConfig }: ApplicationSetupOptions) => {
  return computed(
    () =>
      [
        {
          id: 'com.github.cernbox.web-extensions.nav.win',
          type: 'sidebarNav',
          scopes: ['files'],
          navItem: {
            name: () => 'Win spaces',
            icon: 'layout-grid',
            isActive: () => true,
            enabled(capabilities) {
              return capabilities.group_based?.capabilities?.includes('cephfs-mount') || false
            },
            route: {
              path: `/files/spaces/winspaces`
            },
            activeFor: [{ path: `/files/spaces/winspaces` }],
            priority: 41
          }
        }
      ] satisfies Extension[]
  )
}
