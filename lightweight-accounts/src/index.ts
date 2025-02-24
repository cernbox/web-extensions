import { useGettext } from 'vue3-gettext'
import { defineWebApplication, useRouter, useUserStore } from '@ownclouders/web-pkg'
import translations from '../l10n/translations.json'
import { extensions } from './extensions'
import App from './components/App.vue'

export default defineWebApplication({
  setup(args) {
    const { $gettext } = useGettext()
    const userStore = useUserStore()
    const router = useRouter()

    router.addRoute({
      name: 'lightweight-accounts-home',
      path: '/files/lightweight-accounts-home',
      component: App,
      meta: { entryPoint: true, authContext: 'user' },
      beforeEnter: (to, from, next) => {
        const user = userStore.user
        const roles = user.appRoleAssignments as any[] // types don't match
        if (roles?.some((role) => role.name === 'user-light')) {
          next()
        }
        next({ path: '/files' })
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
