<template>
  <g>
    <linearGradient id="engineGradient"
      gradientTransform="rotate(90)"
      x1="0%" y1="0%" x2="100%" y2="0">
        <stop offset="0%" stop-color="#ffaaff" stop-opacity="0.8"/>
        <stop offset="3%" stop-color="#ff88ff" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#ff00ff" stop-opacity="0"/>
      </linearGradient>

    <rect
      x="-400"
      y="1200"
      width="800"
      height="10000"
      ry="200"
      rx="200"
      stroke-width="0"
      fill="url(#engineGradient)" />

    <rect
      x="-2100"
      y="950"
      width="500"
      height="6000"
      ry="200"
      rx="200"
      stroke-width="0"
      fill="url(#engineGradient)" />

    <rect
      x="1600"
      y="950"
      width="500"
      height="6000"
      ry="200"
      rx="200"
      stroke-width="0"
      fill="url(#engineGradient)" />
  </g>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ship-engines',
  computed: {
    ...mapGetters('StarMap', [
      'gameTime',
    ])
  },
}
</script>
