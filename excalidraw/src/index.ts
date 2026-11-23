import { ApplicationInformation, AppWrapperRoute, defineWebApplication } from '@ownclouders/web-pkg'
import { useGettext } from 'vue3-gettext'
import translations from '../l10n/translations.json'
import App from './App.vue'
import { sceneAdapter } from './collab/scene'

const applicationId = 'excalidraw'

// CERNBox's AppWrapper shares the drawing through the Yjs server. The published web-pkg types do
// not know the `yjs` option yet, hence a separate object rather than a literal in the call.
const routeOptions = { applicationId, yjs: { makeAdapter: () => sceneAdapter } }

export default defineWebApplication({
  setup() {
    const { $gettext } = useGettext()

    const routes = [
      {
        name: applicationId,
        path: '/:driveAliasAndItem(.*)?',
        component: AppWrapperRoute(App, routeOptions),
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
