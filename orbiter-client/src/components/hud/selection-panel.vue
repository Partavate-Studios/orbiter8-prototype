<template>
  <!-- What you selected, as a card held at the corner of the screen (docs/ui-plan.md section 15, Koda
       2026-11-21; mockup docs/mockups/together/8-card-states). Always there: with nothing selected it
       shows your ship.
       - A spine of tabs down its left edge for what belongs together: a planet, its station and its
         moons; in the belt, its places. The tabs are in the same place whichever of them is shown.
       - One face: the game's own card art (card-ui/info.svg.vue), without its frame.
       - One heading: the name, or a planet's and its station's or moon's, each in its own color, meeting.
       - One action row: the main action as a pill, the rest as wells (action-row.vue). Keys 1–9.
       - Several moons open as a list beside the face; picking one makes it the face.
       Over the card, the system's star, planets and belt (system-strip.vue). On a phone the same,
       smaller, above the tab bar, the actions beside the face; tap the face to hold the card up. -->
  <div class="selection" :class="{ sheet }" :style="themeVars">
    <system-strip v-if="!sheet || selected != null" class="strip" :compact="sheet" />

    <div v-if="object" class="card3" :class="{ ship: isShip, besieged, listed: listOpen }">
      <!-- the corner brackets, in the home's color (not on the ship's card: Koda's purple frame) -->
      <template v-if="!isShip">
        <i v-for="corner in ['tl', 'tr', 'bl', 'br']" :key="corner" class="bracket" :class="corner" aria-hidden="true" />
      </template>

      <header class="heading" :class="{ joined: front }">
        <button v-if="front" type="button" class="half home" :title="'Back to ' + home.name" @click="select(home.key)">
          <span class="name">{{ home.name }}</span>
        </button>
        <div class="half face-name" :class="{ purple: isShip }">
          <button v-if="moonStep" type="button" class="step" :title="'Previous moon: ' + moonStep.prev.moonName" :aria-label="'Previous moon: ' + moonStep.prev.moonName" @click="select(moonStep.prev.moonId)">
            <svg viewBox="-6 -8 12 16" aria-hidden="true"><path d="M3 -6L-3 0L3 6" /></svg>
          </button>
          <span class="name" :style="{ fontSize: nameSize + 'px' }">{{ object.name }}</span>
          <button v-if="moonStep" type="button" class="step" :title="'Next moon: ' + moonStep.next.moonName" :aria-label="'Next moon: ' + moonStep.next.moonName" @click="select(moonStep.next.moonId)">
            <svg viewBox="-6 -8 12 16" aria-hidden="true"><path d="M-3 -6L3 0L-3 6" /></svg>
          </button>
        </div>
      </header>

      <div class="body">
        <!-- the spine: ways to what belongs together (squares, never round: round is an action) -->
        <nav v-if="tabs.length > 1" class="spine" :class="{ many: tabs.length > 5 }" data-own-scroll :aria-label="belt ? 'The asteroid belt' : home.name + ', its station and moons'">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="tab"
            :class="{ on: tab.on }"
            :style="{ '--tab': tab.color }"
            :title="tab.title"
            :aria-label="tab.title"
            :aria-current="tab.on ? 'true' : undefined"
            @click="pressTab(tab)"
          >
            <img v-if="tab.art" :src="tab.art" alt="" />
            <span v-else class="sphere" :style="tab.style" />
            <b v-if="tab.count > 1" class="count">{{ tab.count }}</b>
            <i v-if="tab.mine" class="mine" aria-hidden="true" />
            <i v-if="tab.besieged" class="siege" aria-hidden="true" />
          </button>
        </nav>

        <component
          :is="sheet ? 'button' : 'div'"
          class="face"
          :type="sheet ? 'button' : undefined"
          :title="sheet ? 'Look at the card' : undefined"
          :aria-label="sheet ? 'Look at the card of ' + object.name : undefined"
          @click="sheet && (heldUp = true)"
        >
          <themed-card :object-id="objectId" bare />
        </component>

        <!-- several moons: a list of them, by name (one of the few places with words) -->
        <div v-if="listOpen" class="moons">
          <h3>Moons</h3>
          <button v-for="moon in home.moons" :key="moon.moonId" type="button" class="moon" @click="select(moon.moonId)">
            <span class="sphere" :style="moonSphere(moon)" />
            <span class="moon-name">{{ moon.moonName }}</span>
            <svg viewBox="-6 -8 12 16" aria-hidden="true"><path d="M-3 -6L3 0L-3 6" /></svg>
          </button>
        </div>
        <action-row v-else-if="sheet" class="side" compact :main="buttons.main" :wells="buttons.wells" @run="run" />
      </div>

      <footer v-if="!sheet" class="actions">
        <action-row :main="buttons.main" :wells="buttons.wells" @run="run" />
      </footer>

      <!-- yours: a yellow badge on the card's corner, never the frame, so it can be yours and besieged at once -->
      <span v-if="object.isMine" class="yours" title="Yours" aria-label="Yours">
        <svg viewBox="-8 -8 16 16" aria-hidden="true"><path d="M0 -4.6L1.35 -1.4L4.4 -1.4L1.9 0.6L2.85 3.9L0 2L-2.85 3.9L-1.9 0.6L-4.4 -1.4L-1.35 -1.4Z" /></svg>
      </span>
    </div>

    <!-- a phone's card, held up: the whole card as it's always been -->
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
import { usePlayerStore } from '@/stores/player'
import { CARD_THEMES, cardThemeKey } from '@/libs/card-theme'
import { fitSize } from '@/libs/fit-text'
import { ASTEROID_ART, BELT_KEY, DUST_ART, PORT_ART, beltKeys, bodySphere, homeOf } from '@/libs/body-art'
import SystemStrip from './system-strip.vue'
import ThemedCard from './themed-card.vue'
import ActionRow from './action-row.vue'
import { actionsFor, cardButtons, runAction } from './card-actions'
import { FACE_WIDTH, SPINE_WIDTH } from './layout'

export default {
  name: 'SelectionPanel',
  components: { SystemStrip, ThemedCard, ActionRow },
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
    /** A menu is open: the number keys are the menu's, not the card's. */
    menuOpen: { type: Boolean, default: false }
  },
  data() {
    return {
      heldUp: false,
      /** The moons' list is open beside the face. */
      listOpen: false
    }
  },
  computed: {
    ...mapState(useStarMapStore, ['systemObjects', 'sprites', 'myShipId']),
    ...mapState(useUIStore, ['selected']),
    /** What the card shows: the selection, or with nothing selected your ship (the body you're wearing). */
    objectId() {
      if (this.selected != null && this.sprites[this.selected]) return this.selected
      return this.sprites[this.myShipId] && this.systemObjects[this.myShipId]?.type === 'ship' ? this.myShipId : null
    },
    object() {
      // (sprites too: the card's art reads its sprite)
      return this.objectId != null ? this.systemObjects[this.objectId] : null
    },
    /** The face's colors. */
    theme() {
      return CARD_THEMES[cardThemeKey(this.object)]
    },
    isShip() {
      return this.theme === CARD_THEMES.ship
    },
    /**
     * What the selection belongs to: a station's or moon's planet (an asteroid's station: its
     * asteroid), else the selection itself. Its color is the frame's.
     */
    home() {
      const o = this.object
      if (!o) return null
      if ((o.type === 'station' || o.type === 'moon') && this.systemObjects[o.orbiting]) return this.systemObjects[o.orbiting]
      return o
    },
    homeTheme() {
      return CARD_THEMES[cardThemeKey(this.home)]
    },
    /** A station or moon is the face: the heading is its home's name and its own, meeting. */
    front() {
      return Boolean(this.home && this.home.key !== this.objectId)
    },
    /** In the asteroid belt: the spine is the belt's places. */
    belt() {
      return homeOf(this.objectId, this.systemObjects) === BELT_KEY
    },
    besieged() {
      const o = this.home
      return Boolean(o && (o.type === 'planet' || o.type === 'asteroid') && usePlayerStore().siegeAt?.(o.objectId ?? o.id))
    },
    themeVars() {
      return {
        '--face-w': FACE_WIDTH + 'px',
        '--spine-w': SPINE_WIDTH + 'px',
        '--accent': this.theme.accent,
        '--frame': this.homeTheme?.base ?? this.theme.base,
        '--face': this.theme.base
      }
    },
    nameSize() {
      return fitSize(this.object.name, 14, this.front ? 120 : 190, 700)
    },
    /** On a moon's card with more than one moon: the moons either side, to step through them. */
    moonStep() {
      const moons = this.home?.moons ?? []
      const index = moons.findIndex((m) => m.moonId === this.objectId)
      if (index < 0 || moons.length < 2) return null
      return { prev: moons[(index - 1 + moons.length) % moons.length], next: moons[(index + 1) % moons.length] }
    },
    /**
     * The spine's tabs. A planet (or an asteroid with a station out of the belt's spine): itself, its
     * station, its moon or Moons. In the belt: its places in order, each asteroid followed by its station.
     */
    tabs() {
      const objects = this.systemObjects
      const player = usePlayerStore()
      const besieged = (o) => Boolean(o.objectId != null && player.siegeAt?.(o.objectId))
      const colorOf = (o) => CARD_THEMES[cardThemeKey(o)].base
      const portTab = (owner) => {
        const station = objects[owner.stationKey]
        return station ? [{ id: station.key, key: station.key, on: station.key === this.objectId, title: station.name + ': its station', art: PORT_ART, color: colorOf(station), mine: station.isMine }] : []
      }
      if (this.belt) {
        return beltKeys(objects).flatMap((key) => {
          const o = objects[key]
          if (o.type === 'section') return [{ id: key, key, on: key === this.objectId, title: o.name + ': empty space to mine', art: DUST_ART, color: colorOf(o) }]
          return [{ id: key, key, on: key === this.objectId, title: `${o.name}, ${o.compositionName} asteroid, size ${o.size}`, art: ASTEROID_ART[o.composition] ?? ASTEROID_ART[0], color: colorOf(o), mine: o.isMine, besieged: besieged(o) }, ...portTab(o)]
        })
      }
      const home = this.home
      if (!home || home.type !== 'planet') return []
      const moons = home.moons ?? []
      const onMoon = moons.some((m) => m.moonId === this.objectId)
      const tabs = [{ id: home.key, key: home.key, on: home.key === this.objectId && !this.listOpen, title: home.name, style: bodySphere(home, 26), color: colorOf(home), mine: home.isMine, besieged: besieged(home) }, ...portTab(home)]
      if (moons.length) {
        const shown = moons.find((m) => m.moonId === this.objectId) ?? moons[0]
        tabs.push({
          id: 'moons',
          key: shown.moonId,
          moons: moons.length > 1,
          on: onMoon || this.listOpen,
          count: moons.length,
          title: moons.length === 1 ? shown.moonName : `Its ${moons.length} moons`,
          style: bodySphere(objects[shown.moonId], 20),
          color: CARD_THEMES.moon.base
        })
      }
      return tabs
    },
    actions() {
      return actionsFor(this.object)
    },
    /** The action row: the main action and the rest (card-actions.js cardButtons). */
    buttons() {
      return cardButtons(this.object, this.actions)
    }
  },
  watch: {
    selected() {
      this.heldUp = false
      // (a press on the Moons tab that goes back to the planet keeps the list: pressTab)
      this.listOpen = this.keepList === true
      this.keepList = false
    }
  },
  mounted() {
    window.addEventListener('keydown', this.onKey)
  },
  unmounted() {
    window.removeEventListener('keydown', this.onKey)
  },
  methods: {
    ...mapActions(useUIStore, ['selectSprite']),
    moonSphere(moon) {
      return bodySphere(this.systemObjects[moon.moonId], 20)
    },
    select(key) {
      this.o8audio.playEffect('click')
      this.selectSprite(key)
    },
    /**
     * A tab: shows that thing. The lit one of a planet's station or single moon goes back to the planet.
     * Several moons: the tab opens their list beside the planet (and closes it again).
     */
    pressTab(tab) {
      if (tab.moons) {
        this.o8audio.playEffect('click')
        if (this.home.key !== this.objectId) {
          this.keepList = true
          return this.selectSprite(this.home.key)
        }
        this.listOpen = !this.listOpen
        return
      }
      this.listOpen = false
      this.select(tab.on && !this.belt ? this.home.key : tab.key)
    },
    run(option) {
      this.o8audio.playEffect('click')
      runAction(option, this.object, { showMoons: () => {} })
    },
    /** 1–9 press the card's actions by slot (each action keeps its number). */
    onKey(event) {
      if (event.ctrlKey || event.metaKey || event.altKey || !/^[1-9]$/.test(event.key)) return
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      if (!this.object || this.menuOpen || useDialogStore().open) return
      const ui = useUIStore()
      if (ui.neighborView || ui.jumpAnimationState) return
      const button = [this.buttons.main, ...this.buttons.wells].find((b) => b && b.key === Number(event.key))
      if (!button) return
      // (so the digit doesn't land in a dialog's field that this opens)
      event.preventDefault()
      this.run(button.option)
    }
  }
}
</script>

<style scoped>
.selection {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  text-align: left;
}
.strip {
  width: 440px;
  max-width: calc(100vw - 32px);
}

/* the card: a quiet frame, the inside the same purple-gray on every card */
.card3 {
  position: relative;
  box-sizing: border-box;
  padding: 3px;
  border-radius: 38px / 9px;
  background: #5a4c8c;
}
.card3::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 35px / 7px;
  background: #1b1531;
}
.card3 > * {
  position: relative;
}
/* the Orbiter 8's card keeps Koda's purple frame */
.card3.ship {
  background: linear-gradient(135deg, #5c1aae 0%, #280b4b 10%, #5c1aae 50%, #280b4b 90%, #5c1aae 100%);
}
/* under siege: pink dashes round the whole card (pink needs you) */
.card3.besieged::after {
  content: '';
  position: absolute;
  inset: -8px;
  border: 2px dashed var(--o8-pink-light);
  border-radius: 44px / 14px;
  pointer-events: none;
}
/* thick brackets in the home's color round each corner */
.bracket {
  position: absolute !important;
  width: 54px;
  height: 46px;
  box-sizing: border-box;
  border: 0 solid var(--frame);
  pointer-events: none;
}
.bracket.tl {
  left: -1.5px;
  top: -1.5px;
  border-width: 6px 0 0 6px;
  border-top-left-radius: 38px 9px;
}
.bracket.tr {
  right: -1.5px;
  top: -1.5px;
  border-width: 6px 6px 0 0;
  border-top-right-radius: 38px 9px;
}
.bracket.bl {
  left: -1.5px;
  bottom: -1.5px;
  border-width: 0 0 6px 6px;
  border-bottom-left-radius: 38px 9px;
}
.bracket.br {
  right: -1.5px;
  bottom: -1.5px;
  border-width: 0 6px 6px 0;
  border-bottom-right-radius: 38px 9px;
}

/* one heading: the name; or the home's and the face's, each in its color, meeting */
.heading {
  display: flex;
  height: 26px;
  margin: 8px 8px 0;
}
.half {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  height: 26px;
  padding: 0 10px;
  border: 0;
  border-radius: 13px;
  background: var(--face);
  color: #1b1531;
  font: inherit;
  font-weight: bold;
}
.half.purple {
  background: linear-gradient(135deg, #7c39cd, #5c1aae);
  color: #ffffff;
}
.joined .home {
  flex: 0 0 40%;
  border-radius: 13px 0 0 13px;
  background: var(--frame);
  font-size: 12.5px;
  cursor: pointer;
}
.joined .home .name {
  opacity: 0.8;
}
.joined .home:hover .name {
  opacity: 1;
}
.joined .face-name {
  border-radius: 0 13px 13px 0;
}
.name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.half:focus-visible,
.step:focus-visible,
.tab:focus-visible,
.moon:focus-visible,
.face:focus-visible {
  outline: 2.5px solid var(--o8-brand-300);
  outline-offset: 2px;
}
.step {
  flex: none;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 11px;
  background: #1b153133;
  cursor: pointer;
}
.step svg {
  width: 8px;
  height: 12px;
}
.step path,
.moon path {
  fill: none;
  stroke: #1b1531;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.body {
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 6px 6px 0;
}
/* the spine */
.spine {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: var(--spine-w);
  box-sizing: border-box;
  margin: 2px 0 4px;
  padding: 8px 0;
  border-radius: 12px;
  background: #150f28;
  overflow-y: auto;
  scrollbar-width: none;
  max-height: calc(var(--face-w) * 188 / 140);
}
.spine::-webkit-scrollbar {
  display: none;
}
.tab {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1.2px solid #4a3d7a;
  border-radius: 12px;
  background: #1a1331;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.tab:hover {
  border-color: #b9a0ff;
}
/* the one that's showing: lit in its own color, a bar toward the face */
.tab.on {
  border: 2.2px solid var(--tab);
  background: #302651;
}
.tab.on::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 9px;
  bottom: 9px;
  width: 4px;
  border-radius: 2px;
  background: var(--tab);
}
.tab img {
  width: 32px;
  height: 32px;
}
.sphere {
  display: block;
  border-radius: 50%;
}
/* a belt's places: more of them, so smaller */
.spine.many .tab {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}
.spine.many .tab img {
  width: 26px;
  height: 26px;
}
.count {
  position: absolute;
  right: -6px;
  top: -6px;
  min-width: 18px;
  height: 18px;
  box-sizing: border-box;
  padding: 0 4px;
  border: 1px solid #ffffff88;
  border-radius: 9px;
  background: #230b41;
  color: #ffffff;
  font-size: 11px;
  font-weight: normal;
  line-height: 16px;
}
/* yours, and under siege: the system strip's marks */
.mine {
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 7px;
  height: 7px;
  border: 1.5px solid #1a1331;
  border-radius: 50%;
  background: var(--o8-yellow);
}
.siege {
  position: absolute;
  inset: 3px;
  border: 1.6px dashed var(--o8-pink-light);
  border-radius: 9px;
}

.face {
  flex: none;
  display: block;
  width: var(--face-w);
  height: calc(var(--face-w) * 188 / 140);
  padding: 0;
  border: 0;
  background: none;
}
.face svg,
.held-up svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* the moons' list */
.moons {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 184px;
  box-sizing: border-box;
  margin: 2px 0 4px 4px;
  padding: 10px;
  border-radius: 12px;
  background: #221a3d;
}
.moons h3 {
  margin: 2px 4px 0;
  color: #d2cfd9;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}
.moon {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  box-sizing: border-box;
  padding: 0 10px 0 12px;
  border: 1px solid #3f3566;
  border-radius: 12px;
  background: #150f28;
  color: #ffffff;
  font: inherit;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}
.moon:hover {
  border-color: #b9a0ff;
  background: #302651;
}
.moon-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.moon svg {
  flex: none;
  width: 8px;
  height: 12px;
}
.moon path {
  stroke: #d9ccf5;
}

/* the action row, across the bottom of the whole card, under a rule in the face's color */
.actions {
  margin: 0 12px;
  padding: 10px 0 10px;
  border-top: 1.5px solid color-mix(in srgb, var(--face) 55%, transparent);
}

.yours {
  position: absolute !important;
  right: -6px;
  top: -8px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 2px solid #1b1531;
  border-radius: 50%;
  background: var(--o8-yellow);
}
.yours svg {
  width: 16px;
  height: 16px;
}
.yours path {
  fill: #1b1531;
}

/* a phone: the same, smaller, above the tab bar; the actions sit beside the face */
.sheet {
  --face-w: 128px !important;
  --spine-w: 52px !important;
  align-items: stretch;
}
.sheet .strip {
  width: auto;
}
.sheet .card3 {
  width: 100%;
}
.sheet .body {
  gap: 6px;
  padding-bottom: 8px;
}
.sheet .tab {
  width: 40px;
  height: 40px;
}
.sheet .face {
  cursor: pointer;
}
.sheet .side {
  flex: 1;
  min-width: 0;
  align-content: flex-start;
  padding: 4px 4px 0 2px;
}
.sheet .moons {
  flex: 1;
  width: auto;
  min-width: 0;
  margin: 0;
  overflow-y: auto;
  max-height: calc(var(--face-w) * 188 / 140);
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
</style>
