import App from './App.vue'

import { Resource, urlJoin } from '@ownclouders/web-client'
import {
  ApplicationFileExtension,
  ApplicationInformation,
  AppMenuItemExtension,
  AppWrapperRoute,
  defineWebApplication,
  useOpenEmptyEditor,
  useUserStore
} from '@ownclouders/web-pkg'
import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'

export default defineWebApplication({
  setup({ applicationConfig }) {
    const { $gettext } = useGettext()
    const userStore = useUserStore()
    const { openEmptyEditor } = useOpenEmptyEditor()

    const appId = 'codimd'

    const fileExtensions = () => {
      const extensions: ApplicationFileExtension[] = [
        {
          extension: 'zmd',
          label: () => $gettext('Markdown file with images')
        },
        {
          extension: 'md',
          label: () => $gettext('Markdown file')
        },
        {
          extension: 'markdown',
          label: () => $gettext('Markdown file')
        }
      ]

      const config = applicationConfig || {}
      extensions.push(...(config.extraExtensions || []).map((ext: string) => ({ extension: ext })))

      let primaryExtensions: string[] = config.primaryExtensions || ['md', 'zmd']

      if (typeof primaryExtensions === 'string') {
        primaryExtensions = [primaryExtensions]
      }

      return extensions.reduce<ApplicationFileExtension[]>((acc, extensionItem) => {
        const isPrimary = primaryExtensions.includes(extensionItem.extension)
        if (isPrimary) {
          extensionItem.newFileMenu = {
            menuTitle() {
              if (typeof extensionItem.label === 'function') {
                return extensionItem.label()
              }
              return extensionItem.label
            }
          }
        }
        acc.push(extensionItem)
        return acc
      }, [])
    }

    const routes = [
      {
        name: 'codimd-direct',
        path: '/',
        component: App,
        meta: {
          authContext: 'hybrid',
          patchCleanPath: true
        }
      },
      {
        name: 'codimd',
        path: '/:driveAliasAndItem(.*)?',
        component: AppWrapperRoute(App, {
          applicationId: appId
        }),
        meta: {
          authContext: 'hybrid',
          patchCleanPath: true
        }
      }
    ]

    const appInfo: ApplicationInformation = {
      name: $gettext('CodiMD'),
      id: appId,
      icon: 'markdown',
      color: '#2F2F2F',
      hasEditor: false,
      defaultExtension: 'md',
      meta: {
        fileSizeLimit: 2000000
      },
      extensions: fileExtensions().map((extensionItem) => {
        return {
          extension: extensionItem.extension,
          ...(Object.prototype.hasOwnProperty.call(extensionItem, 'newFileMenu') && {
            newFileMenu: extensionItem.newFileMenu
          })
        }
      })
    }

    const menuItems = computed<AppMenuItemExtension[]>(() => {
      const items: AppMenuItemExtension[] = []

      if (userStore.user) {
        items.push({
          id: `app.${appInfo.id}.menuItem`,
          type: 'appMenuItem',
          label: () => appInfo.name,
          color: appInfo.color,
          icon: appInfo.icon,
          priority: 20,
          path: urlJoin(appInfo.id),
          handler: () => openEmptyEditor(appInfo.id, appInfo.defaultExtension)
        })
      }

      return items
    })

    return {
      appInfo,
      routes,
      extensions: menuItems
    }
  }
})
