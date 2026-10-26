<template>
  <!-- One ship of the Orbiter 8 class, nose up, about 9 units across (scale it with a parent transform). -->
  <g transform="scale(0.002)">
    <g v-if="engines">
      <rect
        v-for="(flame, index) in design.engines"
        :key="index"
        :x="flame[0]"
        :y="flame[1]"
        :width="flame[2]"
        :height="flame[3]"
        rx="200"
        ry="200"
        fill="url(#engineGradient)"
      />
    </g>
    <path :transform="design.transform" :d="design.d" :fill="color" />
  </g>
</template>

<script>
import { SHIP_DESIGNS } from './ship-designs'

export default {
  name: 'FleetShip',
  props: {
    /** One of SHIP_DESIGNS: orbiter8, polygon, boba, moonbeam. */
    type: {
      type: String,
      default: 'orbiter8'
    },
    engines: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: '#ffffff'
    }
  },
  computed: {
    design() {
      return SHIP_DESIGNS[this.type] ?? SHIP_DESIGNS.orbiter8
    }
  }
}
</script>
