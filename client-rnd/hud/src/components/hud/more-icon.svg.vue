<template>
  <!-- More: three dots, in the HUD's round button. -->
  <g>
    <icon>
      <circle cx="-13" r="4" fill="#ffffff" /><circle r="4" fill="#ffffff" /><circle cx="13" r="4" fill="#ffffff" />
    </icon>
  </g>
</template>

<script>
import Icon from '@/components/star-map/hud/icons/_icon-container.svg'

export default {
  name: 'MoreIcon',
  components: { Icon }
}
</script>
