<template>
  <!-- The HUD: everything over the game while you play, in four corners by purpose, the middle left to
       the game (ANALYSIS.md). Top left, you; top right, where you are; bottom left, what you selected;
       bottom right, everyone else and the game itself. A portrait phone gets a strip, a sheet and a
       tab bar instead. It's HTML over the map's layers, so neither repaints the other. -->
  <div class="hud" :class="{ phone, map: neighborView }" :style="{ zoom: hudScale }" @click="releaseFocus">
    <!-- you -->
    <div class="you">
      <pilot-plate :strip="phone" @my-ship="myShip" />
      <div class="chips">
        <span v-if="sessionLeft" class="chip" title="Your session key: moves go without wallet popups">Session · {{ sessionLeft }} left</span>
        <span v-if="scanWords && !neighborView" class="chip" role="status">{{ scanWords }}</span>
        <!-- the ship's drones at work in an empty belt section: what stopping now would load, and when the
             holds are full; it selects the section, where Stop mining is -->
        <button
          v-if="mining && !neighborView"
          type="button"
          class="chip mining"
          :class="{ full: mining.full }"
          :title="mining.full ? 'The holds are full: stop mining to load the ore' : 'Your drones are mining. Stopping loads what they have so far'"
          @click="miningSection"
        >
          <span>{{ mining.words }}</span>
          <span class="bar" role="progressbar" aria-label="Mining" :aria-valuenow="mining.mined" aria-valuemin="0" :aria-valuemax="mining.room">
            <i :style="{ width: mining.fraction * 100 + '%' }" />
          </span>
        </button>
      </div>
    </div>

    <template v-if="!neighborView">
      <!-- where you are -->
      <system-block class="where" :compact="phone" @star="star" @jump="jump" @menu="toggleMenu" />

      <!-- what you selected -->
      <selection-panel v-if="!(phone && (menuOpen || moreOpen))" class="selected" :sheet="phone" :menu-open="menuOpen" />

      <!-- everyone else, and the game: the dock (a phone's tab bar, with the rest under More) -->
      <nav v-if="!phone" class="dock" aria-label="Menus">
        <rim-button v-for="b in dockButtons" :key="b.menu" v-bind="b.bind" @press="toggleMenu(b.menu)"><component :is="b.icon" /></rim-button>
      </nav>
      <template v-else>
        <div v-if="moreOpen" class="more" @click="moreOpen = false">
          <rim-button label="Ports" :tint="HUD_TINT.ports" :rest="HUD_REST.ports" @press="toggleMenu('ports')"><ports-icon /></rim-button>
          <rim-button label="Ships" :tint="HUD_TINT.ships" :rest="HUD_REST.ships" :badge="shipCount" @press="toggleMenu('ships')"><ships-icon /></rim-button>
          <rim-button label="Jump" :tint="starTint" @press="jump"><jump-icon /></rim-button>
          <rim-button v-for="b in dockButtons.filter((d) => d.menu !== 'chat')" :key="b.menu" v-bind="b.bind" @press="toggleMenu(b.menu)"><component :is="b.icon" /></rim-button>
        </div>
        <nav class="tabs" aria-label="Menus">
          <rim-button label="My ship" :tint="HUD_TINT.you" :rest="HUD_REST.you" @press="myShip"><avatar-icon /></rim-button>
          <rim-button label="Star" :tint="starTint" @press="star"><star-icon /></rim-button>
          <rim-button label="Planets" :tint="HUD_TINT.planets" :rest="HUD_REST.planets" :badge="planetCount" :on="menuState.planetsMenu" @press="toggleMenu('planets')"><planets-icon /></rim-button>
          <rim-button v-bind="chatButton.bind" @press="toggleMenu('chat')"><broadcast-icon /></rim-button>
          <rim-button label="More" tint="#c3b3da" rest="#a59fb3" :badge="stepsLeft" :alert="besieged" :on="moreOpen" @press="moreOpen = !moreOpen"><more-icon /></rim-button>
        </nav>
      </template>

      <menu-sheet :phone="phone" />
    </template>
  </div>
</template>

<script>
import { reactive } from 'vue'
import { mapActions, mapState } from 'pinia'
import { STAR_KEY } from '@orbiter8/sdk/system'
import { game } from '@orbiter8/sdk/client'
import { miningProgress } from '@orbiter8/sdk/game/mining'
import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { usePlayerStore } from '@/stores/player'
import { firstSteps } from '@/libs/first-steps'
import { HUD_TINT, HUD_REST } from '@/libs/palette'
import { openMenuName } from '@/components/star-map/hud/menus/menu-container/_menu-container.svg.vue'
import AvatarIcon from '@/components/star-map/hud/icons/avatar-icon.svg'
import StarIcon from '@/components/star-map/hud/icons/star-icon.svg'
import JumpIcon from '@/components/star-map/hud/icons/jump-icon.svg'
import PlanetsIcon from '@/components/star-map/hud/icons/planets-icon.svg'
import PortsIcon from '@/components/star-map/hud/icons/ports-icon.svg'
import ShipsIcon from '@/components/star-map/hud/icons/ships-icon.svg'
import HelpIcon from '@/components/star-map/hud/icons/help-icon.svg'
import SiegesIcon from '@/components/star-map/hud/icons/sieges-icon.svg'
import TrophyIcon from '@/components/star-map/hud/icons/trophy-icon.svg'
import BroadcastIcon from '@/components/star-map/hud/icons/broadcast-icon.svg'
import GearIcon from '@/components/star-map/hud/icons/gear-icon.svg'
import MoreIcon from './more-icon.svg.vue'
import PilotPlate from './pilot-plate.vue'
import SystemBlock, { starTint } from './system-block.vue'
import SelectionPanel from './selection-panel.vue'
import MenuSheet from './menu-sheet.vue'
import RimButton from './rim-button.vue'

// How many broadcasts the chat had when it was last open. Kept outside the component: the HUD goes
// away during a jump and comes back.
const chat = reactive({ seen: null })

/** "40s", "12m", "1h 05m": a countdown in a chip. */
function duration(seconds) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.ceil(seconds / 60)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

export default {
  name: 'HudOverlay',
  components: {
    AvatarIcon,
    StarIcon,
    JumpIcon,
    PlanetsIcon,
    ShipsIcon,
    HelpIcon,
    SiegesIcon,
    TrophyIcon,
    BroadcastIcon,
    GearIcon,
    MoreIcon,
    PortsIcon,
    PilotPlate,
    SystemBlock,
    SelectionPanel,
    MenuSheet,
    RimButton
  },
  data() {
    return { now: Date.now(), moreOpen: false, chat, HUD_TINT, HUD_REST }
  },
  computed: {
    ...mapState(useUIStore, ['selected', 'menuState', 'viewRatio', 'neighborView', 'hudScale']),
    ...mapState(useStarMapStore, ['myShipId', 'spriteIds', 'systemObjects']),
    ...mapState(useGameStateStore, ['events']),
    player() {
      return usePlayerStore()
    },
    /** A portrait screen: the phone layout (the old client's breakpoint). */
    phone() {
      return this.viewRatio <= 1
    },
    menuOpen() {
      return openMenuName(useUIStore()) !== null
    },
    starTint() {
      return starTint(this.systemObjects[STAR_KEY])
    },
    planetCount() {
      return this.spriteIds.planets?.length ?? 0
    },
    shipCount() {
      return this.spriteIds.ships?.length ?? 0
    },
    besieged() {
      return this.player.besiegedCells.size > 0
    },
    /** First steps not done yet: a badge on Help (none once they're all done). */
    stepsLeft() {
      if (!this.player.pilot) return 0
      return firstSteps(this.player).filter((step) => !step.done).length
    },
    chatCount() {
      return Array.isArray(this.events.chatEvents) ? this.events.chatEvents.length : 0
    },
    /** Broadcasts since the chat was last open (all of them until it has been). */
    chatUnread() {
      return Math.max(0, this.chatCount - (this.chat.seen ?? 0))
    },
    chatButton() {
      return {
        menu: 'chat',
        icon: 'broadcast-icon',
        bind: { label: 'Chat', title: 'Broadcasts (C)', tint: HUD_TINT.chat, rest: HUD_REST.chat, badge: this.chatUnread, on: this.menuState.chatMenu }
      }
    },
    /** Help, sieges, ranks, chat, settings: tinted by what they open (libs/palette.js). */
    dockButtons() {
      const on = this.menuState
      return [
        { menu: 'help', icon: 'help-icon', bind: { label: 'Help', title: 'First steps (H)', tint: HUD_TINT.help, rest: HUD_REST.help, badge: this.stepsLeft, on: on.helpMenu } },
        { menu: 'feed', icon: 'sieges-icon', bind: { label: 'Sieges', title: 'Siege feed (F)', tint: HUD_TINT.sieges, rest: HUD_REST.sieges, alert: this.besieged, on: on.feedMenu } },
        { menu: 'leaderboard', icon: 'trophy-icon', bind: { label: 'Ranks', title: 'Leaderboard (L)', tint: HUD_TINT.leaderboard, rest: HUD_REST.leaderboard, on: on.leaderboardMenu } },
        this.chatButton,
        { menu: 'settings', icon: 'gear-icon', bind: { label: 'Settings', tint: HUD_TINT.settings, rest: HUD_REST.settings, on: on.settingsMenu } }
      ]
    },
    /** The session key's time left, or null when there's no live session. */
    sessionLeft() {
      const d = this.player
      if (!d.sessionLive) return null
      const seconds = Math.max(0, d.session.expiry - d.now / 1000)
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      return h ? `${h}h ${m}m` : `${m}m`
    },
    /** The ship mining (D93): its drones at work, units mined of the room, and the time until full; or null. */
    mining() {
      const progress = miningProgress(this.player.mining, this.now)
      if (!progress) return null
      const { drones } = progress
      const count = `${progress.mined}/${progress.room}`
      // a phone's is shorter, clear of the star's name beside it
      if (this.phone) {
        const left = progress.full ? 'full' : duration(progress.secondsLeft)
        return { ...progress, words: `${drones || ''} mining · ${count} · ${left}`.trim() }
      }
      const crew = drones ? `${drones} drone${drones === 1 ? '' : 's'} · ` : ''
      const left = progress.full ? 'holds full' : `full in ${duration(progress.secondsLeft)}`
      return { ...progress, words: `Mining · ${crew}${count} · ${left}` }
    },
    /** "Scanning Lulin-851… 23 s", then "Recording the scan…", or null. */
    scanWords() {
      const scan = this.player.scan
      if (!scan) return null
      const here = scan.cell === this.player.ship?.cell
      const where = here ? 'this star' : game.starName(scan.cell)
      if (scan.status === 'due') return `Recording the scan of ${where}…`
      const seconds = Math.max(0, Math.ceil((scan.readyAt - this.now) / 1000))
      return seconds > 0 ? `Scanning ${where}… ${seconds} s` : `Scanning ${where}…`
    }
  },
  watch: {
    // While the chat is open, everything in it has been seen.
    'menuState.chatMenu': 'seeChat',
    chatCount: 'seeChat',
    menuOpen(open) {
      if (open) this.moreOpen = false
    }
  },
  mounted() {
    // Timers (sessions, buildings, sieges) count down by this clock; the scan's by the second.
    this.clock = setInterval(() => usePlayerStore().tick(), 15_000)
    this.seconds = setInterval(() => {
      const player = usePlayerStore()
      if (player.scan || player.mining) this.now = Date.now()
    }, 1000)
  },
  unmounted() {
    clearInterval(this.clock)
    clearInterval(this.seconds)
  },
  methods: {
    ...mapActions(useUIStore, ['selectSprite', 'scaleAnimateTo', 'zoomOutToNeighbors', 'openMenu', 'closeMenu']),
    /**
     * A button pressed with the pointer gives its focus back, so Space stays "my ship" and doesn't press
     * it again. Pressed from the keyboard or a gamepad (no pointer: detail 0), it keeps its focus ring.
     */
    releaseFocus(event) {
      if (event.detail > 0 && document.activeElement instanceof HTMLButtonElement) document.activeElement.blur()
    },
    seeChat() {
      if (this.menuState.chatMenu) this.chat.seen = this.chatCount
    },
    /** A dock button opens its menu, swaps it for the open one, or closes it when it's the open one. */
    toggleMenu(menu) {
      if (this.menuState[menu + 'Menu']) this.closeMenu()
      else this.openMenu(menu)
    },
    myShip() {
      this.closeMenu()
      this.selectSprite(this.myShipId)
      this.scaleAnimateTo({ scale: '0.05', time: 1000 })
    },
    /** The star; pressed again, out to the galaxy map. */
    star() {
      this.closeMenu()
      if (this.selected != STAR_KEY) this.selectSprite(STAR_KEY)
      else this.zoomOutToNeighbors()
    },
    jump() {
      this.closeMenu()
      this.zoomOutToNeighbors()
    },
    /** The section the ship is mining, selected: its card has Stop mining. */
    miningSection() {
      const section = this.systemObjects[this.myShipId]?.mining?.section
      if (!section) return
      this.closeMenu()
      this.selectSprite(section)
    }
  }
}
</script>

<style scoped>
.hud {
  --edge: 16px;
  position: absolute;
  inset: 0;
  z-index: 5;
  overflow: hidden;
  pointer-events: none;
  font-family: Ubuntu, sans-serif;
  font-size: 13px;
  color: #c3b3da;
  user-select: none;
  /* back after a jump (and on arriving at all): a quick fade, as the new system settles */
  animation: hud-in 0.35s ease-out;
}
@keyframes hud-in {
  from {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hud {
    animation: none;
  }
}
.hud > * {
  position: absolute;
  pointer-events: auto;
}
.you {
  top: calc(var(--edge) + env(safe-area-inset-top));
  left: calc(var(--edge) + env(safe-area-inset-left));
  /* the cargo list opens over what's below */
  z-index: 21;
  pointer-events: none;
}
.you > * {
  pointer-events: auto;
}
.chips {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  margin-top: 7px;
  pointer-events: none;
}
/* things of yours that are counting down: yellow (libs/palette.js) */
.chip {
  padding: 4px 11px;
  border: 1px solid #ebff9955;
  border-radius: 12px;
  background: #12052ae6;
  color: var(--o8-yellow-light);
  font-size: 12px;
  white-space: nowrap;
}
/* mining: a button (it selects the section), with a bar that fills as the holds do */
.chip.mining {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 5px 11px 6px;
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  pointer-events: auto;
}
.chip.mining:hover {
  border-color: #ebff99aa;
}
.chip.mining:focus-visible {
  outline: 2px solid var(--o8-yellow-light);
  outline-offset: 2px;
}
.chip.mining .bar {
  display: block;
  height: 4px;
  border-radius: 2px;
  background: #ebff9926;
  overflow: hidden;
}
.chip.mining .bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--o8-yellow-light);
  transition: width 1s linear;
}
@media (prefers-reduced-motion: reduce) {
  .chip.mining .bar i {
    transition: none;
  }
}
.where {
  top: calc(var(--edge) + env(safe-area-inset-top));
  right: calc(var(--edge) + env(safe-area-inset-right));
}
.selected {
  left: calc(var(--edge) + env(safe-area-inset-left));
  bottom: calc(var(--edge) + env(safe-area-inset-bottom));
  pointer-events: none;
}
.selected > :deep(*) {
  pointer-events: auto;
}
.dock {
  right: calc(var(--edge) + env(safe-area-inset-right));
  bottom: calc(var(--edge) + 8px + env(safe-area-inset-bottom));
  display: flex;
  gap: 4px;
  padding: 9px 8px 7px;
  border: 1px solid #3f3566;
  border-radius: 16px;
  background: #12052ab8;
}

/* over the galaxy map (z-index 50), where only the pilot's plate stays */
.hud.map {
  z-index: 55;
}

/* a portrait phone */
.phone {
  --edge: 8px;
}
.phone .you {
  right: calc(var(--edge) + env(safe-area-inset-right));
}
.phone .where {
  top: calc(var(--edge) + 58px + env(safe-area-inset-top));
}
.phone .selected {
  right: calc(var(--edge) + env(safe-area-inset-right));
  bottom: calc(72px + env(safe-area-inset-bottom));
}
.tabs {
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-around;
  padding: 7px 4px calc(5px + env(safe-area-inset-bottom));
  border-top: 1px solid #3f3566;
  background: #12052af2;
}
.tabs > * {
  flex: 1;
}
.more {
  left: var(--edge);
  right: var(--edge);
  bottom: calc(72px + env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px 4px;
  padding: 14px 8px;
  border: 1.5px solid #5a4c8c;
  border-radius: 14px;
  background: #1b1531f5;
}
</style>
