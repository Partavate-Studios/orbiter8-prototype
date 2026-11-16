<template>
  <!-- What you selected: its card (the game's own, card-ui/info.svg.vue), held at the corner of the
       screen like a card in your hand, with its menu behind it (Koda, round 2): the menu slides out from
       behind the card and back, by the tab on its edge (A, or pad R3 to put the card away), and when
       it's in, its edge still shows past the card. Every action has its own slot, so a button never
       moves (card-actions.js SLOTS); going to the station, moons or planet is the menu's icons. Over
       the card, the system's star and planets (system-strip.vue), to pick the next one from here. On a
       phone the same, smaller, above the tab bar; tap the card to hold it up full size. -->
  <div class="selection" :class="{ sheet }" :style="themeVars">
    <system-strip v-if="!sheet || object" class="strip" :class="{ narrow: !drawerOpen || !object || !showScope }" :compact="sheet" />

    <template v-if="object">
      <button v-if="!showScope" type="button" class="bring-back card-pill" title="Show the selection's card" @click="toggleScope()">
        {{ object.name }}
      </button>
      <div v-else class="hand">
        <!-- the menu, behind the card: out, or in with its edge showing (clipped at the card's middle,
             so none of it shows on the card's far side) -->
        <div class="drawer-clip">
        <div class="drawer" :class="{ open: drawerOpen }" @click="!drawerOpen && openDrawer()">
          <div class="inside" :inert="!drawerOpen || undefined">
            <div class="list" data-own-scroll>
              <template v-if="page === 'moons'">
                <button v-for="moon in family.moons" :key="moon.moonId" type="button" class="action" @click="select(moon.moonId)">
                  <span>{{ moon.moonName }}</span>
                </button>
              </template>
              <template v-else>
                <template v-for="(option, index) in slots" :key="index">
                  <button v-if="option" type="button" class="action" :class="{ dim: !option.enabled }" @click="run(option)">
                    <kbd v-if="index < 9" aria-hidden="true">{{ index + 1 }}</kbd>
                    <span :style="{ fontSize: labelSize(option.text) + 'px' }">{{ option.text }}</span>
                  </button>
                  <!-- an empty slot keeps its place, so the buttons under it don't move -->
                  <span v-else class="action empty" aria-hidden="true" />
                </template>
                <p v-if="!slots.length" class="none">Nothing to do here.</p>
              </template>
            </div>
            <!-- the things around this one, each in its own place: planet, station, moons; then put the card away -->
            <div class="icons">
              <template v-if="family.planet">
                <rim-button v-if="family.planetKey !== objectId" small bare label="Its planet" :tint="theme.accent" @press="select(family.planetKey)">
                  <icon-container><g transform="scale(0.5)"><sprite :object-id="family.planetKey" /></g></icon-container>
                </rim-button>
                <span v-else class="icon-slot here" title="This planet" aria-hidden="true" />
                <rim-button
                  v-if="family.stationKey && family.stationKey !== objectId"
                  small
                  bare
                  label="Its station"
                  :tint="theme.accent"
                  @press="select(family.stationKey)"
                >
                  <icon-container><g transform="scale(0.5)"><sprite :object-id="family.stationKey" /></g></icon-container>
                </rim-button>
                <span v-else class="icon-slot" :class="{ here: family.stationKey === objectId }" aria-hidden="true" />
                <rim-button
                  v-if="family.moons.length"
                  small
                  bare
                  :label="family.moons.length === 1 ? 'Its moon' : 'Its moons'"
                  :tint="theme.accent"
                  :badge="family.moons.length > 1 ? family.moons.length : 0"
                  :on="page === 'moons'"
                  @press="moons"
                >
                  <icon-container><g transform="translate(-2 -2) scale(0.75)"><sprite :object-id="family.moons[0].moonId" /></g></icon-container>
                </rim-button>
                <span v-else class="icon-slot" aria-hidden="true" />
              </template>
              <span class="spacer" />
              <rim-button v-if="page === 'moons'" small bare label="Back" :tint="theme.accent" @press="page = 'main'"><back-icon /></rim-button>
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

        <component
          :is="sheet ? 'button' : 'div'"
          class="card"
          :type="sheet ? 'button' : undefined"
          :title="sheet ? 'Look at the card' : undefined"
          :aria-label="sheet ? 'Look at the card of ' + object.name : undefined"
          @click="sheet && (heldUp = true)"
        >
          <svg :viewBox="CARD_BOX" font-family="Ubuntu, sans-serif"><info :object-id="objectId" /></svg>
        </component>
      </div>
    </template>

    <!-- a phone's card, held up -->
    <Transition name="held">
      <button v-if="heldUp && object" type="button" class="held-up" aria-label="Put the card down" @click="heldUp = false">
        <svg :viewBox="CARD_BOX" font-family="Ubuntu, sans-serif"><info :object-id="objectId" /></svg>
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
import Info from '@/components/star-map/hud/card-ui/info.svg'
import Sprite from '@/components/star-map/hud/card-ui/sprite.svg'
import IconContainer from '@/components/star-map/hud/icons/_icon-container.svg'
import XIcon from '@/components/star-map/hud/icons/x-icon.svg'
import BackIcon from '@/components/star-map/hud/icons/back-icon.svg'
import RimButton from './rim-button.vue'
import SystemStrip from './system-strip.vue'
import { actionsFor, runAction, slotted } from './card-actions'
import { CARD_WIDTH, CARD_HEIGHT } from './layout'

export default {
  name: 'SelectionPanel',
  components: { Info, Sprite, IconContainer, XIcon, BackIcon, RimButton, SystemStrip },
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
      page: 'main',
      heldUp: false,
      // the card with a margin for its siege frame and its "yours" badge
      CARD_BOX: '-80 -80 160 230'
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
    /** The selection's planet, its station and its moons: the icons' places. */
    family() {
      const object = this.object
      const planetKey = object?.type === 'planet' ? object.key : object?.type === 'station' || object?.type === 'moon' ? object.orbiting : null
      const planet = planetKey ? this.systemObjects[planetKey] : null
      return {
        planetKey,
        planet,
        stationKey: planet?.hasStation ? planet.stationKey : null,
        moons: planet?.moons ?? []
      }
    }
  },
  watch: {
    selected() {
      this.page = 'main'
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
      return fitSize(text, 15, this.sheet ? 170 : 190, 700)
    },
    select(key) {
      this.o8audio.playEffect('click')
      this.selectSprite(key)
    },
    run(option) {
      this.o8audio.playEffect('click')
      runAction(option, this.object, { showMoons: this.moons })
    },
    /** One moon: go to it. More: list them in the menu. */
    moons() {
      const moons = this.family.moons
      if (moons.length === 1) return this.selectSprite(moons[0].moonId)
      this.page = this.page === 'moons' ? 'main' : 'moons'
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
      if (this.page !== 'main') return
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
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  text-align: left;
}
.strip {
  width: calc(var(--card-w) - var(--card-margin) - var(--tuck) + var(--drawer-w) + 12px);
  max-width: calc(100vw - 32px);
  transition: width 0.25s ease;
}
.strip.narrow {
  width: calc(var(--card-w) + var(--peek) + 12px);
}
.hand {
  position: relative;
  width: var(--card-w);
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
  left: calc(var(--card-w) / 2);
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
  gap: 6px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #5a4c8c transparent;
  /* room for the focus ring */
  padding: 3px;
  margin: -3px;
}
/* card-button.svg.vue's pill, at a size to press */
.action {
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  box-sizing: border-box;
  padding: 0 22px;
  border: 1px solid #5b1aaa88;
  border-radius: 60px / 14px;
  background: linear-gradient(135deg, #5c1aae 0%, #280b4b 10%, #5c1aae 50%, #280b4b 90%, #5c1aae 100%);
  color: #ffffff;
  font: inherit;
  font-weight: bold;
  white-space: nowrap;
  text-shadow: 0 1px 3px #000c;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.action:hover {
  border-color: #5b1aaa;
  background: linear-gradient(90deg, #5c1aae 0%, #280b4b 10%, #5c1aae 50%, #280b4b 90%, #5c1aae 100%);
}
.action.dim {
  color: #ffffff66;
}
/* an empty slot: a faint socket where its button goes */
.action.empty {
  border: 1px dashed #5a4c8c66;
  background: none;
  cursor: default;
}
.action:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 3px;
}
.action kbd {
  position: absolute;
  left: 10px;
  font: inherit;
  font-size: 10px;
  font-weight: normal;
  color: #c3b3da99;
  text-shadow: none;
}
@media (hover: none) {
  .action kbd {
    display: none;
  }
}
.none {
  margin: 8px;
  color: #bdb5d4;
  font-size: 13px;
  text-align: center;
}
.icons {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 8px;
}
.icons .rim-button {
  min-width: 40px;
}
/* an icon's place when it has nothing to go to (or it's the selection itself) */
.icon-slot {
  flex: none;
  width: 34px;
  height: 34px;
  margin: 2px 3px;
  box-sizing: border-box;
  border: 1px dashed #5a4c8c66;
  border-radius: 50%;
}
.icon-slot.here {
  border: 1.5px solid var(--accent);
  opacity: 0.55;
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
  margin: 0 0 0 calc(-1 * (var(--card-margin) + var(--tuck)));
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
  padding: 0 16px;
}
.sheet .icons {
  padding-top: 6px;
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
  .strip {
    transition: none;
  }
}
</style>
