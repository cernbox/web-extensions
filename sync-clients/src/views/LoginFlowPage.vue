<template>
  <div class="sync-clients-login-flow oc-height-viewport oc-flex oc-flex-column oc-flex-center oc-flex-middle">
    <div class="oc-login-card">
      <img class="oc-login-logo" :src="logoImg" alt="" :aria-hidden="true" />

      <!--
        no oc-width-medium here, unlike the runtime's login/logout cards: that utility is a hard
        `width: 300px`, which squeezes this card's two-column summary into a sliver. The body is a
        block and fills the card on its own - do not give it width: 100% either, because
        .oc-card-body carries horizontal padding and nothing resets box-sizing to border-box, so
        the padding would be added on top of the full width and overflow the card.
      -->
      <div class="oc-login-card-body">
        <h2 class="oc-login-card-title" v-text="$gettext('Connect a device')" />

        <oc-spinner v-if="state === 'loading'" :aria-label="$gettext('Loading request')" />

        <template v-else-if="isDecisionPending">
          <p class="sync-clients-lede" v-text="lede" />
          <flow-summary
            :flow="flow"
            :relative-age="relativeAge"
            :countdown="countdown"
            :is-expired="isExpired"
          />
          <div class="sync-clients-wrong-user">
            <oc-button
              appearance="raw"
              variation="primary"
              :disabled="state === 'submitting'"
              @click="onSignOut"
            >
              <span v-text="$gettext('Not you? Sign out')" />
            </oc-button>
            <small
              class="oc-text-muted oc-display-block"
              v-text="
                $gettext('You will have to start the connection again from your sync client.')
              "
            />
          </div>
          <hr class="oc-my-m" />
          <!--
            toasts render only in the Application layout, so a failed submit has to say so here
          -->
          <p v-if="submitError" class="sync-clients-error" role="alert" v-text="submitError" />
          <flow-decision
            :default-name="flow.client_label"
            :submitting="state === 'submitting'"
            :is-expired="isExpired"
            @grant="onGrant"
            @deny="onDeny"
          />
        </template>

        <flow-outcome v-else-if="outcome" :outcome="outcome" />
      </div>

      <div class="oc-login-card-footer oc-pt-rm">
        <p v-text="footerSlogan" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, unref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGettext } from 'vue3-gettext'
import { useAuthService, useRoute, useClientService, useThemeStore } from '@ownclouders/web-pkg'
import { denyFlow, getFlowInfo, grantFlow } from '../api'
import { isFlowGone } from '../helpers/http'
import { useFlowExpiry } from '../composables/useFlowExpiry'
import FlowDecision from '../components/FlowDecision.vue'
import FlowOutcome from '../components/FlowOutcome.vue'
import FlowSummary from '../components/FlowSummary.vue'
import type { FlowInfo, FlowOutcomeKind, FlowState } from '../types'

const { $gettext } = useGettext()
const route = useRoute()
const clientService = useClientService()
const authService = useAuthService()
const themeStore = useThemeStore()
const { currentTheme } = storeToRefs(themeStore)

const state = ref<FlowState>('loading')
const flow = ref<FlowInfo>()
const submitError = ref('')

const { isExpired, countdown, relativeAge, syncClock } = useFlowExpiry(flow)

const logoImg = computed(() => unref(currentTheme).logo.login)
const footerSlogan = computed(() => unref(currentTheme).common.slogan)

// the token is a secret: read straight off the route, and never logged, echoed into an error
// message, or sent anywhere other than the flow endpoints
const logintoken = computed(() => String(unref(route).params.logintoken || ''))

const lede = computed(() =>
  $gettext(
    'A sync client is asking for permission to sync your files. Approve it only if you started this yourself.'
  )
)

const isDecisionPending = computed(
  () => !!unref(flow) && ['pending', 'submitting'].includes(unref(state))
)

const outcome = computed<FlowOutcomeKind | undefined>(() => {
  const current = unref(state)
  return current === 'loading' || current === 'pending' || current === 'submitting'
    ? undefined
    : current
})

onMounted(async () => {
  try {
    const info = await getFlowInfo(clientService, unref(logintoken))
    syncClock(info)
    flow.value = info
    // covers the flow that lapsed while the user was away at the IdP
    state.value = unref(isExpired) ? 'expired' : 'pending'
  } catch (error) {
    state.value = isFlowGone(error) ? 'expired' : 'error'
  }
})

// a flow running out while the page is open drops the form, rather than letting the user submit
// into a 404
watch(isExpired, (expired) => {
  if (expired && unref(state) === 'pending') {
    state.value = 'expired'
  }
})

const submit = async (action: () => Promise<void>, granted: FlowOutcomeKind) => {
  state.value = 'submitting'
  submitError.value = ''
  try {
    await action()
    state.value = granted
  } catch (error) {
    if (isFlowGone(error)) {
      // lost the compare-and-set race against the polling client, or lapsed mid-submit
      state.value = 'expired'
      return
    }
    state.value = 'pending'
    submitError.value = $gettext('Could not complete the request. Please try again.')
  }
}

const onGrant = (name: string) => {
  const label = name.trim() || unref(flow).client_label
  return submit(() => grantFlow(clientService, unref(logintoken), label), 'granted')
}

const onDeny = () => submit(() => denyFlow(clientService, unref(logintoken)), 'denied')

/**
 * Escape hatch for someone who finds themselves signed in as the wrong account: ending the session
 * is what stops that account from granting.
 *
 * It does not return here afterwards. logoutUser() ends the IdP session and lands on /logout, whose
 * "Log in again" calls loginUser() with no redirect - which clears the stored post-login URL, so
 * the flow token cannot survive the round trip. Returning to this page would need the IdP prompt
 * forwarded through loginUser(), which the host does not expose today. The sync client is still
 * polling, so restarting the connection from there is the intended next step.
 */
const onSignOut = () => authService.logoutUser()
</script>

<style lang="scss" scoped>
.sync-clients-lede {
  color: var(--oc-color-text-muted);
}

.sync-clients-error {
  color: var(--oc-color-swatch-danger-default);
}

.sync-clients-wrong-user {
  margin-top: var(--oc-space-small);
  text-align: left;
}

.oc-login-card {
  max-width: 32rem;
  width: 100%;
}
</style>
