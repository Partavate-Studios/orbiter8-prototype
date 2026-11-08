<template>
  <g>
    <icon>
      <g transform="scale(0.1)">
        <circle cx="0" cy="0" r="150" stroke-width="0" :fill="spectral ? `url(#starGlow-${spectral})` : 'url(#glowingGradient)'" stroke="none" />
        <circle cx="0" cy="0" r="36" stroke-width="2" :fill="spectral ? `url(#star-${spectral})` : 'url(#starGradient)'" stroke="#ffffffaa" />
        <g v-for="(neighbor, index) in neighbors" :key="index">
          <g v-if="neighbor.exists" :transform="'rotate(' + index * 30 + ')'">
            <g stroke="#ffffff" stroke-width="8">
              <path d="M 0 -70 Q 70 -70 150 50" stroke="#ffffff44" fill="none" />
            </g>
            <g :transform="'translate(165 65)'">
              <g :transform="'rotate(' + index * -30 + ')'">
                <circle cx="0" cy="0" r="22" stroke-width="0" fill="url(#glowingGradient)" stroke="none" />
                <circle cx="0" cy="0" r="20" stroke-width="2" fill="url(#starGradient)" stroke="#ffffffaa" />
              </g>
            </g>
          </g>
        </g>
      </g>
    </icon>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import Icon from './_icon-container.svg'
import { STAR_KEY } from '@/sdk/system'

export default {
  name: 'JumpIcon',
  components: {
    Icon
  },
  computed: {
    ...mapState(useStarMapStore, ['neighbors']),
    /** The star's spectral class (sdk/traits.js), for the center of the icon. */
    spectral() {
      return useStarMapStore().systemObjects[STAR_KEY]?.spectral
    }
  }
}
</script>
