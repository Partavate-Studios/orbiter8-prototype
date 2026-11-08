<template>
  <!-- The title's backdrop: a sun with ships circling it and a busy space port by a planet. Every so
       often one of the ships leaves (libs/title-flight.js). The backdrop is painted once on a canvas;
       every moving part is its own small layer moved with CSS transforms, so the browser moves them on
       the GPU without repainting anything. Positions are in scene units (--u): 1600 x 900 of them fit
       any screen, centered. -->
  <div class="title-scene" aria-hidden="true">
    <canvas ref="backdrop" class="backdrop"></canvas>

    <div ref="sun" class="anchor sun">
      <svg class="part turn-slow" viewBox="-160 -160 320 320">
        <ellipse
          v-for="n in 9"
          :key="n"
          :transform="'rotate(' + n * 40 + ')'"
          rx="150"
          ry="5"
          fill="url(#starGlow-G)"
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
          fill="url(#starGlow-G)"
          opacity="0.3"
        />
      </svg>
      <svg class="part" viewBox="-160 -160 320 320">
        <!-- Sol, in the star map's yellow (libs/palette.js STAR_CLASSES.G) -->
        <circle r="70" fill="url(#starGlow-G)" />
        <circle r="28" fill="url(#star-G)" stroke="#fffbe6" stroke-width="0.4" />
      </svg>
      <!-- ships circling the sun, noses along their orbit; the third, the one that leaves, is the runner -->
      <svg ref="orbit" class="part orbit" viewBox="-160 -160 320 320">
        <g v-for="slot in stayingSlots" :key="slot" :transform="'rotate(' + slot + ') translate(112 0) rotate(180)'">
          <fleet-ship type="orbiter8" transform="scale(1.6)" />
        </g>
      </svg>
    </div>

    <div class="anchor planet">
      <svg viewBox="-260 -260 520 520">
        <defs>
          <!-- Earth, by the I.S.S.: the star map's Terrestrial colors (libs/palette.js PLANET_COLORS[0]) -->
          <radialGradient id="title-planet-light" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stop-color="#a8e6ff" />
            <stop offset="50%" stop-color="#2f7fd9" />
            <stop offset="100%" stop-color="#1a2a6e" />
          </radialGradient>
          <clipPath id="title-planet-disc"><circle r="180" /></clipPath>
        </defs>
        <circle r="236" fill="none" stroke="#7fd4ff" stroke-width="44" opacity="0.06" />
        <circle r="206" fill="none" stroke="#7fd4ff" stroke-width="6" opacity="0.08" />
        <circle r="180" fill="url(#title-planet-light)" stroke="#a8e6ff" stroke-width="2" stroke-opacity="0.7" />
        <!-- its land, as the map's Earth-like surface marks -->
        <g clip-path="url(#title-planet-disc)" fill="#5fd27e" fill-opacity="0.42" transform="scale(18)">
          <rect x="-2" y="-8" width="12" height="2" rx="1" /><rect x="0" y="-6" width="14" height="2" rx="1" />
          <rect x="-9" y="-7" width="6" height="2" rx="1" /><rect x="-10" y="-4" width="10" height="2" rx="1" />
          <rect x="-1" y="-2" width="12" height="2" rx="1" /><rect x="-12" y="1" width="12" height="2" rx="1" />
          <rect x="-10" y="3" width="14" height="2" rx="1" /><rect x="-4" y="4" width="14" height="2" rx="1" />
          <rect x="0" y="6" width="6" height="2" rx="1" /><rect x="-10" y="9" width="12" height="2" rx="1" />
        </g>
        <circle r="180" fill="url(#planetShade)" />
      </svg>
    </div>

    <!-- The space port: ships of the Orbiter 8 class docked side-on at the station's pads (as in the
         trade menu's art), shuttles running between them and the station, and now and then a visitor
         that flies in, docks and leaves (libs/title-visitor.js). -->
    <div ref="port" class="anchor port">
      <div ref="spin" class="part spin">
        <!-- Behind the station and ships: the shuttles show only crossing the docking tubes. -->
        <div v-for="lane in lanes" :key="lane.key" class="lane" :style="{ transform: 'rotate(' + lane.angle + 'deg)' }">
          <span v-for="shuttle in lane.shuttles" :key="shuttle.key" class="shuttle" :style="shuttle.style"></span>
        </div>
        <svg class="part" viewBox="-130 -130 260 260">
          <g
            v-for="dock in docks"
            :key="'tube-' + dock.pad"
            :transform="'rotate(' + dock.pad + ')'"
            stroke="#e6dcf5"
            stroke-width="0.8"
            stroke-opacity="0.75"
          >
            <line :x1="TUBE.from" y1="-4" :x2="TUBE.to" y2="-4" />
            <line :x1="TUBE.from" y1="4" :x2="TUBE.to" y2="4" />
          </g>
          <g v-for="dock in docks" :key="dock.pad" :transform="dock.transform">
            <fleet-ship :type="dock.type" />
          </g>
          <g transform="scale(0.125) translate(-290 -301)">
            <path fill="#ffffff" fill-rule="evenodd" :d="stationPath" />
          </g>
        </svg>
      </div>
      <!-- The visitor doesn't turn with the station: fly() places it every frame. -->
      <svg class="part" viewBox="-130 -130 260 260">
        <!-- Its tube to the pad, while it's docked. -->
        <g ref="visitorTube" class="visitor-tube" stroke="#e6dcf5" stroke-width="0.8" stroke-opacity="0.75">
          <line :x1="TUBE.from" y1="-4" :x2="TUBE.to" y2="-4" />
          <line :x1="TUBE.from" y1="4" :x2="TUBE.to" y2="4" />
        </g>
        <g ref="visitor" opacity="0">
          <fleet-ship type="orbiter8" engines flame="engineTrailGradient" />
        </g>
      </svg>
    </div>

    <!-- Placed every frame by fly(), from the orbit's own clock. -->
    <div ref="runner" class="anchor runner">
      <svg viewBox="-30 -30 60 60">
        <fleet-ship type="orbiter8" engines flame="engineTrailGradient" transform="scale(1.6)" />
      </svg>
    </div>
  </div>
</template>

<script>
import FleetShip from '@/components/assets/fleet-ship.svg'
import { paintBackdrop, BACKDROP_SIZE } from '@/components/star-map/assets/backdrop-art'
import { onFrame } from '@/libs/frame-loop'
import { useUIStore } from '@/stores/ui'
import { flightPose, planFlight, SLOTS } from '@/libs/title-flight'
import { DOCKED, TUBE, dockRadius, dockTransform, visitorPose, VISITOR_SCALE } from '@/libs/title-visitor'

// The station's outline (the same art as the game's station sprite), about 580 units across.
const STATION_PATH =
  'M291 0l61 35 15 -25 139 80 -15 25 61 36 0 71 28 0 0 160 -28 0 0 70 -63 36 14 24 -139 80 -14 -24 -59 34 -63 -37 -15 26 -139 -80 15 -26 -59 -33 0 -73 -30 0 0 -160 30 0 0 -68 62 -36 -15 -26 139 -81 15 27 60 -35zm83 196c47,36 64,100 42,155l-98 -57 56 -98zm22 188c-36,47 -99,63 -154,42l56 -99 98 57zm-188 22c-46,-36 -63,-100 -41,-154l98 56 -57 98zm-22 -188c37,-46 100,-63 155,-41l-57 98 -98 -57z'

const STARS = 260
// Shuttles run along each docked ship's tube, one each way, from inside the station to the middle of the
// ship: drawn behind both, they show only in the tube. In scene units from the
// station's center; the port's viewBox is 260 of its units across 280 scene units.
const PORT_UNIT = 280 / 260
const SHUTTLE_FROM = 28

export default {
  name: 'TitleScene',
  components: { FleetShip },
  data() {
    return { stationPath: STATION_PATH, TUBE, runnerSlot: null }
  },
  computed: {
    /** The two ships that stay in orbit; the runner is drawn on its own. */
    stayingSlots() {
      return SLOTS.filter((slot) => slot !== this.runnerSlot)
    },
    docks() {
      return DOCKED.map((ship) => ({ ...ship, transform: dockTransform(ship.pad, ship.scale) }))
    },
    lanes() {
      return DOCKED.map((ship, index) => {
        const shipMiddle = dockRadius(ship.scale) * PORT_UNIT
        return {
          key: ship.pad,
          angle: ship.pad,
          shuttles: [
            { outbound: true, offset: -1.8 },
            { outbound: false, offset: 1.8 }
          ].map(({ outbound, offset }, j) => {
            const duration = 5.2 + ((index + j) % 3) * 1.1
            return {
              key: j,
              style: {
                '--from': outbound ? SHUTTLE_FROM : shipMiddle,
                '--to': outbound ? shipMiddle : SHUTTLE_FROM,
                '--dir': outbound ? 1 : -1,
                '--offset': offset,
                // Negative delays start the scene mid-traffic.
                animationDuration: duration + 's',
                animationDelay: -(index * 1.7 + j * 2.9) + 's'
              }
            }
          })
        }
      })
    }
  },
  mounted() {
    this.paint()
    this.measure()
    this.flames = this.$refs.runner.querySelector('.flames')
    this.visitorFlames = this.$refs.visitor.querySelector('.flames')
    this.stopFrames = onFrame(() => this.fly())
    this.onResize = () => {
      cancelAnimationFrame(this.resizeFrame)
      this.resizeFrame = requestAnimationFrame(() => {
        this.paint()
        this.measure()
      })
    }
    window.addEventListener('resize', this.onResize)
    // A new pixel ratio (the window moved to a screen with other scaling) repaints too.
    useUIStore().watchPixelRatio()
    this.stopRatioWatch = this.$watch(() => useUIStore().screenSize.dpr, this.onResize)
  },
  unmounted() {
    this.stopRatioWatch?.()
    window.removeEventListener('resize', this.onResize)
    cancelAnimationFrame(this.resizeFrame)
    this.stopFrames()
  },
  methods: {
    /** Plans the runner's loop for this screen: where the sun is and how big the screen is, in scene units. */
    measure() {
      const sun = this.$refs.sun.getBoundingClientRect()
      const unit = sun.width / 320
      this.unit = unit
      this.plan = planFlight(
        {
          sun: {
            x: (sun.left + sun.width / 2 - window.innerWidth / 2) / unit,
            y: (sun.top + sun.height / 2 - window.innerHeight / 2) / unit
          },
          halfWidth: window.innerWidth / 2 / unit,
          halfHeight: window.innerHeight / 2 / unit
        },
        this.runnerSlot ?? undefined
      )
      this.runnerSlot = this.plan.slot
      // The visitor's units: the port's viewBox, 260 across. It comes from and goes beyond the screen.
      const port = this.$refs.port.getBoundingClientRect()
      this.portReach = Math.hypot(window.innerWidth, window.innerHeight) / (port.width / 260) + 40
    },
    /** Places the runner for this frame, on the clock of the orbit it leaves and rejoins. */
    fly() {
      // No orbit animation (reduced motion): the runner just keeps its place.
      const orbit = this.$refs.orbit.getAnimations()[0]
      const pose = flightPose(this.plan, orbit ? orbit.currentTime / 1000 : 0)
      const x = pose.x * this.unit
      const y = pose.y * this.unit
      const runner = this.$refs.runner.style
      runner.transform = `translate(${x}px, ${y}px) rotate(${pose.rotation}deg) scale(${pose.scale})`
      // Flying past, it fades behind the menu's dark band like smoked glass, so it doesn't crowd the logo.
      const behind = pose.scale === 1 ? 0 : this.behindBand(window.innerWidth / 2 + x, window.innerHeight / 2 + y)
      runner.opacity = pose.opacity * (1 - 0.6 * behind)
      this.flames.style.opacity = pose.engines
      this.visit()
      if (!orbit) this.stopFrames()
    },
    /** Places the port's visitor for this frame, on the clock of the station it docks at. */
    visit() {
      const spin = this.$refs.spin.getAnimations()[0]
      const pose = spin ? visitorPose(spin.currentTime / 1000, this.portReach) : { opacity: 0 }
      const visitor = this.$refs.visitor
      visitor.setAttribute('opacity', pose.opacity)
      // Docked, its rotation is the pad's angle plus 180 (libs/title-visitor.js dockTransform).
      const tube = this.$refs.visitorTube
      tube.classList.toggle('shown', Boolean(pose.docked))
      if (pose.docked) tube.setAttribute('transform', `rotate(${pose.rotation - 180})`)
      if (!pose.opacity) return
      visitor.setAttribute(
        'transform',
        `translate(${pose.x} ${pose.y}) rotate(${pose.rotation}) scale(${VISITOR_SCALE})`
      )
      this.visitorFlames.style.opacity = pose.engines
    },
    /** How far the point (in pixels) is behind the title menu's dark band: 0 clear of it, 1 behind its darkest part. */
    behindBand(x, y) {
      if (!this.band?.isConnected) this.band = this.$el.parentElement?.querySelector('.band')
      if (!this.band) return 0
      const { left, top, width, bottom } = this.band.getBoundingClientRect()
      const across = (x - left) / width
      const clamp = (value) => Math.min(1, Math.max(0, value))
      // The band's gradient (title-screen.vue): clear to 12% across, darkest from 30% to 70%, clear from 86%.
      const sideways = clamp(Math.min((across - 0.12) / 0.18, (0.86 - across) / 0.16))
      const upright = clamp(Math.min(y - top, bottom - y) / 30)
      return sideways * upright
    },
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
.runner {
  --x: 0;
  --y: 0;
  --size: 60;
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
  /* Slower than the ships round the sun (libs/title-visitor.js SPIN_S). */
  animation: turn 240s linear infinite;
}

.visitor-tube {
  opacity: 0;
  transition: opacity 0.6s;
}
.visitor-tube.shown {
  opacity: 1;
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
  left: calc(var(--u) * -8);
  top: calc(var(--u) * (var(--offset) - 1.1));
  width: calc(var(--u) * 9);
  height: calc(var(--u) * 2.2);
  border-radius: calc(var(--u) * 1.1);
  /* a bright head with a fading trail behind it */
  background:
    radial-gradient(circle at calc(100% - var(--u) * 1.1) 50%, #ffffff calc(var(--u) * 1), #0000 calc(var(--u) * 1.2)),
    linear-gradient(90deg, #e6dcf500, #e6dcf599 80%, #e6dcf5);
  transform: translateX(calc(var(--u) * var(--from))) scaleX(var(--dir));
  animation: shuttle 6s ease-in-out infinite;
}

@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}
/* Out from under the station or the ship, along the tube, and in under the other; it waits there a while. */
@keyframes shuttle {
  0% {
    opacity: 1;
    transform: translateX(calc(var(--u) * var(--from))) scaleX(var(--dir));
  }
  55%,
  100% {
    opacity: 1;
    transform: translateX(calc(var(--u) * var(--to))) scaleX(var(--dir));
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
}
</style>
