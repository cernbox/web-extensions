<template>
  <!--
    /account is authContext 'hybrid', so a public-link visitor reaches it with no user context.
    Rendering nothing there also stops the list request from firing.
  -->
  <div v-if="userContextReady" class="account-table sync-clients-section">
    <h2 v-text="$gettext('Connected devices')" />
    <p
      class="sync-clients-section-lede oc-text-muted"
      v-text="$gettext('Sync clients that can access your files. Disconnecting one stops it immediately.')"
    />
    <clients-table
      :clients="clients"
      :loading="isLoading"
      :downloads-url="downloadsUrl"
      @revoke="confirmRevoke"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, unref } from 'vue'
import { storeToRefs } from 'pinia'
import { useGettext } from 'vue3-gettext'
import { useAuthStore, useClientService, useMessages, useModals } from '@ownclouders/web-pkg'
import { listClients, revokeClient } from '../api'
import ClientsTable from './ClientsTable.vue'
import type { ConnectedClient } from '../types'

/** Where users get the client. Same URL the cernbox-integration top bar already links to. */
const DOWNLOADS_URL = 'https://cernbox.web.cern.ch/cernbox/downloads/'

const { $gettext } = useGettext()
const clientService = useClientService()
const authStore = useAuthStore()
const { userContextReady } = storeToRefs(authStore)
const { showMessage, showErrorMessage } = useMessages()
const { dispatchModal } = useModals()

const clients = ref<ConnectedClient[]>([])
const isLoading = ref(true)

const downloadsUrl = computed(() => DOWNLOADS_URL)

const load = async () => {
  isLoading.value = true
  try {
    clients.value = await listClients(clientService)
  } catch (error) {
    showErrorMessage({
      title: $gettext('Could not load your connected devices.'),
      errors: [error as Error]
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (unref(userContextReady)) {
    load()
  }
})

const revoke = async (client: ConnectedClient) => {
  try {
    await revokeClient(clientService, client.id)
    showMessage({ title: $gettext('Device disconnected.') })
  } catch (error) {
    showErrorMessage({
      title: $gettext('Could not disconnect the device.'),
      errors: [error as Error]
    })
  } finally {
    await load()
  }
}

const confirmRevoke = (client: ConnectedClient) => {
  dispatchModal({
    title: $gettext('Disconnect %{ device }?', { device: client.name }),
    message: $gettext(
      'This device will stop syncing immediately and will have to be connected again to regain access.'
    ),
    confirmText: $gettext('Disconnect'),
    variation: 'danger',
    onConfirm: () => revoke(client)
  })
}
</script>

<style lang="scss" scoped>
.sync-clients-section-lede {
  margin-top: 0;
}
</style>
