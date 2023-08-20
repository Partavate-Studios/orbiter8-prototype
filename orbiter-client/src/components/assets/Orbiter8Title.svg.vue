<template>
<svg
  xmlns="http://www.w3.org/2000/svg"
  xml:space="preserve"
  :width="width + 'px'"
  :height="height + 'px'"
  version="1.1"
  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
  viewBox="0 0 1253 125"
   xmlns:xlink="http://www.w3.org/1999/xlink">
  <orbiter8text></orbiter8text>
</svg>
</template>

<script>

import orbiter8text from './_orbiter8text.svg'

export default {
  name: 'Orbiter8Title',
  components: {
    orbiter8text
  },
  props: {
    width: {
      default: 100
    }
  },
  computed: {
    height: function () {
      return this.width / 1253 * 125
    }
  },
  data () {
    return {
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
