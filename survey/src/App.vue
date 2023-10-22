<template>
  <div>
    <oc-button
      id="survey"
      ref="surveyButton"
      appearance="raw"
      variation="inverse"
      href="https://indico.cern.ch/event/1315215/"
      target="_blank"
      type="a"
      v-oc-tooltip="'Share Your Feedback! Fill out our usability survey and help us improve.'"
    >
      <oc-icon name="survey" />
      <span>Survey</span>
    </oc-button>
  </div>
</template>

<script lang="ts">
export default {
  name: 'Survey',

  mounted() {
    const surveyButton = this.$refs.surveyButton.$el

    if (localStorage.getItem('mouseOverDoneSurvey') !== 'true') {
      surveyButton.focus()

      // Wait for 7 seconds, then trigger a blur event to unfocus the element
      setTimeout(() => {
        surveyButton.blur()
      }, 7000)

      // Update local storage to indicate that the event has been done.
      localStorage.setItem('mouseOverDoneSurvey', 'true')
    }
  }
}
</script>

<style lang="scss"></style>
