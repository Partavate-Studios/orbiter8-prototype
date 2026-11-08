<template>
  <!-- Black holes (D17): a dark disk, its accretion ring, and a faint glow -->
  <g v-if="blackHole">
    <circle cx="0" cy="0" r="150" fill="none" stroke="#c3b3da" stroke-width="6" stroke-opacity="0.8" />
    <circle cx="0" cy="0" r="175" fill="none" stroke="#c3b3da" stroke-width="2" stroke-opacity="0.35" />
    <circle cx="0" cy="0" r="130" fill="#05010d" />
    <circle cx="0" cy="0" r="140" stroke="#ffffff" stroke-width="0" fill="#ffffff00" />
  </g>
  <!-- A star of a spectral class (sdk/traits.js): its class's colors, and on normal and high graphics
       its glow (wider on high). Without a class (the title's art), the old lavender star. -->
  <g v-else>
    <circle
      v-if="graphicsQuality > 1"
      cx="0"
      cy="0"
      :r="spectral && graphicsQuality > 2 ? 270 : 240"
      stroke-width="0"
      :fill="spectral ? 'url(#starGlow-' + spectral + ')' : 'url(#glowingGradient)'"
      pointer-events="none"
    />
    <circle
      cx="0"
      cy="0"
      r="130"
      :stroke="spectral ? STAR_CLASSES[spectral].core : '#ffffff'"
      stroke-width="0.15"
      :fill="spectral ? 'url(#star-' + spectral + ')' : 'url(#starGradient)'"
    />
    <circle cx="0" cy="0" r="140" stroke="#ffffff" stroke-width="0" fill="#ffffff00" />
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { STAR_CLASSES } from '@/libs/palette'

export default {
  name: 'Star',
  props: {
    /** Draw a black hole instead of a star. */
    blackHole: { type: Boolean, default: false },
    /** Its spectral class, O to M (sdk/traits.js); none: the title's lavender star. */
    spectral: { type: String, default: null }
  },
  data() {
    return { STAR_CLASSES }
  },
  computed: {
    ...mapState(useConfigStore, ['graphicsQuality'])
  }
}
</script>
