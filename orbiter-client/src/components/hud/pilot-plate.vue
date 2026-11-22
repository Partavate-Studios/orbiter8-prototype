<template>
  <!-- You: call sign, ship, credits and cargo, in the pilot card's striped purple frame. Two things to
       press (Koda, 2026-11-21: you as an identity, not only your ship): you (the round button and your
       call sign) open your info card; your ship's name selects your ship (Space). Under the names,
       every cargo hold, one cell each, filled in its good's color; it opens the full list. -->
  <div class="pilot-plate" :class="{ strip }">
    <div class="frame">
      <rim-button
        v-if="!strip"
        class="me"
        label="You"
        title="You: your info card"
        bare
        :tint="HUD_TINT.you"
        :rest="HUD_REST.you"
        @press="$emit('me')"
      >
        <avatar-icon />
      </rim-button>
      <div class="who">
        <button type="button" class="name" title="You: your info card" :style="{ fontSize: callsign.size + 'px' }" @click="$emit('me')">{{ callsign.text }}</button>
        <button type="button" class="ship" title="Your ship (Space)" :style="{ fontSize: shipName.size + 'px' }" @click="$emit('my-ship')">{{ shipName.text }}</button>
      </div>
      <b class="credits">{{ avatar.credits.toLocaleString('en-US') }}&cent;</b>
      <!-- every hold, one cell each, in its good's color (round 2, item 6) -->
      <button
        type="button"
        class="cargo"
        :aria-expanded="open ? 'true' : 'false'"
        :title="'Cargo: ' + used + ' of ' + holds + ' holds in use. Every good aboard'"
        @click="toggle"
      >
        <svg class="holds" :width="holdsWidth" :height="HOLDS_H" :viewBox="`0 0 ${holdsWidth} ${HOLDS_H}`" aria-hidden="true">
          <hold-grid :total="holds" :segments="segments" :width="holdsWidth" :height="HOLDS_H" />
        </svg>
        <span class="count">Cargo {{ used }}/{{ holds }}</span>
      </button>
    </div>
    <!-- every good aboard and the empty holds -->
    <ul v-if="open" class="cargo-list">
      <li v-for="part in parts" :key="part.name">
        <i :style="{ background: part.color }" /><span>{{ part.name }}</span><b>{{ part.units.toLocaleString('en-US') }}</b>
      </li>
      <li v-if="otherHolds"><i :style="{ background: TEXT_3 }" /><span>Parts and repairs</span><b>{{ otherHolds }}</b></li>
      <li><i class="empty" /><span>Empty holds</span><b>{{ empty }}</b></li>
    </ul>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { cargoLines, emptyHolds } from '@orbiter8/sdk/game/trade'
import { useGameStateStore } from '@/stores/gamestate'
import { fitText } from '@/libs/fit-text'
import { HUD_TINT, HUD_REST, goodColor, TEXT_2, TEXT_3 } from '@/libs/palette'
import { otherHolds, shipHolds } from '@/libs/goods'
import RimButton from './rim-button.vue'
import HoldGrid from './hold-grid.svg.vue'

// The holds' row, in pixels: wide and low, so 250 holds still show one by one (about 2 px each).
const HOLDS_W = 152
const HOLDS_W_STRIP = 250
const HOLDS_H = 13
import AvatarIcon from '@/components/star-map/hud/icons/avatar-icon.svg'

export default {
  name: 'PilotPlate',
  components: { RimButton, AvatarIcon, HoldGrid },
  props: {
    /** A phone's full-width strip: no my-ship button (it's a tab). */
    strip: { type: Boolean, default: false }
  },
  emits: ['my-ship', 'me'],
  data() {
    return { open: false, HUD_TINT, HUD_REST, HOLDS_H, TEXT_3 }
  },
  computed: {
    ...mapState(useGameStateStore, ['avatar', 'goods']),
    // Names are the players': shrunk to fit, then cut (libs/fit-text.js).
    callsign() {
      return fitText(this.avatar.name ?? '', 16, this.strip ? 150 : 128)
    },
    shipName() {
      return fitText(this.avatar.ship?.name ?? '', 12, this.strip ? 150 : 128)
    },
    holds() {
      return this.avatar.ship?.holds ?? 0
    },
    empty() {
      return this.avatar.ship ? emptyHolds(this.avatar.ship) : 0
    },
    used() {
      return this.holds - this.empty
    },
    holdsWidth() {
      return this.strip ? HOLDS_W_STRIP : HOLDS_W
    },
    segments() {
      return this.avatar.ship ? shipHolds(this.avatar.ship, goodColor, { text2: TEXT_2, text3: TEXT_3 }) : []
    },
    /** Holds in use for other things: fitted parts, and holds lost to damage. */
    otherHolds() {
      return otherHolds(this.avatar.ship).other
    },
    /** What's aboard: each good in its color (colonists lavender; they ride 100 to a hold). */
    parts() {
      const ship = this.avatar.ship
      if (!ship) return []
      const names = this.goods ?? []
      return cargoLines(ship, names).map((line) => {
        const id = names.indexOf(line.name)
        return {
          name: line.name,
          units: line.units,
          holds: id >= 0 ? line.units : Math.ceil(line.units / 100),
          color: id >= 0 ? goodColor(id) : TEXT_2
        }
      })
    }
  },
  methods: {
    toggle() {
      this.o8audio.playEffect('click')
      this.open = !this.open
    }
  }
}
</script>

<style scoped>
.pilot-plate {
  position: relative;
  width: 318px;
  text-align: left;
}
.pilot-plate.strip {
  width: auto;
}
.frame {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    'me who credits'
    'me cargo cargo';
  align-items: center;
  gap: 2px 10px;
  padding: 7px 12px 7px 9px;
  border: 4px solid transparent;
  border-radius: 12px;
  /* the pilot card's frame (profileGradient), over its dark inside */
  background:
    linear-gradient(#0d0719e0, #0d0719e0) padding-box,
    linear-gradient(135deg, #7c39cd 0%, #280b4b 20%, #5c1aae 50%, #280b4b 80%, #7c39cd 100%) border-box;
}
.strip .frame {
  padding: 4px 10px;
  border-width: 3px;
}
.me {
  grid-area: me;
  flex: none;
  min-width: 0;
}
.who {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.who {
  grid-area: who;
  gap: 2px;
}
.strip .frame {
  grid-template-areas:
    'who credits'
    'cargo cargo';
  grid-template-columns: minmax(0, 1fr) auto;
}
.who button {
  align-self: flex-start;
  max-width: 100%;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}
.who button:hover {
  text-decoration: underline;
  text-decoration-color: #b9a0ff;
  text-underline-offset: 3px;
}
.who button:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
.who .name {
  color: #ffffff;
}
.who .ship {
  color: #c3b3da;
}
.credits {
  grid-area: credits;
  justify-self: end;
  color: #ffffff;
  font-size: 17px;
  font-weight: normal;
}
.cargo {
  grid-area: cargo;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: -3px -4px;
  padding: 3px 4px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: #c3b3da;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.cargo:hover {
  background: #ffffff14;
  color: #ffffff;
}
.count {
  white-space: nowrap;
}
.holds {
  display: block;
  flex: none;
}
.cargo-list {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 2;
  min-width: 190px;
  margin: 4px 0 0;
  padding: 8px 12px;
  list-style: none;
  border: 1px solid #5a4c8c;
  border-radius: 10px;
  background: #1b1531f5;
  color: #e6dcf5;
  font-size: 13px;
}
.cargo-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
}
.cargo-list i {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.cargo-list i.empty {
  border: 1px solid #c3b3da88;
  box-sizing: border-box;
}
.cargo-list span {
  flex: 1;
}
.cargo-list b {
  color: #ffffff;
  font-weight: normal;
}
</style>
