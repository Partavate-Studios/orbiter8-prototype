<template>
  <g>
    <g font-size="0.8em">
      <rect
        x="-5"
        y="-5"
        width="55"
        height="30"
        rx="5"
        ry="5"
        fill="url(#tabGradient)"
        stroke="#ffffff88"
        stroke-width="0.5"
      />
      <g v-if="quantity > 0">
        <text x="5" y="5" text-anchor="start" fill="#ffffff">&#8594;</text>
        <text x="45" y="5" text-anchor="end" fill="#ffffff">{{ Math.abs(quantity) }}x </text>
        <text x="5" y="16" text-anchor="start" fill="#ffffff">{{ price * quantity * -1 }}&cent;</text>
      </g>
      <g v-if="quantity < 0">
        <text x="45" y="5" text-anchor="end" fill="#ffffff">&#8592;</text>
        <text x="5" y="5" text-anchor="start" fill="#ffffff">{{ Math.abs(quantity) }}x </text>
        <text x="45" y="16" text-anchor="end" fill="#ffffff">{{ price * quantity * -1 }}&cent;</text>
      </g>
    </g>
  </g>
</template>

<script>
export default {
  name: 'TransferTab',
  props: {
    price: {
      type: Number,
      default: 0
    },
    quantity: {
      type: Number,
      default: 0
    }
  }
}
</script>
