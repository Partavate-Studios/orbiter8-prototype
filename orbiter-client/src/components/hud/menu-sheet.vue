<template>
  <!-- The sheet every menu slides up in (trade, shipyard, armory, colony, siege, loadout, the list of
       what's here, chat, leaderboard, feed, help, settings). The menus are the game's own, drawn in the
       map's units; the sheet is only as tall as what the open one draws, and scrolls when that's
       taller than the screen. Its frame takes the menu's colors (libs/card-theme.js menuTheme). -->
  <Transition name="sheet">
    <div v-if="menu" ref="sheet" :key="menu" class="menu-sheet" :class="{ phone }" :style="frame" role="dialog" :aria-label="menu + ' menu'">
      <!-- a menu built in HTML (the trade menu): as wide and tall as it lays itself out -->
      <div v-if="htmlMenu" ref="scroller" class="inside html" data-own-scroll>
        <component :is="htmlMenu" :object-id="selected" :narrow="phone" />
      </div>
      <div v-else ref="scroller" class="inside" data-own-scroll>
        <svg ref="svg" :viewBox="viewBox" :style="size" font-family="Ubuntu, sans-serif" xmlns="http://www.w3.org/2000/svg">
          <g ref="content">
            <component :is="menuComponent" :object-id="selected" />
          </g>
        </svg>
      </div>
      <button type="button" class="close" title="Close (Esc)" aria-label="Close" @click="close">
        <svg viewBox="-12 -12 24 24" aria-hidden="true">
          <path v-if="phone" d="M-8 -3L0 5L8 -3" />
          <path v-else d="M-6 -6L6 6M6 -6L-6 6" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { CARD_THEMES, menuTheme, mixHex } from '@/libs/card-theme'
import { CARD_GRAY } from '@/libs/palette'
import { openMenuName } from '@/components/star-map/hud/menus/menu-container/_menu-container.svg.vue'
import TradePanel from './trade/trade-panel.vue'
import ObjectsPanel from './objects/objects-panel.vue'
import YardsPanel from './yards/yards-panel.vue'
import ProfilePanel from './profile/profile-panel.vue'
import ArmoryPanel from './armory/armory-panel.vue'
import HelpPanel from './panels/help-panel.vue'
import ChatPanel from './panels/chat-panel.vue'
import FeedPanel from './panels/feed-panel.vue'
import RanksPanel from './panels/ranks-panel.vue'
import SettingsPanel from './panels/settings-panel.vue'
import SiegePanel from './panels/siege-panel.vue'
import AsteroidPanel from './panels/asteroid-panel.vue'
import ColonyPanel from './panels/colony-panel.vue'
import ShipPanel from './panels/ship-panel.vue'

/**
 * Every menu's inside: the quiet blue-gray the station's menus had (Koda, 2026-11-21: "I love the color
 * of the background on those menus as a default color"). The frame still takes each menu's own colors.
 */
const MENU_INSIDE = mixHex(CARD_THEMES.station.deep, CARD_GRAY, 0.6)

/** Menus built in HTML rather than the map's SVG units (round 2): they size themselves. */
const HTML_MENUS = {
  trade: TradePanel,
  objects: ObjectsPanel,
  shipyard: YardsPanel,
  profile: ProfilePanel,
  armory: ArmoryPanel,
  help: HelpPanel,
  chat: ChatPanel,
  feed: FeedPanel,
  leaderboard: RanksPanel,
  settings: SettingsPanel,
  siege: SiegePanel,
  asteroid: AsteroidPanel,
  colony: ColonyPanel,
  loadout: ShipPanel
}

/** (Every menu is HTML now; this is kept for a menu still drawn in the map's units, should one return.) */
const MENUS = {}
// The menus were drawn for a panel this wide at most, a screen (960 units) tall, centered on 0.
const MAX_WIDTH = 800
const HALF_HEIGHT = 480
// Room around what a menu draws, in its units.
const PAD_TOP = 34
// On wide screens the close button sits in the sheet's top right corner: lists start under it.
const PAD_TOP_WIDE = 62
const PAD_BOTTOM = 30

export default {
  name: 'MenuSheet',
  props: {
    phone: { type: Boolean, default: false }
  },
  data() {
    return { top: -HALF_HEIGHT, bottom: HALF_HEIGHT }
  },
  computed: {
    ...mapState(useUIStore, ['selected', 'viewport', 'groupPixels']),
    menu() {
      const name = openMenuName(useUIStore())
      return MENUS[name] || HTML_MENUS[name] ? name : null
    },
    htmlMenu() {
      return HTML_MENUS[this.menu] ?? null
    },
    menuComponent() {
      return MENUS[this.menu]
    },
    theme() {
      return menuTheme(this.menu, useStarMapStore().systemObjects[this.selected])
    },
    /** The sheet's width in the menus' units: theirs, or the screen's when that's narrower. */
    width() {
      return Math.min(MAX_WIDTH, this.viewport.width) - (this.phone ? 14 : 25)
    },
    viewBox() {
      return `${-this.width / 2} ${this.top} ${this.width} ${this.bottom - this.top}`
    },
    /** Drawn at the map's scale, so every menu is the size it always was. */
    size() {
      return { width: this.width * this.groupPixels + 'px', height: (this.bottom - this.top) * this.groupPixels + 'px' }
    },
    frame() {
      const t = this.theme
      return {
        '--mid': t.mid,
        '--deep': t.deep,
        // (for a menu's own buttons and marks: the thing's color, and a light step of it)
        '--base': t.base,
        '--accent': t.accent,
        '--inside': MENU_INSIDE
      }
    }
  },
  watch: {
    menu() {
      this.top = -HALF_HEIGHT
      this.bottom = HALF_HEIGHT
      this.$nextTick(() => {
        this.watchContent()
        this.watchPlace()
      })
    }
  },
  mounted() {
    this.watchContent()
    this.watchPlace()
  },
  unmounted() {
    this.observer?.disconnect()
    this.placeObserver?.disconnect()
    cancelAnimationFrame(this.measuring)
    useUIStore().setMenuBox(null)
  },
  methods: {
    ...mapActions(useUIStore, ['closeMenu']),
    close() {
      this.o8audio.playEffect('click')
      this.closeMenu()
    },
    /**
     * Tells the camera where the sheet covers the screen (stores/ui.js setMenuBox), so the selection
     * can sit in the free space beside it instead of under it (Koda: the station "disappears" under the
     * shipyard). Again whenever the sheet's size changes.
     */
    watchPlace() {
      this.placeObserver?.disconnect()
      const sheet = this.$refs.sheet
      const report = () => {
        const box = this.$refs.sheet?.getBoundingClientRect?.()
        useUIStore().setMenuBox(box && box.width ? { left: box.left, right: box.right } : null)
      }
      report()
      if (!sheet || typeof ResizeObserver === 'undefined') return
      this.placeObserver = new ResizeObserver(report)
      this.placeObserver.observe(sheet)
    },
    /** Measures the open menu now, and again whenever what it draws changes (pages, rows, lists). */
    watchContent() {
      this.observer?.disconnect()
      if (this.htmlMenu) return
      const content = this.$refs.content
      if (!content) return
      this.measure()
      if (typeof MutationObserver === 'undefined') return
      this.observer = new MutationObserver(() => {
        cancelAnimationFrame(this.measuring)
        this.measuring = requestAnimationFrame(this.measure)
      })
      this.observer.observe(content, { childList: true, subtree: true })
    },
    /** Fits the sheet to what the menu draws, inside the screen's height. */
    measure() {
      const content = this.$refs.content
      if (!content?.getBBox) return
      let box
      try {
        box = content.getBBox()
      } catch {
        return
      }
      if (!box.height) return
      const top = Math.max(-HALF_HEIGHT, Math.floor(box.y - (this.phone ? PAD_TOP : PAD_TOP_WIDE)))
      const bottom = Math.min(HALF_HEIGHT, Math.ceil(box.y + box.height + PAD_BOTTOM))
      if (Math.abs(top - this.top) > 1 || Math.abs(bottom - this.bottom) > 1) {
        this.top = top
        this.bottom = bottom
      }
    }
  }
}
</script>

<style scoped>
.menu-sheet {
  position: absolute;
  left: 50%;
  bottom: 14px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  max-height: calc(100% - 28px);
  box-sizing: border-box;
  transform: translateX(-50%);
  padding: 10px;
  border-radius: 12px;
  /* the menu's striped frame (menuGradient) around its quiet inside */
  background: linear-gradient(135deg, var(--mid) 0%, var(--deep) 10%, var(--mid) 50%, var(--deep) 90%, var(--mid) 100%);
  box-shadow: 0 0 0 3px #00000033;
  pointer-events: auto;
}
.inside {
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  border: 3px solid #ffffff22;
  border-radius: 6px;
  background: var(--inside);
  scrollbar-width: thin;
  scrollbar-color: var(--mid) transparent;
}
.inside.html {
  /* the trade menu's own text and buttons: the menu's quiet inside, a step darker */
  background: var(--inside);
}
.inside svg {
  display: block;
  max-width: 100%;
  shape-rendering: geometricPrecision;
  text-rendering: geometricPrecision;
  user-select: none;
}
.close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 2px solid var(--mid);
  border-radius: 8px;
  background: var(--deep);
  cursor: pointer;
}
.close:hover {
  background: var(--mid);
}
.close svg {
  display: block;
  width: 100%;
  height: 100%;
}
.close path {
  fill: none;
  stroke: #ffffff;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* a phone: the full width, up from the bottom edge, the close under the thumb */
.phone {
  bottom: 0;
  width: 100%;
  /* under the pilot's strip: credits and cargo stay in view */
  max-height: calc(100% - 58px - env(safe-area-inset-top));
  padding: 6px 6px calc(6px + env(safe-area-inset-bottom));
  border-radius: 12px 12px 0 0;
}
.phone .close {
  position: static;
  flex: none;
  align-self: center;
  width: 150px;
  height: 40px;
  margin-top: 6px;
}
.sheet-enter-active,
.sheet-leave-active {
  transition:
    transform 0.2s ease-out,
    opacity 0.2s;
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translate(-50%, 60%);
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active {
    transition: none;
  }
}
</style>
