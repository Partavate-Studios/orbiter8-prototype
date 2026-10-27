<template>
  <!-- One ship of the Orbiter 8 class, nose up, about 9 units across. A transform passed in lands on the
       outer group; the inner one scales the art down. -->
  <g>
    <g transform="scale(0.002)">
      <g v-if="engines" class="flames">
        <rect
          v-for="(plume, index) in design.engines"
          :key="index"
          :x="plume[0]"
          :y="plume[1]"
          :width="plume[2]"
          :height="plume[3]"
          rx="200"
          ry="200"
          :fill="'url(#' + flame + ')'"
        />
      </g>
      <path :transform="design.transform" :d="design.d" :fill="color" />
    </g>
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
    /** The gradient (svg-defs.vue) the engine flames are filled with. */
    flame: {
      type: String,
      default: 'engineGradient'
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
