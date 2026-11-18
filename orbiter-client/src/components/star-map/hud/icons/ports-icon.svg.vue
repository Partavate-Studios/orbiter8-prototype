<template>
  <!-- A port: the station's wheel with a ship coming in to dock -->
  <g>
    <icon>
      <circle cx="-3" cy="2" r="13" fill="#e6dcf5" />
      <circle cx="-3" cy="2" r="8" fill="none" stroke="#3d2a6e" stroke-width="2.4" />
      <path d="M-8.5 -3.5L2.5 7.5M2.5 -3.5L-8.5 7.5" stroke="#3d2a6e" stroke-width="2.4" stroke-linecap="round" />
      <path d="M12 -14L18 -18M14 -9L20 -13" stroke="#e6dcf5" stroke-width="1.6" stroke-linecap="round" opacity="0.7" />
      <path d="M9 -12L14 -16L16 -13L11 -9Z" fill="#e6dcf5" />
    </icon>
  </g>
</template>

<script>
import Icon from './_icon-container.svg'

export default {
  name: 'PortsIcon',
  components: { Icon }
}
</script>
