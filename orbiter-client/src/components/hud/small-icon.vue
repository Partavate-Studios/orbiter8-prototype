<template>
  <!-- One of the game's small icons (libs/small-icons.js), in the current text color. -->
  <svg class="small-icon" viewBox="-12 -12 24 24" aria-hidden="true"><path :d="SMALL_ICONS[name]" /></svg>
</template>

<script>
import { SMALL_ICONS } from '@/libs/small-icons'

export default {
  name: 'SmallIcon',
  props: {
    /** The icon's name in libs/small-icons.js. */
    name: { type: String, required: true }
  },
  data() {
    return { SMALL_ICONS }
  }
}
</script>

<style scoped>
.small-icon {
  display: block;
  width: 22px;
  height: 22px;
}
path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
