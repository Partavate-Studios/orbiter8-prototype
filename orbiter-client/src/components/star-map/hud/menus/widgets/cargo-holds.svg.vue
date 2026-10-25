<template>
  <g transform="">
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
