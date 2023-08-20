<template>
  <g>
    <icon>
      <ship transform="translate(0 2) scale(3)" />
    </icon>
  </g>
</template>

<script>
import Icon from './_icon-container.svg'
import Ship from '../../sprites/ship.svg'

export default {
  name: 'ShipIcon',
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
