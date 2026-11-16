<template>
  <g>
    <icon>
      <!-- Two crossed blades: sieges -->
      <g fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round">
        <path d="M -12 -12 L 9 9" />
        <path d="M 12 -12 L -9 9" />
        <path d="M 5 11 L 11 5" />
        <path d="M -5 11 L -11 5" />
      </g>
    </icon>
  </g>
</template>

<script>
import Icon from './_icon-container.svg'

export default {
  name: 'SiegesIcon',
  components: {
    Icon
  }
}
</script>
