<template>
  <!-- Panel 3: thriving across the system. Jupiter (the game's gas giant) with Io, Europa, Ganymede and
       Callisto on their rings, a Federation station and freighters working between them, and the ice
       of the asteroids drifting past on the right. -->
  <svg class="art" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g transform="translate(-200 -10)">
      <circle v-for="moon in moons" :key="'ring' + moon.name" :r="moon.orbit" class="ring" />
      <story-planet :planet-class="6" :radius="150" :spin="220" />
      <g
        v-for="moon in moons"
        :key="moon.name"
        class="orbit"
        :style="{ animationDuration: moon.lap + 's', animationDelay: -moon.lap * moon.at + 's' }"
      >
        <g :transform="'translate(' + moon.orbit + ' 0)'"><moon-art :radius="moon.r" /></g>
      </g>
      <g class="orbit" style="animation-duration: 28s; animation-delay: -9s">
        <g transform="translate(174 0) scale(1.3)"><station-art /></g>
      </g>
      <g
        v-for="ship in ships"
        :key="'ship' + ship.orbit"
        class="orbit"
        :style="{ animationDuration: ship.lap + 's', animationDelay: -ship.lap * ship.at + 's' }"
      >
        <g :transform="'translate(' + ship.orbit + ' 0) rotate(180) scale(2.2)'">
          <fleet-ship type="orbiter8" engines flame="engineTrailGradient" />
        </g>
      </g>
    </g>

    <!-- the asteroids: ice, drifting -->
    <g class="belt">
      <g v-for="rock in rocks" :key="rock.x" :transform="'translate(' + rock.x + ' ' + rock.y + ') rotate(' + rock.turn + ')'">
        <moon-art :radius="rock.r" />
      </g>
    </g>
  </svg>
</template>

<script>
import StoryPlanet from '@/components/assets/story-planet.svg'
import FleetShip from '@/components/assets/fleet-ship.svg'
import MoonArt from './moon-art.svg'
import StationArt from './station-art.svg'

export default {
  name: 'PanelJupiter',
  components: { StoryPlanet, FleetShip, MoonArt, StationArt },
  data() {
    return {
      // The Galilean moons at the sizes the game gives them.
      moons: [
        { name: 'Io', r: 7, orbit: 196, lap: 22, at: 0.1 },
        { name: 'Europa', r: 6, orbit: 232, lap: 31, at: 0.6 },
        { name: 'Ganymede', r: 9.5, orbit: 272, lap: 44, at: 0.35 },
        { name: 'Callisto', r: 9.5, orbit: 318, lap: 60, at: 0.85 }
      ],
      ships: [
        { orbit: 214, lap: 34, at: 0.4 },
        { orbit: 252, lap: 48, at: 0.9 },
        { orbit: 296, lap: 55, at: 0.2 }
      ],
      rocks: [
        { x: 250, y: -300, r: 7, turn: 20 },
        { x: 330, y: -230, r: 4, turn: 80 },
        { x: 400, y: -320, r: 9, turn: 140 },
        { x: 300, y: 150, r: 5, turn: 200 },
        { x: 390, y: 60, r: 11, turn: 60 },
        { x: 440, y: 250, r: 6, turn: 110 },
        { x: 350, y: 340, r: 8, turn: 30 },
        { x: 470, y: -80, r: 4, turn: 170 }
      ]
    }
  }
}
</script>

<style scoped>
.ring {
  fill: none;
  stroke: #c3b3da;
  stroke-opacity: 0.2;
  stroke-width: 0.8;
}
.orbit {
  animation: turn linear infinite;
}
.belt {
  animation: drift 40s ease-in-out infinite alternate;
}
@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}
@keyframes drift {
  from {
    transform: translate(20px, 10px);
  }
  to {
    transform: translate(-20px, -10px);
  }
}
</style>
