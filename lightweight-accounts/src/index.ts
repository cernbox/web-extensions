import { useGettext } from 'vue3-gettext'
import { defineWebApplication, useRouter, useStore } from '@ownclouders/web-pkg'
import { User } from '@ownclouders/web-client'
import translations from '../l10n/translations.json'
import { extensions } from './extensions'
import App from './components/App.vue'

export default defineWebApplication({
  setup(args) {
    const { $gettext } = useGettext()
    const store = useStore()
    const router = useRouter()

    router.addRoute({
      name: 'lightweight-accounts-home',
      path: '/files/lightweight-accounts-home',
      component: App,
      meta: { entryPoint: true, authContext: 'user' },
      beforeEnter: (to, from, next) => {
        const user = store.getters.user as User
        if (user.role?.name === 'user-light') {
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
