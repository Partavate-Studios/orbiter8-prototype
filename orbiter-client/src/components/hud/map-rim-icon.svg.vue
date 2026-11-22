<template>
  <!-- The galaxy map's icon (map-icon.svg.vue) as a round HUD button's (a phone's Map tab). -->
  <g>
    <icon>
      <map-icon x="-21" y="-21" style="width: 42px; height: 42px" />
    </icon>
  </g>
</template>

<script>
import Icon from '@/components/star-map/hud/icons/_icon-container.svg'
import MapIcon from './map-icon.svg.vue'

export default {
  name: 'MapRimIcon',
  components: { Icon, MapIcon }
}
</script>
