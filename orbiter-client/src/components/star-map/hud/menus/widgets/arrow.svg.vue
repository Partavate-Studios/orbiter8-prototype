<template>
  <g stroke-linecap="round" >
    <g stroke-width="4" stroke="#1e083a">
      <line
        :x1="2"
        y1="0"
        :x2="-2"
        y2="4" />
      <line
        :x1="2"
        y1="0"
        :x2="-2"
        y2="-4" />
    </g>
    <g stroke-width="1.5" stroke="#ffffff">
      <line
        :x1="2"
        y1="0"
        :x2="-2"
        y2="4" />
      <line
        :x1="2"
        y1="0"
        :x2="-2"
        y2="-4" />
    </g>

  </g>
</template>

<script>

export default {
  name: 'Arrow',
  components: {
  },
  data () {
    return {
    }
  },

}
</script>

<style lang="scss">
</style>
