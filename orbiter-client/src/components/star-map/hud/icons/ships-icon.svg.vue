<template>
  <g>
    <icon>
      <ship transform="translate(16 -6) scale(1)" />
      <ship transform="translate(6 0) scale(1.5)" />
      <ship transform="translate(-8 8) scale(2)" />
    </icon>
  </g>
</template>

<script>
import Icon from './_icon-container.svg'
import Ship from '../../sprites/ship.svg'

export default {
  name: 'ShipsIcon',
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
