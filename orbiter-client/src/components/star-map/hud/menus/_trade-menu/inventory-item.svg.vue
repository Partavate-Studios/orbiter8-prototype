<template>
  <!-- A port's line: "Selling Organics / 880 @ 56¢ ea."; compact, one line, when the port trades many goods -->
  <g v-if="compact" fill="#ffffff" font-size="0.8em">
    <text x="-60" y="0" text-anchor="start" fill="#ffffff88">{{ inventory < 0 ? '&#8593;' : '&#8595;' }}</text>
    <text x="-50" y="0" text-anchor="start">{{ goodstype }}</text>
    <text x="58" y="0" text-anchor="end" fill="#ffffff88">{{ Math.abs(inventory) }} @ {{ price.toLocaleString('en-US') }}&cent;</text>
  </g>
  <g v-else fill="#ffffff" font-size="0.9em">
    <text x="-22" y="0" text-anchor="end">{{ buyingOrSelling }}</text>
    <text x="-20" y="0" text-anchor="start">{{ goodstype }}</text>
    <text x="0" y="13" text-anchor="end" fill="#ffffff88">{{ Math.abs(inventory) }} @</text>
    <text x="55" y="13" text-anchor="end" fill="#ffffff88">{{ price.toLocaleString('en-US') }}&cent; ea.</text>
  </g>
</template>

<script>
export default {
  name: 'InventoryItem',
  props: {
    goodstype: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      default: 0
    },
    inventory: {
      type: Number,
      default: 0
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    buyingOrSelling() {
      if (this.inventory > 0) {
        return 'Selling'
      } else if (this.inventory < 0) {
        return 'Buying'
      }
      return ''
    }
  }
}
</script>
