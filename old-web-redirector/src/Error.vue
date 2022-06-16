<template>
  <main>
    <div class="oc-position-center">
      <div class="oc-text-center">
        <oc-icon size="xxlarge" name="error-warning" fill-type="line" />
        <p class="oc-text-lead">This URL is no longer valid</p>
        <p>Please contact the support if you think this is an error</p>
      </div>
    </div>
  </main>
</template>
<script>
class UrlError extends Error {
  constructor(url) {
    super(`The url '${url}' is not registered`)
    this.name = 'UrlError'
  }
}

export default {
  name: 'Redirector',

  mounted() {
    throw new UrlError(this.$route.fullPath)
  }
}
</script>
