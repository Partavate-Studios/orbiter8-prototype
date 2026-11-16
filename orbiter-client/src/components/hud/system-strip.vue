<template>
  <!-- The system's bodies on the selection card's edge (Koda, round 2, item 3): the star, then every
       planet in orbit order, so the next one is a short move from the card's buttons instead of a trip
       to the top right. ‹ › step through them (as Tab, [ ], pad L1/R1 do). A planet's station and moons
       are the menu's icons, not here, so nothing is listed twice. Each body is a small flat sphere in
       its class's colors: cheap, no per-frame art. -->
  <nav class="system-strip" :class="{ compact }" aria-label="This system's star and planets">
    <button type="button" class="step" title="Previous ([ or Shift+Tab)" aria-label="Previous" @click="step(-1)">
      <svg viewBox="-6 -8 12 16" aria-hidden="true"><path d="M3 -6L-3 0L3 6" /></svg>
    </button>
    <div ref="row" class="row" data-own-scroll>
      <button
        v-for="body in bodies"
        :key="body.key"
        :ref="(element) => setButton(body.key, element)"
        type="button"
        class="body"
        :class="{ on: body.on, family: body.family }"
        :title="body.title"
        :aria-label="body.title"
        :aria-current="body.on ? 'true' : undefined"
        @click="select(body.key)"
      >
        <span class="sphere" :style="body.style" />
        <i v-if="body.mine" class="mine" aria-hidden="true" />
        <i v-if="body.besieged" class="besieged" aria-hidden="true" />
      </button>
    </div>
    <button type="button" class="step" title="Next (] or Tab)" aria-label="Next" @click="step(1)">
      <svg viewBox="-6 -8 12 16" aria-hidden="true"><path d="M-3 -6L3 0L-3 6" /></svg>
    </button>
  </nav>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { STAR_KEY } from '@orbiter8/sdk/system'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { PLANET_COLORS, STAR_CLASSES } from '@/libs/palette'

/** A body's sphere: lit from the upper left, in its light, mid and dark colors (cheap CSS, no SVG). */
const sphere = (light, mid, dark, size) => ({
  width: size + 'px',
  height: size + 'px',
  background: `radial-gradient(circle at 32% 30%, ${light} 0%, ${mid} 45%, ${dark} 100%)`
})

export default {
  name: 'SystemStrip',
  props: {
    /** A phone's sheet: smaller bodies. */
    compact: { type: Boolean, default: false }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects', 'spriteIds']),
    ...mapState(useUIStore, ['selected']),
    /** The planet the selection belongs to (itself, or a station's or moon's planet). */
    selectedPlanet() {
      const object = this.systemObjects[this.selected]
      if (!object) return null
      if (object.type === 'planet') return object.key
      if (object.type === 'station' || object.type === 'moon') return object.orbiting
      return null
    },
    keys() {
      return [STAR_KEY, ...(this.spriteIds.planets ?? [])].filter((key) => this.systemObjects[key])
    },
    bodies() {
      const player = usePlayerStore()
      const big = this.compact ? 22 : 26
      return this.keys.map((key) => {
        const object = this.systemObjects[key]
        const on = key === this.selected
        const family = !on && key === this.selectedPlanet
        if (object.type === 'star') {
          const star = STAR_CLASSES[object.spectral] ?? STAR_CLASSES.G
          return {
            key,
            on,
            family,
            title: object.name,
            style: object.blackHole
              ? { ...sphere('#05010d', '#05010d', '#05010d', big - 4), boxShadow: '0 0 0 2px #af6fff' }
              : { ...sphere(star.core, star.mid, star.glow, big - 2), boxShadow: `0 0 8px ${star.glow}88` }
          }
        }
        const colors = PLANET_COLORS[object.class] ?? PLANET_COLORS[1]
        // Planets 4 to 20 across by size (sizes run about 1 to 20).
        const size = Math.round(Math.min(big - 6, 9 + (object.size ?? 8) * 0.6))
        return {
          key,
          on,
          family,
          title: object.name + (object.hasStation ? ' · port' : '') + (object.moons?.length ? ` · ${object.moons.length} ${object.moons.length === 1 ? 'moon' : 'moons'}` : ''),
          mine: object.isMine,
          besieged: Boolean(player.siegeAt?.(object.objectId)),
          style: sphere(colors.light, colors.mid, colors.dark, size)
        }
      })
    }
  },
  watch: {
    selected() {
      this.$nextTick(this.scrollToSelected)
    }
  },
  created() {
    this.buttons = new Map()
  },
  mounted() {
    this.scrollToSelected()
  },
  methods: {
    ...mapActions(useUIStore, ['selectSprite']),
    setButton(key, element) {
      if (element) this.buttons.set(key, element)
      else this.buttons.delete(key)
    },
    /** Keeps the selected body (or its planet) in view when the strip scrolls. */
    scrollToSelected() {
      const key = this.keys.includes(this.selected) ? this.selected : this.selectedPlanet
      const button = this.buttons.get(key)
      const row = this.$refs.row
      if (!button || !row) return
      const left = button.offsetLeft - row.offsetLeft
      if (left < row.scrollLeft || left + button.offsetWidth > row.scrollLeft + row.clientWidth) {
        row.scrollTo?.({ left: left - row.clientWidth / 2 + button.offsetWidth / 2, behavior: 'smooth' })
      }
    },
    select(key) {
      this.o8audio.playEffect('click')
      this.selectSprite(key)
    },
    /** The next or previous body; from a station or moon, its planet's neighbor. */
    step(direction) {
      this.o8audio.playEffect('click')
      const from = this.keys.includes(this.selected) ? this.selected : this.selectedPlanet
      const index = this.keys.indexOf(from)
      const next =
        index === -1 ? (direction > 0 ? 0 : this.keys.length - 1) : (index + direction + this.keys.length) % this.keys.length
      this.selectSprite(this.keys[next])
    }
  }
}
</script>

<style scoped>
.system-strip {
  display: flex;
  align-items: center;
  height: 40px;
  box-sizing: border-box;
  padding: 0 4px;
  border: 1px solid #3f3566;
  border-radius: 20px;
  background: #12052ae6;
}
.row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  /* room for the focus ring */
  padding: 0 3px;
}
.row::-webkit-scrollbar {
  display: none;
}
.step,
.body {
  flex: none;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.step {
  width: 26px;
  height: 32px;
  border-radius: 16px;
}
.step svg {
  width: 10px;
  height: 14px;
}
.step path {
  fill: none;
  stroke: #c3b3da;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.step:hover {
  background: #302651;
}
.body {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.body:hover {
  background: #302651;
}
.sphere {
  display: block;
  border-radius: 50%;
}
/* the selection: ringed in the focus lavender; its planet (when a station or moon is selected) dashed */
.body.on {
  box-shadow: inset 0 0 0 2px #b9a0ff;
}
.body.family {
  box-shadow: inset 0 0 0 1.5px #b9a0ff88;
}
/* yours: a small yellow mark (the color guide's "yours is a mark") */
.mine {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--o8-yellow);
  box-shadow: 0 0 0 1px #12052a;
}
/* under siege: a pink ring (it needs you) */
.besieged {
  position: absolute;
  inset: 2px;
  border: 1.5px dashed var(--o8-pink-light, #ff6fb0);
  border-radius: 50%;
}
.compact {
  height: 36px;
}
.compact .body {
  width: 30px;
  height: 30px;
}
</style>
