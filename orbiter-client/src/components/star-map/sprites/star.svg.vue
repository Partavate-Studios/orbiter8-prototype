<template>
  <!-- Black holes (D17): a dark disk, its accretion ring, and a faint glow -->
  <g v-if="blackHole">
    <circle cx="0" cy="0" r="150" fill="none" stroke="#c3b3da" stroke-width="6" stroke-opacity="0.8" />
    <circle cx="0" cy="0" r="175" fill="none" stroke="#c3b3da" stroke-width="2" stroke-opacity="0.35" />
    <circle cx="0" cy="0" r="130" fill="#05010d" />
    <circle cx="0" cy="0" r="140" stroke="#ffffff" stroke-width="0" fill="#ffffff00" />
  </g>
  <g v-else>
    <circle cx="0" cy="0" r="130" stroke="#ffffff" stroke-width="0.15" fill="url(#starGradient)" />
    <circle cx="0" cy="0" r="140" stroke="#ffffff" stroke-width="0" fill="#ffffff00" />

    <circle
      v-if="graphicsQuality > 1"
      cx="0"
      cy="0"
      r="240"
      stroke-width="0"
      fill="url(#glowingGradient)"
      pointer-events="none"
    />
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'

export default {
  name: 'Star',
  props: {
    /** Draw a black hole instead of a star. */
    blackHole: { type: Boolean, default: false }
  },
  computed: {
    ...mapState(useConfigStore, ['graphicsQuality'])
  }
}
</script>
