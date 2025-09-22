import { useGettext } from 'vue3-gettext'
import { defineWebApplication, useRouter, useUserStore, useSpacesStore } from '@ownclouders/web-pkg'
import { watch } from 'vue'
import { isPersonalSpaceResource } from '@ownclouders/web-client'
import translations from '../l10n/translations.json'
import { extensions } from './extensions'
import App from './components/App.vue'

export default defineWebApplication({
  setup(args) {
    const { $gettext } = useGettext()
    const userStore = useUserStore()
    const spacesStore = useSpacesStore()
    const router = useRouter()

    router.addRoute({
      name: 'lightweight-accounts-home',
      path: '/files/lightweight-accounts-home',
      component: App,
      meta: { entryPoint: true, authContext: 'user' },
      beforeEnter: (to, from, next) => {
        if (spacesStore.spacesInitialized) {
          const userHasPersonalSpace = !!spacesStore.spaces.find(
            (drive) => isPersonalSpaceResource(drive) && drive.isOwner(userStore.user)
          )
          if (!userHasPersonalSpace) {
            next()
          }
          next({ path: '/files' })
        }
        watch(
          () => spacesStore.spacesInitialized,
          (spacesInitialized) => {
            if (spacesInitialized) {
              const userHasPersonalSpace = !!spacesStore.spaces.find(
                (drive) => isPersonalSpaceResource(drive) && drive.isOwner(userStore.user)
              )
              if (!userHasPersonalSpace) {
                next()
              }
              next({ path: '/files' })
            }
          }
        )
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
