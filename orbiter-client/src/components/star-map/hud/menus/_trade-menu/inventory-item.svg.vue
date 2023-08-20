<template>
  <g fill="#ffffff" font-size="0.9em">
    <text x="-22" y="0" text-anchor="end">{{ buyingOrSelling }}</text>
    <text x="-20" y="0" text-anchor="start">{{ goodstype }}</text>
    <text x="0" y="13" text-anchor="end" fill="#ffffff88">{{ Math.abs(inventory) }} @</text>
    <text x="55" y="13" text-anchor="end" fill="#ffffff88">{{ price }}&cent; ea.</text>
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
    }
  },
  computed: {  
    buyingOrSelling () {
      if (this.inventory > 0) {
        return 'Selling'
      } else if (this.inventory < 0) {
        return 'Buying'
      }
      return '' 
    },

  }
}
</script>
