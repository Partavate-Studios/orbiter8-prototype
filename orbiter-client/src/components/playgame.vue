<template>
  <div class="playorbiter8">
    <star-map />
    <layer-html />
    <transaction-tray />
    <!-- (a jump from the map: the map slides away with the system, libs/jump-slide.js) -->
    <galaxy-map v-if="(neighborView && !jumpAnimationState) || jumpFromMap" :class="{ departing: jumpFromMap }" />
    <black-hole-entry />
    <tech-tree v-if="techTreeOpen" class="tech-tree-over" @close="techTreeOpen = false" />
    <game-dialog />
  </div>
</template>

<script>
import { CAMERA } from '@/constants'
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { useStarMapStore } from '@/stores/starmap'
import { useUIStore } from '@/stores/ui'
import { mapActions, mapState } from 'pinia'
import { useConfigStore } from '@/stores/config'
import starMap from '@/components/star-map/map'
import layerHtml from '@/components/layer-html/container-html'
import TransactionTray from '@/components/transaction-tray.vue'
import GameDialog from '@/components/game-dialog.vue'
import TechTree from '@/components/star-map/tech-tree.vue'
import GalaxyMap from '@/components/star-map/galaxy-map.vue'
import BlackHoleEntry from '@/components/star-map/black-hole-entry.vue'
import { usePlayerStore } from '@/stores/player'
import { useDialogStore } from '@/stores/dialog'
import router from '@/router/router'
import { onFrame } from '@/libs/frame-loop'

/** Keys for the HUD's menus (their buttons' tooltips name them). */
const MENU_KEYS = { m: 'map', o: 'objects', n: 'minerva', p: 'planets', h: 'help', c: 'chat', l: 'leaderboard', f: 'feed' }

/** Whether a key went to a text field (chat, names), not the map. */
function isTyping(event) {
  const target = event.target
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
}

export default {
  name: 'Play',
  components: {
    starMap,
    layerHtml,
    TransactionTray,
    GameDialog,
    TechTree,
    GalaxyMap,
    BlackHoleEntry
  },
  data() {
    return { player: usePlayerStore() }
  },
  computed: {
    ...mapState(useGameStateStore, ['haveAvatar', 'haveShip']),
    ...mapState(useUIStore, ['selected', 'jumpAnimationState', 'jumpThroughHole', 'viewport', 'neighborView', 'neighborSwitchScale', 'menuState', 'jumpFromMap']),
    techTreeOpen: {
      get() {
        return useUIStore().techTreeOpen
      },
      set(open) {
        useUIStore().techTreeOpen = open
      }
    },
    ...mapState(useStarMapStore, ['gameTime', 'systemObjects', 'sprites', 'spriteIds', 'myShipId']),
    ...mapState(useConfigStore, ['tickDelay']),
    /** The star you're at, when it's your first visit and its scan is pending (its stars and planets are about to be revealed). */
    newStarHere() {
      const scan = this.player.scan
      const cell = this.player.pilot?.ship.cell
      return scan && cell != null && scan.cell === cell ? cell : null
    },
    /** The system you're in has a black hole at its core. */
    atBlackHole() {
      return Object.values(this.systemObjects).some((object) => object.type === 'star' && object.blackHole)
    }
  },
  watch: {
    jumpAnimationState() {
      this.playTravelMusic()
    },
    // (set when the move is sent, before the ship has stretched into the hole: the music starts there)
    jumpThroughHole() {
      this.playTravelMusic()
    },
    // The system often loads after this screen does, and changes under a jump.
    atBlackHole(hole) {
      if (this.jumpAnimationState || this.jumpThroughHole) return
      if (hole !== (this.o8audio.currentMusic === 'holeSystem')) this.playHereMusic()
    },
    // The scan is often scheduled a moment after the jump's animation ends (when the jump is mined):
    // the new-star track starts then, over the map's music.
    newStarHere(cell) {
      if (cell != null && !this.jumpAnimationState && !this.jumpThroughHole && this.o8audio.currentMusic === 'map') this.playHereMusic()
    },
    // A scan seen while jumping counts too: with a short scan delay (a local chain's 4 s) it can be
    // scheduled and recorded before the jump's animation ends.
    'player.scan.cell'(cell) {
      if (cell != null) this.scanSeenAt = cell
    }
  },
  beforeCreate() {},
  created() {
    window.addEventListener('keyup', this.handleKeyPress)
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('wheel', this.onWheel)
    if (!this.haveAvatar || !this.haveShip) {
      router.push('/')
    }
    this.lastTick = 0
    this.stopFrames = onFrame(this.onFrame)
    // The map only loads when a new block is seen; make sure the (single) poller runs however we got here.
    this.startBlockPolling()
  },
  mounted() {
    this.playHereMusic()
  },
  unmounted() {
    window.removeEventListener('keyup', this.handleKeyPress)
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('wheel', this.onWheel)
    this.stopFrames()
  },
  methods: {
    /**
     * The music for traveling: the jump's, or the black hole's from the moment you go in; and back to
     * the music for where you are once you've arrived. Safe to call again: it never restarts a song.
     */
    playTravelMusic() {
      const playing = this.o8audio.currentMusic
      if (this.jumpAnimationState || this.jumpThroughHole) {
        const song = this.jumpThroughHole ? 'hole' : 'jump'
        if (playing !== song) this.o8audio.playMusic(song)
      } else if (playing === 'jump' || playing === 'hole') this.playHereMusic()
    },
    /**
     * The music for where you are: Entering the Tomb in a system with a black hole at its core; else
     * Reflections in the Wind at a star you're visiting first while its scan is pending, once for that
     * visit (it plays out, then the map's comes back: 08audio.js THEN); else the map's
     * (docs/briefs/music.md).
     */
    playHereMusic() {
      if (this.atBlackHole) return this.o8audio.playMusic('holeSystem')
      const here = this.player.pilot?.ship.cell
      const cell = this.newStarHere ?? (this.scanSeenAt === here ? here : null)
      if (cell != null && this.discoveryPlayedAt !== cell) {
        this.discoveryPlayedAt = cell
        this.o8audio.playMusic('discovery')
      } else this.o8audio.playMusic('map')
    },
    screenshot() {
      let svgRoot = document.getElementById('gameSVG')
      let svgSource = svgRoot.outerHTML
      let svgDataUri = 'data:image/svg+xml;base64,' + btoa(svgSource)
      let downloadLink = document.createElement('a')
      downloadLink.href = svgDataUri

      let today = new Date()
      let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
      let time = today.getHours() + '.' + today.getMinutes() + '.' + today.getSeconds()
      let dateTime = date + '_' + time
      downloadLink.download = 'screenshot' + dateTime + '.svg'
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    },
    ...mapActions(useChainStore, ['startBlockPolling']),
    ...mapActions(useStarMapStore, ['incrementGameTime', 'updateAllTelemtry']),
    ...mapActions(useConfigStore, ['toggleGraphicsQuality']),
    ...mapActions(useUIStore, [
      'enterNeighborView',
      'exitNeighborView',
      'toggleMinerva',
      'viewportToTime',
      'setSelectedTelemetry',
      'moveUp',
      'moveDown',
      'moveLeft',
      'moveRight',
      'scaleBy',
      'wheelZoomAt',
      'back',
      'stepPlanet',
      'selectSprite',
      'openMenu',
      'closeMenu',
      'zoomOutToNeighbors'
    ]),
    onWheel(event) {
      // Over the dialog, the wheel isn't the map's.
      if (event.target instanceof Element && event.target.closest('[data-own-scroll]')) return
      const zoomingOut = event.deltaY > 0
      // The galaxy map handles its own wheel (zooming in past your star brings you back here).
      if (this.neighborView) return
      // Zoomed out until the heliopause nearly fills the screen: the next step out hands over to the
      // galaxy map, which carries the zoom on (the heliopause shrinks into the star).
      if (zoomingOut && this.viewport.scale >= this.neighborSwitchScale * 0.97) {
        this.enterNeighborView()
        return
      }
      // Wheel up zooms in (smaller scale = closer).
      this.wheelZoomAt({
        screenX: event.clientX - window.innerWidth / 2,
        screenY: event.clientY - window.innerHeight / 2,
        factor: zoomingOut ? CAMERA.WHEEL_ZOOM_OUT : CAMERA.WHEEL_ZOOM_IN,
        time: CAMERA.WHEEL_TWEEN_MS
      })
    },
    /** Keys that act as soon as they're pressed (and would otherwise move focus or scroll the page). */
    handleKeyDown(event) {
      if (isTyping(event) || event.ctrlKey || event.metaKey || event.altKey) return
      switch (event.key) {
        case 'Escape':
          this.back()
          break
        case ' ':
          this.selectSprite(this.myShipId)
          break
        case 'Tab':
          this.stepPlanet({ planets: this.spriteIds.planets, step: event.shiftKey ? -1 : 1 })
          break
        case ']':
          this.stepPlanet({ planets: this.spriteIds.planets, step: 1 })
          break
        case '[':
          this.stepPlanet({ planets: this.spriteIds.planets, step: -1 })
          break
        default: {
          // Letters open the HUD's menus (pressed again, close them); M is the galaxy map.
          const menu = MENU_KEYS[event.key.toLowerCase()]
          if (event.shiftKey || this.jumpAnimationState || useDialogStore().open) return
          if (menu === 'map') this.neighborView ? this.exitNeighborView() : this.zoomOutToNeighbors()
          // (P is the list on its planets: the planets menu is part of the list now)
          else if (menu && !this.neighborView) this.menuState[(menu === 'planets' ? 'objects' : menu) + 'Menu'] ? this.closeMenu() : this.openMenu(menu)
          else return
        }
      }
      event.preventDefault()
    },
    handleKeyPress(event) {
      if (isTyping(event)) return
      switch (event.key) {
        case '`':
          this.toggleMinerva()
          break
        case '~':
          this.toggleGraphicsQuality()
          break
        case '=':
          this.scaleBy(0.25)
          break
        case '-':
          this.scaleBy(4)
          break
        case '+':
          this.scaleBy(0.75)
          break
        case '_':
          this.scaleBy(1.25)
          break
        case 'ArrowRight':
          this.moveRight(CAMERA.KEY_PAN)
          break
        case 'ArrowLeft':
          this.moveLeft(CAMERA.KEY_PAN)
          break
        case 'ArrowDown':
          this.moveDown(CAMERA.KEY_PAN)
          break
        case 'ArrowUp':
          this.moveUp(CAMERA.KEY_PAN)
          break
        case 'S':
          this.screenshot()
          break
      }
    },
    /** One game tick: advance time, the camera's animations, every orbit, then keep the camera on the selected sprite. */
    advanceGame() {
      this.incrementGameTime()
      this.viewportToTime(this.gameTime)
      this.updateAllTelemtry()
      this.followSelectedSprite()
    },
    followSelectedSprite() {
      const sprite = this.selected != null ? this.sprites[this.selected] : null
      if (!sprite) return
      this.setSelectedTelemetry({
        translatex: sprite.position.x,
        translatey: sprite.position.y,
        scale: sprite.cameraScale
      })
    },
    onFrame(now) {
      // Low graphics tier ticks at ~30 fps (tickDelay); the others tick every frame.
      if (now - this.lastTick < this.tickDelay) return
      this.lastTick = now
      this.advanceGame()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.playorbiter8 {
  user-select: none;
  width: 100%;
  height: 100%;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
}
</style>

<style lang="scss">
a:focus {
  outline: none;
}

.is-dragging {
  cursor: grabbing;
}
</style>
