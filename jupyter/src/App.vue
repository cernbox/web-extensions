<template>
  <main id="jupyter">
    <div class="oc-container oc-width-1-1">
      <div id="notebook">
        <div id="notebook-container" class="container" v-html="renderedNotebook"></div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { AppConfigObject } from '@ownclouders/web-pkg/src/apps'
import * as ipynb2html from 'ipynb2html'

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
    const config = computed(() => {
      const {
        OpenExternal = false,
        OpenExternalName = 'Open in Jupyter',
        OpenUrl
      } = props.applicationConfig as AppConfigObject
      return { OpenExternal, OpenExternalName, OpenUrl }
    })

    const renderedNotebook = computed(() => {
      return props.currentContent
        ? ipynb2html.render(JSON.parse(props.currentContent)).innerHTML
        : null
    })

    return {
      config,
      renderedNotebook
    }
  }
})
</script>
<style>
#jupyter {
  overflow: scroll !important;
}
#notebook {
  padding-top: 40px;
  padding-bottom: 40px;
}

#notebook-container {
  padding: 30px 28px 30px 130px;
  background-color: var(--oc-color-background-default);
  min-height: 0;
  -webkit-box-shadow: 0px 0px 12px 1px rgb(87 87 87 / 20%);
  box-shadow: 0px 0px 12px 1px rgb(87 87 87 / 20%);
  margin-right: auto;
  margin-left: auto;
}

@media (min-width: 1200px) {
  #notebook .container {
    width: 1140px;
  }
}
@media (min-width: 992px) {
  #notebook .container {
    width: 940px;
  }
}
@media (min-width: 768px) {
  #notebook .container {
    width: 768px;
  }
}
pre {
  background: var(--oc-color-background-muted);
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  color: var(--oc-color-text-default);
  font: 0.875rem/1.5 Consolas,monaco,monospace;
  overflow: auto;
  padding: 10px;
  -moz-tab-size: 4;
  tab-size: 4;
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
user agent stylesheet
pre {
  display: block;
  font-family: monospace;
  white-space: pre;
  margin: 1em 0px;
}
</style>
