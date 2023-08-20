<template>
  <g transform="scale(4)">
    <defs>
      <mask id="Mask">
        <rect x="-40" y="-20" width="80" height="40" fill="#ffffff"  />
      </mask>

    </defs>
    <g mask="url(#Mask)" >
      <g transform="rotate(0) translate(24 4) scale(3.5)" opacity="0.1"><ship /></g>
      <g transform="rotate(0) translate(-24 -8) scale(3.5)" opacity="0.5"><station /></g>

      <g transform="rotate(0) translate(24 4) scale(3.5)" opacity="0.75"><ship-outline /></g>
      <g transform="rotate(0) translate(-24 -8) scale(3.5)" opacity="0.75"><station-outline /></g>

      <line x1="2" y1="-8" x2="16" y2="-8" stroke="#ffffff88" stroke-width="0.5" />
      <line x1="2" y1="-6" x2="16" y2="-6" stroke="#ffffff88" stroke-width="0.5" />
      <cargo-holds transform="translate(24 4)" :cargoHolds="maxCargoHolds" :predictedLoad="predictedLoad" :existingLoad="existingLoad" />
    </g>
    <rect x="-41" y="-21" rx="1" ry="1" width="82" height="42" fill="#00000011" stroke-width="0.5" stroke="#c3b3da44" />
  </g>
</template>

<script>
import Ship from '../../../sprites/ship.svg'
import Station from '../../../sprites/station.svg'
import ShipOutline from '../../../sprites/ship-outline.svg'
import StationOutline from '../../../sprites/station-outline.svg'
import CargoHolds from '../widgets/cargo-holds.svg'

export default {
  name: 'Cargo',
  components: {
    Ship,
    Station,
    ShipOutline,
    StationOutline,
    CargoHolds
  },
  props: {
    cargoHolds: {
      type: Number,
      default: 100
    },
    predictedLoad: {
      type: Number,
      default: 20
    },
    existingLoad: {
      type: Number,
      default: 0
    }
  },
  methods: {
    fillPatternFor (n) {

      if (n <= (this.predictedLoad / this.cargoHolds * this.maxCargoHolds)) {
        return "url('#fullBlockGradient')"
      } else if (n <= (this.existingLoad / this.cargoHolds * this.maxCargoHolds)) {
        return "url('#soldBlockGradient')"
      }
      return "url('#emptyBlockGradient')"

    }
  },
  computed: {
    maxCargoHolds () {
      return Math.min(this.cargoHolds, 24)
    }
  }
}
</script>

<style lang="scss">
</style>
