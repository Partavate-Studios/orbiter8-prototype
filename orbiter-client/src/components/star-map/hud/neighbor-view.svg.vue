<template>
  <!-- Zoomed out past the heliopause: the system's heliopause shrinks into a star, its neighbors (one
       jump away) fly in from beyond the screen edges, and the neighbors of neighbors the player has
       explored appear as dots further out. Another way to jump besides the jump menu. Drawn in HUD
       units, centered where the world's star sits. -->
  <g class="neighbor-view">
    <!-- dims the system behind; clicking empty space drops the current choice -->
    <rect
      :x="leftMostX"
      :y="topMostY"
      :width="rightMostX - leftMostX"
      :height="bottomMostY - topMostY"
      fill="#12052a"
      :opacity="0.85 * phase.backdrop"
      @click="choose(null)"
    />

    <g text-anchor="middle" dominant-baseline="middle" :opacity="phase.neighbors">
      <text x="0" :y="topMostY + 60" fill="#ffffffcc" font-size="1.4em">Neighboring Stars</text>
      <text x="0" :y="topMostY + 88" fill="#ffffff66" font-size="0.8em">
        Each is one jump away. Scroll in (or press Esc) to return to {{ currentStarSystemName }}.
      </text>
    </g>

    <g :transform="'translate(0 ' + CENTER_Y + ')'">
      <!-- second ring: explored neighbors' neighbors, and paths back to here -->
      <path
        v-for="star in returnPaths"
        :key="'back-' + star.id"
        :d="routeBack(star)"
        fill="none"
        stroke="#c3b3da"
        stroke-width="1"
        stroke-dasharray="1 5"
        stroke-linecap="round"
        :opacity="0.45 * phase.outer"
      />
      <circle
        v-for="dot in outerDots"
        :key="'outer-' + dot.id"
        :cx="dot.x"
        :cy="dot.y"
        r="3"
        fill="#8e7aaa"
        :opacity="0.8 * phase.outer"
      />

      <!-- routes to the neighbors: faint, brighter on hover, animated for the chosen one -->
      <path
        v-for="star in stars"
        :key="'route-' + star.id"
        :d="routeTo(star)"
        fill="none"
        :stroke="star.id === hoveredId ? '#ffffff' : '#c3b3da'"
        :stroke-width="star.id === hoveredId ? 1.6 : 1"
        stroke-dasharray="2 6"
        stroke-linecap="round"
        :opacity="(star.id === hoveredId ? 0.9 : 0.25) * phase.outer"
      />
      <path
        v-if="chosen"
        :d="routeTo(chosen)"
        class="chosen-route"
        fill="none"
        stroke="#ffffff"
        stroke-width="2.5"
        stroke-dasharray="10 8"
        stroke-linecap="round"
      />

      <!-- the player's ship orbiting this star: this copy shows while it's behind the star -->
      <g ref="shipBehind" display="none">
        <ship :should-show-engines="jumpState === 'waiting'" />
      </g>

      <!-- this system: its heliopause, shrinking into a star -->
      <g :transform="'translate(' + center.x + ' ' + center.y + ')'">
        <circle cx="0" cy="0" :r="center.radius * 2.2" fill="url(#glowingGradient)" :opacity="phase.morph" />
        <circle
          cx="0"
          cy="0"
          :r="center.radius"
          fill="url(#starGradient)"
          :fill-opacity="phase.morph"
          stroke="#ffffff"
          :stroke-width="1 + phase.morph * 0.5"
          :stroke-opacity="1 - 0.4 * phase.morph"
        />
        <text
          x="0"
          :y="center.radius + 22"
          text-anchor="middle"
          fill="#ffffffcc"
          font-size="0.9em"
          :opacity="phase.morph"
        >
          {{ currentStarSystemName }}
        </text>
      </g>

      <!-- …and this one while it's in front -->
      <g ref="shipFront" display="none">
        <ship :should-show-engines="jumpState === 'waiting'" />
      </g>

      <g v-for="star in stars" :key="'star-' + star.id" :transform="'translate(' + star.x + ' ' + star.y + ')'">
        <a
          cursor="pointer"
          @click.prevent="choose(star)"
          @mouseover="hoveredId = star.id"
          @mouseleave="hoveredId = null"
        >
          <circle cx="0" cy="0" r="34" fill="#ffffff00" />
          <circle
            cx="0"
            cy="0"
            :r="(star.visited ? 26 : 20) * (star.id === hoveredId ? 1.5 : 1)"
            fill="url(#glowingGradient)"
            :opacity="phase.neighbors"
          />
          <circle
            cx="0"
            cy="0"
            :r="(star.visited ? 11 : 8) * (star.id === hoveredId ? 1.25 : 1)"
            :fill="star.visited ? '#e5cfff' : '#8e7aaa'"
            :stroke="star.id === hoveredId || (chosen && chosen.id === star.id) ? '#ffffff' : 'none'"
            stroke-width="2"
            :opacity="phase.neighbors"
          />
          <text
            x="0"
            y="30"
            text-anchor="middle"
            :fill="star.id === hoveredId ? '#ffffff' : star.visited ? '#ffffffdd' : '#ffffff77'"
            font-size="0.8em"
            :opacity="phase.neighbors"
            >{{ star.visited ? star.name : 'Unexplored' }}</text
          >
          <text x="0" y="46" text-anchor="middle" fill="#ffffff55" font-size="0.6em" :opacity="phase.neighbors">
            #{{ star.id }}
          </text>
        </a>
      </g>
    </g>

    <!-- the choice; then, while the jump waits for the wallet and the chain, the ship races around the star -->
    <g v-if="chosen" :transform="'translate(0 ' + (bottomMostY - 150) + ')'" text-anchor="middle">
      <template v-if="jumpState === 'waiting'">
        <text x="0" y="-48" fill="#ffffffcc" font-size="1em">Preparing to jump to {{ chosenName }}…</text>
        <text x="0" y="-20" fill="#ffffff77" font-size="0.8em"
          >Confirm in your wallet, then wait for the move to be recorded.</text
        >
      </template>
      <template v-else>
        <text x="0" y="-48" fill="#ffffffcc" font-size="1em">
          {{ jumpState === 'failed' ? "The jump didn't go through. Try again?" : 'Jump to ' + chosenName + '?' }}
        </text>
        <g transform="translate(-135 0)">
          <menu-button :text="'Jump'" @buttonclick="jump" />
        </g>
        <g transform="translate(135 0)">
          <menu-button :text="'Cancel'" @buttonclick="choose(null)" />
        </g>
      </template>
    </g>
  </g>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { game } from '@/sdk/client'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { useGameStateStore } from '@/stores/gamestate'
import { layoutNeighbors, layoutOuterRing, pointAt, arcPath } from '@/sdk/game/neighbor-layout'
import MenuButton from './menus/menu-button.svg'
import Ship from '../sprites/ship.svg'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { writeAttribute } from '@/libs/dom-writes'

// The world's star sits this far above the HUD's center (WORLD_OFFSET_Y in group units).
const CENTER_Y = -100
// The heliopause's radius in world units (guides-canvas.vue draws it).
const HELIOPAUSE_RADIUS = 5000
// The star the heliopause shrinks into, in HUD units.
const STAR_RADIUS = 10
// The whole entrance; each part runs in its own slice of it (see `phase`).
const ENTER_MS = 1300
// Where the neighbors start, in ring radii: beyond the screen edges.
const FLY_IN_FROM = 3.2
// The ship's orbit around the center star: a tilted ellipse (its depth decides which side of the
// star it's drawn on), one lap every ORBIT_SECONDS, or RACING_ORBIT_SECONDS while a jump is pending.
const SHIP_SCALE = 0.85
const ORBIT_GAP = 24
const ORBIT_TILT = 0.32
const ORBIT_SECONDS = 7
const RACING_ORBIT_SECONDS = 0.9
// The contract's name for a star nobody has visited yet.
const UNEXPLORED = 'Unexplored Star'

const clamp01 = (value) => Math.min(1, Math.max(0, value))
const easeOut = (value) => 1 - Math.pow(1 - value, 3)
const lerp = (from, to, t) => from + (to - from) * t

export default {
  name: 'NeighborView',
  components: {
    MenuButton,
    Ship
  },
  data() {
    return {
      CENTER_Y,
      // 0 → 1 over the entrance
      progress: 0,
      chosenId: null,
      hoveredId: null,
      // null, 'waiting' (wallet and chain) or 'failed'
      jumpState: null,
      // Where the heliopause was on screen when the view opened (set on mount).
      start: { x: 0, y: 0, radius: 60 },
      // Neighbor lists the player has explored, read once when the view opens.
      explored: null
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['neighbors', 'currentStarSystemId', 'currentStarSystemName']),
    ...mapState(useUIStore, ['leftMostX', 'rightMostX', 'topMostY', 'bottomMostY', 'viewport']),
    /** Each part of the entrance, 0 → 1 in its own slice of the timeline. */
    phase() {
      const t = this.progress
      const slice = (from, to) => easeOut(clamp01((t - from) / (to - from)))
      return { backdrop: slice(0, 0.35), morph: slice(0, 0.5), neighbors: slice(0.25, 0.8), outer: slice(0.55, 1) }
    },
    /** The heliopause becoming the star: from its size and place on screen to a small star at the center. */
    center() {
      const t = this.phase.morph
      return {
        x: lerp(this.start.x, 0, t),
        y: lerp(this.start.y, this.ringY, t),
        radius: lerp(this.start.radius, STAR_RADIUS, t)
      }
    },
    neighborList() {
      return Object.values(this.neighbors ?? {}).filter((neighbor) => Number(neighbor.id) > 0)
    },
    angles() {
      return layoutNeighbors(this.neighborList.map((neighbor) => neighbor.id))
    },
    /**
     * Where the rings settle: midway between the title and the Jump / Cancel row (relative to the
     * world's star, where the view starts), and how far up or down they can reach from there.
     */
    freeSpan() {
      return { top: this.topMostY + 130, bottom: this.bottomMostY - 230 }
    },
    ringY() {
      return (this.freeSpan.top + this.freeSpan.bottom) / 2 - CENTER_Y
    },
    verticalRoom() {
      return (this.freeSpan.bottom - this.freeSpan.top) / 2 - 40 // a star's label hangs below it
    },
    /** The second ring, in ring radii (see layoutOuterRing). */
    outerRing() {
      const explored = this.explored
      return layoutOuterRing({
        currentId: this.currentStarSystemId,
        angles: this.angles,
        neighborsOf: (id) => explored?.neighborsOf(id) ?? null
      })
    },
    /** Room for the rings, measured from the star: clear of the title above and the choice below. */
    ringRadius() {
      const sideRoom = (this.rightMostX - this.leftMostX) / 2 - 90
      const room = Math.min(sideRoom, this.verticalRoom)
      // Leave space outside the first ring for the second, if there is one.
      const extent = Math.max(1, ...this.outerRing.dots.map((dot) => Math.hypot(dot.x, dot.y) + 0.06))
      return Math.max(90, room / extent)
    },
    /** Screens are wider than tall: spread the rings sideways into an ellipse, up to 1.6x. */
    stretchX() {
      const sideRoom = (this.rightMostX - this.leftMostX) / 2 - 90
      const extent = Math.max(1, ...this.outerRing.dots.map((dot) => Math.hypot(dot.x, dot.y) + 0.06))
      return Math.min(1.6, Math.max(1, sideRoom / extent / this.ringRadius))
    },
    stars() {
      const distance = this.ringRadius * lerp(FLY_IN_FROM, 1, this.phase.neighbors)
      return this.neighborList.map((neighbor) => {
        const { x, y } = pointAt(this.angles.get(String(neighbor.id)), distance)
        return {
          id: Number(neighbor.id),
          name: neighbor.name,
          visited: neighbor.name !== UNEXPLORED,
          x: x * this.stretchX,
          y: y + this.ringY
        }
      })
    },
    outerDots() {
      const scale = this.ringRadius * lerp(1.6, 1, this.phase.outer)
      return this.outerRing.dots.map((dot) => ({
        id: dot.id,
        x: dot.x * scale * this.stretchX,
        y: dot.y * scale + this.ringY
      }))
    },
    returnPaths() {
      const returning = new Set(this.outerRing.returns)
      return this.stars.filter((star) => returning.has(star.id))
    },
    chosen() {
      return this.stars.find((star) => star.id === this.chosenId) ?? null
    },
    chosenName() {
      const star = this.chosen
      return star ? (star.visited ? star.name : 'unexplored star #' + star.id) : ''
    }
  },
  mounted() {
    // The world's star (and its heliopause) sits at the camera offset, scaled down by the zoom.
    const { x, y, scale } = this.viewport
    this.start = { x: x / scale, y: y / scale, radius: HELIOPAUSE_RADIUS / scale }
    this.explored = game.explored()
    const begin = performance.now()
    const step = (now) => {
      this.progress = clamp01((now - begin) / ENTER_MS)
      if (this.progress < 1) this.frame = requestAnimationFrame(step)
    }
    this.frame = requestAnimationFrame(step)
    // The ship starts behind the star (top of its orbit) and comes out as the neighbors arrive.
    this.orbit = { angle: -Math.PI / 2 - 0.3, speed: (2 * Math.PI) / ORBIT_SECONDS }
    this.stopFrames = onFrame(this.moveShip, FRAME_ORDER.render)
  },
  unmounted() {
    cancelAnimationFrame(this.frame)
    this.stopFrames()
  },
  methods: {
    ...mapActions(useUIStore, ['exitNeighborView']),
    ...mapActions(useGameStateStore, ['moveToSystem']),
    /** Where a straight line from the center to a star leaves the center star and reaches the other. */
    ends(star, startGap, endGap) {
      const dy = star.y - this.ringY
      const length = Math.hypot(star.x, dy) || 1
      const ux = star.x / length
      const uy = dy / length
      return {
        near: { x: ux * (this.center.radius + startGap), y: this.ringY + uy * (this.center.radius + startGap) },
        far: { x: star.x - ux * endGap, y: star.y - uy * endGap }
      }
    },
    /** The route out to a neighbor: it leaves this star and bows to one side. */
    routeTo(star) {
      const { near, far } = this.ends(star, 6, 16)
      return arcPath(near, far)
    },
    /** The path back from a neighbor that leads here: drawn the other way, so it bows to the other side. */
    routeBack(star) {
      const { near, far } = this.ends(star, 6, 16)
      return arcPath(far, near)
    },
    choose(star) {
      if (this.jumpState === 'waiting') return
      if (star) this.o8audio.playEffect('click')
      this.chosenId = star ? star.id : null
      this.jumpState = null
    },
    /** Waits here, ship racing, for the wallet and the chain; the jump animation starts once the move is mined. */
    async jump() {
      this.jumpState = 'waiting'
      const jumped = await this.moveToSystem(this.chosenId)
      if (jumped) this.exitNeighborView()
      else this.jumpState = 'failed'
    },
    /** Each frame: advance the ship around the star, drawing it behind or in front depending on its depth. */
    moveShip(now) {
      const seconds = this.lastFrame ? Math.min(0.1, (now - this.lastFrame) / 1000) : 0
      this.lastFrame = now
      const target = (2 * Math.PI) / (this.jumpState === 'waiting' ? RACING_ORBIT_SECONDS : ORBIT_SECONDS)
      this.orbit.speed += (target - this.orbit.speed) * Math.min(1, seconds * 2.5)
      this.orbit.angle += this.orbit.speed * seconds
      const { angle } = this.orbit
      const a = this.center.radius + ORBIT_GAP
      const b = a * ORBIT_TILT
      const x = this.center.x + a * Math.cos(angle)
      const y = this.center.y + b * Math.sin(angle)
      // Facing along the orbit (the art's nose points up).
      const heading = (Math.atan2(b * Math.cos(angle), -a * Math.sin(angle)) * 180) / Math.PI + 90
      const depth = (Math.sin(angle) + 1) / 2 // 0 = far side, 1 = near side
      const scale = SHIP_SCALE * (0.8 + 0.2 * depth) * this.phase.neighbors
      const transform = `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${heading.toFixed(1)}) scale(${scale.toFixed(3)})`
      const behind = Math.sin(angle) < 0
      writeAttribute(this.$refs.shipBehind, 'transform', transform)
      writeAttribute(this.$refs.shipFront, 'transform', transform)
      writeAttribute(this.$refs.shipBehind, 'display', behind && scale > 0 ? 'inline' : 'none')
      writeAttribute(this.$refs.shipFront, 'display', !behind && scale > 0 ? 'inline' : 'none')
    }
  }
}
</script>

<style scoped>
.chosen-route {
  animation: travel 1.2s linear infinite;
}
@keyframes travel {
  to {
    stroke-dashoffset: -36;
  }
}
</style>
