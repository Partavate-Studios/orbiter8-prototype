<template>
  <!-- The title's backdrop: a sun with ships circling it, a ship flying past, and a busy space port by a
       planet. The backdrop is painted once on a canvas; every moving part is its own small layer
       animated with CSS transforms, so the browser moves them on the GPU without repainting anything.
       Positions are in scene units (--u): 1600 x 900 of them fit any screen, centered. -->
  <div class="title-scene" aria-hidden="true">
    <canvas ref="backdrop" class="backdrop"></canvas>

    <div class="anchor drifter">
      <svg viewBox="-30 -30 60 60"><fleet-ship type="orbiter8" engines transform="scale(4)" /></svg>
    </div>

    <div class="anchor sun">
      <svg class="part turn-slow" viewBox="-160 -160 320 320">
        <ellipse
          v-for="n in 9"
          :key="n"
          :transform="'rotate(' + n * 40 + ')'"
          rx="150"
          ry="5"
          fill="url(#glowingGradient)"
          opacity="0.3"
        />
      </svg>
      <svg class="part turn-slow reverse shimmer" viewBox="-160 -160 320 320">
        <ellipse
          v-for="n in 9"
          :key="n"
          :transform="'rotate(' + (n * 40 + 20) + ')'"
          :rx="90 + (n % 4) * 18"
          ry="4"
          fill="url(#glowingGradient)"
          opacity="0.3"
        />
      </svg>
      <svg class="part" viewBox="-160 -160 320 320">
        <circle r="70" fill="url(#glowingGradient)" />
        <circle r="28" fill="url(#starGradient)" stroke="#ffffff" stroke-width="0.4" />
      </svg>
      <!-- three ships circling the sun, noses along their orbit -->
      <svg class="part orbit" viewBox="-160 -160 320 320">
        <g v-for="n in 3" :key="n" :transform="'rotate(' + n * 120 + ') translate(112 0) rotate(180)'">
          <fleet-ship type="orbiter8" engines transform="scale(1.6)" />
        </g>
      </svg>
    </div>

    <div class="anchor planet">
      <svg viewBox="-260 -260 520 520">
        <defs>
          <radialGradient id="title-planet-light" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stop-color="#eadcff" />
            <stop offset="45%" stop-color="#a48bd0" />
            <stop offset="100%" stop-color="#34245a" />
          </radialGradient>
        </defs>
        <circle r="236" fill="none" stroke="#c3b3da" stroke-width="44" opacity="0.07" />
        <circle r="206" fill="none" stroke="#c3b3da" stroke-width="6" opacity="0.08" />
        <circle r="180" fill="url(#title-planet-light)" stroke="#e6dcf5" stroke-width="2" stroke-opacity="0.7" />
      </svg>
    </div>

    <!-- The space port: ships of the Orbiter 8 class docked nose-in, shuttles running between them and
         the station. -->
    <div class="anchor port">
      <div class="part spin">
        <svg class="part" viewBox="-130 -130 260 260">
          <g v-for="dock in docks" :key="dock.angle" :transform="dock.transform">
            <fleet-ship :type="dock.type" />
          </g>
          <g transform="scale(0.125) translate(-290 -301)">
            <path fill="#ffffff" fill-rule="evenodd" :d="stationPath" />
          </g>
        </svg>
        <div v-for="lane in lanes" :key="lane.key" class="lane" :style="{ transform: 'rotate(' + lane.angle + 'deg)' }">
          <span v-for="shuttle in lane.shuttles" :key="shuttle.key" class="shuttle" :style="shuttle.style"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FleetShip from '@/components/assets/fleet-ship.svg'
import { paintBackdrop, BACKDROP_SIZE } from '@/components/star-map/assets/backdrop-art'

// The station's outline (the same art as the game's station sprite), about 580 units across.
const STATION_PATH =
  'M291 0l61 35 15 -25 139 80 -15 25 61 36 0 71 28 0 0 160 -28 0 0 70 -63 36 14 24 -139 80 -14 -24 -59 34 -63 -37 -15 26 -139 -80 15 -26 -59 -33 0 -73 -30 0 0 -160 30 0 0 -68 62 -36 -15 -26 139 -81 15 27 60 -35zm83 196c47,36 64,100 42,155l-98 -57 56 -98zm22 188c-36,47 -99,63 -154,42l56 -99 98 57zm-188 22c-46,-36 -63,-100 -41,-154l98 56 -57 98zm-22 -188c37,-46 100,-63 155,-41l-57 98 -98 -57z'

// Docked ships, one per side of the station: same class, a little different in size.
const DOCK_DISTANCE = 84
const DOCKS = [
  { angle: 0, type: 'orbiter8', scale: 3.3 },
  { angle: 90, type: 'polygon', scale: 3.5 },
  { angle: 180, type: 'boba', scale: 3.9 },
  { angle: 270, type: 'moonbeam', scale: 3.6 }
]
// Shuttles run along each dock's line, a little to either side, between the hull (STATION_EDGE) and
// the docked ship's nose (SHIP_NOSE), in scene units from the station's center.
const STATION_EDGE = 40
const SHIP_NOSE = 66
const STARS = 260

export default {
  name: 'TitleScene',
  components: { FleetShip },
  data() {
    return { stationPath: STATION_PATH }
  },
  computed: {
    docks() {
      return DOCKS.map((dock) => ({
        ...dock,
        // Nose up in the art; turned to point at the station.
        transform: `rotate(${dock.angle}) translate(${DOCK_DISTANCE} 0) rotate(-90) scale(${dock.scale})`
      }))
    },
    lanes() {
      return DOCKS.map((dock, index) => ({
        key: dock.angle,
        angle: dock.angle,
        shuttles: [
          { outbound: true, offset: -6 },
          { outbound: false, offset: 6 }
        ].map(({ outbound, offset }, j) => {
          const duration = 5.2 + ((index + j) % 3) * 1.1
          return {
            key: j,
            style: {
              '--from': outbound ? STATION_EDGE : SHIP_NOSE,
              '--to': outbound ? SHIP_NOSE : STATION_EDGE,
              '--dir': outbound ? 1 : -1,
              '--offset': offset,
              // Negative delays start the scene mid-traffic.
              animationDuration: duration + 's',
              animationDelay: -(index * 1.7 + j * 2.9) + 's'
            }
          }
        })
      }))
    }
  },
  mounted() {
    this.paint()
    this.onResize = () => {
      cancelAnimationFrame(this.resizeFrame)
      this.resizeFrame = requestAnimationFrame(() => this.paint())
    }
    window.addEventListener('resize', this.onResize)
  },
  unmounted() {
    window.removeEventListener('resize', this.onResize)
    cancelAnimationFrame(this.resizeFrame)
  },
  methods: {
    /** Paints the backdrop art and the stars, covering the screen. Only on mount and resize. */
    paint() {
      const canvas = this.$refs.backdrop
      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      const scale = (Math.max(width, height) / BACKDROP_SIZE) * 1.15
      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.scale(scale, scale)
      ctx.translate(-BACKDROP_SIZE / 2, -BACKDROP_SIZE / 2)
      paintBackdrop(ctx)
      ctx.restore()

      // Seeded, so a resize doesn't rearrange the sky.
      let seed = 8
      const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
      for (let i = 0; i < STARS; i++) {
        const bright = random() < 0.08
        ctx.globalAlpha = bright ? 0.9 : 0.25 + random() * 0.45
        ctx.fillStyle = bright ? '#ffffff' : '#af6fff'
        ctx.beginPath()
        ctx.arc(random() * width, random() * height, bright ? 1.2 : 0.6 + random() * 0.8, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
  }
}
</script>

<style scoped>
.title-scene {
  /* One scene unit: 1600 x 900 units always fit the screen. */
  --u: min(100vw / 1600, 100vh / 900);
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #280b4b;
  pointer-events: none;
}
.backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.anchor {
  position: absolute;
  left: calc(50% + var(--u) * var(--x));
  top: calc(50% + var(--u) * var(--y));
  width: calc(var(--u) * var(--size));
  height: calc(var(--u) * var(--size));
  margin: calc(var(--u) * var(--size) / -2) 0 0 calc(var(--u) * var(--size) / -2);
}
.anchor svg,
.part {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.sun {
  --x: -560;
  --y: -280;
  --size: 320;
}
.planet {
  --x: 720;
  --y: 390;
  --size: 520;
}
.port {
  --x: 520;
  --y: 150;
  --size: 280;
}
.drifter {
  --x: 0;
  --y: 0;
  --size: 60;
  animation: drift 80s cubic-bezier(0.6, 0, 0.9, 0.6) infinite;
}

.turn-slow {
  animation: turn 240s linear infinite;
}
.turn-slow.reverse {
  animation-direction: reverse;
}
.shimmer {
  animation:
    turn 240s linear infinite reverse,
    shimmer 9s ease-in-out infinite alternate;
}
.orbit {
  animation: turn 45s linear infinite;
}
.spin {
  animation: turn 150s linear infinite;
}

.lane {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
}
.shuttle {
  position: absolute;
  left: calc(var(--u) * -12);
  top: calc(var(--u) * (var(--offset) - 1.5));
  width: calc(var(--u) * 14);
  height: calc(var(--u) * 3);
  border-radius: calc(var(--u) * 1.5);
  /* a bright head with a fading trail behind it */
  background:
    radial-gradient(
      circle at calc(100% - var(--u) * 1.5) 50%,
      #ffffff calc(var(--u) * 1.4),
      #0000 calc(var(--u) * 1.6)
    ),
    linear-gradient(90deg, #e6dcf500, #e6dcf599 80%, #e6dcf5);
  opacity: 0;
  transform: translateX(calc(var(--u) * var(--from))) scaleX(var(--dir));
  animation: shuttle 6s ease-in-out infinite;
}

@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}
@keyframes shimmer {
  from {
    opacity: 0.55;
  }
  to {
    opacity: 1;
  }
}
/* Out to the docked ship (or in to the station), then out of sight until the next trip. */
@keyframes shuttle {
  0% {
    opacity: 0;
    transform: translateX(calc(var(--u) * var(--from))) scaleX(var(--dir));
  }
  8%,
  48% {
    opacity: 1;
  }
  55%,
  100% {
    opacity: 0;
    transform: translateX(calc(var(--u) * var(--to))) scaleX(var(--dir));
  }
}
/* A ship far off to the upper right comes toward us and passes off the lower left. */
@keyframes drift {
  from {
    transform: translate(calc(var(--u) * 900), calc(var(--u) * -560)) rotate(-122deg) scale(0.06);
  }
  to {
    transform: translate(calc(var(--u) * -980), calc(var(--u) * 640)) rotate(-122deg) scale(5);
  }
}

/* Portrait screens: the scene is laid out for 900 x 1600 units, with the port below the menu. */
@media (max-aspect-ratio: 1/1) {
  .title-scene {
    --u: min(100vw / 900, 100vh / 1600);
  }
  .sun {
    --x: -260;
    --y: -640;
  }
  .planet {
    --x: 330;
    --y: 760;
  }
  .port {
    --x: 60;
    --y: 560;
  }
}

@media (prefers-reduced-motion: reduce) {
  .title-scene * {
    animation: none !important;
  }
  .shuttle {
    opacity: 0.8;
  }
  .drifter {
    display: none;
  }
}
</style>
