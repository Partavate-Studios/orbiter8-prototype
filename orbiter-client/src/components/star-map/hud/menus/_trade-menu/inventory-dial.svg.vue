<template>
  <g transform="" font-size="0.8em">
    <g v-if="portInventory > 0">
        <text x="-100" y="0" text-anchor="start">
            Buy {{ label }}</text>
    </g>
    <g v-else-if="portInventory < 0">
        <text x="-100" y="0" text-anchor="start">
            Sell {{ label }}</text>
    </g>
        <text x="100" y="0" text-anchor="end">
            {{ Math.abs(inventoryToTrade) }} / {{ maxAllowed }}</text>

    <g transform="translate(0 20) scale(1.25)">
      <slider
        v-on:update:percentage="$emit('update:inventoryToTrade', calculatedReturnValue($event))"
        v-on:update:increment="$emit('update:inventoryToTrade', incrementValue())"
        v-on:update:decrement="$emit('update:inventoryToTrade', decrementValue())"
        :lowestValue="parseInt(0)"
        :highestValue="Math.abs(maxHolds)"
        :highlightValue="Math.abs(maxAllowed)"
        :reverse="getReverse"
        :currentValue="Math.abs(inventoryToTrade)" />
    </g>

  </g>
</template>

<script>
import Slider from './slider.svg'

export default {
  name: 'TradeMenuInventory',
  data () {
    return {
    }
  },
  methods: {
    calculatedReturnValue ($event) {
      return Math.min(parseInt(Math.round($event * this.maxHolds)), this.maxAllowed) * Math.sign(this.portInventory)
    },
    incrementValue() {
      return Math.min(Math.abs(this.inventoryToTrade) + 1, this.maxAllowed) * Math.sign(this.portInventory)
    },
    decrementValue() {
      return Math.max(Math.abs(this.inventoryToTrade) - 1, 0) * Math.sign(this.portInventory)
    },
  },
  computed: {
    getReverse() {
      if (this.portInventory < 0) {
        return true
      }
      return false
    }
  },
  components: {
    Slider
  },
  props: {
    portInventory: {
      type: Number,
      default: 0
    },
    inventoryToTrade: {
      type: Number,
      default: 0
    },
    maxHolds: {
      type: Number,
      default: 0
    },
    maxAllowed: {
      type: Number,
      default: 0
    },
    label: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss">
</style>
