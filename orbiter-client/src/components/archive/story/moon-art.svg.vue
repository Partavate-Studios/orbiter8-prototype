<template>
  <!-- The game's moon (sprites/moon.svg.vue at full quality), at any radius, centered. -->
  <g :transform="'scale(' + radius / 4 + ')'">
    <circle r="4" stroke="#c3b3da" stroke-width="0.5" fill="#e5cfff" />
    <g stroke="#c3b3da" stroke-width="0.15" fill="#c3b3da">
      <circle cx="-1.25" cy="1" r="1.5" />
      <circle cx="1" cy="-1.25" r="0.75" />
      <circle cx="1.5" cy="1" r="1" />
      <circle cx="-1.25" cy="-1.75" r="0.5" />
      <circle cx="-3" cy="-1" r="1" />
      <circle cx="3" cy="-0.5" r="1" />
      <circle cx="-1" cy="-3" r="0.75" />
      <circle cx="-0.25" cy="3" r="0.5" />
    </g>
  </g>
</template>

<script>
export default {
  name: 'MoonArt',
  props: {
    radius: { type: Number, default: 4 }
  }
}
</script>
