import { ApplicationInformation, AppWrapperRoute, defineWebApplication } from '@ownclouders/web-pkg'
import { useGettext } from 'vue3-gettext'
import translations from '../l10n/translations.json'
import App from './App.vue'

const applicationId = 'excalidraw'

export default defineWebApplication({
  setup() {
    const { $gettext } = useGettext()

    const routes = [
      {
        name: applicationId,
        path: '/:driveAliasAndItem(.*)?',
        component: AppWrapperRoute(App, { applicationId }),
        meta: {
          authContext: 'hybrid',
          patchCleanPath: true
        }
      }
    ]

    const appInfo: ApplicationInformation = {
      name: 'Excalidraw',
      id: applicationId,
      icon: 'pencil-ruler-2',
      color: '#6965DB',
      defaultExtension: 'excalidraw',
      extensions: [
        {
          extension: 'excalidraw',
          routeName: applicationId,
          newFileMenu: {
            menuTitle() {
              return $gettext('Excalidraw drawing')
            }
          }
        }
      ]
    }

    return {
      appInfo,
      routes,
      translations
    }
  }
})
