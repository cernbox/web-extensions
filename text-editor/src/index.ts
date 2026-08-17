import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'
import { urlJoin } from '@ownclouders/web-client'
import {
  AppMenuItemExtension,
  ApplicationFileExtension,
  ApplicationInformation,
  AppWrapperRoute,
  defineWebApplication,
  useOpenEmptyEditor,
  useUserStore
} from '@ownclouders/web-pkg'
import translations from '../l10n/translations.json'
import App from './App.vue'
import { defaultPrimaryExtensions, fileTypes } from './helpers/fileTypes'

/**
 * Claims the `text-editor` id so this replaces the built-in app rather than sitting beside it.
 * Remove `text-editor` from the `apps` list in config.json when loading this as an external app,
 * or both register the same extensions and the app picker offers the file twice.
 */
const applicationId = 'text-editor'

export default defineWebApplication({
  setup({ applicationConfig }) {
    const { $gettext } = useGettext()
    const userStore = useUserStore()
    const { openEmptyEditor } = useOpenEmptyEditor()

    const config = applicationConfig || {}

    const buildFileExtensions = (): ApplicationFileExtension[] => {
      let primary: string | string[] = config.primaryExtensions || defaultPrimaryExtensions
      if (typeof primary === 'string') {
        primary = [primary]
      }

      const known = Object.entries(fileTypes).map(([extension, definition]) => ({
        extension,
        label: definition.label
      }))

      // Extensions the deployment adds are opened as code with no grammar, which is still an
      // improvement on the built-in app: they at least get line numbers and no markdown mangling.
      const extra = (config.extraExtensions || []).map((extension: string) => ({ extension }))

      return [...known, ...extra].map(({ extension, label }) => ({
        extension,
        ...(label && { label: () => $gettext(label) }),
        ...(primary.includes(extension) &&
          label && {
            newFileMenu: {
              menuTitle: () => $gettext(label)
            }
          })
      }))
    }

    const routes = [
      {
        path: '/:driveAliasAndItem(.*)?',
        component: AppWrapperRoute(App, { applicationId }),
        name: applicationId,
        meta: {
          authContext: 'hybrid',
          title: $gettext('Text Editor'),
          patchCleanPath: true
        }
      }
    ]

    const appInfo: ApplicationInformation = {
      name: $gettext('Text Editor'),
      id: applicationId,
      icon: 'file-text',
      color: '#0D856F',
      defaultExtension: 'txt',
      meta: {
        // The built-in app capped this at 2 MB, which is small for the logs and source files
        // people routinely open here. CodeMirror handles this size without trouble.
        fileSizeLimit: config.fileSizeLimit ?? 50000000
      },
      extensions: buildFileExtensions().map(({ extension, newFileMenu }) => ({
        extension,
        ...(newFileMenu && { newFileMenu })
      }))
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
      translations,
      extensions: menuItems
    }
  }
})
