<template>
  <!-- The outliner: this system as a list beside the map (a bottom sheet on phones). Pointing at a row
       rings that object on the map; choosing it selects it and the camera flies there. Opened from
       the HUD's planets and ships buttons (ui store openOutliner). -->
  <aside v-if="outliner" class="outliner" data-own-scroll :aria-label="'Everything in ' + currentStarSystemName">
    <header>
      <div class="tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="outliner === tab.id"
          @click="openOutliner(tab.id)"
        >
          {{ tab.label }} <span class="count">{{ tab.count }}</span>
        </button>
      </div>
      <button type="button" class="close" aria-label="Close the list" @click="closeOutliner">×</button>
    </header>

    <ol v-if="outliner === 'planets'" class="rows">
      <li v-for="planet in planets" :key="planet.key" :class="{ selected: selected === planet.key }">
        <button type="button" class="row" v-bind="pointing(planet.key)" @click="go(planet.key)">
          <span class="globe" :style="{ '--diameter': planet.diameter + 'px' }"></span>
          <span class="words">
            <span class="name">{{ planet.name }}</span>
            <span class="meta">{{ planet.kind }} · {{ planet.owner }}</span>
          </span>
          <span v-if="planet.myShipHere" class="you" title="Your ship is here">You</span>
        </button>
        <div v-if="planet.children.length" class="children">
          <button
            v-for="child in planet.children"
            :key="child.key"
            type="button"
            class="chip"
            :class="[child.type, { selected: selected === child.key }]"
            :title="child.type === 'station' ? 'Space station' : 'Moon'"
            v-bind="pointing(child.key)"
            @click="go(child.key)"
          >
            {{ child.name }}
          </button>
        </div>
      </li>
    </ol>

    <ol v-else class="rows">
      <li v-for="ship in ships" :key="ship.key" :class="{ selected: selected === ship.key }">
        <button type="button" class="row" v-bind="pointing(ship.key)" @click="go(ship.key)">
          <span class="ship-mark" :class="{ mine: ship.mine }"></span>
          <span class="words">
            <span class="name">{{ ship.name }}</span>
            <span class="meta">{{ ship.mine ? 'Yours' : ship.owner }} · {{ ship.where }}</span>
          </span>
        </button>
      </li>
      <li v-if="ships.length === 0" class="empty">No ships in this system.</li>
    </ol>
  </aside>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { planetTypeName } from '@/sdk/game/planet-types'

// Phones show the panel as a bottom sheet; choosing something there closes it so the map shows.
const SHEET_QUERY = '(max-aspect-ratio: 1/1)'

export default {
  name: 'Outliner',
  computed: {
    ...mapState(useUIStore, ['outliner', 'selected']),
    ...mapState(useStarMapStore, ['systemObjects', 'spriteIds', 'myShipId', 'currentStarSystemName']),
    tabs() {
      return [
        { id: 'planets', label: 'Planets', count: this.planets.length },
        { id: 'ships', label: 'Ships', count: this.ships.length }
      ]
    },
    planets() {
      const myShip = this.systemObjects[this.myShipId]
      return (this.spriteIds.planets ?? []).map((key) => {
        const planet = this.systemObjects[key]
        const children = []
        if (planet.hasStation) {
          children.push({ key: planet.stationKey, type: 'station', name: this.systemObjects[planet.stationKey]?.name })
        }
        for (const moon of planet.moons) children.push({ key: moon.moonId, type: 'moon', name: moon.moonName })
        return {
          key,
          name: planet.name,
          kind: planetTypeName(planet.class),
          owner: planet.isMine ? 'Yours' : Number(planet.owner) === 0 ? 'Unclaimed' : planet.ownerName,
          // Sized like the planets themselves, within a row's height.
          diameter: 8 + Math.min(14, Number(planet.size) / 4),
          myShipHere: myShip?.orbiting === key,
          children
        }
      })
    },
    ships() {
      const ships = (this.spriteIds.ships ?? []).map((key) => {
        const ship = this.systemObjects[key]
        const at = this.systemObjects[ship.orbiting]
        return {
          key,
          name: ship.name,
          owner: ship.ownerName,
          mine: ship.isMine,
          where: at?.type === 'planet' ? 'at ' + at.name : 'near the star'
        }
      })
      return ships.sort((a, b) => Number(b.mine) - Number(a.mine))
    }
  },
  methods: {
    ...mapActions(useUIStore, ['openOutliner', 'closeOutliner', 'selectSprite', 'highlight']),
    /** Pointing at a row (mouse or keyboard focus) rings its object on the map. */
    pointing(key) {
      const off = () => this.highlight(null)
      return {
        onMouseenter: () => this.highlight(key),
        onMouseleave: off,
        onFocus: () => this.highlight(key),
        onBlur: off
      }
    },
    go(key) {
      this.selectSprite(key)
      if (window.matchMedia(SHEET_QUERY).matches) this.closeOutliner()
    }
  }
}
</script>

<style scoped>
.outliner {
  position: fixed;
  top: 96px;
  right: 128px;
  bottom: 16px;
  width: 300px;
  z-index: 1050;
  display: flex;
  flex-direction: column;
  border: 1px solid #c3b3da44;
  border-radius: 14px;
  background: #12052ae6;
  color: #e6dcf5;
  font-family: Ubuntu, sans-serif;
  font-size: 14px;
  overflow: hidden;
}
header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px 6px 12px;
  border-bottom: 1px solid #c3b3da22;
}
.tabs {
  display: flex;
  gap: 4px;
  flex: 1;
}
.tabs button {
  padding: 5px 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: none;
  color: #c3b3da;
  font: inherit;
  cursor: pointer;
}
.tabs button[aria-selected='true'] {
  border-color: #c3b3da55;
  background: #3a1a66cc;
  color: #ffffff;
}
.count {
  color: #c3b3da99;
  font-size: 12px;
}
.close {
  border: 0;
  background: none;
  color: #c3b3da;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
.close:hover {
  color: #ffffff;
}
.rows {
  flex: 1;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  list-style: none;
  overscroll-behavior: contain;
}
.rows li {
  border-radius: 10px;
}
.rows li.selected {
  background: #3a1a6699;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.row:hover,
.row:focus-visible {
  background: #5a2f9655;
  outline: none;
}
.globe {
  flex: none;
  width: 22px;
  display: flex;
  justify-content: center;
}
.globe::before {
  content: '';
  width: var(--diameter);
  height: var(--diameter);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #eadcff, #a48bd0 55%, #34245a);
}
.ship-mark {
  flex: none;
  width: 22px;
  height: 10px;
  /* a small dart, nose to the right */
  clip-path: polygon(0 0, 100% 50%, 0 100%, 25% 50%);
  background: #c3b3da;
}
.ship-mark.mine {
  background: #ffffff;
}
.words {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.name {
  color: #ffffff;
}
.meta {
  color: #c3b3da;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.you {
  flex: none;
  padding: 1px 7px;
  border: 1px solid #e6dcf588;
  border-radius: 999px;
  font-size: 11px;
}
.children {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 8px 8px 40px;
}
.chip {
  padding: 2px 9px;
  border: 1px solid #c3b3da33;
  border-radius: 999px;
  background: #2a0f4f;
  color: #c3b3da;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.chip.station {
  border-color: #c3b3da77;
  color: #e6dcf5;
}
.chip:hover,
.chip:focus-visible,
.chip.selected {
  background: #5a2f96;
  color: #ffffff;
  outline: none;
}
.empty {
  padding: 12px;
  color: #c3b3da;
}

/* Phones: a sheet from the bottom, leaving the map visible above it. */
@media (max-aspect-ratio: 1/1) {
  .outliner {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    max-height: 45vh;
    border-radius: 16px 16px 0 0;
  }
}
</style>
