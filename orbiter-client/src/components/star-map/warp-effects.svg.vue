<template>
  <!-- Other pilots' ships jumping out of this system, or in from another (starmap.warps). Leaving, a
       ghost of the ship speeds forward, stretches into a streak and is gone, leaving a fading flash.
       Arriving, a streak shoots in along its heading and flashes where the ship appears (the ship
       itself fades in: sprite-transform). In world units; written every frame by writeFrame. -->
  <g pointer-events="none">
    <defs>
      <radialGradient id="warpFlash">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="35%" stop-color="#e6dcf5" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#c3b3da" stop-opacity="0" />
      </radialGradient>
    </defs>
    <g v-for="warp in warps" :key="warp.id" :ref="(element) => setElement(warp.id, element)">
      <circle data-part="flash" r="0" fill="url(#warpFlash)" />
      <line data-part="streak" stroke="#e6dcf5" stroke-linecap="round" />
      <g v-if="warp.kind === 'out'" data-part="ship">
        <g transform="rotate(180)"><ship :should-show-engines="true" /></g>
      </g>
    </g>
  </g>
</template>

<script>
import { mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { writeAttribute } from '@/libs/dom-writes'
import Ship from './sprites/ship.svg'

/** How long each warp lasts (ms; WARP_IN_MS is shared with sprite-transform, which fades the ship in). */
export const WARP_IN_MS = 1000
const WARP_OUT_MS = 1300
/** On screen (pixels): the streak's length and width, and the flash's size. */
const STREAK_PX = 140
const STREAK_WIDTH_PX = 2
const FLASH_PX = 40

const clamp01 = (value) => Math.min(1, Math.max(0, value))

export default {
  name: 'WarpEffects',
  components: { Ship },
  computed: {
    ...mapState(useStarMapStore, ['warps', 'sprites'])
  },
  mounted() {
    this.elements = new Map()
    this.stopFrames = onFrame(this.writeFrame, FRAME_ORDER.render)
  },
  unmounted() {
    this.stopFrames()
  },
  methods: {
    setElement(id, element) {
      if (element) this.elements.set(id, element)
      else this.elements.delete(id)
    },
    writeFrame() {
      if (this.warps.length === 0) return
      const now = Date.now()
      const pixels = useUIStore().drawnPixelsPerUnit
      const finished = []
      for (const warp of this.warps) {
        const element = this.elements.get(warp.id)
        const t = (now - warp.start) / (warp.kind === 'out' ? WARP_OUT_MS : WARP_IN_MS)
        if (t >= 1) {
          finished.push(warp.id)
          continue
        }
        if (element) this.place(element, warp, t, pixels)
      }
      if (finished.length) useStarMapStore().endWarps(finished)
    },
    /** One warp at `t` (0 to 1) through it. */
    place(element, warp, t, pixels) {
      // Leaving: where the ship was. Arriving: where it is now, following its orbit.
      const sprite = warp.kind === 'in' ? this.sprites[warp.key] : null
      const x = sprite ? sprite.position.x : warp.x
      const y = sprite ? sprite.position.y : warp.y
      // The ship art points its nose 90° past its rotation (it's drawn turned 180°).
      const rotation = sprite ? sprite.telemetry.rotation : warp.rotation
      const nose = ((rotation + 90) * Math.PI) / 180
      const ax = Math.cos(nose)
      const ay = Math.sin(nose)
      const streak = STREAK_PX / pixels
      const flash = element.querySelector('[data-part="flash"]')
      const line = element.querySelector('[data-part="streak"]')
      writeAttribute(line, 'stroke-width', STREAK_WIDTH_PX / pixels)

      if (warp.kind === 'out') {
        // Pulls ahead, speeding up, then streaks off; a flash where it went.
        const pull = t * t * streak * 1.2
        const ship = element.querySelector('[data-part="ship"]')
        const stretch = 1 + 3 * clamp01((t - 0.3) / 0.3)
        writeAttribute(
          ship,
          'transform',
          `translate(${x + ax * pull} ${y + ay * pull}) rotate(${rotation}) scale(${warp.scale}) scale(1 ${stretch})`
        )
        writeAttribute(ship, 'opacity', 1 - clamp01((t - 0.35) / 0.25))
        const from = clamp01((t - 0.3) / 0.7) * streak
        const to = clamp01((t - 0.25) / 0.25) * streak * 1.6
        writeAttribute(line, 'x1', x + ax * from)
        writeAttribute(line, 'y1', y + ay * from)
        writeAttribute(line, 'x2', x + ax * to)
        writeAttribute(line, 'y2', y + ay * to)
        writeAttribute(line, 'opacity', 0.9 * (1 - clamp01((t - 0.5) / 0.5)))
        const burst = clamp01((t - 0.3) / 0.7)
        writeAttribute(flash, 'cx', x)
        writeAttribute(flash, 'cy', y)
        writeAttribute(flash, 'r', (FLASH_PX / pixels) * (0.3 + burst))
        writeAttribute(flash, 'opacity', t < 0.3 ? 0 : 1 - burst)
      } else {
        // A streak shoots in from behind along its heading and shrinks into it; a flash as it lands.
        const tail = (1 - clamp01(t / 0.45)) * streak * 1.6 + streak * 0.05
        const head = (1 - clamp01(t / 0.35)) * streak * 0.6
        writeAttribute(line, 'x1', x - ax * tail)
        writeAttribute(line, 'y1', y - ay * tail)
        writeAttribute(line, 'x2', x - ax * head)
        writeAttribute(line, 'y2', y - ay * head)
        writeAttribute(line, 'opacity', t < 0.45 ? 0.9 : 0)
        const burst = clamp01((t - 0.35) / 0.65)
        writeAttribute(flash, 'cx', x)
        writeAttribute(flash, 'cy', y)
        writeAttribute(flash, 'r', (FLASH_PX / pixels) * (0.3 + burst))
        writeAttribute(flash, 'opacity', t < 0.35 ? 0 : 1 - burst)
      }
    }
  }
}
</script>
