<template>
  <!-- Where you are: the system's number and name, its star, the minimap with the zoom beside it, what's
       here (planets, ships) and the way out (jump). On a phone the name, the minimap and the zoom: the
       rest are tabs. -->
  <div class="system-block" :class="{ compact }">
    <div class="title">
      <div class="name">
        <small>Star System {{ currentStarSystemId }}</small>
        <b :style="{ fontSize: nameFit.size + 'px' }">{{ nameFit.text }}</b>
      </div>
      <rim-button v-if="!compact" label="The star" :title="starTitle" bare :tint="starTint" @press="$emit('star')">
        <star-icon />
      </rim-button>
    </div>
    <!-- the map of the system, and its zoom beside it (Koda, round 2: "it should be next to the map") -->
    <div class="map-row">
      <zoom-rail :height="compact ? 96 : 132" :compact="compact" />
      <svg v-if="mapDataLoaded" class="minimap" viewBox="-56 -56 112 112"><minimap /></svg>
    </div>
    <div v-if="!compact" class="here">
      <rim-button label="Planets" title="Planets (P; Tab steps through them)" :tint="HUD_TINT.planets" :rest="HUD_REST.planets" :badge="planetCount" :on="menuState.planetsMenu" @press="$emit('menu', 'planets')">
        <planets-icon />
      </rim-button>
      <rim-button label="Ships" title="Ships in this system" :tint="HUD_TINT.ships" :rest="HUD_REST.ships" :badge="shipCount" :on="menuState.shipsMenu" @press="$emit('menu', 'ships')">
        <ships-icon />
      </rim-button>
      <rim-button label="Jump" title="Galaxy map: jump to another star (M)" :tint="starTint" @press="$emit('jump')">
        <jump-icon />
      </rim-button>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { STAR_KEY } from '@orbiter8/sdk/system'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { fitText } from '@/libs/fit-text'
import { HUD_TINT, HUD_REST, STAR_CLASSES } from '@/libs/palette'
import Minimap from '@/components/star-map/hud/minimap.svg'
import StarIcon from '@/components/star-map/hud/icons/star-icon.svg'
import JumpIcon from '@/components/star-map/hud/icons/jump-icon.svg'
import PlanetsIcon from '@/components/star-map/hud/icons/planets-icon.svg'
import ShipsIcon from '@/components/star-map/hud/icons/ships-icon.svg'
import RimButton from './rim-button.vue'
import ZoomRail from './zoom-rail.vue'

/** The star button takes the star's light (sdk/traits.js); a black hole its partner link's violet. */
export function starTint(star) {
  if (star?.blackHole) return '#af6fff'
  return star?.spectral ? STAR_CLASSES[star.spectral].glow : '#e6dcf5'
}

export default {
  name: 'SystemBlock',
  components: { Minimap, StarIcon, JumpIcon, PlanetsIcon, ShipsIcon, RimButton, ZoomRail },
  props: {
    compact: { type: Boolean, default: false }
  },
  emits: ['star', 'jump', 'menu'],
  data() {
    return { HUD_TINT, HUD_REST }
  },
  computed: {
    ...mapState(useStarMapStore, ['currentStarSystemId', 'currentStarSystemName', 'mapDataLoaded', 'spriteIds', 'systemObjects']),
    ...mapState(useUIStore, ['menuState', 'selected']),
    nameFit() {
      return fitText(this.currentStarSystemName ?? '', this.compact ? 22 : 28, this.compact ? 170 : 260)
    },
    starTint() {
      return starTint(this.systemObjects[STAR_KEY])
    },
    starTitle() {
      return this.selected === STAR_KEY ? 'Neighboring stars' : 'The star'
    },
    planetCount() {
      return this.spriteIds.planets?.length ?? 0
    },
    shipCount() {
      return this.spriteIds.ships?.length ?? 0
    }
  }
}
</script>

<style scoped>
.system-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.name {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-shadow:
    0 0 4px #000,
    0 1px 2px #000;
}
.name small {
  color: #ffffffaa;
  font-size: 12px;
}
.name b {
  color: #ffffffdd;
  font-weight: normal;
  line-height: 1.1;
  white-space: nowrap;
}
.map-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.minimap {
  display: block;
  width: 132px;
  height: 132px;
}
.here {
  display: flex;
  gap: 2px;
  margin-top: 2px;
}
.compact {
  flex-direction: row;
  align-items: flex-start;
}
.compact .minimap {
  width: 96px;
  height: 96px;
}
.compact .name {
  margin-top: 4px;
}
</style>
