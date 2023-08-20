<template>
  <g v-if="objectId != null">
    <card-background />
  </g>
</template>

<script>
import CardBackground from '../card-background.svg'

export default {
  name: 'TradeMenu',
  components: {
      CardBackground
  },
  data () {
    return {
      equipmentToTrade: 0,
      fuelToTrade: 0,
      organicsToTrade: 0,
      pending: false
    }
  },
  props: {
    objectId: null
  },
  methods: {
  },
  computed: {
  },
}
</script>

<style lang="scss">
</style>
