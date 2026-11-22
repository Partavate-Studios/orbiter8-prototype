<template>
  <!-- The galaxy map's icon (Koda, 2026-11-21: the old one's curved arcs were from slingshot days):
       three hexes of the map, your star in one, and a straight jump to its neighbor. -->
  <svg class="map-icon" viewBox="-12 -12 24 24" aria-hidden="true">
    <polygon v-for="(points, i) in HEXES" :key="i" :points="points" :opacity="i === 1 ? 0.45 : 0.9" />
    <line x1="-5.4" y1="3" x2="0" y2="-6.4" class="jump" />
    <circle cx="-5.4" cy="3" r="2.2" class="here" />
    <circle cx="0" cy="-6.4" r="1.6" class="there" />
  </svg>
</template>

<script>
const R = 6.2
const hex = (x, y) => [0, 1, 2, 3, 4, 5].map((i) => `${(x + R * Math.cos((Math.PI / 3) * i + Math.PI / 6)).toFixed(1)},${(y + R * Math.sin((Math.PI / 3) * i + Math.PI / 6)).toFixed(1)}`).join(' ')
const DX = (R * Math.sqrt(3)) / 2
const HEXES = [hex(-DX, 3), hex(DX, 3), hex(0, 3 - R * 1.5)]

export default {
  name: 'MapIcon',
  data() {
    return { HEXES }
  }
}
</script>

<style scoped>
.map-icon {
  display: block;
  width: 26px;
  height: 26px;
}
polygon {
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.2;
}
.jump {
  stroke: var(--o8-yellow-light);
  stroke-width: 1.5;
  stroke-dasharray: 2 2;
}
.here {
  fill: #ffffff;
}
.there {
  fill: var(--o8-yellow-light);
}
</style>
