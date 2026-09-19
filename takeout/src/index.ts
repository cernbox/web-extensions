import { computed } from 'vue'
import { defineWebApplication } from '@ownclouders/web-pkg'
import type { CustomComponentExtension } from '@ownclouders/web-pkg'
import TakeoutSection from './components/TakeoutSection.vue'
import translations from '../l10n/translations.json'

const appInfo = {
  id: 'takeout',
  name: 'Takeout'
}

export default defineWebApplication({
  // no per-deployment config today
  setup() {
    return {
      appInfo,
      translations,
      extensions: computed(
        () =>
          [
            {
              id: 'com.github.cernbox.web-extensions.takeout.account-section',
              type: 'customComponent',
              // required: an extension without extensionPointIds matches every extension point
              // of its type, so omitting this also renders into the global progress bar
              extensionPointIds: ['app.runtime.account.sections'],
              content: TakeoutSection
            }
          ] satisfies CustomComponentExtension[]
      )
    }
  }
})
