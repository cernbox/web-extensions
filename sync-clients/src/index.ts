import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'
import { defineWebApplication, useRouter } from '@ownclouders/web-pkg'
import type { ApplicationSetupOptions, CustomComponentExtension } from '@ownclouders/web-pkg'
import { setMockMode } from './api'
import ConnectedClientsSection from './components/ConnectedClientsSection.vue'
import LoginFlowPage from './views/LoginFlowPage.vue'
import translations from '../l10n/translations.json'

const appInfo = {
  id: 'sync-clients',
  name: 'Sync clients'
}

export default defineWebApplication({
  setup({ applicationConfig }: ApplicationSetupOptions) {
    const { $gettext } = useGettext()
    const router = useRouter()

    setMockMode(applicationConfig?.mock === true)

    // Registered here rather than via the `routes` key: the runtime prefixes those with
    // `/<appId>` (web-runtime/src/container/api.ts), and the sync client sends the browser to
    // exactly `/login-flow/<logintoken>`.
    //
    // Deliberately unnamed. useLayout falls back to the plain, full-page layout for any route
    // without a name, and its list of named plain-layout routes is hardcoded to runtime pages, so
    // this is the only way an external app can drop the top bar and sidebar. Nothing routes to
    // this page by name, and the document title comes from meta.title.
    router.addRoute({
      path: '/login-flow/:logintoken',
      component: LoginFlowPage,
      meta: { title: $gettext('Connect a device'), authContext: 'user' }
    })

    return {
      appInfo,
      translations,
      extensions: computed(
        () =>
          [
            {
              id: 'com.github.cernbox.web-extensions.sync-clients.account-section',
              type: 'customComponent',
              // required: an extension without extensionPointIds matches every extension point
              // of its type, so omitting this also renders into the global progress bar
              extensionPointIds: ['app.runtime.account.sections'],
              content: ConnectedClientsSection
            }
          ] satisfies CustomComponentExtension[]
      )
    }
  }
})
