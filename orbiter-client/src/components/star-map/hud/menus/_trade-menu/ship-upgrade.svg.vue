<template>
  <g transform="scale(4)">
    <g mask="url(#tradeTabMask)">
      <line x1="-20" y1="-19" x2="28" y2="-19" stroke="#ffffff88" stroke-width="1" stroke-dasharray="0.75 0.25" />

      <g transform="rotate(0) translate(4 4) scale(3.5)" opacity="0.1"><ship /></g>
      <g transform="rotate(0) translate(-54 -8) scale(3.5)" opacity="0.5"><station /></g>

      <g transform="rotate(0) translate(4 4) scale(3.5)" opacity="0.75"><ship-outline /></g>
      <g transform="rotate(0) translate(-54 -8) scale(3.5)" opacity="0.75"><station-outline /></g>

      <line x1="-28" y1="-8" x2="-21" y2="-8" stroke="#ffffff88" stroke-width="0.5" />
      <line x1="-28" y1="-6" x2="-21" y2="-6" stroke="#ffffff88" stroke-width="0.5" />

      <line x1="-18" y1="-18" x2="-18" y2="10" stroke="#ffffff88" stroke-width="0.5" />
      <line x1="-20" y1="-18" x2="-20" y2="10" stroke="#ffffff88" stroke-width="0.5" />

      <line x1="28" y1="-18" x2="28" y2="10" stroke="#ffffff88" stroke-width="0.5" />
      <line x1="26" y1="-18" x2="26" y2="10" stroke="#ffffff88" stroke-width="0.5" />

      <line x1="-17" y1="-6" x2="-5" y2="-6" stroke="#ffffff88" stroke-width="0.5" stroke-dasharray="0.75 0.25" />
      <line x1="-17" y1="-5.5" x2="-5" y2="-5.5" stroke="#ffffff88" stroke-width="0.5" stroke-dasharray="0.5 0.5" />

      <line x1="13" y1="-6" x2="25" y2="-6" stroke="#ffffff88" stroke-width="0.5" stroke-dasharray="0.75 0.25" />
      <line x1="13" y1="-5.5" x2="25" y2="-5.5" stroke="#ffffff88" stroke-width="0.5" stroke-dasharray="0.5 0.5" />

      <line x1="-4" y1="-2" x2="-4" y2="-9" stroke="#ffffffaa" stroke-width="1.5" />
      <line x1="12" y1="-2" x2="12" y2="-9" stroke="#ffffffaa" stroke-width="1.5" />

      <line x1="-18" y1="-13" x2="-13" y2="-19" stroke="#ffffff66" stroke-width="0.5" />
      <line x1="26" y1="-13" x2="21" y2="-19" stroke="#ffffff66" stroke-width="0.5" />

      <cargo-holds
        transform="translate(4 4)"
        :cargo-holds="cargoHolds"
        :predicted-load="predictedLoad"
        :existing-load="existingLoad"
      />
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
      default: 0
    },
    existingLoad: {
      type: Number,
      default: 0
    }
  },
  computed: {},
  methods: {}
}
</script>

<style lang="scss"></style>
