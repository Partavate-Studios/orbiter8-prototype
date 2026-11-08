<template>
  <g>
    <icon>
      <g transform="scale(0.1)">
        <circle cx="0" cy="0" r="170" stroke-width="0" :fill="glowFill" stroke="none" />
        <circle cx="0" cy="0" r="62" stroke-width="3" :fill="starFill" stroke="#ffffffaa" />
      </g>
    </icon>
  </g>
</template>

<script>
import Icon from './_icon-container.svg'
import { useStarMapStore } from '@/stores/starmap'
import { STAR_KEY } from '@/sdk/system'

// The top-right button while the star isn't selected (it becomes JumpIcon once it is), drawn in the
// star's spectral colors (sdk/traits.js).
export default {
  name: 'StarIcon',
  components: {
    Icon
  },
  computed: {
    spectral() {
      return useStarMapStore().systemObjects[STAR_KEY]?.spectral
    },
    starFill() {
      return this.spectral ? `url(#star-${this.spectral})` : 'url(#starGradient)'
    },
    glowFill() {
      return this.spectral ? `url(#starGlow-${this.spectral})` : 'url(#glowingGradient)'
    }
  }
}
</script>
