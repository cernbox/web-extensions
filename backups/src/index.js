import translations from '../l10n/translations'
import Backups from './views/Backups.vue'

// just a dummy function to trick gettext tools
function $gettext(msg) {
  return msg
}

const appInfo = {
  name: $gettext('Backups'),
  id: 'backups',
  icon: 'arrow-go-back',
  isFileEditor: false
}

const routes = [
  {
    path: '/',
    redirect: () => {
      return { name: 'backups-restore-jobs' }
    }
  },
  {
    path: '/my-backups',
    name: 'backups',
    component: Backups,
    meta: {
      title: $gettext('My backups')
    },
    children: [
      {
        path: ':item*',
        name: 'backups-me',
        component: Backups,
        meta: {
          patchCleanPath: true,
          title: $gettext('Backup')
        }
      }
    ]
  },
  {
    path: '/project-backups',
    name: 'backup-projects',
    component: Backups,
    meta: {
      title: $gettext('Projects backups')
    },
    children: [
      {
        path: ':item*',
        name: 'backups-projects',
        component: Backups,
        meta: {
          patchCleanPath: true,
          title: $gettext('Backup')
        }
      }
    ]
  },
  {
    path: '/restore-jobs',
    name: 'backups-restore-jobs',
    component: Backups,
    meta: {
      title: $gettext('Restore jobs')
    }
  }
]

const navItems = [
  {
    name: $gettext('Restore jobs'),
    icon: 'server',
    route: {
      path: `/${appInfo.id}/restore-jobs?`
    },
    enabled: () => {
      return true
    }
  },
  {
    name: $gettext('My backups'),
    icon: 'arrow-go-back',
    route: {
      path: `/${appInfo.id}/my-backups?`
    },
    enabled: () => {
      return true
    }
  },
  {
    name: $gettext('Project backups'),
    icon: 'arrow-go-back',
    route: {
      path: `/${appInfo.id}/project-backups?`
    },
    enabled: () => {
      return true
    }
  }
]

export default {
  appInfo,
  routes,
  translations,
  navItems
}
