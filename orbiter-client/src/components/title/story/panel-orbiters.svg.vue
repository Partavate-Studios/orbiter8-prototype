<template>
  <!-- Panel 6: the Orbiters of the 2090s. An Orbiter slings from planet to planet along a dotted route,
       out from the sun on the left to the dashed edge of the solar system on the right, where it stops:
       the edge flares as the ship reaches it. -->
  <svg class="art wide" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g transform="translate(-520 0) scale(0.45)"><star /></g>
    <g v-for="planet in planets" :key="planet.name" :transform="'translate(' + planet.x + ' ' + planet.y + ')'">
      <story-planet :planet-class="planet.cls" :radius="planet.r" :rings="planet.rings" />
    </g>

    <!-- the edge of the sun's reach -->
    <circle cx="-900" cy="0" r="1290" class="edge" />

    <!-- the slingshot route, then the ship on it -->
    <path :d="route" class="route" />
    <g class="ship">
      <g transform="scale(2.4)"><fleet-ship type="orbiter8" engines flame="engineTrailGradient" /></g>
    </g>
  </svg>
</template>

<script>
import Star from '@/components/star-map/sprites/star.svg'
import StoryPlanet from '@/components/assets/story-planet.svg'
import FleetShip from '@/components/assets/fleet-ship.svg'

// Out past Mars, Jupiter, Saturn, Uranus and Neptune, swinging around each.
const ROUTE =
  'M-460 40 C -420 90 -360 -10 -300 -30 S -190 -30 -160 40 S -50 120 0 10 S 70 -120 130 -70 S 240 20 250 100 S 320 80 340 -10 S 384 -30 388 4'

export default {
  name: 'PanelOrbiters',
  components: { Star, StoryPlanet, FleetShip },
  data() {
    return {
      route: ROUTE,
      planets: [
        { name: 'Mars', cls: 1, r: 9, rings: 0, x: -300, y: -62 },
        { name: 'Jupiter', cls: 6, r: 32, rings: 0, x: -118, y: 80 },
        { name: 'Saturn', cls: 6, r: 25, rings: 10, x: 70, y: -100 },
        { name: 'Uranus', cls: 4, r: 15, rings: 1, x: 236, y: 60 },
        { name: 'Neptune', cls: 4, r: 14, rings: 0, x: 322, y: -54 }
      ]
    }
  }
}
</script>

<style scoped>
.edge {
  fill: none;
  stroke: #e6dcf5;
  stroke-width: 2;
  stroke-dasharray: 8 10;
  stroke-opacity: 0.55;
  animation: flare 10s ease-out infinite;
}
.route {
  fill: none;
  stroke: #c3b3da;
  stroke-opacity: 0.4;
  stroke-width: 1.2;
  stroke-dasharray: 3 7;
}
.ship {
  offset-path: path(
    'M-460 40 C -420 90 -360 -10 -300 -30 S -190 -30 -160 40 S -50 120 0 10 S 70 -120 130 -70 S 240 20 250 100 S 320 80 340 -10 S 384 -30 388 4'
  );
  offset-rotate: auto 90deg;
  animation: sling 10s cubic-bezier(0.3, 0, 0.5, 1) infinite;
}
@keyframes sling {
  0% {
    offset-distance: 0%;
  }
  78% {
    offset-distance: 100%;
  }
  100% {
    offset-distance: 100%;
  }
}
@keyframes flare {
  0%,
  76% {
    stroke-opacity: 0.55;
    stroke-width: 2;
  }
  82% {
    stroke-opacity: 1;
    stroke-width: 6;
  }
  100% {
    stroke-opacity: 0.55;
    stroke-width: 2;
  }
}
</style>
