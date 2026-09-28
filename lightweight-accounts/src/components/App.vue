<template>
  <div class="lightweight-accounts-home oc-text-center oc-p-m">
    <h1 v-translate class="oc-text-lead">Welcome to CERNBox</h1>
    <p v-translate>With this account you can access shared content and collaborate on projects</p>
    <div class="lightweight-accounts-home-links">
      <router-link
        v-for="link in links"
        :key="link.id"
        :to="link.to"
        class="lightweight-accounts-home-link"
      >
        <oc-icon :name="link.icon" size="xlarge" variation="primary" />
        <span class="lightweight-accounts-home-link-title" v-text="link.title" />
        <span class="lightweight-accounts-home-link-description" v-text="link.description" />
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'
import {
  createLocationShares,
  createLocationSpaces,
  useCapabilityStore
} from '@ownclouders/web-pkg'

const { $gettext } = useGettext()
const capabilityStore = useCapabilityStore()

// shown under the same conditions as the files app's own navigation items, so a link never
// leads to a view that is switched off
const links = computed(() => [
  ...(capabilityStore.sharingApiEnabled !== false
    ? [
        {
          id: 'shared-with-me',
          to: createLocationShares('files-shares-with-me'),
          icon: 'share-forward',
          title: $gettext('Shared with me'),
          description: $gettext('Files and folders others have shared with you')
        }
      ]
    : []),
  ...(capabilityStore.spacesProjects
    ? [
        {
          id: 'spaces',
          to: createLocationSpaces('files-spaces-projects'),
          icon: 'layout-grid',
          title: $gettext('Spaces'),
          description: $gettext('Project spaces you are a member of')
        }
      ]
    : [])
])
</script>

<style scoped>
.lightweight-accounts-home-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--oc-space-medium);
  margin-top: var(--oc-space-large);
}

/* styled like the files app's tiles */
.lightweight-accounts-home-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--oc-space-small);
  width: 16rem;
  padding: var(--oc-space-large) var(--oc-space-medium);
  border: 1px solid var(--oc-color-border);
  border-radius: 5px;
  background-color: var(--oc-color-background-highlight);
  color: var(--oc-color-text-default);
  transition: border-color 0.2s ease;
}

.lightweight-accounts-home-link:hover,
.lightweight-accounts-home-link:focus-visible {
  border-color: var(--oc-color-swatch-primary-default);
  color: var(--oc-color-text-default);
}

.lightweight-accounts-home-link-title {
  font-size: var(--oc-font-size-large);
  font-weight: 600;
}

.lightweight-accounts-home-link-description {
  color: var(--oc-color-text-muted);
  font-size: var(--oc-font-size-small);
}
</style>
