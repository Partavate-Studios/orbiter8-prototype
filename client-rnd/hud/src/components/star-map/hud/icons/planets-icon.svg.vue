<template>
  <g>
    <icon>
      <circle cx="16" cy="-6" r="6" stroke="#c3b3da" stroke-width="0.25" fill="url(#planet-4)" />
      <circle cx="6" cy="-2" r="8" stroke="#c3b3da" stroke-width="0.25" fill="url(#planet-3)" />
      <circle cx="-8" cy="4" r="12" stroke="#c3b3da" stroke-width="0.25" fill="url(#planet-0)" />
    </icon>
  </g>
</template>

<script>
import Icon from './_icon-container.svg'

export default {
  name: 'PlanetsIcon',
  components: {
    Icon
  }
}
</script>
