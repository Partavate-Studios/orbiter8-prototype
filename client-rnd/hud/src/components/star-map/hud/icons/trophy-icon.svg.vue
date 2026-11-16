<template>
  <g>
    <icon>
      <g fill="#ffffff" stroke="#ffffff">
        <!-- cup -->
        <path stroke-width="0" d="M -10 -13 H 10 V -5 A 10 10 0 0 1 -10 -5 Z" />
        <!-- handles -->
        <path fill="none" stroke-width="2.5" d="M -10 -10 H -14 V -6 A 5 5 0 0 0 -8 0" />
        <path fill="none" stroke-width="2.5" d="M 10 -10 H 14 V -6 A 5 5 0 0 1 8 0" />
        <!-- stem and base -->
        <rect stroke-width="0" x="-2" y="4" width="4" height="6" />
        <rect stroke-width="0" x="-8" y="10" width="16" height="4" rx="1" />
      </g>
    </icon>
  </g>
</template>

<script>
import Icon from './_icon-container.svg'

export default {
  name: 'TrophyIcon',
  components: {
    Icon
  }
}
</script>
