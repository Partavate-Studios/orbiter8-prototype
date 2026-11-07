<template>
  <!-- Going through a black hole (D17): the Orbiter 8 flies at the hole, its nose stretches in ahead of
       its tail, then the tail catches up and the hole swallows it; the ring flashes. Played once the
       move is sent (stores/gamestate.js traverseBlackHole), over everything; the jump animation runs
       under it and carries on to the far side. -->
  <div v-if="at" class="entry" :style="{ opacity: fade }">
    <svg viewBox="-300 -300 600 600" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="entryGlow">
          <stop offset="0%" :stop-color="MAP.partnerLink" stop-opacity="0.55" />
          <stop offset="100%" :stop-color="MAP.partnerLink" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle r="150" fill="url(#entryGlow)" :opacity="0.5 + flash * 0.5" />
      <circle r="62" fill="none" :stroke="MAP.charted" stroke-width="3" :opacity="0.6 + flash * 0.4" />
      <circle :r="62 + flash * 60" fill="none" :stroke="MAP.charted" stroke-width="2" :opacity="flash * 0.7" />
      <circle r="52" :fill="MAP.hole" />
      <!-- The ship, nose up (the art's), stretched along its length from the tail -->
      <g v-if="ship.k > 0.01" :transform="`translate(0 ${ship.tail}) scale(1 ${ship.k}) translate(0 ${-LENGTH / 2})`">
        <g :transform="`scale(${ART_SCALE})`"><ship :should-show-engines="true" /></g>
      </g>
      <!-- The hole's dark disk again, over the part of the ship already inside -->
      <circle r="52" :fill="MAP.hole" :opacity="ship.inside" />
    </svg>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { MAP } from '@/libs/palette'
import { BLACK_HOLE_ENTRY_MS } from '@/constants'
import Ship from '@/components/star-map/sprites/ship.svg'

/** The ship's art is 11.5 units long (sprites/ship.svg.vue); drawn this many times larger. */
const ART_SCALE = 7
const LENGTH = 11.5 * ART_SCALE
/** Where the ship's tail sits when it stops to enter, below the hole's center. */
const TAIL = 170 + LENGTH / 2

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const clamp01 = (t) => Math.max(0, Math.min(1, t))

export default {
  name: 'BlackHoleEntry',
  components: { Ship },
  data() {
    return { MAP, ART_SCALE, LENGTH, t: 0 }
  },
  computed: {
    ...mapState(useUIStore, { at: 'blackHoleEntry' }),
    /** The tail's y and the stretch: approach, nose in, tail catches up. */
    ship() {
      const t = this.t
      if (t < 0.28) {
        // approach: the whole ship flies up to where it stops
        const p = ease(t / 0.28)
        return { tail: TAIL + 140 * (1 - p), k: 1, inside: 0 }
      }
      if (t < 0.64) {
        // the nose stretches into the hole; the tail holds back
        const p = ease((t - 0.28) / 0.36)
        const nose = TAIL - LENGTH + (0 - (TAIL - LENGTH)) * p
        return { tail: TAIL, k: (TAIL - nose) / LENGTH, inside: p * 0.3 }
      }
      // the tail catches up, and the hole takes it all
      const p = ease(clamp01((t - 0.64) / 0.24))
      const tail = TAIL * (1 - p)
      return { tail, k: tail / LENGTH, inside: 0.3 + p * 0.7 }
    },
    /** The ring's flash as the ship disappears. */
    flash() {
      return this.t < 0.84 ? 0 : Math.sin(Math.PI * clamp01((this.t - 0.84) / 0.16))
    },
    fade() {
      return this.t < 0.08 ? this.t / 0.08 : this.t > 0.92 ? (1 - this.t) / 0.08 : 1
    }
  },
  watch: {
    at: {
      immediate: true,
      handler(at) {
        cancelAnimationFrame(this.frame)
        if (!at) return
        const step = () => {
          this.t = clamp01((Date.now() - at) / BLACK_HOLE_ENTRY_MS)
          if (this.t < 1) this.frame = requestAnimationFrame(step)
          else useUIStore().blackHoleEntry = null
        }
        step()
      }
    }
  },
  unmounted() {
    cancelAnimationFrame(this.frame)
  }
}
</script>

<style scoped>
.entry {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: none;
  background: radial-gradient(ellipse at center, #1c0838ee 0%, #0b0218f5 70%);
}
svg {
  width: 100%;
  height: 100%;
}
</style>
