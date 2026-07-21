<template>
  <oc-button
    v-if="tooltipText"
    id="office-app-feedback-btn"
    v-oc-tooltip="tooltipText"
    appearance="raw"
    variation="passive"
    size="small"
    class="office-app-feedback-btn oc-mx-xs"
    :aria-label="tooltipText"
    @click="openModal"
  >
    <span class="office-app-feedback-btn-surface">
      <oc-icon name="chat-smile-3" fill-type="line" />
      <span>{{ $gettext('Office Pilot') }}</span>
    </span>
  </oc-button>
</template>

<script lang="ts">
import { computed, defineComponent, unref } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useRoute, useModals } from '@ownclouders/web-pkg'
import FeedbackModal from './FeedbackModal.vue'

// route names for external apps are namespaced by the runtime as
// `external-<app-slug>-apps` (see packages/web-app-external + web-runtime's announceRoutes)
const EXTERNAL_APP_ROUTE_NAME = /^external-(.+)-apps$/

export default defineComponent({
  name: 'OfficeAppFeedbackTopBarButton',
  setup() {
    const { $gettext } = useGettext()
    const route = useRoute()
    const { dispatchModal } = useModals()

    const appTestingCopy: Record<string, string> = {
      ms365: $gettext(
        'Try our new document editor being piloted, Collabora Online'
      ),
      collabora: $gettext('Give us your feedback on Collabora')
    }

    const currentAppSlug = computed(() => {
      const match = unref(route).name?.toString().match(EXTERNAL_APP_ROUTE_NAME)
      return match ? match[1] : null
    })

    const tooltipText = computed(() => {
      const slug = unref(currentAppSlug)
      return slug ? appTestingCopy[slug] || null : null
    })

    const openModal = () => {
      dispatchModal({
        title: $gettext('Try our new office apps'),
        hideActions: true,
        focusTrapInitial: false,
        customComponent: FeedbackModal,
        customComponentAttrs: () => ({ currentAppSlug: unref(currentAppSlug) })
      })
    }

    return { tooltipText, openModal }
  }
})
</script>

<style lang="scss" scoped>
// Glowing animated gradient-border effect, adapted from
// https://www.css-buttons.com/buttons/142/rainbow-color-border-glowing-animated-button
// (same ::before/::after + background-position technique), swapped to shades of blue.
//
// The oc-button itself only positions the two pseudo-elements (the gradient "ring" and its
// blurred glow copy behind it); the actual button surface (icon, label, passive-colored
// background matching the tours extension's hover state) is the nested span on top of them,
// so only a ~2px ring of the gradient is visible around the edge.
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
