import { useGettext } from 'vue3-gettext'
import { defineWebApplication } from '@ownclouders/web-pkg'
import translations from '../l10n/translations.json'
import { extensions } from './extensions'

export default defineWebApplication({
  setup(args) {
    const { $gettext } = useGettext()
    return {
      appInfo: {
        name: $gettext('Search in folder'),
        id: 'search-in-folder'
      },
      extensions: extensions(args),
      translations
    }
  }
})
