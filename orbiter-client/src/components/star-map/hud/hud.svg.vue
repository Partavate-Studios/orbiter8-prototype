<template>
  <g>
    <defs>
      <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7c39cd" stop-opacity="1" />
        <stop offset="20%" stop-color="#280b4b" stop-opacity="1" />
        <stop offset="50%" stop-color="#5c1aae" stop-opacity="1" />
        <stop offset="80%" stop-color="#280b4b" stop-opacity="1" />
        <stop offset="100%" stop-color="#7c39cd" stop-opacity="1" />
      </linearGradient>
    </defs>
    <g v-if="!isMenuOn">
      <current-system :transform="corner(rightMostX, -100, topMostY, 45)" />

      <g :transform="corner(leftMostX, profileOffset.x, topMostY, profileOffset.y)">
        <g font-size="0.7em" fill="#ffffff88" transform="translate(0 40)">
          <rect
            x="0"
            y="-40"
            width="200"
            :height="profileHeight"
            fill="url(#profileGradient)"
            stroke="#ffffff22"
            rx="10"
            ry="10"
            stroke-width="1"
          />
          <rect
            x="4"
            y="-36"
            width="192"
            :height="profileHeight - 8"
            fill="#00000088"
            stroke="#000000"
            rx="8"
            ry="8"
            stroke-width="1"
          />
          <text text-anchor="start" transform="translate(35 -20)" fill="#ffffff" font-size="1.2em"
            >{{ avatar.name }}
          </text>
          <text text-anchor="end" transform="translate(70 -04)">Starship:</text>
          <text text-anchor="start" transform="translate(75 -04)" fill="#ffffff">{{ avatar.ship.name }}</text>
          <text text-anchor="end" transform="translate(70 11)">Credits:</text>
          <text text-anchor="start" transform="translate(75 11)" fill="#ffffff">{{ avatar.credits.toLocaleString('en-US') }}&cent;</text>

          <!-- Every good aboard and the empty holds, two by two (the card grows past four) -->
          <g font-size="0.9em">
            <g v-for="(slot, index) in cargoSlots" :key="index" :transform="cargoSlotAt(index)">
              <text text-anchor="end" fill="#ffffff">{{ slot.units }}</text>
              <text text-anchor="start" x="5">{{ slot.name }}</text>
            </g>
          </g>
        </g>
      </g>

      <g :transform="corner(leftMostX, 50, topMostY, 50)">
        <a cursor="pointer" @click.prevent="selectMyShip()">
          <title>My ship (Space)</title>
          <avatar-icon />
        </a>
      </g>

      <minimap v-if="mapDataLoaded && !neighborView" :transform="corner(rightMostX, -70, topMostY, 160)" />

      <!-- The long-range scan of a star you discovered, until it's recorded (yellow: yours) -->
      <text
        v-if="scanWords"
        :transform="corner(rightMostX, -20, topMostY, 232)"
        text-anchor="end"
        font-size="0.8em"
        :fill="YELLOW_LIGHT"
        >{{ scanWords }}</text
      >

      <g :transform="corner(rightMostX, -50, topMostY, 50)">
        <!-- A star until the star is selected; then the star-nav icon, which zooms out to its neighbors. -->
        <a cursor="pointer" @click.prevent="selectStar()">
          <title>{{ starSelected ? 'Neighboring stars' : 'The star' }}</title>
          <jump-icon v-if="starSelected" />
          <star-icon v-else />
        </a>
      </g>

      <g v-if="false" :transform="'translate(' + (leftMostX + 50) + ' ' + (bottomMostY - 150) + ')'">
        <a cursor="pointer" @click.prevent="mute()">
          <speaker-icon />
        </a>
      </g>

      <!-- Help: the first steps, with how many are left until they're done -->
      <g :transform="corner(leftMostX, 50, bottomMostY, -450)">
        <a cursor="pointer" @click.prevent="openMenu('help')">
          <title>First steps</title>
          <help-icon />
          <g v-if="stepsLeft">
            <circle cx="-25" cy="20" fill="#230b41" stroke="#ffffff88" stroke-width="0.5" r="10" />
            <text
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="0.65em"
              fill="#ffffffaa"
              transform="translate(-25 20)"
              >{{ stepsLeft }}</text
            >
          </g>
        </a>
      </g>

      <!-- The siege feed, ringed in pink while a siege is running -->
      <g :transform="corner(leftMostX, 50, bottomMostY, -350)">
        <a cursor="pointer" @click.prevent="openMenu('feed')">
          <title>Siege feed</title>
          <circle v-if="player.besiegedCells.size" r="27" fill="none" :stroke="PINK_LIGHT" stroke-width="2" />
          <sieges-icon />
        </a>
      </g>
      <!-- The session key's time left (yellow: yours) -->
      <text
        v-if="sessionLeft"
        :transform="corner(leftMostX, 105, topMostY, 125)"
        font-size="0.8em"
        :fill="YELLOW_LIGHT"
        >Session · {{ sessionLeft }} left</text
      >

      <g :transform="corner(leftMostX, 50, bottomMostY, -250)">
        <a cursor="pointer" @click.prevent="showLeaderboard()">
          <title>Leaderboard</title>
          <trophy-icon />
        </a>
      </g>

      <g :transform="corner(leftMostX, 50, bottomMostY, -150)">
        <a cursor="pointer" @click.prevent="showChat()">
          <title>Chat</title>
          <broadcast-icon />
          <g v-if="chatEventsCount">
            <circle cx="-25" cy="20" fill="#230b41" stroke="#ffffff88" stroke-width="0.5" r="10" />
            <text
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="0.65em"
              fill="#ffffffaa"
              transform="translate(-25 20)"
              >{{ chatEventsCount }}</text
            >
          </g>
        </a>
      </g>

      <zoom-slider :transform="corner(0, 0, bottomMostY, -50, 1.5)" />

      <!-- Shows or hides the selection's card, so only there when something is selected. -->
      <scope-toggle v-if="selected != null" :transform="corner(0, 0, bottomMostY, -100)" />

      <g :transform="corner(leftMostX, 50, bottomMostY, -50)">
        <a cursor="pointer" @click.prevent="showSettings()">
          <title>Settings</title>
          <gear-icon />
        </a>
      </g>

      <g :transform="corner(rightMostX, -50, bottomMostY, -50)">
        <a cursor="pointer" @click.prevent="showShips()">
          <title>Ships in this system</title>
          <ships-icon />
          <g v-if="shipCount">
            <circle cx="25" cy="20" fill="#230b41" stroke="#ffffff88" stroke-width="0.5" r="10" />
            <text
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="0.65em"
              fill="#ffffffaa"
              transform="translate(25 20)"
              >{{ shipCount }}</text
            >
          </g>
        </a>
      </g>
      <g :transform="corner(rightMostX, -50, bottomMostY, -150)">
        <a cursor="pointer" @click.prevent="showPlanets()">
          <title>Planets (Tab and Shift+Tab step through them)</title>
          <planets-icon />
          <g>
            <circle cx="25" cy="20" fill="#230b41" stroke="#ffffff88" stroke-width="0.5" r="10" />
            <text
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="0.65em"
              fill="#ffffffaa"
              transform="translate(25 20)"
              >{{ planetCount }}</text
            >
          </g>
        </a>
      </g>
    </g>

    <!-- The selection's cards. (The compass that showed here with nothing selected is stashed: see
         UPGRADE_NOTES.md, "Stashed: the compass".) -->
    <g v-if="showScope && selected != null" transform="translate(0 -100)">
      <card-ui :object-id="selected" />
    </g>

    <g>
      <g v-if="menuState.planetsMenu">
        <planets-menu />
      </g>
      <g v-if="menuState.shipsMenu">
        <ships-menu />
      </g>
      <g v-if="menuState.settingsMenu">
        <settings-menu />
      </g>
      <g v-if="menuState.tradeMenu">
        <trade-menu :object-id="selected" />
      </g>
      <g v-if="menuState.shipyardMenu">
        <shipyard-menu :object-id="selected" />
      </g>
      <g v-if="menuState.chatMenu">
        <chat-menu />
      </g>
      <g v-if="menuState.leaderboardMenu">
        <leaderboard-menu />
      </g>
      <g v-if="menuState.colonyMenu">
        <colony-menu :object-id="selected" />
      </g>
      <g v-if="menuState.armoryMenu">
        <armory-menu :object-id="selected" />
      </g>
      <g v-if="menuState.loadoutMenu">
        <loadout-menu />
      </g>
      <g v-if="menuState.siegeMenu">
        <siege-menu :object-id="selected" />
      </g>
      <g v-if="menuState.feedMenu">
        <feed-menu />
      </g>
      <g v-if="menuState.helpMenu">
        <help-menu />
      </g>
    </g>
  </g>
</template>

<script>
import { cargoLines, emptyHolds, shortGoodName } from '@/sdk/game/trade'
import { STAR_KEY } from '@/sdk/system'
import { game } from '@/sdk/client'

import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { mapActions, mapState } from 'pinia'
import CurrentSystem from './current-system/system.svg'

import ScopeToggle from './toggles/scope-toggle.svg'
import ZoomSlider from './zoom-slider.svg'
import CardUi from './card-ui/card-ui.svg'
import ColonyMenu from './menus/colony-menu.svg'
import ArmoryMenu from './menus/armory-menu.svg'
import LoadoutMenu from './menus/loadout-menu.svg'
import SiegeMenu from './menus/siege-menu.svg'
import FeedMenu from './menus/feed-menu.svg'
import SiegesIcon from './icons/sieges-icon.svg'
import HelpMenu from './menus/help-menu.svg'
import HelpIcon from './icons/help-icon.svg'
import { firstSteps } from '@/libs/first-steps'
import { PINK_LIGHT, YELLOW_LIGHT } from '@/libs/palette'
import { usePlayerStore } from '@/stores/player'
// import SpriteInfo from './scope/sprite-info-box.svg'
// import SpriteMenu from './scope/sprite-menu.svg'
//Icons
// import MyShipIcon from './icons/my-ship-icon.svg'
import AvatarIcon from './icons/avatar-icon.svg'
import GearIcon from './icons/gear-icon.svg'
import JumpIcon from './icons/jump-icon.svg'
import StarIcon from './icons/star-icon.svg'
import Minimap from './minimap.svg'
import PlanetsIcon from './icons/planets-icon.svg'
import ShipsIcon from './icons/ships-icon.svg'
import SpeakerIcon from './icons/speaker-icon.svg'
import BroadcastIcon from './icons/broadcast-icon.svg'
//Menus
import PlanetsMenu from './menus/planets-menu.svg'
import ShipsMenu from './menus/ships-menu.svg'
import TradeMenu from './menus/trade-menu.svg'
import ShipyardMenu from './menus/shipyard-menu.svg'
import ChatMenu from './menus/chat-menu.svg'
import LeaderboardMenu from './menus/leaderboard-menu.svg'
import TrophyIcon from './icons/trophy-icon.svg'
import SettingsMenu from './menus/settings-menu.svg'

export default {
  name: 'Hud',
  components: {
    AvatarIcon,
    CardUi,
    CurrentSystem,
    GearIcon,
    JumpIcon,
    StarIcon,
    Minimap,
    PlanetsIcon,
    PlanetsMenu,
    SettingsMenu,
    ChatMenu,
    LeaderboardMenu,
    TrophyIcon,
    ShipsIcon,
    ShipsMenu,
    SpeakerIcon,
    BroadcastIcon,
    ScopeToggle,
    TradeMenu,
    ShipyardMenu,
    ZoomSlider,
    ColonyMenu,
    ArmoryMenu,
    LoadoutMenu,
    SiegeMenu,
    FeedMenu,
    HelpMenu,
    HelpIcon,
    SiegesIcon
  },
  data() {
    return { now: Date.now() }
  },
  computed: {
    starSelected() {
      return this.selected === STAR_KEY
    },
    ...mapState(useUIStore, [
      'showScope',
      'selected',
      'leftMostX',
      'rightMostX',
      'topMostY',
      'bottomMostY',
      'menuState',
      'isMenuOn',
      'viewRatio',
      'neighborView',
      'hudScale'
    ]),
    ...mapState(useStarMapStore, ['myShipId', 'spriteIds', 'mapDataLoaded']),
    ...mapState(useGameStateStore, ['avatar', 'events', 'goods']),
    player() {
      return usePlayerStore()
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
    /** "Scanning Lulin-851… 23 s", then "Recording the scan…", or null. */
    scanWords() {
      const scan = this.player.scan
      if (!scan) return null
      const here = scan.cell === this.player.ship?.cell
      const where = here ? 'this star' : game.starName(scan.cell)
      if (scan.status === 'due') return `Recording the scan of ${where}…`
      const seconds = Math.max(0, Math.ceil((scan.readyAt - this.now) / 1000))
      return seconds > 0 ? `Scanning ${where}… ${seconds} s` : `Scanning ${where}…`
    },
    PINK_LIGHT: () => PINK_LIGHT,
    YELLOW_LIGHT: () => YELLOW_LIGHT,
    /**
     * Every good aboard, then the empty holds, in two columns (the left wide, the right narrow). A
     * portrait phone has no room under the card for more than three rows: past five goods the rest
     * share a slot ("+N more"), and the ship's card lists them all.
     */
    cargoSlots() {
      const lines = cargoLines(this.avatar.ship, this.goods).map((line, index) => ({
        ...line,
        name: shortGoodName(line.name, index % 2 === 0)
      }))
      const room = this.viewRatio <= 1 ? 5 : Infinity
      const shown =
        lines.length > room
          ? [...lines.slice(0, room - 1), { name: `+${lines.length - room + 1} more`, units: lines.slice(room - 1).reduce((a, l) => a + l.units, 0) }]
          : lines
      return [...shown, { name: 'Empty', units: emptyHolds(this.avatar.ship) }]
    },
    /** The profile card's height: 100 for up to four slots, 15 more for each further row of two. */
    profileHeight() {
      return 100 + Math.max(0, Math.ceil(this.cargoSlots.length / 2) - 2) * 15
    },
    /** Where the profile card sits from the top left corner: under the avatar button on portrait screens. */
    profileOffset() {
      return this.viewRatio <= 1 ? { x: 20, y: 90 } : { x: 100, y: 15 }
    },
    /** First steps not done yet: a badge on the "?" button (none once they're all done). */
    stepsLeft() {
      if (!this.player.pilot) return 0
      return firstSteps(this.player).filter((step) => !step.done).length
    },
    chatEventsCount() {
      if (Array.isArray(this.events.chatEvents)) {
        return this.events.chatEvents.length
      }
      return 0
    },
    planetCount() {
      if (Array.isArray(this.spriteIds.planets)) {
        return this.spriteIds.planets.length
      }
      return 0
    },
    shipCount() {
      if (Array.isArray(this.spriteIds.ships)) {
        return this.spriteIds.ships.length
      }
      return 0
    }
  },
  mounted() {
    // Timers (sessions, buildings, sieges) count down by this clock; the scan's by the second.
    this.clock = setInterval(() => usePlayerStore().tick(), 15_000)
    this.seconds = setInterval(() => {
      if (usePlayerStore().scan) this.now = Date.now()
    }, 1000)
  },
  unmounted() {
    clearInterval(this.clock)
    clearInterval(this.seconds)
  },
  methods: {
    /** Where cargo slot `index` sits: two columns, rows 15 apart, the empty holds last on the right. */
    cargoSlotAt(index) {
      const last = index === this.cargoSlots.length - 1
      // The last slot takes the right column of its row (an odd count leaves the left one empty).
      const at = last && index % 2 === 0 ? index + 1 : index
      return `translate(${at % 2 ? 140 : 40} ${30 + Math.floor(at / 2) * 15})`
    },
    /**
     * Places a corner control (offset from a screen edge) at the player's interface size: the
     * offset and the control grow together, so it stays the same distance inside the screen's edge.
     */
    corner(edgeX, offsetX, edgeY, offsetY, extraScale = 1) {
      const scale = this.hudScale
      return `translate(${edgeX + offsetX * scale} ${edgeY + offsetY * scale}) scale(${scale * extraScale})`
    },
    ...mapActions(useUIStore, ['selectSprite', 'scaleAnimateTo', 'zoomOutToNeighbors', 'openMenu']),
    showSettings() {
      this.o8audio.playEffect('click')
      this.openMenu('settings')
    },
    showPlanets() {
      this.o8audio.playEffect('click')
      this.openMenu('planets')
    },
    showShips() {
      this.o8audio.playEffect('click')
      this.openMenu('ships')
    },
    showChat() {
      this.o8audio.playEffect('click')
      this.openMenu('chat')
    },
    showLeaderboard() {
      this.o8audio.playEffect('click')
      this.openMenu('leaderboard')
    },
    selectMyShip() {
      this.o8audio.playEffect('click')
      this.selectSprite(this.myShipId)
      this.scaleAnimateTo({ scale: '0.05', time: 1000 })
    },
    selectStar() {
      this.o8audio.playEffect('click')
      if (this.selected != STAR_KEY) {
        this.selectSprite(STAR_KEY)
      } else {
        this.zoomOutToNeighbors()
      }
    }
  }
}
</script>
