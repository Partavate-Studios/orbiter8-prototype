<template>
  <!-- Where you are, as one panel (Koda chose this on 2026-11-21: docs/mockups/together/9, way B). The
       name leads: what's at the center (its button selects it), the system's number and name (press:
       the list of everything here, with how many), and Map (the galaxy map). Under it the minimap and
       its zoom fold out, and fold away. On a phone the name and the map: the rest are tabs. -->
  <div class="system-block" :class="{ compact, folded: mapFolded }">
    <div class="plate">
      <rim-button v-if="!compact" class="center" label="The center" :title="starTitle" bare :tint="starTint" @press="$emit('star')">
        <star-icon />
      </rim-button>
      <button type="button" class="name" :class="{ on: menuState.objectsMenu }" title="Everything in this system (O)" @click="$emit('menu', 'objects')">
        <span class="words">
          <small>Star System {{ currentStarSystemId }}</small>
          <b :style="{ fontSize: nameFit.size + 'px' }">{{ nameFit.text }}</b>
        </span>
        <span v-if="!compact" class="list"><small-icon name="all" />{{ thingCount }}</span>
      </button>
      <button v-if="!compact" type="button" class="map" title="Galaxy map: jump to another star (M)" aria-label="Galaxy map" @click="$emit('jump')">
        <map-icon />
      </button>
    </div>
    <!-- the map of the system, and its zoom beside it (Koda, round 2: "it should be next to the map") -->
    <div v-if="!mapFolded" class="map-row">
      <svg v-if="mapDataLoaded" class="minimap" viewBox="-56 -56 112 112"><minimap /></svg>
      <zoom-rail :height="compact ? 96 : 132" :compact="compact" />
    </div>
    <button type="button" class="fold" :title="mapFolded ? 'Show the map' : 'Fold the map away'" :aria-label="mapFolded ? 'Show the map' : 'Fold the map away'" :aria-expanded="mapFolded ? 'false' : 'true'" @click="toggleMapFold()">
      <svg viewBox="-8 -4 16 8" aria-hidden="true"><path :d="mapFolded ? 'M-5 -2L0 2L5 -2' : 'M-5 2L0 -2L5 2'" /></svg>
    </button>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { STAR_KEY } from '@orbiter8/sdk/system'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { fitText } from '@/libs/fit-text'
import { STAR_CLASSES } from '@/libs/palette'
import Minimap from '@/components/star-map/hud/minimap.svg'
import StarIcon from '@/components/star-map/hud/icons/star-icon.svg'
import RimButton from './rim-button.vue'
import ZoomRail from './zoom-rail.vue'
import SmallIcon from './small-icon.vue'
import MapIcon from './map-icon.svg.vue'

/** The star button takes the star's light (sdk/traits.js); a black hole its partner link's violet. */
export function starTint(star) {
  if (star?.blackHole) return '#af6fff'
  return star?.spectral ? STAR_CLASSES[star.spectral].glow : '#e6dcf5'
}

export default {
  name: 'SystemBlock',
  components: { Minimap, StarIcon, RimButton, ZoomRail, SmallIcon, MapIcon },
  props: {
    compact: { type: Boolean, default: false }
  },
  emits: ['star', 'jump', 'menu'],
  computed: {
    ...mapState(useStarMapStore, ['currentStarSystemId', 'currentStarSystemName', 'mapDataLoaded', 'systemObjects']),
    ...mapState(useUIStore, ['menuState', 'selected', 'mapFolded']),
    nameFit() {
      return fitText(this.currentStarSystemName ?? '', this.compact ? 20 : 22, this.compact ? 150 : 150)
    },
    starTint() {
      return starTint(this.systemObjects[STAR_KEY])
    },
    starTitle() {
      return this.selected === STAR_KEY ? 'Neighboring stars' : (this.systemObjects[STAR_KEY]?.name ?? 'The center')
    },
    /** Everything in the list: the bodies and the ships (not the belt's empty space). */
    thingCount() {
      return Object.values(this.systemObjects).filter((o) => o.type !== 'section').length
    }
  },
  methods: {
    ...mapActions(useUIStore, ['toggleMapFold'])
  }
}
</script>

<style scoped>
.system-block {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
  border: 1.5px solid #5a4c8c;
  border-radius: 28px;
  background: #12052aee;
}
.plate {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 56px;
  padding: 0 6px;
}
.center {
  flex: none;
}
button {
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
button:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
/* the name: press it for the list of everything here */
.name {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  height: 46px;
  padding: 0 10px 0 6px;
  border: 1.5px solid transparent;
  border-radius: 14px;
  background: none;
  color: #ffffff;
  text-align: left;
}
.name:hover,
.name.on {
  border-color: #b9a0ff;
  background: #302651;
}
.words {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.words small {
  color: #ffffffaa;
  font-size: 11px;
}
.words b {
  color: #ffffff;
  font-weight: normal;
  line-height: 1.1;
  white-space: nowrap;
}
.list {
  flex: none;
  display: flex;
  align-items: center;
  gap: 5px;
  padding-left: 12px;
  border-left: 1px solid #5a4c8c;
  font-size: 15px;
}
.list .small-icon {
  width: 20px;
  height: 20px;
}
.map {
  flex: none;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border: 1.5px solid transparent;
  border-radius: 14px;
  background: none;
}
.map:hover {
  border-color: #b9a0ff;
  background: #302651;
}
.map-row {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 6px;
  padding: 2px 12px 0;
}
.minimap {
  display: block;
  flex: 1;
  max-width: 200px;
  height: 132px;
}
/* folds the map away under the name, and brings it back */
.fold {
  align-self: center;
  display: grid;
  place-items: center;
  width: 64px;
  height: 18px;
  padding: 0;
  border: 0;
  background: none;
}
.fold svg {
  width: 16px;
  height: 8px;
}
.fold path {
  fill: none;
  stroke: #c3b3da;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.fold:hover path {
  stroke: #ffffff;
}
.folded .fold {
  height: 14px;
  margin-top: -6px;
}

/* a phone: the name, and the map under it */
.compact {
  border-radius: 16px;
  background: #12052acc;
}
.compact .plate {
  height: 44px;
  padding: 0 4px;
}
.compact .name {
  height: 40px;
}
.compact .words {
  align-items: flex-end;
}
.compact .minimap {
  width: 96px;
  height: 96px;
  flex: none;
}
.compact .map-row {
  padding: 0 6px;
}
</style>
