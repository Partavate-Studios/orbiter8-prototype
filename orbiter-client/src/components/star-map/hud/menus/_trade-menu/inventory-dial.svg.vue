<template>
  <g font-size="0.8em">
    <g v-if="portInventory > 0">
      <text x="-100" y="0" text-anchor="start"> Buy {{ label }}</text>
    </g>
    <g v-else-if="portInventory < 0">
      <text x="-100" y="0" text-anchor="start"> Sell {{ label }}</text>
    </g>
    <text x="100" y="0" text-anchor="end"> {{ Math.abs(inventoryToTrade) }} / {{ maxAllowed }}</text>

    <g transform="translate(0 20) scale(1.25)">
      <slider
        :lowest-value="parseInt(0)"
        :highest-value="Math.abs(maxHolds)"
        :highlight-value="Math.abs(maxAllowed)"
        :reverse="getReverse"
        :current-value="Math.abs(inventoryToTrade)"
        @update:percentage="$emit('update:inventoryToTrade', calculatedReturnValue($event))"
        @update:increment="$emit('update:inventoryToTrade', incrementValue())"
        @update:decrement="$emit('update:inventoryToTrade', decrementValue())"
      />
    </g>
  </g>
</template>

<script>
import Slider from './slider.svg'

export default {
  name: 'TradeMenuInventory',
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
  },
  emits: ['update:inventoryToTrade'],
  computed: {
    getReverse() {
      if (this.portInventory < 0) {
        return true
      }
      return false
    }
  },
  methods: {
    calculatedReturnValue($event) {
      return Math.min(parseInt(Math.round($event * this.maxHolds)), this.maxAllowed) * Math.sign(this.portInventory)
    },
    incrementValue() {
      return Math.min(Math.abs(this.inventoryToTrade) + 1, this.maxAllowed) * Math.sign(this.portInventory)
    },
    decrementValue() {
      return Math.max(Math.abs(this.inventoryToTrade) - 1, 0) * Math.sign(this.portInventory)
    }
  }
}
</script>

<style lang="scss"></style>
