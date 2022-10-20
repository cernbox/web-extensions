<template>
  <main>
    <div class="oc-position-center">
      <oc-spinner size="xlarge" />
      <p v-translate class="oc-invisible">Loading app</p>
    </div>
  </main>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Redirector',
  computed: {
    ...mapGetters(['user'])
  },

  async mounted() {
    /*

    index.php/apps/files/?dir=/&view=favorites -> favorites
    index.php/apps/files/?dir=/&view=sharingin -> shared with me
    index.php/apps/files/?dir=/&view=sharingout -> shared by others
    index.php/apps/files/?dir=/&view=sharinglinks - shared by link
    index.php/apps/files/?dir=/&view=projectspaces-personal -> projects
    index.php/apps/files/?dir=/&view=eostrashbin -> trasbin


    index.php/apps/files/?dir=/my/path& -> /eos/user/[letter]/[username]/my/path


    index.php/apps/files?dir=/__myshares/mysharename%20(id%3A4235)/and/path -> [share path]/and/path
    index.php/apps/files?dir=/__myprojects/myproject/and/path -> /eos/project/[letter]/[project]/and/path

    index.php/s/ASFIAHSUAHS?path=%2Fand%2Fpath -> [token]/and/path

    */

    const isPublic = this.$route.name.includes('public')
    const view = this.$route.query.view
    const dir = this.$route.query.dir || ''
    const first = dir?.split('/').filter(Boolean)[0]

    if (isPublic) {
      console.log('Redirecting old url to public link')
      this.$router.push({
        name: 'files-public-files',
        params: {
          item: `${this.$route.params.token}${this.$route.query.path || ''}`
        }
      })
    } else {
      switch (view) {
        case 'favorites':
          console.log('Redirecting old url to favorites')
          this.$router.push({
            name: 'files-common-favorites'
          })
          break

        case 'sharingin':
          console.log('Redirecting old url to shared with me')
          this.$router.push({
            name: 'files-shares-with-me'
          })
          break

        case 'sharingout':
          console.log('Redirecting old url to shared by me')
          this.$router.push({
            name: 'files-shares-with-others'
          })
          break

        case 'sharinglinks':
          console.log('Redirecting old url to shared by link')
          this.$router.push({
            name: 'files-shares-via-link'
          })
          break

        case 'projectspaces-personal':
          console.log('Redirecting old url to projects view')
          // TODO change after moving to spaces
          this.$router.push({
            name: 'files-common-projects'
          })
          break

        case 'eostrashbin':
          console.log('Redirecting old url to trashbin')
          this.$router.push({
            name: 'files-trash-personal'
          })
          break

        default:
          switch (first) {
            case '__myshares': {
              console.log('Redirecting old url to a share')
              const path = await this.getSharePath(dir, this.$client)
              this.$router.push({
                name: path ? 'files-spaces-personal' : 'files-shares-with-me',
                params: {
                  storageId: this.user.id,
                  item: path
                }
              })
              break
            }

            case '__myprojects':
              console.log('Redirecting old url a project')
              this.$router.push({
                name: 'files-spaces-personal',
                params: {
                  storageId: this.user.id,
                  item: this.getProjectPath(dir)
                }
              })
              break

            default:
              console.log('Redirecting old url to home')
              this.$router.push({
                name: 'files-spaces-personal',
                params: {
                  storageId: this.user.id,
                  item: this.getHomePath(this.user.id, dir)
                }
              })
              break
          }
          break
      }
    }
  },
  methods: {
    getHomePath: (user, dir) => {
      return `/eos/user/${user[0]}/${user}${dir}`
    },

    getProjectPath: (dir) => {
      const elems = dir.split('/').filter(Boolean)
      const project = elems[1]
      const path = elems.slice(2).join('/')
      return `/eos/project/${project[0]}/${project}/${path}`
    },

    getSharePath: async (dir, client) => {
      const elems = dir.split('/').filter(Boolean)
      const match = elems[1]?.match('id:[a-zA-z0-9-]*')

      if (!match) return

      const id = match[0]?.slice(3)

      if (!id) return

      const shares = await client.shares.getShares('', {
        state: 'all',
        include_tags: false,
        shared_with_me: true
      })

      const share = shares.find((share) => share.shareInfo.id === id)
      return share ? `${share.shareInfo.path}/${elems.slice(2).join('/')}` : null
    }
  }
}
</script>
