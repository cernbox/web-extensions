import { h } from 'vue'
import { useGettext } from 'vue3-gettext'
import { defineWebApplication, usePortalTarget } from '@ownclouders/web-pkg'
import DirectLink from './components/DirectLink.vue'
import PathDetails from './components/PathDetails.vue'
import translations from '../l10n/translations.json'

export default defineWebApplication({
  setup(args) {
    const appId = 'cernbox-integration'
    const { $gettext } = useGettext()
    const { registerPortal } = usePortalTarget()

    registerPortal({
      to: 'app.files.sidebar.sharing.shared-with.top',
      from: appId,
      content: (slots) => [h(DirectLink, slots)]
    })
    registerPortal({
      to: 'app.files.sidebar.file.details.table',
      from: appId,
      content: (slots) => [h(PathDetails, slots)]
    })
    registerPortal({
      to: 'app.files.sidebar.space.details.table',
      from: appId,
      content: (slots) => [h(PathDetails, slots)]
    })

    return {
      appInfo: {
        name: $gettext('CERNBox Integration'),
        id: appId
      },
      translations
    }
  }
})
