<template>
  <g transform="">
    <defs>
      <linearGradient id="emptyBlockGradient"
        x1="0%" y1="0%" x2="0%" y2="100%" gradientTransform="rotate(0)">
          <stop offset="0%" stop-color="#c3b3da00" stop-opacity="1"/>
          <stop offset="100%" stop-color="#ffffff00" stop-opacity="1"/>
        </linearGradient>
      <linearGradient id="fullBlockGradient"
        x1="0%" y1="0%" x2="0%" y2="100%" gradientTransform="rotate(0)">
          <stop offset="0%" stop-color="#c3b3da" stop-opacity="1"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="soldBlockGradient"
        x1="0%" y1="0%" x2="0%" y2="100%" gradientTransform="rotate(0)">
          <stop offset="0%" stop-color="#c3b3da" stop-opacity="1"/>
          <stop offset="100%" stop-color="#5c1aae" stop-opacity="1"/>
      </linearGradient>
    </defs>
      <rect
        v-for="n in maxCargoHolds"
        :key="'hold-' + n"
        :x="-6 + (((n-1) % 5)) * 2.5"
        :y="1 - parseInt((n-1) / 5) * 2.5"
        width="2"
        height="2"
        ry="0.5"
        rx="0.5"
        stroke-width="0.2"
        stroke="#ffffff"
        :fill="fillPatternFor(n)" />
  </g>
</template>

<script>

export default {
  name: 'CargoHolds',
  components: {
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
      return Math.min(this.cargoHolds, 35)
    }
  }
}
</script>

<style lang="scss">
</style>
