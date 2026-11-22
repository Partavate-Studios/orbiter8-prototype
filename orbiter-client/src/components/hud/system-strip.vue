<template>
  <!-- The system's bodies on the selection card's edge (Koda, round 2, item 3): the star, then every
       planet in orbit order, so the next one is a short move from the card's buttons instead of a trip
       to the top right. ‹ › step through them (as Tab, [ ], pad L1/R1 do). The asteroid belt has its
       place among the orbits; a planet's port and moons, and the belt's eight places, are the tabs
       down the card's spine (selection-panel.vue), so nothing is listed twice. Each body is a small flat sphere in
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
        <span v-if="body.belt" class="belt-ring" />
        <span v-else class="sphere" :style="body.style" />
        <i v-if="body.buys" class="buys" aria-hidden="true" />
        <i v-if="body.services" class="services" aria-hidden="true" />
        <i v-if="body.mine" class="mine" aria-hidden="true" />
        <i v-if="body.besieged" class="besieged" aria-hidden="true" />
      </button>
    </div>
    <button type="button" class="step" title="Next (] or Tab)" aria-label="Next" @click="step(1)">
      <svg viewBox="-6 -8 12 16" aria-hidden="true"><path d="M-3 -6L3 0L-3 6" /></svg>
    </button>
    <!-- the strip is the list's short form: this opens the whole of it (objects/objects-panel.vue) -->
    <button type="button" class="list" title="Everything in this system (O)" aria-label="Everything in this system" @click="openList">
      <small-icon name="all" />
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
import { BELT_KEY, beltKeys, homeOf, sphere } from '@/libs/body-art'
import { portSigns } from './ports/ports'
import SmallIcon from './small-icon.vue'

export default {
  name: 'SystemStrip',
  components: { SmallIcon },
  props: {
    /** A phone's sheet: smaller bodies. */
    compact: { type: Boolean, default: false }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects', 'spriteIds']),
    ...mapState(useUIStore, ['selected']),
    /** The planet the selection belongs to (itself, or a station's or moon's planet), or the belt. */
    selectedPlanet() {
      return homeOf(this.selected, this.systemObjects)
    },
    belt() {
      return beltKeys(this.systemObjects)
    },
    /** The star, then the planets and the belt in orbit order. */
    keys() {
      const planets = (this.spriteIds.planets ?? []).filter((key) => this.systemObjects[key])
      if (this.belt.length) {
        const radius = this.systemObjects[this.belt[0]].orbit.radius
        const at = planets.findIndex((key) => this.systemObjects[key].orbit.radius > radius)
        planets.splice(at === -1 ? planets.length : at, 0, BELT_KEY)
      }
      return this.systemObjects[STAR_KEY] ? [STAR_KEY, ...planets] : planets
    },
    bodies() {
      const player = usePlayerStore()
      const big = this.compact ? 22 : 26
      const cargo = player.cargo ?? []
      // Its port's signs (Koda, 2026-11-17): a green dot above when it buys something you carry, a gray
      // one below when it has shipyards or an armory. The belt's are its asteroids' ports'.
      const signsOf = (stations) => {
        const signs = stations.map((station) => portSigns(station, cargo))
        return { buys: signs.some((x) => x.buys), services: signs.some((x) => x.services) }
      }
      const words = ({ buys, services }) => (buys ? ' · buys what you carry' : '') + (services ? ' · shipyards or armory' : '')
      return this.keys.map((key) => {
        if (key === BELT_KEY) {
          const signs = signsOf(this.belt.map((k) => this.systemObjects[this.systemObjects[k].stationKey]).filter(Boolean))
          return { key, belt: true, on: false, family: this.selectedPlanet === BELT_KEY, title: 'The asteroid belt' + words(signs), ...signs }
        }
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
        const signs = signsOf(object.hasStation ? [this.systemObjects[object.stationKey]] : [])
        // Planets 4 to 20 across by size (sizes run about 1 to 20).
        const size = Math.round(Math.min(big - 6, 9 + (object.size ?? 8) * 0.6))
        return {
          key,
          on,
          family,
          ...signs,
          title:
            object.name +
            (object.hasStation ? ' · port' : '') +
            (object.moons?.length ? ` · ${object.moons.length} ${object.moons.length === 1 ? 'moon' : 'moons'}` : '') +
            words(signs),
          mine: object.isMine,
          besieged: Boolean(player.siegeAt?.(object.objectId)),
          style: sphere(colors.light, colors.mid, colors.dark, size)
        }
      })
    }
  },
  watch: {
    selected(key) {
      if (this.belt.includes(key)) this.lastInBelt = key
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
    ...mapActions(useUIStore, ['selectSprite', 'openMenu', 'closeMenu']),
    openList() {
      this.o8audio?.playEffect('click')
      useUIStore().menuState.objectsMenu ? this.closeMenu() : this.openMenu('objects')
    },
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
      this.go(key)
    },
    /** Selects a body; the belt selects the place in it last chosen, else its first. */
    go(key) {
      if (key !== BELT_KEY) return this.selectSprite(key)
      if (this.selectedPlanet === BELT_KEY) return
      this.selectSprite(this.belt.includes(this.lastInBelt) ? this.lastInBelt : this.belt[0])
    },
    /** The next or previous body; from a station or moon, its planet's neighbor. */
    step(direction) {
      this.o8audio.playEffect('click')
      const from = this.keys.includes(this.selected) ? this.selected : this.selectedPlanet
      const index = this.keys.indexOf(from)
      const next =
        index === -1 ? (direction > 0 ? 0 : this.keys.length - 1) : (index + direction + this.keys.length) % this.keys.length
      this.go(this.keys[next])
    }
  }
}
</script>

<style scoped>
.list {
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin: 0 4px 0 6px;
  padding: 0;
  border: 1.2px solid #4a3d7a;
  border-radius: 9px;
  background: #1a1331;
  color: #ffffff;
  cursor: pointer;
}
.list:hover {
  border-color: #b9a0ff;
}
.list:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
.list .small-icon {
  width: 16px;
  height: 16px;
}
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
/* its port buys something you carry: a green dot above (Koda, 2026-11-17) */
.buys {
  position: absolute;
  top: 0;
  left: 50%;
  width: 6px;
  height: 6px;
  margin-left: -3px;
  border-radius: 50%;
  background: #5be37d;
  box-shadow: 0 0 0 1px #12052a, 0 0 4px #5be37daa;
}
/* its port has shipyards or an armory: a gray dot below */
.services {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 6px;
  height: 6px;
  margin-left: -3px;
  border-radius: 50%;
  background: #a9a3bb;
  box-shadow: 0 0 0 1px #12052a;
}
/* the belt: a ring of rocks */
.belt-ring {
  display: block;
  width: 20px;
  height: 20px;
  box-sizing: border-box;
  border: 3.5px dotted #b8a98f;
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
