<template>
  <h2 class="oc-px-m oc-py-s oc-invisible-sr">
    {{ title }}
    <span class="oc-text-medium">({{ items.length }})</span>
  </h2>
  <no-content-message v-if="!items.length" class="files-empty oc-flex-stretch" icon="inbox">
    <template #message>
      <span>{{ emptyMessage }}</span>
    </template>
  </no-content-message>
  <custom-resource-table
    v-else
    v-model:selected-ids="selectedResourcesIds"
    :resources="resourceItems"
    :fields-displayed="displayedFields"
    :has-actions="true"
    :is-selectable="false"
    :sort-by="sortBy"
    :sort-dir="sortDir"
    :header-position="fileListHeaderY"
    :grouping-settings="groupingSettings"
    @sort="sortHandler"
  >
    <template #contextMenu="{ resource }">
      <context-actions
        v-if="isResourceInSelection(resource)"
        :action-options="{ space: getMatchingSpace(resource), resources: selectedResources }"
      />
    </template>
    <template #quickActions="{ resource }">
      <oc-button
        v-oc-tooltip="hideShareAction.label({ space: null, resources: [resource] })"
        appearance="raw"
        :class="['oc-p-xs', hideShareAction.class]"
        @click.stop="hideShareAction.handler({ space: null, resources: [resource] })"
      >
        <oc-icon :name="resource.hidden ? 'eye' : 'eye-off'" fill-type="line" />
      </oc-button>
      <oc-button
        v-oc-tooltip="
          resource.status && resource.status.toLowerCase() === 'pending'
            ? 'Process share'
            : 'Reprocess share'
        "
        appearance="raw"
        @click.stop="processShare(resource)"
      >
        <oc-icon
          :name="
            resource.status && resource.status.toLowerCase() === 'pending' ? 'check' : 'refresh'
          "
          fill-type="line"
        />
      </oc-button>
    </template>
    <template #footer>
      <div v-if="showMoreToggle && hasMore" class="oc-width-1-1 oc-text-center oc-mt">
        <oc-button
          id="embedded-shares-show-all"
          appearance="raw"
          gap-size="xsmall"
          size="small"
          :data-test-expand="(!showMore).toString()"
          @click="toggleShowMore"
        >
          {{ toggleMoreLabel }}
          <oc-icon :name="'arrow-' + (showMore ? 'up' : 'down') + '-s'" fill-type="line" />
        </oc-button>
      </div>
      <div v-else>
        <pagination :pages="paginationPages" :current-page="paginationPage" />
        <list-info class="oc-width-1-1 oc-my-s" />
      </div>
    </template>
  </custom-resource-table>
</template>

<script lang="ts">
import {
  ContextActions,
  NoContentMessage,
  Pagination,
  SortDir,
  useFileActionsToggleHideShare,
  useGetMatchingSpace,
  usePagination,
  useSelectedResources
} from '@ownclouders/web-pkg'
import CustomResourceTable from './CustomResourceTable.vue'

import { computed, defineComponent, PropType, ref, unref } from 'vue'
import { IncomingEmbeddedShareResource, processShare } from '../functions'
import ListInfo from './ListInfo.vue'
import { useGettext } from 'vue3-gettext'

export default defineComponent({
  name: 'RepositoriesSection',
  components: {
    Pagination,
    CustomResourceTable,
    NoContentMessage,
    ContextActions,
    ListInfo
  },
  props: {
    title: {
      type: String,
      required: true
    },
    emptyMessage: {
      type: String,
      required: false,
      default: 'No repositories available, sorry :('
    },
    sortBy: {
      type: String,
      required: false,
      default: undefined
    },
    sortDir: {
      type: String as PropType<'asc' | 'desc'>,
      required: false,
      default: undefined,
      validator: (value: string) => {
        return (
          value === undefined || [SortDir.Asc.toString(), SortDir.Desc.toString()].includes(value)
        )
      }
    },
    sortHandler: {
      type: Function as PropType<any>,
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
    items: {
      type: Array as PropType<IncomingEmbeddedShareResource[]>,
      required: true
    },
    isSideBarOpen: {
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
  setup(props) {
    const { $gettext } = useGettext()
    const areHiddenFilesShown = ref(false)
    const { getMatchingSpace } = useGetMatchingSpace()

    const displayedFields = computed(() => {
      return ['name', 'sharedBy', 'sdate', 'status']
    })

    const showMore = ref(false)
    const hasMore = computed(() => {
      return props.items.length > props.showMoreToggleCount
    })
    const toggleShowMore = () => {
      showMore.value = !showMore.value
    }
    const toggleMoreLabel = computed(() => {
      return unref(showMore) ? $gettext('Show less') : $gettext('Show more')
    })

    const resourceItems = computed(() => {
      if (props.showMoreToggle || showMore) {
        return props.items
      }
      return props.items.slice(0, props.showMoreToggleCount)
    })

    const { total: paginationPages, page: paginationPage } = usePagination({
      items: props.items,
      perPageStoragePrefix: 'shares'
    })

    const { actions: hideShareActions } = useFileActionsToggleHideShare()
    const hideShareAction = computed(() => unref(hideShareActions)[0])
    const { selectedResourcesIds, selectedResources, isResourceInSelection } =
      useSelectedResources()

    return {
      areHiddenFilesShown,
      displayedFields,
      hasMore,
      showMore,
      hideShareAction,
      paginationPages,
      paginationPage,
      resourceItems,
      selectedResourcesIds,
      selectedResources,
      getMatchingSpace,
      isResourceInSelection,
      processShare,
      toggleShowMore,
      toggleMoreLabel
    }
  }
})
</script>
