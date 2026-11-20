<template>
  <!-- Panel 8: the land rush. The galaxy around Sol as the map shows it: the named stars nearest
       home, numbered stars past them, jump routes in the player's yellow, Orbiters streaming out
       along them, claim flags going up where they land, and a pirate band out in the dark where no
       route reaches. -->
  <svg class="art wide" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <!-- the field of stars no one has reached -->
    <circle v-for="(far, index) in field" :key="'far' + index" :cx="far.x" :cy="far.y" :r="far.r" fill="#e6dcf5" :opacity="far.o" />

    <!-- jump routes -->
    <line v-for="(route, index) in routes" :key="'route' + index" :x1="route.from.x" :y1="route.from.y" :x2="route.to.x" :y2="route.to.y" class="route" />

    <!-- Sol and the charted stars -->
    <g v-for="(point, name) in stars" :key="name" :transform="'translate(' + point.x + ' ' + point.y + ')'">
      <circle :r="point.r * 2.2" :fill="'url(#starGlow-' + point.spectral + ')'" />
      <circle :r="point.r" :fill="'url(#star-' + point.spectral + ')'" stroke="#ffffff" stroke-width="0.3" />
      <text :y="point.r + 20" class="label">{{ name }}</text>
      <g v-if="point.claimed" class="flag" :style="{ animationDelay: point.claimed + 's' }">
        <g :transform="'translate(' + (point.r + 4) + ' ' + -(point.r + 2) + ')'">
          <path d="M0 0V-26" stroke="#ffffff" stroke-width="2" />
          <path d="M0 -26H16L12 -20L16 -14H0Z" fill="#ebff99" />
        </g>
      </g>
    </g>

    <!-- Orbiters leaving Sol -->
    <g v-for="(flight, index) in flights" :key="'flight' + index" class="ship" :style="flight.style">
      <g transform="scale(1.9)"><fleet-ship type="orbiter8" engines flame="engineTrailGradient" /></g>
    </g>

    <!-- the pirates, in the dark -->
    <g class="band" transform="translate(240 -240)">
      <circle r="44" fill="none" stroke="#c3b3da" stroke-opacity="0.35" stroke-width="1" stroke-dasharray="3 5" />
      <g v-for="(pirate, index) in pirates" :key="'pirate' + index" :transform="'translate(' + pirate.x + ' ' + pirate.y + ') rotate(' + pirate.heading + ') scale(1.7)'">
        <fleet-ship type="orbiter8" engines flame="engineTrailGradient" />
      </g>
    </g>
  </svg>
</template>

<script>
import FleetShip from '@/components/assets/fleet-ship.svg'

// Sol, the genesis ring with its old Earth names, and numbered stars past them, as the map places them.
const STARS = {
  // (spectral: their classes as the game draws them, sdk/traits.js; the genesis stars' are real)
  Sol: { x: -240, y: 70, r: 20, spectral: 'G' },
  'Alpha Centauri': { x: -70, y: -50, r: 10, claimed: 3.2, spectral: 'G' },
  "Barnard's Star": { x: -380, y: -150, r: 8, spectral: 'M' },
  'Wolf 359': { x: -40, y: 210, r: 7, spectral: 'M' },
  Sirius: { x: 130, y: 100, r: 12, claimed: 5.6, spectral: 'A' },
  'Star 1234': { x: 270, y: -160, r: 7, spectral: 'K' },
  'Star 2051': { x: 350, y: 180, r: 6, spectral: 'B' },
  'Star 877': { x: 40, y: -250, r: 5, spectral: 'F' }
}
const ROUTES = [
  ['Sol', 'Alpha Centauri'],
  ['Sol', "Barnard's Star"],
  ['Sol', 'Wolf 359'],
  ['Alpha Centauri', 'Sirius'],
  ['Alpha Centauri', 'Star 1234'],
  ['Sirius', 'Star 2051'],
  ["Barnard's Star", 'Star 877']
]
// Each flight: the legs it flies, when it starts and how long it takes.
const FLIGHTS = [
  { legs: ['Sol', 'Alpha Centauri', 'Sirius'], at: 0, for: 7 },
  { legs: ['Sol', "Barnard's Star", 'Star 877'], at: 1.6, for: 7.5 },
  { legs: ['Sol', 'Wolf 359'], at: 2.4, for: 5 },
  { legs: ['Sol', 'Alpha Centauri', 'Star 1234'], at: 3.5, for: 8 },
  { legs: ['Sol', 'Alpha Centauri'], at: 5, for: 4 }
]
const FIELD_STARS = 70

export default {
  name: 'PanelLandRush',
  components: { FleetShip },
  data() {
    return {
      stars: STARS,
      routes: ROUTES.map(([from, to]) => ({ from: STARS[from], to: STARS[to] })),
      flights: FLIGHTS.map((flight) => ({
        style: {
          offsetPath: 'path("M' + flight.legs.map((name) => STARS[name].x + ' ' + STARS[name].y).join(' L ') + '")',
          animationDuration: flight.for + 's',
          animationDelay: flight.at + 's'
        }
      })),
      pirates: [
        { x: -15, y: 5, heading: 200 },
        { x: 12, y: -10, heading: 230 },
        { x: 8, y: 19, heading: 190 }
      ],
      field: this.seededField()
    }
  },
  methods: {
    /** Faint far stars, the same every time. */
    seededField() {
      let seed = 29
      const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
      return Array.from({ length: FIELD_STARS }, () => ({
        x: -500 + random() * 1000,
        y: -500 + random() * 1000,
        r: 1 + random() * 2.2,
        o: 0.25 + random() * 0.5
      }))
    }
  }
}
</script>

<style scoped>
.route {
  stroke: #ebff99;
  stroke-opacity: 0.55;
  stroke-width: 1.5;
  stroke-dasharray: 6 8;
}
.label {
  font-family: 'Ubuntu', system-ui, sans-serif;
  font-size: 16px;
  fill: #c3b3da;
  text-anchor: middle;
}
/* Portrait screens show the whole scene small: larger type, so the names still read. */
@media (max-width: 640px), (max-aspect-ratio: 1 / 1) {
  .label {
    font-size: 30px;
  }
}
.ship {
  offset-rotate: auto 90deg;
  animation: fly linear infinite both;
}
.flag {
  animation: raise 0.5s ease-out both;
}
.band {
  animation: drift 20s ease-in-out infinite alternate;
}
@keyframes fly {
  0% {
    offset-distance: 0%;
    opacity: 0;
  }
  8% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    offset-distance: 100%;
    opacity: 0;
  }
}
@keyframes raise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}
@keyframes drift {
  from {
    transform: translate(240px, -240px);
  }
  to {
    transform: translate(215px, -218px);
  }
}
</style>
