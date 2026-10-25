<template>
  <!-- The bodies that live in the world SVG: the star and anything orbiting it directly. Planets
       and everything orbiting them are drawn in their own layers (planet-layers.vue); the orbit
       rings around the star are on the guides canvas, under every body. -->
  <g v-if="currentStarSystemId > 0">
    <template v-for="(object, key) in systemObjects" :key="'sprite-' + key">
      <sprite-transform
        v-if="object.type !== 'planet' && !orbitsPlanet(object)"
        :sprite="sprites[key]"
        :object-index="key"
        :type="object.type"
      >
      </sprite-transform>
    </template>
  </g>
</template>

<script>
import { mapState } from 'pinia'

import { useStarMapStore } from '@/stores/starmap'
import SpriteTransform from './sprites/sprite-transform.svg'

export default {
  name: 'SolarSystem',
  components: {
    SpriteTransform
  },
  computed: {
    ...mapState(useStarMapStore, ['currentStarSystemId', 'systemObjects', 'sprites'])
  },
  methods: {
    orbitsPlanet(object) {
      return Boolean(object.orbiting) && this.systemObjects[object.orbiting]?.type === 'planet'
    }
  }
}
</script>
