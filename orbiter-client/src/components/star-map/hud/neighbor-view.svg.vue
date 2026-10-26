<template>
  <!-- Zoomed out past the heliopause: the current system becomes a star, and its neighbors (one jump
       away) appear around it. Another way to jump besides the jump menu. Drawn in HUD units,
       centered where the world's star sits. -->
  <g class="neighbor-view">
    <!-- dims the system behind; clicking empty space drops the current choice -->
    <rect
      :x="leftMostX"
      :y="topMostY"
      :width="rightMostX - leftMostX"
      :height="bottomMostY - topMostY"
      fill="#12052a"
      :opacity="0.55 * progress"
      @click="choose(null)"
    />

    <g text-anchor="middle" dominant-baseline="middle" :opacity="progress">
      <text x="0" :y="topMostY + 60" fill="#ffffffcc" font-size="1.4em">Neighboring Stars</text>
      <text x="0" :y="topMostY + 88" fill="#ffffff66" font-size="0.8em">
        Each is one jump away. Scroll in (or press Esc) to return to {{ currentStarSystemName }}.
      </text>
    </g>

    <g :transform="'translate(0 ' + CENTER_Y + ')'">
      <!-- faint routes to every neighbor; the chosen one is drawn bright and animated below -->
      <path
        v-for="star in stars"
        :key="'route-' + star.id"
        :d="routeTo(star)"
        fill="none"
        stroke="#c3b3da"
        stroke-width="1"
        stroke-dasharray="2 6"
        :opacity="0.25 * progress"
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

      <!-- this system, shrunk to a star -->
      <circle cx="0" cy="0" :r="centerRadius * 2.2" fill="url(#glowingGradient)" />
      <circle cx="0" cy="0" :r="centerRadius" fill="url(#starGradient)" stroke="#ffffffaa" stroke-width="1.5" />
      <text x="0" :y="centerRadius + 22" text-anchor="middle" fill="#ffffffcc" font-size="0.9em">
        {{ currentStarSystemName }}
      </text>

      <g v-for="star in stars" :key="'star-' + star.id" :transform="'translate(' + star.x + ' ' + star.y + ')'">
        <a cursor="pointer" @click.prevent="choose(star)">
          <circle cx="0" cy="0" r="34" fill="#ffffff00" />
          <circle cx="0" cy="0" :r="star.visited ? 26 : 20" fill="url(#glowingGradient)" :opacity="progress" />
          <circle
            cx="0"
            cy="0"
            :r="star.visited ? 11 : 8"
            :fill="star.visited ? '#e5cfff' : '#8e7aaa'"
            :stroke="chosen && chosen.id === star.id ? '#ffffff' : 'none'"
            stroke-width="2"
            :opacity="progress"
          />
          <text
            x="0"
            y="30"
            text-anchor="middle"
            :fill="star.visited ? '#ffffffdd' : '#ffffff77'"
            font-size="0.8em"
            :opacity="progress"
            >{{ star.visited ? star.name : 'Unexplored' }}</text
          >
          <text x="0" y="46" text-anchor="middle" fill="#ffffff55" font-size="0.6em" :opacity="progress">
            #{{ star.id }}
          </text>
        </a>
      </g>
    </g>

    <!-- the choice -->
    <g v-if="chosen" :transform="'translate(0 ' + (bottomMostY - 150) + ')'" text-anchor="middle">
      <text x="0" y="-48" fill="#ffffffcc" font-size="1em">
        Jump to {{ chosen.visited ? chosen.name : 'unexplored star #' + chosen.id }}?
      </text>
      <g transform="translate(-135 0)">
        <menu-button :text="'Jump'" @buttonclick="jump" />
      </g>
      <g transform="translate(135 0)">
        <menu-button :text="'Cancel'" @buttonclick="choose(null)" />
      </g>
    </g>
  </g>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { useGameStateStore } from '@/stores/gamestate'
import { layoutNeighbors, pointAt, arcPath } from '@/sdk/game/neighbor-layout'
import MenuButton from './menus/menu-button.svg'

// The world's star sits this far above the HUD's center (WORLD_OFFSET_Y in group units).
const CENTER_Y = -100
// How long the neighbors take to slide out from the center.
const ENTER_MS = 600
// The contract's name for a star nobody has visited yet.
const UNEXPLORED = 'Unexplored Star'

export default {
  name: 'NeighborView',
  components: {
    MenuButton
  },
  data() {
    return {
      CENTER_Y,
      // 0 → 1 while the view opens
      progress: 0,
      chosenId: null
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['neighbors', 'currentStarSystemName']),
    ...mapState(useUIStore, ['leftMostX', 'rightMostX', 'topMostY', 'bottomMostY']),
    /** Room for the ring of stars, measured from the star: clear of the title above, the choice below. */
    ringRadius() {
      const sideRoom = (this.rightMostX - this.leftMostX) / 2 - 90
      const roomAbove = CENTER_Y - this.topMostY - 140 // title and hint, plus a star's label
      const roomBelow = this.bottomMostY - CENTER_Y - 250 // a star's label, then the Jump / Cancel row
      return Math.max(120, Math.min(sideRoom, roomAbove, roomBelow))
    },
    /** The system grows from its size at full zoom-out into a star. */
    centerRadius() {
      return 8 + 10 * this.progress
    },
    stars() {
      const list = Object.values(this.neighbors ?? {}).filter((neighbor) => Number(neighbor.id) > 0)
      const angles = layoutNeighbors(list.map((neighbor) => neighbor.id))
      const distance = this.ringRadius * (0.15 + 0.85 * this.progress)
      return list.map((neighbor) => {
        const { x, y } = pointAt(angles.get(String(neighbor.id)), distance)
        return { id: Number(neighbor.id), name: neighbor.name, visited: neighbor.name !== UNEXPLORED, x, y }
      })
    },
    chosen() {
      return this.stars.find((star) => star.id === this.chosenId) ?? null
    }
  },
  mounted() {
    const start = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - start) / ENTER_MS)
      this.progress = 1 - Math.pow(1 - t, 3) // ease out
      if (t < 1) this.frame = requestAnimationFrame(step)
    }
    this.frame = requestAnimationFrame(step)
  },
  unmounted() {
    cancelAnimationFrame(this.frame)
  },
  methods: {
    ...mapActions(useUIStore, ['exitNeighborView']),
    ...mapActions(useGameStateStore, ['moveToSystem']),
    /** The route from this star to a neighbor: it leaves the star's edge and bows to one side. */
    routeTo(star) {
      const length = Math.hypot(star.x, star.y) || 1
      const start = { x: (star.x / length) * (this.centerRadius + 6), y: (star.y / length) * (this.centerRadius + 6) }
      const end = { x: star.x - (star.x / length) * 16, y: star.y - (star.y / length) * 16 }
      return arcPath(start, end)
    },
    choose(star) {
      if (star) this.o8audio.playEffect('click')
      this.chosenId = star ? star.id : null
    },
    jump() {
      const destination = this.chosenId
      this.exitNeighborView()
      // Same as the jump menu: plays the jump animation until the new system loads.
      this.moveToSystem(destination)
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
