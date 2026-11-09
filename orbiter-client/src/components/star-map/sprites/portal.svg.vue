<template>
  <!-- A black hole: Koda's portal art from the Multiverse Portals demo (orbiter8-multiverse-bobabeam,
       assets/portal.svg.vue), meant as a black hole: a lavender core fading to black, a dark halo, and
       two rings of dark swirls turning slowly the other way round. Drawn at `radius` (its core's), at
       the origin. The swirls turn on normal and high graphics and hold still on low (each turn
       repaints them). Its gradients are in svg-defs.vue. -->
  <g :transform="'scale(' + radius / 16 + ')'">
    <circle r="16" stroke="#c3b3da" stroke-opacity="0.3" stroke-width="0.25" fill="url(#portalGradient)" />
    <circle r="24" stroke-width="0" fill="url(#portalDarkening)" pointer-events="none" />
    <g>
      <path
        v-for="n in 10"
        :key="'a' + n"
        :transform="'rotate(' + n * 36 + ')'"
        d="M 2 2 Q 7 -15 7 -5"
        stroke="url(#portalDarkline)"
        stroke-width="10"
        fill="none"
      />
      <animateTransform
        v-if="turning"
        attributeName="transform"
        type="rotate"
        from="360"
        to="0"
        dur="30s"
        repeatCount="indefinite"
      />
    </g>
    <g>
      <path
        v-for="n in 6"
        :key="'b' + n"
        :transform="'rotate(' + n * 60 + ')'"
        d="M 2 2 Q 7 -12 5 -2"
        stroke="url(#portalDarkline)"
        stroke-width="10"
        fill="none"
      />
      <animateTransform
        v-if="turning"
        attributeName="transform"
        type="rotate"
        from="360"
        to="0"
        dur="120s"
        repeatCount="indefinite"
      />
    </g>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'

export default {
  name: 'Portal',
  props: {
    /** The core's radius, in the parent's units. */
    radius: { type: Number, default: 16 },
    /** Whether the swirls may turn (off for tiny copies, where it can't be seen). */
    animate: { type: Boolean, default: true }
  },
  computed: {
    ...mapState(useConfigStore, ['graphicsQuality']),
    turning() {
      return this.animate && this.graphicsQuality > 1
    }
  }
}
</script>
