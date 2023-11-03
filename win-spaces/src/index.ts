import { defineWebApplication } from '@ownclouders/web-pkg'
import { extensions } from './extensions'

export default defineWebApplication({
  setup(args) {
    return {
      appInfo: {
        name: 'Win Spaces',
        id: 'win-spaces'
      },
      extensions: extensions(args)
    }
  }
})
