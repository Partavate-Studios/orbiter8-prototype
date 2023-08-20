<template>
  <g>
    <icon>
      <moon transform="translate(0 2) scale(3)" />
    </icon>
  </g>
</template>

<script>
import Icon from './_icon-container.svg'
import Moon from '../../sprites/moon.svg'

export default {
  name: 'Moon',
  components: {
    Ship,
    Icon
  },
  data () {
    return {
    }
  }
}
</script>
