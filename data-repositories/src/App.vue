<template>
  <main>
    <div class="oc-flex-column">
      <app-bar
        :breadcrumbs="breadcrumbs"
        :has-view-options="true"
        :has-hidden-files="false"
        :has-file-extensions="false"
        :has-pagination="true"
      />
      <app-loading-spinner v-if="areResourcesLoading" />
      <template v-else>
        <div
          class="shared-with-me-filters oc-flex oc-flex-between oc-flex-wrap oc-flex-bottom oc-mx-m oc-mb-m"
        >
          <div class="oc-flex oc-flex-wrap">
            <div class="oc-mr-m oc-flex oc-flex-middle">
              <oc-icon name="filter-2" class="oc-mr-xs" />
              <span v-text="$gettext('Filter:')" />
            </div>
            <item-filter-inline
              class="share-visibility-filter"
              filter-name="share-visibility"
              :filter-options="visibilityOptions"
              @toggle-filter="setAreHiddenFilesShown"
            />
          </div>
        </div>
        <repositories-section
          :items="items"
          :title="repositoriesSectionTitle"
          :sort-by="sortBy"
          :sort-dir="sortDir"
          :sort-handler="handleSort"
          :empty-message="repositoriesSectionEmptyMessage"
          :grouping-settings="groupingSettings"
        />
      </template>
    </div>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, unref } from 'vue'
import { useGettext } from 'vue3-gettext'
import {
  AppBar,
  AppLoadingSpinner,
  InlineFilterOption,
  ItemFilterInline,
  SortDir,
  SortField,
  useClientService,
  useGroupingSettings,
  usePagination,
  useResourcesStore,
  useSort
} from '@ownclouders/web-pkg'
import RepositoriesSection from './components/RepositoriesSection.vue'
import { IncomingEmbeddedShareResource, loadResources } from './functions'

/*
This task entails creating the extension for data repositories (similar to the sciencemesh extension)
which is to be used for the EOSC Data Commons when handling OCM shares with the embedded protocol.
Should include the following:
 A table similar to files/shares where the user can see their RO-Crate shares.

  - For shares in `pending` state:
    - Button to "Process Share"
    - Should query the process share endpoint (`/sciencemesh`)
      - Button to "Hide share"
      - Should query the hide share endpoint, same as other OCM shares.
  - For shares in `accepted` state
    - Link to browse to the target folder
    - Button to "Hide share
    - Icon to "reprocess" share:
      - Should reporcess the share with a potentially new destination -> call same endpoint
  - For share in `hidden state`:
    - Same as normal shares: unhide
    - Other actions if easy from the frontend point of view.

*/
export default defineComponent({
  name: 'DataRepositories',
  components: {
    AppBar,
    AppLoadingSpinner,
    ItemFilterInline,
    RepositoriesSection
  },
  props: {},

  setup() {
    const clientService = useClientService()
    const resourcesStore = useResourcesStore()

    const { $gettext } = useGettext()
    const breadcrumbs = computed(() => [
      {
        text: $gettext('Data Repositories'),
        onClick: () => {
          loadResources(clientService)
        }
      }
    ])
    const visibilityOptions = computed(() => [
      { name: 'visible', label: $gettext('Shares') },
      { name: 'hidden', label: $gettext('Hidden Shares') }
    ])

    const areHiddenFilesShown = ref(false)
    const repositoriesSectionTitle = computed(() => {
      return unref(areHiddenFilesShown) ? $gettext('Hidden Shares') : $gettext('Shares')
    })
    const repositoriesSectionEmptyMessage = computed(() => {
      return unref(areHiddenFilesShown) ? $gettext('No hidden shares') : $gettext('No shares')
    })
    const setAreHiddenFilesShown = (value: InlineFilterOption) => {
      areHiddenFilesShown.value = value.name === 'hidden'
      resourcesStore.resetSelection()
    }

    const areResourcesLoading = ref(true)

    const sortFields: SortField[] = [
      { name: 'name', sortable: true, sortDir: SortDir.Asc },
      { name: 'sharedBy', sortable: true, sortDir: SortDir.Asc },
      { name: 'sdate', sortable: true, sortDir: SortDir.Desc },
      { name: 'status', sortable: true, sortDir: SortDir.Asc }
    ]

    const resources = computed(() => resourcesStore.resources as IncomingEmbeddedShareResource[])

    const {
      items: paginatedResources,
      total: paginationPages,
      page: paginationPage
    } = usePagination<IncomingEmbeddedShareResource>({
      items: resources,
      perPageStoragePrefix: 'repositories'
    })
    const visibleShares = computed(() => unref(paginatedResources).filter((r) => !r.hidden))
    const hiddenShares = computed(() => unref(paginatedResources).filter((r) => r.hidden))
    const currentItems = computed(() => {
      return unref(areHiddenFilesShown) ? unref(hiddenShares) : unref(visibleShares)
    })

    const { sortBy, sortDir, items, handleSort } = useSort({
      items: currentItems,
      fields: sortFields
    })
    const groupingSettings = useGroupingSettings({ sortBy, sortDir })

    onMounted(() => {
      loadResources(clientService)
      areResourcesLoading.value = false
    })

    return {
      areResourcesLoading,
      areHiddenFilesShown,
      breadcrumbs,
      items,
      sortBy,
      sortDir,
      handleSort,
      groupingSettings,
      repositoriesSectionTitle,
      repositoriesSectionEmptyMessage,
      setAreHiddenFilesShown,
      visibilityOptions,
      paginationPage,
      paginationPages,
      currentItems
    }
  }
})
</script>
