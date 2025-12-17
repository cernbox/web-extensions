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
    :resources="items"
    :fields-displayed="displayedFields"
    :has-actions="true"
    :is-selectable="false"
    :sort-by="sortBy"
    :sort-dir="sortDir"
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
          resource.status && resource.status === 'pending' ? 'Process share' : 'Reprocess share'
        "
        appearance="raw"
        @click.stop="
          console.debug('Process share clicked', {
            name: resource.name,
            sharedBy: resource.sharedBy,
            sharedOn: resource.sdate,
            status: resource.status
          })
        "
      >
        <oc-icon
          :name="resource.status && resource.status === 'pending' ? 'check' : 'refresh'"
          fill-type="line"
        />
      </oc-button>
    </template>
    <template #footer>
      <!-- <div v-if="showMoreToggle && hasMore" class="oc-width-1-1 oc-text-center oc-mt"> -->
      <!--   <oc-button -->
      <!--     id="files-shared-with-me-show-all" -->
      <!--     appearance="raw" -->
      <!--     gap-size="xsmall" -->
      <!--     size="small" -->
      <!--     :data-test-expand="(!showMore).toString()" -->
      <!--     @click="toggleShowMore" -->
      <!--   > -->
      <!--     {{ toggleMoreLabel }} -->
      <!--     <oc-icon :name="'arrow-' + (showMore ? 'up' : 'down') + '-s'" fill-type="line" /> -->
      <!--   </oc-button> -->
      <!-- </div> -->
      <!-- <div v-else> -->
      <!-- <div> -->
      <!--   <pagination :pages="paginationPages" :current-page="paginationPage" /> -->
      <!--   <list-info class="oc-width-1-1 oc-my-s" /> -->
      <!-- </div> -->
    </template>
  </custom-resource-table>
</template>

<script lang="ts">
/*
  <resource-table
    v-else
    v-model:selected-ids="selectedResourcesIds"
    :is-side-bar-open="isSideBarOpen"
    :fields-displayed="displayedFields"
    :resources="resourceItems"
    :are-resources-clickable="resourceClickable"
    :target-route-callback="resourceTargetRouteCallback"
    :header-position="fileListHeaderY"
    :sort-by="sortBy"
    :sort-dir="sortDir"
    :grouping-settings="groupingSettings"
    @file-click="triggerDefaultAction"
    @item-visible="loadPreview({ space: getMatchingSpace($event), resource: $event })"
    @sort="sortHandler"
  >
*/
import {
  ContextActions,
  NoContentMessage,
  SortDir,
  useFileActionsToggleHideShare,
  useGetMatchingSpace,
  useSelectedResources
} from '@ownclouders/web-pkg'
import CustomResourceTable from './CustomResourceTable.vue'
import { IncomingShareResource } from '@ownclouders/web-client'

interface IncomingEmbeddedShareResource extends IncomingShareResource {
  status: string
}

import { computed, defineComponent, PropType, ref, unref } from 'vue'

export default defineComponent({
  name: 'RepositoriesSection',
  components: {
    // Import and register any child components if needed
    // Pagination,
    CustomResourceTable,
    NoContentMessage,
    ContextActions
    // ListInfo
  },
  props: {
    // Define any props if needed
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
    items: {
      type: Array as PropType<IncomingEmbeddedShareResource[]>,
      required: true
    },
    isSideBarOpen: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    // const { $gettext } = useGettext()
    const areHiddenFilesShown = ref(false)

    const displayedFields = computed(() => {
      return ['name', 'sharedBy', 'sdate', 'status']
    })

    const { getMatchingSpace } = useGetMatchingSpace()

    const { actions: hideShareActions } = useFileActionsToggleHideShare()
    const hideShareAction = computed(() => unref(hideShareActions)[0])
    const { selectedResourcesIds, selectedResources, isResourceInSelection } =
      useSelectedResources()

    return {
      // Return any data or methods to be used in the template
      areHiddenFilesShown,
      hideShareAction,
      displayedFields,
      selectedResourcesIds,
      selectedResources,
      getMatchingSpace,
      isResourceInSelection
    }
  }
})
</script>
