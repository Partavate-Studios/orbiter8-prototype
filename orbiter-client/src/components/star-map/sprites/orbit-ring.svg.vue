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
    :stroke-width="selected ? 0.05 : 0.01"
    :opacity="opacity"
    fill="none"
  />
</template>

<script>
import { mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'

// On-screen radius (pixels) below which a ring is hidden, and above which it's fully shown.
const HIDDEN_BELOW = 6
const SHOWN_ABOVE = 24

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
      const radius = this.r * this.drawnPixelsPerUnit
      const fade = (radius - HIDDEN_BELOW) / (SHOWN_ABOVE - HIDDEN_BELOW)
      return Math.min(1, Math.max(0, fade))
    }
  }
}
</script>
