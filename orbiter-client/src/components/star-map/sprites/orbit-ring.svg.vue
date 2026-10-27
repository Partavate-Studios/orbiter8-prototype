<template>
  <!-- The dotted path a sprite orbits on; bright and thicker for the selected or hovered sprite. Fades out once it's
       too small on screen to read as a ring. -->
  <circle
    v-if="opacity > 0"
    :cx="cx"
    :cy="cy"
    :r="r"
    :stroke="selected ? RING_COLOR.bright : RING_COLOR.faint"
    stroke-dasharray="0.5 1"
    :stroke-width="width"
    :opacity="opacity"
    fill="none"
  />
</template>

<script>
import { mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { RING_COLOR, RING_FAINT, ringOpacity, ringWidth } from '@/libs/sprite-types'

export default {
  name: 'OrbitRing',
  props: {
    cx: { type: Number, default: 0 },
    cy: { type: Number, default: 0 },
    r: { type: Number, required: true },
    /** Selected or under the pointer: drawn bright and thick. */
    selected: { type: Boolean, default: false }
  },
  data() {
    return { RING_COLOR }
  },
  computed: {
    ...mapState(useUIStore, ['drawnPixelsPerUnit']),
    opacity() {
      return ringOpacity(this.r * this.drawnPixelsPerUnit) * (this.selected ? 1 : RING_FAINT)
    },
    width() {
      return ringWidth(this.selected, this.drawnPixelsPerUnit)
    }
  }
}
</script>
