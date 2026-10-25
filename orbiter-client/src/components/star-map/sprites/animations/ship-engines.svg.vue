<template>
  <g>
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
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'

export default {
  name: 'ship-engines',
  computed: {
    ...mapState(useStarMapStore, [
      'gameTime',
    ])
  },
}
</script>
