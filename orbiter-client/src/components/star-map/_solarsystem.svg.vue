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

import { mapGetters, mapMutations } from 'vuex'
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
  watch: {
    gameTime: {
      handler () {
        this.updateTelemetry()
      }
    }
  },
  beforeMount() {
    this.updateTelemetry()
  },
  methods: {
    ...mapMutations('StarMap', [
      'updateAllTelemtry'
    ]),
    updateTelemetry: function () {
      this.updateAllTelemtry()
    }
  },
  computed: {
    ...mapGetters('StarMap', [
      'currentStarSystemId',
      'gameTime',
      'systemObjects'
    ]),
  },
}
</script>
