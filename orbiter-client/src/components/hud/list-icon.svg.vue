<template>
  <!-- The list of what's in the system, as a round HUD button's icon (a phone's Objects tab). -->
  <g>
    <icon>
      <path :d="SMALL_ICONS.all" transform="scale(1.6)" fill="none" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
    </icon>
  </g>
</template>

<script>
import Icon from '@/components/star-map/hud/icons/_icon-container.svg'
import { SMALL_ICONS } from '@/libs/small-icons'

export default {
  name: 'ListIcon',
  components: { Icon },
  data() {
    return { SMALL_ICONS }
  }
}
</script>
