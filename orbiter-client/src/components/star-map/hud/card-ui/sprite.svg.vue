<template>
  <g>
    <planet v-if="systemObjects[objectId].type == 'planet'" transform="scale(2)" :sprite="sprites[objectId]"></planet>
    <star
      v-if="systemObjects[objectId].type == 'star'"
      transform="scale(0.2)"
      :black-hole="Boolean(systemObjects[objectId].blackHole)"
      :spectral="systemObjects[objectId].spectral"
    ></star>
    <ship v-if="systemObjects[objectId].type == 'ship'" transform="rotate(180) scale(4)" :should-show-engines="false" :fitted="systemObjects[objectId].fitted" />
    <station v-if="systemObjects[objectId].type == 'station' && !systemObjects[objectId].onAsteroid" transform="scale(2.2)" :station="systemObjects[objectId]" />
    <moon v-if="systemObjects[objectId].type == 'moon'" transform="scale(4)"></moon>
    <asteroid
      v-if="systemObjects[objectId].type == 'asteroid'"
      transform="scale(2.2)"
      :composition="systemObjects[objectId].composition"
      :section="0"
      :asteroid="systemObjects[objectId]"
    />
    <g v-if="systemObjects[objectId].type == 'asteroid' && systemObjects[objectId].hasStation" transform="scale(2.2)">
      <station transform="scale(0.367)" :station="systemObjects[systemObjects[objectId].stationKey]" />
    </g>
    <station
      v-if="systemObjects[objectId].type == 'station' && systemObjects[objectId].onAsteroid"
      transform="scale(2.2)"
      :station="systemObjects[objectId]"
    />
    <mining-slots v-if="systemObjects[objectId].type == 'section'" transform="scale(3)" :slots="systemObjects[objectId].slots ?? []" :me="account" />
  </g>
</template>

<script>
import { mapState } from 'pinia'

import Ship from '../../sprites/ship.svg'
import Station from '../../sprites/station.svg'
import Star from '../../sprites/star.svg'
import Moon from '../../sprites/moon.svg'
import Planet from '../../sprites/planet.svg'
import Asteroid from '../../sprites/asteroid.svg'
import MiningSlots from '../../sprites/mining-slots.svg'

import { useStarMapStore } from '@/stores/starmap'
import { usePlayerStore } from '@/stores/player'

export default {
  name: 'Sprite',
  components: {
    Asteroid,
    MiningSlots,
    Ship,
    Star,
    Station,
    Moon,
    Planet
  },
  props: {
    /** The selected object's key (see sdk/system.js objectKey). */
    objectId: { type: String, default: null }
  },
  computed: {
    account() {
      return usePlayerStore().account ?? ''
    },
    ...mapState(useStarMapStore, ['systemObjects', 'sprites'])
  }
}
</script>

<style lang="scss"></style>
