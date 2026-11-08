<template>
  <!-- Panel 1: Sol in 2140. The nine planets as the game generates them (class, size, rings), on their
       rings around the sun, with the Federation's stations at Earth and Jupiter and traffic between.
       The view pulls back from the sun as the panel opens. -->
  <svg class="art" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g class="system">
      <circle v-for="planet in planets" :key="'ring' + planet.name" :r="planet.orbit" class="ring" />
      <g transform="scale(0.32)"><star spectral="G" /></g>
      <g
        v-for="planet in planets"
        :key="planet.name"
        class="orbit"
        :style="{ animationDuration: planet.lap + 's', animationDelay: -planet.lap * planet.at + 's' }"
      >
        <g :transform="'translate(' + planet.orbit + ' 0)'">
          <story-planet :planet-class="planet.cls" :radius="planet.r" :rings="planet.rings" />
          <g v-if="planet.station" :transform="'translate(' + (planet.r + 11) + ' 0) scale(0.9)'">
            <station-art />
          </g>
        </g>
      </g>
      <!-- traffic: ships on their own circuits between the planets -->
      <g v-for="ship in ships" :key="'ship' + ship.orbit" class="orbit" :style="{ animationDuration: ship.lap + 's', animationDelay: -ship.lap * ship.at + 's' }">
        <g :transform="'translate(' + ship.orbit + ' 0) rotate(180) scale(2)'">
          <fleet-ship type="orbiter8" engines flame="engineTrailGradient" />
        </g>
      </g>
    </g>
  </svg>
</template>

<script>
import Star from '@/components/star-map/sprites/star.svg'
import StoryPlanet from '@/components/assets/story-planet.svg'
import FleetShip from '@/components/assets/fleet-ship.svg'
import StationArt from './station-art.svg'

// Sol's planets as SystemGen makes them (class, size, rings), on rings sized to fit the panel.
const SOL = [
  ['Mercury', 1, 3, 0],
  ['Venus', 5, 12, 0],
  ['Earth', 0, 12, 0, true],
  ['Mars', 1, 6, 0],
  ['Jupiter', 6, 54, 0, true],
  ['Saturn', 6, 36, 10],
  ['Uranus', 4, 24, 1],
  ['Neptune', 4, 24, 0],
  ['Pluto', 1, 1, 0]
]
const ORBITS = [48, 68, 90, 112, 156, 202, 242, 278, 310]
const LAPS = [9, 14, 19, 25, 46, 62, 78, 94, 115]
const STARTS = [0.1, 0.55, 0.3, 0.8, 0.15, 0.62, 0.4, 0.9, 0.25]

export default {
  name: 'PanelSol',
  components: { Star, StoryPlanet, FleetShip, StationArt },
  data() {
    return {
      planets: SOL.map(([name, cls, size, rings, station], index) => ({
        name,
        cls,
        rings,
        station: Boolean(station),
        r: 4 + size / 4,
        orbit: ORBITS[index],
        lap: LAPS[index],
        at: STARTS[index]
      })),
      ships: [
        { orbit: 101, lap: 30, at: 0.7 },
        { orbit: 134, lap: 40, at: 0.2 },
        { orbit: 179, lap: 52, at: 0.5 }
      ]
    }
  }
}
</script>

<style scoped>
.ring {
  fill: none;
  stroke: #c3b3da;
  stroke-opacity: 0.22;
  stroke-width: 0.8;
}
.system {
  animation: arrive 3s ease-out both;
}
.orbit {
  animation: turn linear infinite;
}
@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}
@keyframes arrive {
  from {
    opacity: 0;
    transform: scale(2.4);
  }
}
</style>
