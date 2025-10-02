<template>
  <div v-if="toursAllowed" id="tours">
    <oc-button v-if="tours.length === 1" id="toursButton" v-oc-tooltip="tours[0].tooltip" size="small"
      @click.stop="startTour(0)">
      <oc-icon name="map" />
      {{ tours[0].tourName }}
    </oc-button>

    <div v-else>
      <oc-button id="toursButton" v-oc-tooltip="toursTooltip" size="small">
        <oc-icon name="map" />
        <translate>Tours</translate>
      </oc-button>
      <oc-drop ref="menu" drop-id="tours" toggle="#toursButton" mode="click" close-on-click padding-size="small">
        <oc-list class="user-menu-list">
          <li v-for="(tour, id) in tours" :id="tour.tourName" :key="`tour-${tour.title}-list-${id}`"
            class="user-menu-list" @click.stop="startTour(id)">
            <oc-button v-oc-tooltip="tour.tooltip" appearance="raw">
              <span class="profile-info-wrapper" :class="'oc-py-xs'">
                {{ tour.tourName }}
              </span></oc-button>
          </li>
        </oc-list>
      </oc-drop>
    </div>
  </div>
</template>

<script>
import { createTranslatedTour, autostartTours } from './helpers'
import { mapState, mapActions } from 'pinia'
import { useAuthStore, useUserStore, useSpacesStore } from '@ownclouders/web-pkg'
import { useToursStore } from './store'

export default {
  computed: {
    ...mapState(useToursStore, ['currentTranslatedTourInfos']),
    ...mapState(useAuthStore, ['accessToken']),
    ...mapState(useUserStore, ['user']),
    ...mapState(useSpacesStore, ['personalSpace', 'spacesInitialized']),

    tours() {
      return this.currentTranslatedTourInfos
    },
    language() {
      return this.$language.current
    },
    toursAllowed() {
      return this.tours.some((t) => this.tourAllowed(t))
    },
    toursTooltip() {
      return this.$gettext('See tours through the interface')
    }
  },
  watch: {
    $route: {
      immediate: false,
      handler: function (from, to) {
        if (from.name === to.name) {
          // This catches e.g. query parameter changes
          return
        }
        this.tryAutostart(to)
      }
    },
    selectedLanguage: {
      immediate: true,
      handler() {
        this.setCurrentTranslatedTourInfos(this.language)
      }
    }
  },
  mounted() {
    this.stopSpacesWatch = this.$watch(
      () => this.spacesInitialized,
      (val) => {
        // when we start, fetching spaces takes longer to initialize, so we
        // need to wait for it before autostarting tours.
        // Watching just for route changes will already be late on the first load.
        if (val === true) {
          this.tryAutostart(this.$route)
          // unregister after success
          this.stopSpacesWatch()
        }
      },
      { immediate: true }
    )
  },
  methods: {
    ...mapActions(useToursStore, ['setCurrentTranslatedTourInfos']),

    startTour(id) {
      createTranslatedTour(this.tours[id]).start()
    },

    tourAllowed(tour) {
      // if there are allowed locations, show based on them, otherwise check denied locations, otherwise show always
      if (tour.allowedLocations?.length) return tour.allowedLocations.includes(this.$route.name)
      else if (tour.deniedLocations?.length)
        return !tour.deniedLocations?.includes(this.$route.name)
      return true
    },

    tryAutostart(route) {
      // If user doesn't have a personal space, it's a lightweight account
      // and we don't want to start tours automatically
      if (this.personalSpace && this.user?.id && this.accessToken && this.currentTranslatedTourInfos.length > 0) {
        autostartTours(this.currentTranslatedTourInfos, route.name, this.accessToken, this.user.id)
      }
    }
  }
}

</script>
<style src="shepherd.js/dist/css/shepherd.css"></style>

<style lang="scss">
.guide-highlight {
  background-color: var(--oc-color-background-highlight);
}

#tours {
  flex: none;
}

#tour {
  height: 100%;
  width: 100%;
}

.guide-img {
  width: 100%;
}

.shepherd-element {
  max-width: 700px !important;
  box-shadow: 5px 0 25px rgb(0 0 0 / 30%) !important;
}

.step-cover {
  .shepherd-header {
    height: 300px;
    align-items: initial !important;

    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 0 !important;

    h3 {
      color: var(--oc-color-text-default) !important;
      font-size: 2rem !important;
      font-weight: 600 !important;
      margin: 0 !important;
      position: relative;
      padding: var(--oc-space-medium) var(--oc-space-medium) 0 var(--oc-space-medium) !important;
      background-color: var(--oc-color-background-default) !important;
      flex: none !important;
    }

    button {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  }
}

.step-normal {
  .shepherd-header{
    align-items: center !important;
    background-color: var(--oc-color-swatch-brand-default) !important;
    border: 0 !important;
    display: flex !important;
    flex-flow: row wrap !important;
    padding: var(--oc-space-small) var(--oc-space-medium) !important;

    h3 {
      color: var(--oc-color-swatch-inverse-default) !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      margin: 0 !important;
    }

    .shepherd-cancel-icon {
      color: hsla(0,0%,100%,.75);
    }
  }
}
.step-hidden-header{
  .shepherd-header {
    float: inline-end;
    background: transparent !important;

    h3 {
      display: none;
    }
  }
}

.shepherd-text {
  border-top: 1px solid var(--oc-color-swatch-brand-default) !important;
}

.shepherd-header {
  border-radius: 15px 15px 0 0 !important;
}

.shepherd-element {
  border-radius: 15px !important;
  background-color: var(--oc-color-background-default) !important;
}

.shepherd-text,
.shepherd-footer {
  border: 0 !important;
  color: var(--oc-color-text-default) !important;
  padding: var(--oc-space-medium) !important;
}

.shepherd-footer {
  border: 0 !important;
}

.shepherd-button {
  background-color: var(--oc-color-swatch-primary-default) !important;
  border-color: var(--oc-color-swatch-primary-default) !important;
}

.shepherd-button-secondary {
  background-color: initial !important;
  color: var(--oc-color-swatch-passive-default) !important;
  border: 1px solid transparent !important;
  border-color: var(--oc-color-swatch-passive-default) !important;
}

.shepherd-cancel-icon {
  padding-right: 8px;
}
</style>
