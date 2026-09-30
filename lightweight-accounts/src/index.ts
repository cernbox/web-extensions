import { useGettext } from 'vue3-gettext'
import { defineWebApplication, useRouter, useUserStore, useSpacesStore } from '@ownclouders/web-pkg'
import { watch } from 'vue'
import translations from '../l10n/translations.json'
import { extensions } from './extensions'
import { useHomeShare } from './homeShare'
import App from './components/App.vue'

export default defineWebApplication({
  setup(args) {
    const { $gettext } = useGettext()
    const userStore = useUserStore()
    const spacesStore = useSpacesStore()
    const router = useRouter()
    const { findHomeShare, createHomeShareLocation } = useHomeShare()
    // the account owning the lightweight homes; without it there are no homes to look for
    const homeShareOwner: string = args.applicationConfig?.homeShareOwner

    const waitForSpaces = () => {
      if (spacesStore.spacesInitialized) {
        return Promise.resolve()
      }
      return new Promise<void>((resolve) => {
        const stop = watch(
          () => spacesStore.spacesInitialized,
          (spacesInitialized) => {
            if (spacesInitialized) {
              stop()
              resolve()
            }
          }
        )
      })
    }

    router.addRoute({
      name: 'lightweight-accounts-home',
      path: '/files/lightweight-accounts-home',
      component: App,
      meta: { entryPoint: true, authContext: 'user' },
      beforeEnter: async () => {
        await waitForSpaces()

        if (spacesStore.personalSpace) {
          return { path: '/files' }
        }

        if (homeShareOwner) {
          try {
            const driveItem = await findHomeShare({
              username: userStore.user.onPremisesSamAccountName,
              owner: homeShareOwner
            })
            if (driveItem) {
              return await createHomeShareLocation(driveItem)
            }
          } catch (e) {
            console.error('lightweight-accounts: could not look up the home share', e)
          }
        }

        return true
      }
    })

    return {
      appInfo: {
        name: $gettext('Lightweight accounts home'),
        id: 'lightweight-accounts-home'
      },
      extensions: extensions(args),
      translations
    }
  }
})
