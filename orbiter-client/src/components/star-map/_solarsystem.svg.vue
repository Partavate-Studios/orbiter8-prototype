<template>
  <g v-if="currentStarSystemId > 0">
    <g
      v-for="(sprite, index) in systemObjects"
      v-bind:key="'sprite-' + index">
      <sprite-transform
        :sprite="sprite"
        :objectIndex="index"
        :type="sprite.type">
      </sprite-transform>
    </g>
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
  data () {
    return {
    }
  },

  computed: {
    ...mapState(useStarMapStore, [
      'currentStarSystemId',
      'systemObjects'
    ]),
  },
}
</script>
