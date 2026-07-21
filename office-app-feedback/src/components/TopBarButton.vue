<template>
  <div v-if="currentAppSlug" class="office-app-feedback-wrapper oc-mx-xs">
    <oc-button
      id="office-app-feedback-btn"
      appearance="raw"
      variation="passive"
      size="small"
      class="office-app-feedback-btn"
      :aria-label="$gettext('Office Pilot')"
    >
      <span class="office-app-feedback-btn-surface">
        <oc-icon name="chat-smile-3" fill-type="line" />
        <span>{{ $gettext('Office Pilot') }}</span>
      </span>
    </oc-button>
    <oc-drop
      drop-id="office-app-feedback-drop"
      toggle="#office-app-feedback-btn"
      mode="hover"
      close-on-click
      padding-size="small"
    >
      <oc-list class="office-app-feedback-menu-list">
        <li v-if="switchOptions.length" class="oc-menu-item-hover">
          <oc-button appearance="raw" class="oc-width-1-1" @click="openSwitchModal">
            {{ $gettext('Try a different app') }}
          </oc-button>
        </li>
        <li class="oc-menu-item-hover">
          <oc-button appearance="raw" class="oc-width-1-1" @click="openFeedbackModal">
            {{ $gettext('Send feedback') }}
          </oc-button>
        </li>
      </oc-list>
    </oc-drop>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, unref } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useAppProviderService, useModals, useRoute } from '@ownclouders/web-pkg'
import AppSwitcherModal from './AppSwitcherModal.vue'
import FeedbackModal from './FeedbackModal.vue'

interface SwitchOption {
  label: string
  value: string
}

// route names for external apps are namespaced by the runtime as
// `external-<app-slug>-apps` (see packages/web-app-external + web-runtime's announceRoutes)
const EXTERNAL_APP_ROUTE_NAME = /^external-(.+)-apps$/

// display names for apps under test; anything not listed here falls back to the raw
// app-provider name, so e.g. EuroOffice shows up automatically once it's registered.
const APP_DISPLAY_NAMES: Record<string, string> = {
  ms365: 'Microsoft Office Online',
  collabora: 'Collabora',
  onlyoffice: 'EuroOffice',
  eurooffice: 'EuroOffice'
}

export default defineComponent({
  name: 'OfficeAppFeedbackTopBarButton',
  setup() {
    const { $gettext } = useGettext()
    const route = useRoute()
    const appProviderService = useAppProviderService()
    const { dispatchModal } = useModals()

    const currentAppSlug = computed(() => {
      const match = unref(route).name?.toString().match(EXTERNAL_APP_ROUTE_NAME)
      return match ? match[1] : null
    })

    // parsed from the route path rather than a resolved Resource: this component isn't a
    // descendant of web-app-external's own App.vue (it's injected into the header separately),
    // so it has no direct access to the Resource that component resolves. driveAliasAndItem
    // always contains the readable file path though, even under id-based routing - see
    // web-app-external's getEditorRouteOpts, which sets it unconditionally.
    const currentExtension = computed(() => {
      const driveAliasAndItem = unref(route).params.driveAliasAndItem
      const path = Array.isArray(driveAliasAndItem)
        ? driveAliasAndItem.join('/')
        : driveAliasAndItem
      if (!path || !path.includes('.')) {
        return null
      }
      return path.split('.').pop().toLowerCase()
    })

    // only apps actually registered for the current file's extension - e.g. this excludes
    // CodiMD (a markdown editor) when viewing a .docx, rather than listing every app name
    // registered anywhere.
    const switchOptions = computed<SwitchOption[]>(() => {
      const ext = unref(currentExtension)
      if (!ext) {
        return []
      }
      const mimeType = appProviderService.mimeTypes.find((mt) => mt.ext?.toLowerCase() === ext)
      if (!mimeType) {
        return []
      }
      return mimeType.app_providers
        .map((provider) => provider.name)
        .filter((name) => name.toLowerCase() !== unref(currentAppSlug))
        .map((name) => ({ label: APP_DISPLAY_NAMES[name.toLowerCase()] || name, value: name }))
    })

    const openSwitchModal = () => {
      dispatchModal({
        title: $gettext('Try a different app'),
        hideActions: true,
        focusTrapInitial: false,
        customComponent: AppSwitcherModal,
        customComponentAttrs: () => ({ switchOptions: unref(switchOptions) })
      })
    }

    const openFeedbackModal = () => {
      dispatchModal({
        title: $gettext('Send feedback'),
        hideActions: true,
        focusTrapInitial: false,
        customComponent: FeedbackModal
      })
    }

    return { currentAppSlug, switchOptions, openSwitchModal, openFeedbackModal }
  }
})
</script>

<style lang="scss" scoped>
.office-app-feedback-wrapper {
  display: inline-flex;
  align-items: center;
  position: relative;
}

// Glowing animated gradient-border effect, adapted from
// https://www.css-buttons.com/buttons/142/rainbow-color-border-glowing-animated-button
// (same ::before/::after + background-position technique), swapped to shades of blue.
//
// The oc-button itself only positions the two pseudo-elements (the gradient "ring" and its
// blurred glow copy behind it); the actual button surface (icon, label, passive-colored
// background matching the tours extension's hover state) is the nested span on top of them,
// so only a ~1px ring of the gradient is visible around the edge.
.office-app-feedback-btn {
  position: relative;
  z-index: 0;
  border-radius: 8px !important;
  padding: 0 !important;
  display: inline-flex !important;
}

.office-app-feedback-btn-surface {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  background: var(--oc-color-swatch-passive-hover-outline);
  white-space: nowrap;
}

// stops are kept deliberately light/bright (no navy darks) - the top bar itself is a dark blue,
// and darker gradient stops were blending straight into it, making the animation barely visible.
.office-app-feedback-btn::before,
.office-app-feedback-btn::after {
  content: '';
  position: absolute;
  inset: -2px;
  z-index: 0;
  border-radius: 9px;
  background: linear-gradient(
    45deg,
    #38bdf8,
    #7dd3fc,
    #e0f2fe,
    #93c5fd,
    #60a5fa,
    #38bdf8,
    #7dd3fc,
    #e0f2fe,
    #93c5fd,
    #60a5fa
  );
  background-size: 400%;
}

.office-app-feedback-btn::after {
  filter: blur(12px);
  opacity: 0.9;
}

@media (prefers-reduced-motion: no-preference) {
  .office-app-feedback-btn::before,
  .office-app-feedback-btn::after {
    animation: office-app-feedback-glow 10s linear infinite;
  }
}

// the color list is the 5-color sequence repeated twice, so shifting by exactly half of the
// 400% background-size (200%) lands back on an identical-looking frame - a seamless one-way
// loop, rather than animating 0 -> 400% -> back to 0 (which visibly reverses direction).
@keyframes office-app-feedback-glow {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 200% 0;
  }
}
</style>
