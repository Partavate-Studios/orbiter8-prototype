<template>
  <!-- What's around the selection, under the system strip (Koda, 2026-11-17): a planet, its port and
       its moons; or, in the belt, its eight places (asteroids, their ports, and the empty space ships
       mine). Big labeled chips, so going between a planet and its port (and back) is one clear press.
       The selection is ringed; yours carry the yellow mark, a siege the pink ring, as in the system strip. -->
  <nav v-if="items.length > 1" class="nearby-strip" :class="{ compact }" :aria-label="home === BELT_KEY ? 'The asteroid belt' : 'This planet, its port and moons'">
    <div ref="row" class="row" data-own-scroll>
      <button
        v-for="item in items"
        :key="item.key"
        :ref="(element) => setButton(item.key, element)"
        type="button"
        class="chip"
        :class="{ on: item.key === selected, port: item.port }"
        :title="item.title"
        :aria-current="item.key === selected ? 'true' : undefined"
        @click="select(item.key)"
      >
        <span class="pic">
          <img v-if="item.art" :src="item.art" alt="" />
          <span v-else class="sphere" :style="item.style" />
          <i v-if="item.mine" class="mine" aria-hidden="true" />
          <i v-if="item.besieged" class="besieged" aria-hidden="true" />
        </span>
        <span class="label">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { ASTEROID_ART, BELT_KEY, DUST_ART, PORT_ART, beltKeys, bodySphere, homeOf } from '@/libs/body-art'

export default {
  name: 'NearbyStrip',
  props: {
    /** A phone's sheet: smaller chips. */
    compact: { type: Boolean, default: false }
  },
  data() {
    return { BELT_KEY }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects']),
    ...mapState(useUIStore, ['selected']),
    home() {
      return homeOf(this.selected, this.systemObjects)
    },
    items() {
      const objects = this.systemObjects
      const player = usePlayerStore()
      const besieged = (o) => Boolean(o.objectId != null && player.siegeAt?.(o.objectId))
      const size = this.compact ? 20 : 24
      const portOf = (owner) => {
        const station = objects[owner.stationKey]
        return station
          ? [{ key: station.key, label: 'Port', title: station.name + ': trade, yards, armory', art: PORT_ART, port: true, mine: station.isMine }]
          : []
      }
      if (!this.home) return []
      if (this.home === BELT_KEY) {
        return beltKeys(objects).flatMap((key) => {
          const o = objects[key]
          if (o.type === 'section') return [{ key, label: o.dustName ? o.dustName + ' dust' : 'Dust', title: o.name + ': empty space to mine', art: DUST_ART }]
          const asteroid = { key, label: o.name, title: `${o.name}, ${o.compositionName} asteroid, size ${o.size}`, art: ASTEROID_ART[o.composition] ?? ASTEROID_ART[0], mine: o.isMine, besieged: besieged(o) }
          return [asteroid, ...portOf(o)]
        })
      }
      const planet = objects[this.home]
      if (!planet) return []
      return [
        { key: planet.key, label: planet.name, title: planet.name, style: bodySphere(planet, size), mine: planet.isMine, besieged: besieged(planet) },
        ...portOf(planet),
        ...(planet.moons ?? []).map(({ moonId, moonName }) => ({
          key: moonId,
          label: moonName,
          title: moonName + ', moon of ' + planet.name,
          style: bodySphere(objects[moonId], Math.round(size * 0.7))
        }))
      ]
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
    scrollToSelected() {
      const button = this.buttons.get(this.selected)
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
    }
  }
}
</script>

<style scoped>
.nearby-strip {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 4px;
  border: 1px solid #3f3566;
  border-radius: 26px;
  background: #12052ae6;
}
.row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  /* room for the focus ring */
  padding: 2px;
}
.row::-webkit-scrollbar {
  display: none;
}
/* a body's chip: its picture and its name, big enough to aim at */
.chip {
  flex: none;
  display: flex;
  align-items: center;
  gap: 7px;
  height: 42px;
  max-width: 150px;
  box-sizing: border-box;
  padding: 0 14px 0 5px;
  border: 1.5px solid #4a3d7a;
  border-radius: 21px;
  background: #1f173a;
  color: #e6dcf5;
  font: inherit;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.chip:hover {
  border-color: #b9a0ff;
  background: #302651;
}
.chip:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
/* the port: where the trading is, so it stands out among the bodies */
.chip.port {
  border-color: #7d6bc4;
  background: linear-gradient(135deg, #3d1a73 0%, #2a1050 100%);
}
/* the selection */
.chip.on {
  border-color: #b9a0ff;
  background: #3d3066;
  box-shadow: 0 0 0 1.5px #b9a0ff55;
  color: #ffffff;
}
.pic {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
}
.pic img {
  width: 32px;
  height: 32px;
}
.sphere {
  display: block;
  border-radius: 50%;
}
.label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* yours: the yellow mark; a siege: the pink ring (as system-strip.vue) */
.mine {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--o8-yellow);
  box-shadow: 0 0 0 1px #12052a;
}
.besieged {
  position: absolute;
  inset: 0;
  border: 1.5px dashed var(--o8-pink-light, #ff6fb0);
  border-radius: 50%;
}
.compact .chip {
  height: 38px;
  max-width: 130px;
  padding: 0 12px 0 4px;
  font-size: 13px;
}
.compact .pic,
.compact .pic img {
  width: 28px;
  height: 28px;
}
</style>
