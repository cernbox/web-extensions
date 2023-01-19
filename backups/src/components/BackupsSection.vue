<template>
  <div>
    <h2 class="oc-px-m oc-py-s">
      {{ backupsTitle }}
    </h2>
    <app-bar
      v-if="route.name !== 'backups-restore-jobs'"
      :breadcrumbs="breadcrumbs"
      :has-sidebar-toggle="false"
    >
    </app-bar>
    <no-content-message
      v-if="!areResourcesLoading && !items.length"
      class="files-empty oc-flex-stretch"
      icon="group"
    >
      <template #message>
        <span>{{ emptyMessage }}</span>
      </template>
    </no-content-message>
    <app-loading-spinner v-if="areResourcesLoading" />
    <resource-table
      v-else
      v-model="selectedResourcesIds"
      class="files-table"
      :class="{ 'files-table-squashed': sideBarOpen }"
      :fields-displayed="displayedFields"
      sidebar-closed
      :resources="items"
      :are-resources-clickable="route.name !== 'backups-restore-jobs'"
      :target-route="resourceTargetLocation"
      :target-route-param-mapping="resourceTargetParamMapping"
      :target-route-query-mapping="resourceTargetQueryMapping"
      :header-position="fileListHeaderY"
      :sort-by="sortBy"
      :sort-dir="sortDir"
      :has-actions="route.name !== 'backups-restore-jobs'"
      @rowMounted="rowMounted"
      @sort="sortHandler"
    >
      <template #status="{ resource }">
        <div
          v-if="route.name !== 'backups-restore-jobs' && !topLevelRoute"
          :key="resource.getDomSelector() + restoreRunning(resource)"
          class="oc-text-nowrap oc-flex oc-flex-middle oc-flex-right"
        >
          <p v-if="restoreRunning(resource)" class="oc-flex oc-flex-middle">
            <app-loading-spinner size="xsmall"></app-loading-spinner>
            <span class="oc-pl-s">Restoring</span>
          </p>
          <oc-button
            v-else
            size="small"
            class="file-row-share-decline oc-ml-s"
            @click.stop="startRestore(resource)"
          >
            <oc-icon size="small" name="arrow-go-back" />
            <span>Restore</span>
          </oc-button>
        </div>
        <div
          v-else-if="route.name === 'backups-restore-jobs'"
          :key="resource.getDomSelector()"
          class="oc-text-nowrap oc-flex oc-flex-middle oc-flex-right"
        >
         
          <p v-if="resource.status === 1" class="oc-flex oc-flex-middle">
            <span class="oc-p-xs">Restore pending</span>
          </p>
          <p v-else-if="resource.status === 2" class="oc-flex oc-flex-middle">
            <app-loading-spinner size="xsmall"></app-loading-spinner>
            <span class="oc-p-xs">Restoring</span>
          </p>
          <div v-else-if="resource.status === 3">
            <p class="oc-flex oc-flex-middle restore-successfull oc-p-xs">
              <oc-button
                id="files-shared-with-me-show-all"
                appearance="raw"
                gap-size="xsmall"
                size="small"
                @click="seeRestore(resource)"
              >
                Restore available <oc-icon name="link" color="white" />
              </oc-button>
            </p>
          </div>

          <p v-else-if="resource.status === 4" class="oc-flex oc-flex-middle restore-failed">
            <oc-button
              id="files-shared-with-me-show-all"
              appearance="raw"
              gap-size="xsmall"
              size="small"
              ><span class="oc-p-xs restore-failed">Restore failed</span>
            </oc-button>
          </p>
        </div>
      </template>
    </resource-table>
  </div>
</template>

<script lang="ts">
import ResourceTable from 'web-app-files/src/components/FilesList/ResourceTable.vue'
import { computed, defineComponent } from 'vue'
import debounce from 'lodash-es/debounce'
import { VisibilityObserver } from 'web-pkg/src/observer'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { useStore } from 'web-pkg/src/composables'

import NoContentMessage from 'web-pkg/src/components/NoContentMessage.vue'
import { SortDir, useResourcesViewDefaults } from 'web-app-files/src/composables'
import AppLoadingSpinner from 'web-pkg/src/components/AppLoadingSpinner.vue'
import { useTask } from 'vue-concurrency'
import { extractDomSelector } from 'web-client/src/helpers/resource'
import { basename } from 'path'
import { Resource } from 'web-client'
// import { buildWebDavFilesPath } from '../../helpers/resources'
import { buildWebDavFilesPath} from 'web-app-files/src/helpers/resources'
import { buildResource } from 'web-client/src/helpers'
import { DavProperties } from 'web-client/src/webdav/constants'
import { clientService } from 'web-pkg/src/services'
import AppBar from 'web-app-files/src/components/AppBar/AppBar.vue'
import {
  breadcrumbsFromPath,
  concatBreadcrumbs
} from 'web-app-files/src/helpers/breadcrumbs'
import { createLocationSpaces } from 'web-app-files/src/router'

const visibilityObserver = new VisibilityObserver()

export default defineComponent({
  components: {
    ResourceTable,
    NoContentMessage,
    AppLoadingSpinner,
    AppBar
  },
  props: {
    title: {
      type: String,
      required: true
    },
    emptyMessage: {
      type: String,
      required: false,
      default: ''
    },
    items: {
      type: Array,
      required: true
    },
    sortBy: {
      type: String,
      required: false,
      default: undefined
    },
    sortDir: {
      type: String,
      required: false,
      default: undefined,
      validator: (value: string) => {
        return (
          value === undefined || [SortDir.Asc.toString(), SortDir.Desc.toString()].includes(value)
        )
      }
    },
    sortHandler: {
      type: Function,
      required: true
    },
    showMoreToggle: {
      type: Boolean,
      default: false
    },
    showMoreToggleCount: {
      type: Number,
      default: 3
    },
    resourceClickable: {
      type: Boolean,
      default: true
    },
    sideBarOpen: {
      type: Boolean,
      default: false
    },
    fileListHeaderY: {
      type: Number,
      default: 0
    },
    groupingSettings: {
      type: Object,
      required: false,
      default: null
    }
  },
  setup() {
    const store = useStore()
    const accessToken = store.getters['runtime/auth/accessToken']

    const { selectedResourcesIds } = useResourcesViewDefaults<Resource, any, any[]>()

    const fetchResources = async (client, path, properties, signal = null) => {
  const options = signal ? { signal } : {}
  try {
    return await client.files.list(path, 1, properties, options)
  } catch (error) {
    if (error.name === 'CanceledError') {
      throw error
    }
    console.error(error)
  }
} 

    /// //// My Backups
    const loadMyBackupsTask = useTask(function* (signal, ref) {
      store.commit('Files/CLEAR_CURRENT_FILES_LIST')

      const webDavFilesPath = ref.$route.params.item
        ? buildWebDavFilesPath(`${store.getters.user.id}`, ref.$route.params.item)
        : buildWebDavFilesPath(
            `${store.getters.user.id}/cback`,
            `/eos/user/${store.getters.user.id[0]}/${store.getters.user.id}`
          )
   

        
      const resourcesPromise = fetchResources(
        clientService.owncloudSdk,
        webDavFilesPath,
        DavProperties.Default,
        signal
      )

      const getResourcesAndCurrent = async (resourcePromise) => {
        let resources = await resourcePromise
        resources = resources.map(buildResource)
        resources.shift()
        return resources
      }

      const resources = yield getResourcesAndCurrent(resourcesPromise)

      /// // local test
      // const resources = [
      //   {
      //     id: 'cback!/eos/user/r/ragozina/2022-06-27T21:32:18+02:00',
      //     fileId: 'cback!/eos/user/r/ragozina/2022-06-27T21:32:18+02:00',
      //     storageId: 'cback',
      //     name: '2022-06-27T21:32:18+02:00',
      //     extension: '',
      //     path: '/cback/eos/user/r/ragozina/2022-06-27T21:32:18+02:00',
      //     webDavPath: '/files/ragozina/cback/eos/user/r/ragozina/2022-06-27T21:32:18+02:00',
      //     type: 'folder',
      //     isFolder: true,
      //     mdate: 'Mon, 27 Jun 2022 19:32:18 GMT',
      //     size: '104444000',
      //     indicators: [],
      //     permissions: '',
      //     starred: false,
      //     shareTypes: [],
      //     ownerId: 'ragozina',
      //     ownerDisplayName: 'Elizaveta Ragozina',
      //     canBeDeleted: () => false,
      //     canCreate: () => false,
      //     canDeny: () => false,
      //     canDownload: () => false,
      //     canRename: () => false,
      //     canShare: () => false,
      //     canUpload: () => false,
      //     isReceivedShare: () => false,
      //     status: true,
      //     getDomSelector: () =>
      //       extractDomSelector('cback!/eos/user/r/ragozina/2022-06-27T21:32:18+02:00')
      //   },
      //   {
      //     id: 'cback!/eos/user/r/ragozina/2022-07-20T21:22:34+02:00',
      //     fileId: 'cback!/eos/user/r/ragozina/2022-07-20T21:22:34+02:00',
      //     storageId: 'cback',
      //     name: '2022-07-20T21:22:34+02:00',
      //     extension: '',
      //     path: '/cback/eos/user/r/ragozina/2022-07-20T21:22:34+02:00',
      //     webDavPath: '/files/ragozina/cback/eos/user/r/ragozina/2022-07-20T21:22:34+02:00',
      //     type: 'folder',
      //     isFolder: true,
      //     mdate: 'Wed, 20 Jul 2022 19:22:34 GMT',
      //     size: '04444000',
      //     indicators: [],
      //     permissions: '',
      //     starred: false,
      //     shareTypes: [],
      //     ownerId: 'ragozina',
      //     ownerDisplayName: 'Elizaveta Ragozina',
      //     canBeDeleted: () => false,
      //     canCreate: () => false,
      //     canDeny: () => false,
      //     canDownload: () => false,
      //     canRename: () => false,
      //     canShare: () => false,
      //     canUpload: () => false,
      //     isReceivedShare: () => false,
      //     status: true,
      //     getDomSelector: () =>
      //       extractDomSelector('cback!/eos/user/r/ragozina/2022-07-20T21:22:34+02:00')
      //   }
      // ]

      resources.forEach((r) => {
        r.status = true
        r.getDomSelector = () => extractDomSelector(r.id)
      })

      store.commit('Files/LOAD_FILES', {
        currentFolder: null,
        files: resources
      })
    })

    /// /// Projects
    const loadProjectsBackupsTask = useTask(function* (signal, ref) {
      store.commit('Files/CLEAR_CURRENT_FILES_LIST')
      let resources

      if (!ref.$route.params?.item) {
        const headers = new Headers()
        headers.append('Authorization', 'Bearer ' + store.getters['runtime/auth/accessToken'])
        headers.append('X-Requested-With', 'XMLHttpRequest')
        const response = yield fetch('cback/backups', {
          method: 'GET',
          headers
        })
        if (!response.ok) {
          const message = `An error has occured: ${response.status}`
          throw new Error(message)
        }
        const data = yield response.json()
        data.shift()

        // local test
        // const data = [
        //   {
        //     Path: '/cback/eos/project/c/cernbox',
        //     Webdav: '/remote.php/dav/files/gdelmont/cback/eos/project/c/cernbox'
        //   },
        //   {
        //     Path: '/cback/eos/project/f/fdo',
        //     Webdav: '/remote.php/dav/files/gdelmont/cback/eos/project/f/fdo'
        //   },
        //   {
        //     Path: '/cback/eos/project/e/eos-winston',
        //     Webdav: '/remote.php/dav/files/gdelmont/cback/eos/project/e/eos-winston'
        //   },
        //   {
        //     Path: '/cback/eos/project/e/eos',
        //     Webdav: '/remote.php/dav/files/gdelmont/cback/eos/project/e/eos'
        //   },
        //   {
        //     Path: '/cback/eos/project/n/noafs',
        //     Webdav: '/remote.php/dav/files/gdelmont/cback/eos/project/n/noafs'
        //   },
        //   {
        //     Path: '/cback/eos/project/t/test',
        //     Webdav: '/remote.php/dav/files/gdelmont/cback/eos/project/t/test'
        //   }
        // ]

        const recievedResources = []

        try {
          if (data?.length) {
            data.forEach((r, i) => {
              recievedResources.push({
                id: i + r.path,
                fileId: i + r.path,
                storageId: 'cback',
                name: basename(r.path),
                extension: '',
                path: r.path,
                webDavPath: r.webdav,
                type: 'folder',
                isFolder: true,
                indicators: [],
                permissions: '',
                starred: false,
                shareTypes: [],
                canBeDeleted: () => false,
                canCreate: () => false,
                canDeny: () => false,
                canDownload: () => false,
                canRename: () => false,
                canShare: () => false,
                canUpload: () => false,
                isReceivedShare: () => false,
                status: true
              })
            })

            resources = recievedResources
            resources.forEach((r) => (r.getDomSelector = () => extractDomSelector(r.id)))
          }
        } catch (error) {
          console.error(error)
          // expected output: ReferenceError: nonExistentFunction is not defined
          // Note - error messages will vary depending on browser
        }
      } else {
        const webDavFilesPath = buildWebDavFilesPath(
          `${store.getters.user.id}/cback`,
          ref.$route.params.item
        )

        const resourcesPromise = fetchResources(
          clientService.owncloudSdk,
          webDavFilesPath,
          DavProperties.Default,
          signal
        )

        const getResourcesAndCurrent = async (resourcePromise) => {
          let resources = await resourcePromise
          resources.shift()
          resources = resources.map(buildResource)
          return resources
        }

        resources = yield getResourcesAndCurrent(resourcesPromise)
        resources.forEach((r) => {
          r.status = true
          r.getDomSelector = () => extractDomSelector(r.id)
        })
      }

      store.commit('Files/LOAD_FILES', {
        currentFolder: null,
        files: resources
      })
    })

    const getRestores = async () => {
      const headers = new Headers()
      headers.append('Authorization', 'Bearer ' + accessToken)
      headers.append('X-Requested-With', 'XMLHttpRequest')
      const response = await fetch('/cback/restores', {
        method: 'GET',
        headers
      })
      if (!response.ok) {
        const message = `An error has occured: ${response.status}`
        throw new Error(message)
      }
      const data = await response.json()
      // const data = [
      //   {
      //     id: 23,
      //     path: '/eos/user/g/gdelmont/ssd',
      //     destination: '/cback/eos/user/g/gdelmont/__restored_11_23_2022__10_38_04__',
      //     status: 3
      //   },
      //   {
      //     id: 24,
      //     path: '/eos/user/g/gdelmont/ssd',
      //     destination: '/cback/eos/user/g/gdelmont/__restored_11_23_2022__10_38_04__',
      //     status: 4
      //   }
      // ]
      return data || []
    }

    const loadRestoresTask = useTask(function* (signal, ref) {
      store.commit('Files/CLEAR_CURRENT_FILES_LIST')
      let resources

      const data = yield getRestores()

      try {
        const recievedResources = []
        if (data?.length) {
          data.forEach((r, i) => {
            recievedResources.push({
              id: r.id + r.path,
              fileId: r.id + r.path,
              storageId: 'cback',
              name: basename(r.path),
              extension: '',
              path: r.path,
              type: 'file',
              isFolder: false,
              indicators: [],
              permissions: '',
              starred: false,
              shareTypes: [],
              canBeDeleted: () => false,
              canCreate: () => false,
              canDeny: () => false,
              canDownload: () => false,
              canRename: () => false,
              canShare: () => false,
              canUpload: () => false,
              isReceivedShare: () => false,
              status: r.status,
              destination: r.destination
            })
          })

          resources = recievedResources
          resources.forEach((r) => (r.getDomSelector = () => extractDomSelector(r.id)))
          store.commit('Files/LOAD_FILES', {
            currentFolder: null,
            files: resources
          })
        }
      } catch (error) {
        console.error(error)
        // expected output: ReferenceError: nonExistentFunction is not defined
        // Note - error messages will vary depending on browser
      }

      // local test
      // const data = [
      //   {
      //     id: 23,
      //     path: '/eos/user/g/gdelmont/ssd',
      //     destination: '/cback/eos/user/g/gdelmont/__restored_11_23_2022__10_38_04__'
      //     status: 4
      //   }
      // ]

      // const recievedResources = []

      // if (data?.length) {
      //   data.forEach((r, i) => {
      //     recievedResources.push({
      //       id: r.id + r.path,
      //       fileId: r.id + r.path,
      //       storageId: 'cback',
      //       name: basename(r.path),
      //       extension: '',
      //       path: r.destination.path,
      //       webDavPath: r.destination.webdav,
      //       type: 'folder',
      //       isFolder: true,
      //       indicators: [],
      //       permissions: '',
      //       starred: false,
      //       shareTypes: [],
      //       canBeDeleted: () => false,
      //       canCreate: () => false,
      //       canDeny: () => false,
      //       canDownload: () => false,
      //       canRename: () => false,
      //       canShare: () => false,
      //       canUpload: () => false,
      //       isReceivedShare: () => false,
      //       status: r.status
      //     })
      //   })
      //   console.log('recievedResources', recievedResources)

      //   resources = recievedResources
      //   resources.forEach((r) => (r.getDomSelector = () => extractDomSelector(r.id)))
      //   store.commit('Files/LOAD_FILES', {
      //     currentFolder: null,
      //     files: resources
      //   })
      // }
    })

    const areMyBackupsLoading = computed(() => {
      return loadMyBackupsTask.isRunning || !loadMyBackupsTask.last
    })

    const areProjectBackupsLoading = computed(() => {
      return loadProjectsBackupsTask.isRunning || !loadProjectsBackupsTask.last
    })

    const areRestoresLoading = computed(() => {
      return loadRestoresTask.isRunning || !loadRestoresTask.last
    })

    const resourceTargetLocationMyBackups = computed(() => {
      return { name: 'backups-me', params: { storageId: store.getters.user.id } }
    })
    const resourceTargetLocationProjectBackups = computed(() => {
      return { name: 'backups-projects', params: { storageId: store.getters.user.id } }
    })
    const resourceTargetParamMapping = computed(() => undefined)
    const resourceTargetQueryMapping = computed(() => undefined)

    return {
      loadMyBackupsTask,
      loadProjectsBackupsTask,
      loadRestoresTask,
      getRestores,
      areMyBackupsLoading,
      areRestoresLoading,
      areProjectBackupsLoading,
      selectedResourcesIds,
      resourceTargetLocationMyBackups,
      resourceTargetLocationProjectBackups,
      resourceTargetParamMapping,
      resourceTargetQueryMapping
    }
  },

  data: () => ({
    runningRestores: [],
    modal: true
  }),
  computed: {
    ...mapGetters(['configuration']),
    route(){
return this.$route
    },
    displayedFields() {
      return this.topLevelRoute && this.$route.name !== 'backups-restore-jobs'
        ? ['name', 'mdate']
        : ['name', 'mdate', 'status']
    },
    topLevelRoute() {
      return !this.$route.params.item
    },
    backupsTitle() {
      return this.$route.name === 'backups-me'
        ? this.$gettext('My backups')
        : this.$route.name === 'backups-projects'
        ? this.$gettext('Project backups')
        : this.$gettext('Restore jobs')
    },
    areResourcesLoading() {
      if (this.$route.name === 'backups-me') {
        return this.areMyBackupsLoading
      }
      if (this.$route.name === 'backups-projects') {
        return this.areProjectBackupsLoading
      }

      if (this.$route.name === 'backups-restore-jobs') {
        return this.areRestoresLoading
      }
      return false
    },
    breadcrumbs() {
      return concatBreadcrumbs(
        { text: this.$route.name, to: { path: this.$route.path } },
        ...breadcrumbsFromPath(this.$route, this.$route.params.item)
      )
    },
    resourceTargetLocation() {
      return this.$route.name === 'backups-projects'
        ? this.resourceTargetLocationProjectBackups
        : this.$route.name === 'backups-me'
        ? this.resourceTargetLocationMyBackups
        : null
    }
  },
  watch: {
    $route: {
      handler: async function (to, from) {
        await this.loadResourcesTask()
      },
      immediate: true
    }
  },

  beforeDestroy() {
    visibilityObserver.disconnect()
  },
  async created() {
    this.loadResourcesTask()

    this.runningRestores = await this.getRestores()
    this.restoresInterval = await setInterval(async () => {
      this.runningRestores = await this.getRestores()
    }, 60 * 1000)
  },
  destoyed() {
    clearInterval(this.restoresInterval)
  },
  methods: {
    ...mapActions('Files', ['loadIndicators', 'loadPreview', 'loadAvatars']),
    ...mapMutations('Files', ['LOAD_FILES', 'CLEAR_CURRENT_FILES_LIST']),
    ...mapActions(['showMessage']),

    seeRestore(r) {
      this.$router.push(
        createLocationSpaces('files-spaces-personal', {
          params: { item: r.destination }
        })
      )
    },

    async restore_backup_trigger({ resources }) {
      const url = `/cback/restores?path=${encodeURIComponent(resources[0].path)}`
      const accessToken = this.$store.getters['runtime/auth/accessToken']

      const headers = new Headers()
      headers.append('Authorization', 'Bearer ' + accessToken)
      headers.append('X-Requested-With', 'XMLHttpRequest')
      const response = await fetch(url, {
        method: 'POST',
        headers
      })

      if (response.status !== 200) {
        this.showMessage({
          title: this.$gettext('An error occurred'),
          desc: this.$gettext('Backup restore could not be initiated'),
          status: 'danger'
        })
        return false
      } else {
        this.showMessage({
          title: this.$gettext('Success'),
          desc: this.$gettext('Backup restore was initiated'),
          status: 'success'
        })
        return true
      }
    },
    rowMounted(resource, component) {
      const debounced = debounce(({ unobserve }) => {
        unobserve()
        this.loadAvatars({ resource })
      }, 250)
      visibilityObserver.observe(component.$el, {
        onEnter: debounced,
        onExit: debounced.cancel
      })
    },
    loadResourcesTask() {
      if (this.$route.name === 'backups-me') {
        this.loadProjectsBackupsTask.cancelAll()
        this.loadRestoresTask.cancelAll()
        this.loadMyBackupsTask.perform(this)
      }
      if (this.$route.name === 'backups-projects') {
        this.loadMyBackupsTask.cancelAll()
        this.loadRestoresTask.cancelAll()
        this.loadProjectsBackupsTask.perform(this)
      }

      if (this.$route.name === 'backups-restore-jobs') {
        this.loadMyBackupsTask.cancelAll()
        this.loadProjectsBackupsTask.cancelAll()
        this.loadRestoresTask.perform(this)
      }
    },
    resStatus(r) {
      return r.status
    },
    restoreRunning(resource) {
      return this.runningRestores.some((e) => {
        return e.path === resource.path
      })
    },
    async startRestore(resource) {
      const restoreStarted = await this.restore_backup_trigger({ resources: [resource] })
      if (restoreStarted) {
        this.runningRestores.push({ path: resource.path, status: 2 })
        // this.runningRestores = await this.checkBackupsStatus()
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.files-empty {
  height: auto;
}

.restore-failed {
  background-color: var(--oc-color-swatch-danger-default);
  color: white !important;
  cursor: default;
}

.restore-successfull {
  background-color: var(--oc-color-swatch-success-default);
  button {
    color: white;
    text-decoration: underline;
  }
}
</style>
