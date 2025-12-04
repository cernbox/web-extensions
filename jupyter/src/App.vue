
<template>
  <div class="jupyter-viewer">
    <div id="app-header">
      <div class="header-left">
        <img :src="logo" id="jupyter-logo" alt="Jupyter Viewer" />
        <span class="title">Jupyter Viewer</span>
      </div>

      <button
        v-if="hasScripts"
        @click="trusted = true"
        :disabled="trusted"
        class="trust-btn"
      >
        {{ trusted ? "Trusted" : "Trust Notebook" }}
      </button>
    </div>

    <div id="scroll-area">
      <div id="jupyter" :class="{ 'theme-dark': darkTheme }">
        <div id="notebook">

          <div
            class="untrusted-warning container-width"
            v-if="hasScripts && !trusted"
          >
            <strong>Script outputs hidden.</strong><br />
            This notebook is not trusted. To enable script outputs, click “Trust Notebook”.
          </div>

          <div
            id="notebook-container"
            class="container-width"
            ref="container"
            v-html="renderedNotebook?.innerHTML"
          ></div>

        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch, nextTick, onUpdated } from 'vue'
import { AppConfigObject, useThemeStore } from '@ownclouders/web-pkg'
import * as ipynb2html from 'ipynb2html'
import logo from './img/logo.svg'

export default defineComponent({
  name: 'JupyterViewer',
  props: {
    applicationConfig: { type: Object as PropType<AppConfigObject>, required: true },
    currentContent: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const themeStore = useThemeStore()
    const container = ref<HTMLElement | null>(null)
    const trusted = ref(false)
    const hasScripts = ref(false)

    const darkTheme = computed(() => {
      return themeStore.currentTheme.isDark
    })
  
    const config = computed(() => {
      const {
        OpenExternal = false,
        OpenExternalName = 'Open in Jupyter',
        OpenUrl
      } = props.applicationConfig as AppConfigObject
      return { OpenExternal, OpenExternalName, OpenUrl }
    })

    const renderedNotebook = computed(() => {
      if (!props.currentContent) return null
      return ipynb2html.render(JSON.parse(props.currentContent))
    })

    // Find cells containing scripts to show warning if untrusted
    // and to apply a style
    const processScriptCells = (root: HTMLElement) => {
      const scriptCells = root.querySelectorAll("div.nb-html-output") // Get all HTML output cells
      hasScripts.value = Array.from(scriptCells).some(
        cell => cell.querySelector("script") !== null
      )
    }

    // The notebook is trusted, so we xan to run any scripts in it
    const runScripts = (root: HTMLElement) => {
      const scripts = root.querySelectorAll("script")

      scripts.forEach(oldScript => {
        const newScript = document.createElement("script")

        // Copy script attributes (src/type/etc.)
        for (const attr of oldScript.attributes) {
          newScript.setAttribute(attr.name, attr.value)
        }

        // Copy inline JS
        if (oldScript.textContent) {
          newScript.appendChild(document.createTextNode(oldScript.textContent))
        }

        // Replace script tag so browser runs it
        oldScript.parentNode?.replaceChild(newScript, oldScript)
      })
    }

    // When notebook HTML is rendered, process cell hiding logic
    watch(renderedNotebook, () => {
      processScriptCells(renderedNotebook.value)
    }, { immediate: true })
  
    onUpdated(() => {
      if (!trusted.value) return // Block scripts if untrusted
      if (!container.value) return
      runScripts(container.value)
    })

    return {
      logo,
      trusted,
      hasScripts,
      darkTheme,
      renderedNotebook,
      container
    }
  }
})
</script>
<style>
.jupyter-viewer {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0; /* important for scroll */
}

/* Fixed INSIDE the component, not the whole page */
#app-header {
  position: sticky;
  top: 0;
  z-index: 10;

  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 11px;
  border-bottom: 1px solid #ddd;
  background-color: var(--oc-color-background-muted);
}

/* Scroll area under the header */
#scroll-area {
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* required so flexbox allows scrolling */
}

#jupyter-logo {
  height: 32px;
  margin-right: 10px;
}

.header-left {
  display: flex;
  align-items: center;
}

.title {
  font-weight: 600;
  font-size: 1.1rem;
}

.trust-btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid #999;
  background: white;
  cursor: pointer;
}

/* Notebook container styling preserved */
#notebook-container {
  padding: 30px 28px 30px 130px;
  background-color: var(--oc-color-background-default);
  box-shadow: 0px 0px 12px 1px rgb(87 87 87 / 20%);
  margin: 0 auto;
}

#notebook {
  padding: 40px 0;
}

.untrusted-warning {
  border: 1px solid #e0e0e0;
  background-color: var(--oc-color-swatch-warning-default);
  padding: 15px;
  color: #555;
  border-radius:8px;
  margin-bottom: 20px;
  margin-right: auto;
  margin-left: auto;
}

@media (min-width: 1200px) {
  .container-width {
    width: 1140px;
  }
}
@media (min-width: 992px) {
  .container-width{
    width: 940px;
  }
}
@media (min-width: 768px) {
  .container-width {
    width: 768px;
  }
}
pre {
  background-color: var(--oc-color-background-muted);
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  color: var(--oc-color-text-default);
  font: 0.875rem/1.5 Consolas,monaco,monospace;
  overflow: auto;
  padding: 10px;
  -moz-tab-size: 4;
  tab-size: 4;
}
.theme-dark .nb-source>pre {
  background-color: var(--oc-color-text-default);
  color: var(--oc-color-background-muted);
}


address,
dl,
fieldset,
figure,
ol,
p,
pre,
ul {
  margin: 0 0 20px;
}
pre {
  display: block;
  font-family: monospace;
  white-space: pre;
  margin: 1em 0px;
}
pre *{
  font-family: monospace;
  white-space: pre;
  font-size: 1.1em;
}
</style>
