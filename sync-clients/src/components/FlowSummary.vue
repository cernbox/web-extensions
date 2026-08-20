<template>
  <dl class="sync-clients-summary">
    <dt v-text="$gettext('Approving as')" />
    <dd class="sync-clients-summary-account">
      <!-- accessible-label left empty on purpose: the display name is right next to it -->
      <oc-avatar v-if="user" :user-name="user.displayName" :width="32" />
      <span>
        <strong v-text="user?.displayName" />
        <small v-if="accountName" class="oc-display-block" v-text="accountName" />
      </span>
    </dd>

    <dt v-text="$gettext('Device asking for access')" />
    <!-- parsed server-side into a display string; rendered as text, never as markup -->
    <dd v-text="flow.client_label" />

    <dt v-text="$gettext('Requested')" />
    <dd v-text="relativeAge" />

    <dt v-text="$gettext('Expires in')" />
    <dd aria-live="polite">
      <span v-if="!isExpired" v-text="countdown" />
      <span v-else class="sync-clients-summary-expired" v-text="$gettext('Expired')" />
    </dd>

    <dt v-text="$gettext('Request ID')" />
    <dd><code v-text="shortClientId" /></dd>
  </dl>
</template>

<script setup lang="ts">
import { computed, unref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@ownclouders/web-pkg'
import type { FlowInfo } from '../types'

const props = defineProps<{
  flow: FlowInfo
  relativeAge: string
  countdown: string
  isExpired: boolean
}>()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const accountName = computed(
  () => unref(user)?.mail || unref(user)?.onPremisesSamAccountName || undefined
)

// enough to match this request against the entry that shows up in the account page afterwards,
// without turning the summary into a wall of UUID
const shortClientId = computed(() => props.flow.client_id.slice(0, 8))
</script>

<style lang="scss" scoped>
.sync-clients-summary {
  display: grid;
  // wide enough for the longest label to stay on one line, capped so it cannot grow further and
  // leave the values wrapping mid-word
  grid-template-columns: 10.5rem minmax(0, 1fr);
  gap: var(--oc-space-small) var(--oc-space-medium);
  margin: 0;
  text-align: left;
  align-items: baseline;

  dt {
    color: var(--oc-color-text-muted);
  }

  dd {
    margin: 0;
    min-width: 0;
    // break-word, not anywhere: only split a word that cannot fit on its own line, so a long
    // email breaks but "Nextcloud-Desktop 3.16.0 (Linux)" still wraps between words
    overflow-wrap: break-word;
  }
}

.sync-clients-summary-account {
  display: flex;
  align-items: center;
  gap: var(--oc-space-small);

  // the avatar is a fixed 32px and must not be squeezed by a long display name next to it
  .oc-avatar {
    flex-shrink: 0;
  }
}

.sync-clients-summary-expired {
  color: var(--oc-color-swatch-danger-default);
}

@media (max-width: 640px) {
  .sync-clients-summary {
    grid-template-columns: 1fr;

    dd {
      margin-bottom: var(--oc-space-small);
    }
  }
}
</style>
