<template>
  <g>
    <icon>
      <space-dock transform="scale(0.065)" />
    </icon>
  </g>
</template>

<script>
import Icon from './_icon-container.svg'
import Station from '../../sprites/station.svg'

export default {
  name: 'SpaceStationIcon',
  components: {
    Station,
    Icon
  },
  data () {
    return {
    }
  }
}
</script>
