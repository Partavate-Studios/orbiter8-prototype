<template>
  <!-- The parts of the star system that live in the world SVG: the star, the planets' orbit rings
       (centered on the star, so they never move) and anything orbiting the star directly.
       Planets and everything orbiting them are drawn in their own layers (planet-layers.vue). -->
  <g v-if="currentStarSystemId > 0">
    <template v-for="(sprite, index) in systemObjects" v-bind:key="'sprite-' + index">
      <orbit-ring v-if="sprite.type === 'planet'" :r="sprite.distance" :selected="index === selected" />
      <sprite-transform v-else-if="!orbitsPlanet(sprite)" :sprite="sprite" :objectIndex="index" :type="sprite.type">
      </sprite-transform>
    </template>
  </g>
</template>

<script>
import { mapState } from 'pinia'

import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import SpriteTransform from './sprites/sprite-transform.svg'
import OrbitRing from './sprites/orbit-ring.svg.vue'

export default {
  name: 'SolarSystem',
  components: {
    SpriteTransform,
    OrbitRing
  },
  computed: {
    ...mapState(useStarMapStore, ['currentStarSystemId', 'systemObjects']),
    ...mapState(useUIStore, ['selected'])
  },
  methods: {
    orbitsPlanet(sprite) {
      return Boolean(sprite.orbiting) && this.systemObjects[sprite.orbiting]?.type === 'planet'
    }
  }
}
</script>
