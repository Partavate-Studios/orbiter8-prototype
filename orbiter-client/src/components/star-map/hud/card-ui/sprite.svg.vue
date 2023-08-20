<template>
  <g>
    <planet v-if="systemObjects[objectId].type == 'planet'" transform="scale(2)" :planet="systemObjects[objectId]"></planet>
    <star v-if="systemObjects[objectId].type == 'star'" transform="scale(0.2)"></star>
    <ship v-if="systemObjects[objectId].type == 'ship'" transform="rotate(180) scale(4)" :show-engines="false" />
    <station v-if="systemObjects[objectId].type == 'station'" transform="scale(0.075)" />
    <moon v-if="systemObjects[objectId].type == 'moon'" transform="scale(4)"></moon>
  </g>
</template>

<script>

import Ship from '../../sprites/ship.svg'
import Station from '../../sprites/station.svg'
import Star from '../../sprites/star.svg'
import Moon from '../../sprites/moon.svg'
import Planet from '../../sprites/planet.svg'

import { mapGetters } from 'vuex'

export default {
  name: 'Sprite',
  components: {
    Ship,
    Star,
    Station,
    Moon,
    Planet,
  },
  props: {
    objectId: null,
  },
  methods: {
  },
  computed: {
    ...mapGetters('StarMap', [
      'systemObjects'
    ]),
  }
}
</script>

<style lang="scss">
</style>
