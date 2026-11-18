<template>
  <!-- What you selected: its card (the game's own, card-ui/info.svg.vue), held at the corner of the
       screen like a card in your hand, with its menu behind it (Koda, round 2): the menu slides out from
       behind the card and back, by the tab on its edge (A, or pad R3 to put the card away), and when
       it's in, its edge still shows past the card. Every action has its own slot, so a button never
       moves (card-actions.js SLOTS), and wears its picture (libs/body-art.js; the keys 1–9 still press
       them). A planet's port and moons are buttons on its card's bottom edge: choosing one deals its card
       out in front of the planet's, which stays behind it (Koda, 2026-11-17); the selection is the front
       card, so menus, keys and the camera act on it. Over the cards, the system's star, planets and belt (system-strip.vue), and under that what's
       around the selection: its planet, port and moons, or the belt's places (nearby-strip.vue). On a
       phone the same, smaller, above the tab bar; tap the card to hold it up full size. -->
  <div class="selection" :class="{ sheet, fanned: front }" :style="themeVars">
    <system-strip v-if="!sheet || object" class="strip" :class="{ narrow: !drawerOpen || !object || !showScope }" :compact="sheet" />
    <nearby-strip v-if="object && showScope" class="nearby" :compact="sheet" />

    <template v-if="object">
      <button v-if="!showScope" type="button" class="bring-back card-pill" title="Show the selection's card" @click="toggleScope()">
        {{ object.name }}
      </button>
      <div v-else class="hand" :class="{ fanned: front }">
        <!-- the menu, behind the front card: out, or in with its edge showing (clipped at the card's
             middle, so none of it shows on the card's far side) -->
        <div class="drawer-clip">
        <div class="drawer" :class="{ open: drawerOpen }" @click="!drawerOpen && openDrawer()">
          <div class="inside" :inert="!drawerOpen || undefined">
            <div class="list" data-own-scroll>
              <template v-for="(option, index) in slots" :key="index">
                <button
                  v-if="option"
                  type="button"
                  class="action"
                  :class="{ dim: !option.enabled, pictured: ACTION_ART[option.command] || ACTION_GLYPH[option.command] }"
                  :title="index < 9 && !sheet ? `${option.text} (${index + 1})` : undefined"
                  @click="run(option)"
                >
                  <span v-if="ACTION_ART[option.command]" class="well"><img :src="ACTION_ART[option.command]" alt="" /></span>
                  <span v-else-if="ACTION_GLYPH[option.command]" class="well">
                    <svg viewBox="-12 -12 24 24" aria-hidden="true"><path :d="ACTION_GLYPH[option.command]" /></svg>
                  </span>
                  <span class="text" :style="{ fontSize: labelSize(option.text) + 'px' }">{{ option.text }}</span>
                </button>
                <!-- an empty slot keeps its place, so the buttons under it don't move -->
                <span v-else class="action empty" aria-hidden="true" />
              </template>
              <p v-if="!slots.length" class="none">Nothing to do here.</p>
            </div>
            <div class="foot">
              <span class="spacer" />
              <rim-button small bare label="Put the card away" :tint="theme.accent" @press="toggleScope()"><x-icon /></rim-button>
            </div>
          </div>
          <!-- the tab: always in view, out past the card's edge -->
          <button
            type="button"
            class="tab"
            :title="drawerOpen ? 'Slide the menu in (A)' : 'Slide the menu out (A)'"
            :aria-label="drawerOpen ? 'Slide the menu in' : 'Slide the menu out'"
            :aria-expanded="drawerOpen ? 'true' : 'false'"
            @click.stop="toggleDrawer"
          >
            <svg viewBox="-6 -8 12 16" aria-hidden="true"><path :d="drawerOpen ? 'M3 -6L-3 0L3 6' : 'M-3 -6L3 0L-3 6'" /></svg>
          </button>
        </div>
        </div>

        <!-- the home card: the planet (or asteroid); with a port's or moon's card dealt out in front of
             it, it waits behind, and pressing it puts that card back -->
        <component
          :is="sheet || front ? 'button' : 'div'"
          class="card home"
          :class="{ behind: front }"
          :type="sheet || front ? 'button' : undefined"
          :title="front ? 'Back to ' + home.name : sheet ? 'Look at the card' : undefined"
          :aria-label="front ? 'Back to ' + home.name : sheet ? 'Look at the card of ' + object.name : undefined"
          @click="front ? select(home.key) : sheet && (heldUp = true)"
        >
          <themed-card :object-id="home.key" />
        </component>

        <!-- a port's or moon's card, dealt out from behind its planet's -->
        <Transition name="deal">
          <component
            :is="sheet ? 'button' : 'div'"
            v-if="front"
            :key="objectId"
            class="card front"
            :type="sheet ? 'button' : undefined"
            :title="sheet ? 'Look at the card' : undefined"
            :aria-label="sheet ? 'Look at the card of ' + object.name : undefined"
            @click="sheet && (heldUp = true)"
          >
            <themed-card :object-id="objectId" />
          </component>
        </Transition>

        <!-- on the card's bottom edge: its port and its moons (Koda, 2026-11-17); a moon's card steps
             through the planet's moons -->
        <div v-if="edge.length" class="edge">
          <template v-for="button in edge" :key="button.kind">
            <button v-if="button.kind === 'prev' || button.kind === 'next'" type="button" class="step" :title="button.title" :aria-label="button.title" @click="select(button.key)">
              <svg viewBox="-6 -8 12 16" aria-hidden="true"><path :d="button.kind === 'prev' ? 'M3 -6L-3 0L3 6' : 'M-3 -6L3 0L-3 6'" /></svg>
            </button>
            <button v-else type="button" class="edge-button" :class="{ on: button.on }" :title="button.title" :aria-label="button.title" :aria-pressed="button.on ? 'true' : 'false'" @click="press(button)">
              <img v-if="button.art" :src="button.art" alt="" />
              <span v-else class="sphere" :style="button.style" />
              <b v-if="button.count > 1" class="count">{{ button.count }}</b>
            </button>
          </template>
        </div>
      </div>
    </template>

    <!-- a phone's card, held up -->
    <Transition name="held">
      <button v-if="heldUp && object" type="button" class="held-up" aria-label="Put the card down" @click="heldUp = false">
        <themed-card :object-id="objectId" />
        <small>Tap to put it down</small>
      </button>
    </Transition>
  </div>
</template>

<script>
import { computed } from 'vue'
import { mapActions, mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { useDialogStore } from '@/stores/dialog'
import { CARD_THEMES, cardThemeKey } from '@/libs/card-theme'
import { fitSize } from '@/libs/fit-text'
import XIcon from '@/components/star-map/hud/icons/x-icon.svg'
import { ACTION_ART, ACTION_GLYPH, PORT_ART, bodySphere } from '@/libs/body-art'
import RimButton from './rim-button.vue'
import SystemStrip from './system-strip.vue'
import NearbyStrip from './nearby-strip.vue'
import ThemedCard from './themed-card.vue'
import { actionsFor, runAction, slotted } from './card-actions'
import { CARD_WIDTH, CARD_HEIGHT } from './layout'

export default {
  name: 'SelectionPanel',
  components: { XIcon, RimButton, SystemStrip, NearbyStrip, ThemedCard },
  // The card's colors (libs/card-theme.js) for everything drawn inside it.
  provide() {
    return {
      cardTheme: computed(() => this.theme),
      iconTint: computed(() => this.theme.accent)
    }
  },
  props: {
    /** A phone: the sheet above the tab bar. */
    sheet: { type: Boolean, default: false },
    /** A menu is open: on wide screens the card stays and its menu slides in. */
    menuOpen: { type: Boolean, default: false }
  },
  data() {
    return {
      ACTION_ART,
      ACTION_GLYPH,
      heldUp: false
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects', 'sprites']),
    ...mapState(useUIStore, ['selected', 'showScope', 'actionsOpen']),
    objectId() {
      return this.selected
    },
    object() {
      // (sprites too: the card's art reads its sprite)
      return this.selected != null && this.sprites[this.selected] ? this.systemObjects[this.selected] : null
    },
    theme() {
      return CARD_THEMES[cardThemeKey(this.object)]
    },
    themeVars() {
      return { '--card-w': CARD_WIDTH + 'px', '--card-h': CARD_HEIGHT + 'px', '--accent': this.theme.accent, '--frame': this.theme.base }
    },
    /** Out: the player's choice, unless a menu is open over a wide screen (the menu is what you're doing). */
    drawerOpen() {
      return this.actionsOpen && !(this.menuOpen && !this.sheet)
    },
    actions() {
      return actionsFor(this.object)
    },
    slots() {
      return slotted(this.object, this.actions)
    },
    /**
     * The card the selection belongs to: a port's or moon's planet (an asteroid's port: its asteroid),
     * else the selection itself.
     */
    home() {
      const o = this.object
      if (!o) return null
      if ((o.type === 'station' || o.type === 'moon') && this.systemObjects[o.orbiting]) return this.systemObjects[o.orbiting]
      return o
    },
    /** A port's or moon's card is dealt out in front of its planet's. */
    front() {
      return Boolean(this.home && this.home.key !== this.objectId)
    },
    /**
     * The buttons on the card's bottom edge: the home's port and its moons (with a count), each lit
     * while its card is out; on a moon's card, ‹ › to step through the moons.
     */
    edge() {
      const home = this.home
      if (!home || (home.type !== 'planet' && home.type !== 'asteroid')) return []
      const out = []
      const moons = home.moons ?? []
      const moonIndex = moons.findIndex((m) => m.moonId === this.objectId)
      const station = home.hasStation ? this.systemObjects[home.stationKey] : null
      if (station) {
        out.push({ kind: 'port', key: station.key, on: station.key === this.objectId, title: station.name + ': its port', art: PORT_ART })
      }
      if (moons.length) {
        if (moonIndex >= 0 && moons.length > 1) {
          const prev = moons[(moonIndex - 1 + moons.length) % moons.length]
          out.push({ kind: 'prev', key: prev.moonId, title: 'Previous moon: ' + prev.moonName })
        }
        const shown = moonIndex >= 0 ? moons[moonIndex] : moons[0]
        out.push({
          kind: 'moons',
          key: shown.moonId,
          on: moonIndex >= 0,
          count: moons.length,
          title: moonIndex >= 0 ? shown.moonName : moons.length === 1 ? shown.moonName : `Its ${moons.length} moons`,
          style: bodySphere(this.systemObjects[shown.moonId], 26)
        })
        if (moonIndex >= 0 && moons.length > 1) {
          const next = moons[(moonIndex + 1) % moons.length]
          out.push({ kind: 'next', key: next.moonId, title: 'Next moon: ' + next.moonName })
        }
      }
      return out
    }
  },
  watch: {
    selected() {
      this.heldUp = false
    }
  },
  mounted() {
    window.addEventListener('keydown', this.onKey)
  },
  unmounted() {
    window.removeEventListener('keydown', this.onKey)
  },
  methods: {
    ...mapActions(useUIStore, ['toggleScope', 'selectSprite', 'toggleActions']),
    /** Long labels ("Claim Planet (2,000¢)", "View on …") shrink to the button. */
    labelSize(text) {
      return fitSize(text, 15, this.sheet ? 140 : 150, 700)
    },
    select(key) {
      this.o8audio.playEffect('click')
      this.selectSprite(key)
    },
    run(option) {
      this.o8audio.playEffect('click')
      const moon = this.home?.moons?.[0]
      runAction(option, this.object, { showMoons: () => moon && this.selectSprite(moon.moonId) })
    },
    /** A card-edge button: deals its card out, or, when it's out, puts it back. */
    press(button) {
      this.select(button.on ? this.home.key : button.key)
    },
    openDrawer() {
      this.o8audio.playEffect('click')
      this.toggleActions(true)
    },
    toggleDrawer() {
      this.o8audio.playEffect('click')
      this.toggleActions()
    },
    /** 1–9 press the menu's slots (each action keeps its number); A slides the menu out or in. */
    onKey(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const digit = /^[1-9]$/.test(event.key)
      if (!digit && event.key !== 'a' && event.key !== 'A') return
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      if (!this.object || !this.showScope || this.menuOpen || useDialogStore().open) return
      const ui = useUIStore()
      if (ui.neighborView || ui.jumpAnimationState) return
      if (!digit) {
        event.preventDefault()
        return this.toggleDrawer()
      }
      const option = this.slots[Number(event.key) - 1]
      if (!option) return
      // (so the digit doesn't land in a dialog's field that this opens)
      event.preventDefault()
      this.run(option)
    }
  }
}
</script>

<style scoped>
.selection {
  --drawer-w: 250px;
  --peek: 16px;
  --tuck: 14px;
  /* the card's own margin inside its art (its siege frame and badge room) */
  --card-margin: calc(var(--card-w) * 5 / 160);
  /* how far a port's or moon's card is dealt out from its planet's */
  --front-x: 0px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  text-align: left;
}
.selection.fanned {
  --front-x: calc(var(--card-w) * 0.5);
}
.strip {
  width: calc(var(--card-w) + var(--front-x) - var(--card-margin) - var(--tuck) + var(--drawer-w) + 12px);
  max-width: calc(100vw - 32px);
  transition: width 0.25s ease;
}
.nearby {
  max-width: calc(100vw - 32px);
}
.strip.narrow {
  width: calc(var(--card-w) + var(--front-x) + var(--peek) + 12px);
}
.hand {
  position: relative;
  width: calc(var(--card-w) + var(--front-x));
  height: var(--card-h);
}
.card {
  position: relative;
  z-index: 2;
  display: block;
  width: var(--card-w);
  height: var(--card-h);
  padding: 0;
  border: 0;
  background: none;
}
/* the planet's card, waiting behind a port's or moon's: dimmed, and pressing it puts that card back */
.card.behind {
  cursor: pointer;
  filter: brightness(0.7) saturate(0.85);
  transition: filter 0.2s;
}
.card.behind:hover {
  filter: brightness(0.9);
}
/* a port's or moon's card, dealt out in front */
.card.front {
  position: absolute;
  z-index: 3;
  left: var(--front-x);
  top: 0;
  filter: drop-shadow(-6px 2px 10px #000a);
}
.deal-enter-active,
.deal-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.deal-enter-from,
.deal-leave-to {
  transform: translateX(calc(-1 * var(--card-w) * 0.5));
  opacity: 0;
}
/* the buttons on the card's bottom edge: the port and the moons, in the menu's round wells */
.edge {
  position: absolute;
  z-index: 4;
  left: 0;
  bottom: -12px;
  width: var(--card-w);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  pointer-events: none;
}
/* behind a dealt card: along the planet card's visible edge, from its left */
.fanned .edge {
  justify-content: flex-start;
  padding-left: 12px;
  box-sizing: border-box;
}
.edge button {
  pointer-events: auto;
}
.edge-button {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1.5px solid #5a4c8c;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 40%, #3d2a6e 0%, #1a1331 80%);
  box-shadow: 0 2px 8px #000a;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.edge-button:hover {
  border-color: #b9a0ff;
}
/* its card is out */
.edge-button.on {
  border: 2px solid #b9a0ff;
  background: radial-gradient(circle at 50% 40%, #5a4596 0%, #2a1f4c 80%);
  box-shadow: 0 0 0 3px #b9a0ff33, 0 2px 8px #000a;
}
.edge-button:focus-visible,
.step:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
.edge-button img {
  width: 34px;
  height: 34px;
}
.edge-button .sphere {
  display: block;
  border-radius: 50%;
}
/* how many moons */
.edge-button .count {
  position: absolute;
  right: -4px;
  bottom: -3px;
  min-width: 18px;
  height: 18px;
  box-sizing: border-box;
  padding: 0 4px;
  border: 1px solid #b9a0ff;
  border-radius: 9px;
  background: #302651;
  color: #ffffff;
  font-size: 11px;
  line-height: 16px;
}
/* stepping through the moons */
.step {
  flex: none;
  display: grid;
  place-items: center;
  width: 22px;
  height: 32px;
  padding: 0;
  border: 1px solid #5a4c8c;
  border-radius: 11px;
  background: #1f173a;
  cursor: pointer;
}
.step:hover {
  border-color: #b9a0ff;
}
.step svg {
  width: 8px;
  height: 12px;
}
.step path {
  fill: none;
  stroke: #d9ccf5;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.card svg,
.held-up svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* the menu behind the card: a little smaller than it, tucked under its right edge when out */
.drawer-clip {
  position: absolute;
  z-index: 1;
  left: calc(var(--card-w) / 2 + var(--front-x));
  top: 0;
  bottom: 0;
  width: calc(var(--card-w) / 2 + var(--drawer-w) + 20px);
  overflow: hidden;
  pointer-events: none;
}
.drawer {
  position: absolute;
  left: calc(var(--card-w) / 2 - var(--card-margin) - var(--tuck));
  /* the card's body is 214 of its 230 units tall; the menu is 88% of that, centered on it */
  top: calc(var(--card-h) * (8 + 214 * 0.06) / 230);
  pointer-events: auto;
  width: var(--drawer-w);
  height: calc(var(--card-h) * 214 * 0.88 / 230);
  box-sizing: border-box;
  border: 1.5px solid #5a4c8c;
  border-radius: 12px;
  background: #1b1531f2;
  transform: translateX(calc(var(--peek) + var(--tuck) - var(--drawer-w)));
  transition: transform 0.25s ease;
  cursor: pointer;
}
.drawer.open {
  transform: none;
  cursor: default;
}
.drawer.open .inside {
  opacity: 1;
}
.drawer:not(.open):hover {
  border-color: #b9a0ff;
}
.inside {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* in: only the menu's edge and tab show, not the ends of its buttons */
  opacity: 0;
  transition: opacity 0.2s;
  box-sizing: border-box;
  padding: 10px 10px 8px calc(10px + var(--tuck));
}
.list {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* five slots (a planet's most) fit the menu without scrolling */
  gap: 5px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #5a4c8c transparent;
  /* room for the focus ring */
  padding: 3px;
  margin: -3px;
}
/* an action: a pill in the menu's own plum and lavender, its picture in a round well like the big
   icons above it (Koda, 2026-11-17: the old bright purple pills didn't sit with the menu) */
.action {
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  gap: 9px;
  height: 38px;
  box-sizing: border-box;
  padding: 0 14px 0 16px;
  border: 1.5px solid #4a3d7a;
  border-radius: 19px;
  background: linear-gradient(180deg, #2e2354 0%, #211839 100%);
  color: #efe7ff;
  font: inherit;
  font-weight: bold;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.action.pictured {
  padding-left: 4px;
}
.action:hover {
  border-color: #b9a0ff;
  background: linear-gradient(180deg, #3a2c69 0%, #2a1f4c 100%);
}
.action:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 3px;
}
.action.dim {
  color: #efe7ff66;
}
.action.dim .well img {
  opacity: 0.4;
}
.action .text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* the picture's round well, as the big icons */
.well {
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid #5a4c8c;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 40%, #3d2a6e 0%, #1a1331 80%);
}
.well img {
  width: 24px;
  height: 24px;
}
.well svg {
  width: 20px;
  height: 20px;
}
.well path {
  fill: none;
  stroke: #d9ccf5;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.action.dim .well svg {
  opacity: 0.4;
}
.well .sphere {
  display: block;
  border-radius: 50%;
}
/* an empty slot: a faint socket where its button goes */
.action.empty {
  border: 1px dashed #5a4c8c55;
  background: none;
  cursor: default;
}
.none {
  margin: 8px;
  color: #bdb5d4;
  font-size: 13px;
  text-align: center;
}
.foot {
  flex: none;
  display: flex;
  align-items: center;
  padding-top: 6px;
}
.foot .rim-button {
  min-width: 40px;
}
.spacer {
  flex: 1;
}
/* the tab on the menu's outer edge */
.tab {
  position: absolute;
  top: 50%;
  right: -13px;
  width: 24px;
  height: 58px;
  margin-top: -29px;
  padding: 0;
  border: 1.5px solid #5a4c8c;
  border-radius: 8px;
  background: #302651;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.tab:hover {
  border-color: #b9a0ff;
  background: #3d3066;
}
.tab:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
.tab svg {
  display: block;
  width: 10px;
  height: 14px;
  margin: auto;
}
.tab path {
  fill: none;
  stroke: #e6dcf5;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.bring-back {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* a phone: the same, smaller, above the tab bar */
.sheet {
  --card-w: 132px !important;
  --card-h: 190px !important;
  --peek: 14px;
  align-items: stretch;
}
/* a phone: the dealt card covers its planet's but for a sliver, and the edge buttons ride the front card */
.sheet.fanned {
  --front-x: 16px;
}
.sheet .card.front {
  top: auto;
  bottom: 0;
}
.sheet .edge,
.sheet.fanned .edge {
  left: var(--front-x);
  bottom: -8px;
  width: var(--card-w);
  justify-content: center;
  padding-left: 0;
  gap: 4px;
}
.sheet .edge-button {
  width: 38px;
  height: 38px;
}
.sheet .edge-button img {
  width: 28px;
  height: 28px;
}
.sheet .strip,
.sheet .strip.narrow {
  width: auto;
}
.sheet .hand {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: auto;
  min-height: var(--card-h);
  /* only the card and the menu take taps: the map shows through the rest when the menu is in */
  pointer-events: none;
}
.sheet .card {
  pointer-events: auto;
}
.sheet .card {
  order: 1;
  flex: none;
  cursor: pointer;
}
.sheet .drawer-clip {
  position: relative;
  order: 2;
  left: auto;
  flex: 1;
  width: auto;
  min-width: 0;
  margin: 0 0 0 calc(var(--front-x) - var(--card-margin) - var(--tuck));
  padding: 0 14px 6px 0;
}
.sheet .drawer {
  position: relative;
  left: auto;
  top: auto;
  width: auto;
  height: auto;
  min-height: calc(var(--card-h) - 12px);
  transform: translateX(calc(-100% + var(--peek) + var(--tuck)));
}
.sheet .drawer.open {
  transform: none;
}
.sheet .inside {
  padding: 8px 8px 6px calc(8px + var(--tuck));
}
.sheet .action {
  height: 42px;
}
.held-up {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  background: #0b0916cc;
  color: #c3b3da;
  font: inherit;
  font-size: 13px;
}
.held-up svg {
  width: min(88vw, 60vh);
  height: auto;
  aspect-ratio: 160 / 230;
}
.held-enter-active,
.held-leave-active {
  transition: opacity 0.15s;
}
.held-enter-active svg,
.held-leave-active svg {
  transition: transform 0.15s;
}
.held-enter-from,
.held-leave-to {
  opacity: 0;
}
.held-enter-from svg,
.held-leave-to svg {
  transform: translateY(30%) scale(0.5);
}
@media (prefers-reduced-motion: reduce) {
  .drawer,
  .strip,
  .deal-enter-active,
  .deal-leave-active {
    transition: none;
  }
}
</style>
