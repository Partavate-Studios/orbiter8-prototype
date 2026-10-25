<template>
  <!-- The parts of the star system that live in the world SVG: the star, the orbit rings centered
       on it (they never move) and anything orbiting the star directly. Planets and everything
       orbiting them are drawn in their own layers (planet-layers.vue).
       All rings come first, so no ring is ever drawn across a body. -->
  <g v-if="currentStarSystemId > 0">
    <template v-for="(object, key) in systemObjects" v-bind:key="'ring-' + key">
      <orbit-ring v-if="orbitsStar(object)" :r="object.orbit.radius" :selected="key === selected" />
    </template>
    <template v-for="(object, key) in systemObjects" v-bind:key="'sprite-' + key">
      <sprite-transform
        v-if="object.type !== 'planet' && !orbitsPlanet(object)"
        :sprite="sprites[key]"
        :objectIndex="key"
        :type="object.type"
      >
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
    ...mapState(useStarMapStore, ['currentStarSystemId', 'systemObjects', 'sprites']),
    ...mapState(useUIStore, ['selected'])
  },
  methods: {
    orbitsStar(object) {
      return object.type !== 'star' && !this.orbitsPlanet(object)
    },
    orbitsPlanet(object) {
      return Boolean(object.orbiting) && this.systemObjects[object.orbiting]?.type === 'planet'
    }
  }
}
</script>
