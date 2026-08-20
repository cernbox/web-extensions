<template>
  <app-loading-spinner v-if="loading" />
  <!--
    deliberately not NoContentMessage: it is sized for a full page (height: 75vh) and would
    dwarf the surrounding account sections
  -->
  <div v-else-if="!clients.length" class="sync-clients-empty oc-text-muted">
    <oc-icon name="computer" fill-type="line" size="large" />
    <span v-text="$gettext('No devices are connected to your account.')" />
    <oc-button type="a" appearance="raw" variation="primary" :href="downloadsUrl" target="_blank">
      <span v-text="$gettext('Get the CERNBox sync client')" />
    </oc-button>
  </div>
  <oc-table-simple v-else>
    <oc-thead>
      <oc-tr>
        <oc-th>{{ $gettext('Name') }}</oc-th>
        <oc-th>{{ $gettext('Client') }}</oc-th>
        <oc-th>{{ $gettext('Registered') }}</oc-th>
        <oc-th>{{ $gettext('Last seen') }}</oc-th>
        <oc-th class="oc-invisible-sr">{{ $gettext('Actions') }}</oc-th>
      </oc-tr>
    </oc-thead>
    <oc-tbody>
      <oc-tr v-for="client in clients" :key="client.id" :data-client-id="client.id">
        <oc-td>{{ client.name }}</oc-td>
        <oc-td>{{ client.description }}</oc-td>
        <oc-td>{{ formatDate(client.created_at) }}</oc-td>
        <oc-td>
          <span v-if="client.last_seen_at" v-text="formatRelative(client.last_seen_at)" />
          <span v-else class="oc-text-muted" v-text="$gettext('Never')" />
        </oc-td>
        <oc-td>
          <oc-button
            appearance="raw"
            variation="danger"
            :aria-label="revokeLabel(client)"
            @click="emit('revoke', client)"
          >
            <span v-text="$gettext('Disconnect')" />
          </oc-button>
        </oc-td>
      </oc-tr>
    </oc-tbody>
  </oc-table-simple>
</template>

<script setup lang="ts">
import {
  AppLoadingSpinner,
  formatDateFromISO,
  formatRelativeDateFromISO
} from '@ownclouders/web-pkg'
import { useGettext } from 'vue3-gettext'
import type { ConnectedClient } from '../types'

defineProps<{
  clients: ConnectedClient[]
  loading: boolean
  downloadsUrl: string
}>()

const emit = defineEmits<{
  (event: 'revoke', client: ConnectedClient): void
}>()

// kept as the object: `current` is reactive on it, destructuring would snapshot it
const language = useGettext()
const { $gettext } = language

const formatDate = (iso: string) => formatDateFromISO(iso, language.current)
const formatRelative = (iso: string) => formatRelativeDateFromISO(iso, language.current)

const revokeLabel = (client: ConnectedClient) =>
  $gettext('Disconnect %{ device }', { device: client.name })
</script>

<style lang="scss" scoped>
.sync-clients-empty {
  display: flex;
  align-items: center;
  gap: var(--oc-space-small);
  flex-wrap: wrap;
  padding: var(--oc-space-small) 0;
}
</style>
