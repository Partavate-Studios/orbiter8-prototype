<template>
  <!-- The trade menu's drawing: the port on the left, your ship's hold in the middle with every hold
       drawn (round 2, item 6), your ship on the right, and an arrow for each good changing hands, in its
       color: toward the hold for what you buy, back to the port for what you sell. -->
  <svg class="trade-scene" :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="description">
    <rect x="0.5" y="0.5" :width="W - 1" :height="H - 1" rx="6" fill="#00000022" stroke="#c3b3da33" />
    <!-- the port: the station's own outline -->
    <g :transform="`translate(${portX} ${H / 2})`">
      <g :transform="`scale(${portScale})`" opacity="0.5"><station /></g>
      <g :transform="`scale(${portScale})`" opacity="0.8"><station-outline /></g>
    </g>
    <!-- the trade: one arrow per good -->
    <g font-size="12" font-family="Ubuntu, sans-serif">
      <g v-for="(flow, i) in drawnFlows" :key="flow.id" :transform="`translate(0 ${flowY(i)})`">
        <line :x1="flowLeft" :x2="flowRight" y1="0" y2="0" :stroke="flow.color" stroke-width="2.5" stroke-dasharray="7 5" stroke-linecap="round" />
        <path v-if="flow.units > 0" :d="`M${flowRight - 2} -5L${flowRight + 7} 0L${flowRight - 2} 5Z`" :fill="flow.color" />
        <path v-else :d="`M${flowLeft + 2} -5L${flowLeft - 7} 0L${flowLeft + 2} 5Z`" :fill="flow.color" />
        <text :x="(flowLeft + flowRight) / 2" y="-5" text-anchor="middle" fill="#f1eefa">{{ Math.abs(flow.units) }} {{ flow.code }}</text>
      </g>
      <text v-if="!flows.length" :x="(flowLeft + flowRight) / 2" :y="H / 2 + 4" text-anchor="middle" fill="#9088aa">
        {{ narrow ? 'Slide a good' : 'Slide a good to trade it' }}
      </text>
    </g>
    <!-- your ship's hold: every hold, filled as it will be -->
    <g :transform="`translate(${bayX} ${bayY})`">
      <rect :x="-6" :y="-6" :width="bayW + 12" :height="bayH + 12" rx="8" fill="#0d0719aa" stroke="#e6dcf5" stroke-opacity="0.45" />
      <hold-grid :total="holds" :segments="segments" :width="bayW" :height="bayH" />
    </g>
    <!-- your ship, nose to the right -->
    <g :transform="`translate(${shipX} ${H / 2}) rotate(90) scale(${shipScale})`">
      <g opacity="0.25"><ship /></g>
      <g opacity="0.85"><ship-outline /></g>
    </g>
  </svg>
</template>

<script>
import Ship from '@/components/star-map/sprites/ship.svg'
import Station from '@/components/star-map/sprites/station.svg'
import ShipOutline from '@/components/star-map/sprites/ship-outline.svg'
import StationOutline from '@/components/star-map/sprites/station-outline.svg'
import HoldGrid from '../hold-grid.svg.vue'

export default {
  name: 'TradeScene',
  components: { Ship, Station, ShipOutline, StationOutline, HoldGrid },
  props: {
    stationKey: { type: String, default: null },
    /** { id, code, color, units } per good changing hands (units negative: sold). */
    flows: { type: Array, default: () => [] },
    holds: { type: Number, default: 0 },
    /** The holds as they'll be (hold-grid.svg.vue). */
    segments: { type: Array, default: () => [] },
    narrow: { type: Boolean, default: false }
  },
  computed: {
    W() {
      return this.narrow ? 360 : 700
    },
    H() {
      return this.narrow ? 120 : 150
    },
    portX() {
      return this.narrow ? 46 : 80
    },
    portScale() {
      return this.narrow ? 5.2 : 7.5
    },
    flowLeft() {
      return this.portX + (this.narrow ? 44 : 64)
    },
    flowRight() {
      return this.bayX - (this.narrow ? 16 : 22)
    },
    bayW() {
      return this.narrow ? 120 : 250
    },
    bayH() {
      return this.narrow ? 66 : 90
    },
    bayX() {
      return this.shipX - (this.narrow ? 38 : 56) - this.bayW
    },
    bayY() {
      return (this.H - this.bayH) / 2
    },
    shipX() {
      return this.W - (this.narrow ? 34 : 56)
    },
    shipScale() {
      return this.narrow ? 4.2 : 6.5
    },
    /** As many arrows as fit; past that, the first ones (the rows list them all). */
    drawnFlows() {
      const room = Math.floor((this.H - 24) / 17)
      return this.flows.slice(0, room)
    },
    description() {
      if (!this.flows.length) return 'The port and your ship: nothing changing hands yet'
      return this.flows.map((flow) => (flow.units > 0 ? 'buying ' : 'selling ') + Math.abs(flow.units) + ' ' + flow.code).join(', ')
    }
  },
  methods: {
    flowY(i) {
      const n = this.drawnFlows.length
      const gap = Math.min(26, (this.H - 30) / Math.max(1, n - 1))
      return this.H / 2 + 6 + (i - (n - 1) / 2) * gap
    }
  }
}
</script>

<style scoped>
.trade-scene {
  display: block;
  width: 100%;
  height: auto;
}
</style>
