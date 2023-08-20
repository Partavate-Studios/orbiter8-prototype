<template>
  <g>
    <circle
      cx="0"
      cy="0"
      :r="lifeRate * lifeRate * 2.5"
      stroke="#ffffff"
      fill="#c3b3da35"
      stroke-width="0.01"
      />
  </g>
</template>

<script>

export default {
  name: 'star',
  props: {
    lifeRate: {
      default: 1
    }
  },
  data () {
    return {
    }
  }
}
</script>
