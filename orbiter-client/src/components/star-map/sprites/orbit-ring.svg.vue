<template>
  <!-- The dotted path a sprite orbits on; thicker for the selected sprite. Fades out once it's
       too small on screen to read as a ring. -->
  <circle
    v-if="opacity > 0"
    :cx="cx"
    :cy="cy"
    :r="r"
    stroke="#c3b3da"
    stroke-dasharray="0.5 1"
    :stroke-width="width"
    :opacity="opacity"
    fill="none"
  />
</template>

<script>
import { mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { ringOpacity, ringWidth } from '@/libs/sprite-types'

export default {
  name: 'OrbitRing',
  props: {
    cx: { type: Number, default: 0 },
    cy: { type: Number, default: 0 },
    r: { type: Number, required: true },
    selected: { type: Boolean, default: false }
  },
  computed: {
    ...mapState(useUIStore, ['drawnPixelsPerUnit']),
    opacity() {
      return ringOpacity(this.r * this.drawnPixelsPerUnit)
    },
    width() {
      return ringWidth(this.selected, this.drawnPixelsPerUnit)
    }
  }
}
</script>
