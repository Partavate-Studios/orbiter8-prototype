<template>
  <g>
      <defs>
      <linearGradient id="barGradient"
        x1="0%" y1="0%" x2="0%" y2="100%" gradientTransform="rotate(0)">
          <stop offset="0%" stop-color="#5c1aae" stop-opacity="1"/>
          <stop offset="10%" stop-color="#c3b3da" stop-opacity="1"/>
          <stop offset="15%" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="20%" stop-color="#c3b3da" stop-opacity="1"/>
          <stop offset="25%" stop-color="#5c1aae" stop-opacity="1"/>
          <stop offset="50%" stop-color="#5c1aae" stop-opacity="1"/>
          <stop offset="100%" stop-color="#280b4b" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect x="-202" y="-12" width="404" height="24" fill="#ff88ff" stroke="#5c1aae88" stroke-width="3" rx="10" ry="10" />
      <rect x="-200" y="-10" :width="400 * (mapLoadedPercentage/100)" height="20" stroke="#5c1aae" stroke-width="2" rx="10" ry="10" class="loadingbar" fill="url(#barGradient)"/>
      <text text-anchor="end" fill="#ffffff88" font-size="1em" transform="translate(200 50)">{{ mapLoadedPercentage }}%</text>
  </g>
</template>

<script>

import { mapGetters } from 'vuex'

export default {
  name: 'loading-bar',
  data () {
    return {
    }
  },
  computed: {
    ...mapGetters('StarMap', [
      'mapLoadedPercentage',
    ]),
  }
}
</script>


<style scoped lang="scss">
  .loadingbar {
    transition: width 2s;
  }
</style>
