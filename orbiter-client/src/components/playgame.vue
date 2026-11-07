<template>
  <div class="playorbiter8">
    <star-map />
    <layer-html />
    <transaction-tray />
    <galaxy-map v-if="neighborView && !jumpAnimationState" />
    <black-hole-entry />
    <first-steps v-if="!neighborView && selected == null" />
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
import FirstSteps from '@/components/star-map/first-steps.vue'
import { usePlayerStore } from '@/stores/player'
import router from '@/router/router'
import { onFrame } from '@/libs/frame-loop'

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
    BlackHoleEntry,
    FirstSteps
  },
  data() {
    return { player: usePlayerStore() }
  },
  computed: {
    ...mapState(useGameStateStore, ['haveAvatar', 'haveShip']),
    ...mapState(useUIStore, ['selected', 'jumpAnimationState', 'viewport', 'neighborView']),
    techTreeOpen: {
      get() {
        return useUIStore().techTreeOpen
      },
      set(open) {
        useUIStore().techTreeOpen = open
      }
    },
    ...mapState(useStarMapStore, ['gameTime', 'systemObjects', 'sprites', 'spriteIds', 'myShipId']),
    ...mapState(useConfigStore, ['tickDelay'])
  },
  watch: {
    jumpAnimationState: {
      handler: function (newval, oldval) {
        if (newval != oldval) {
          if (newval) {
            this.o8audio.playMusic('jump')
          } else {
            this.o8audio.playMusic('map')
          }
        }
      }
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
    this.o8audio.playMusic('map')
  },
  unmounted() {
    window.removeEventListener('keyup', this.handleKeyPress)
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('wheel', this.onWheel)
    this.stopFrames()
  },
  methods: {
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
      'selectSprite'
    ]),
    onWheel(event) {
      // Over the dialog, the wheel isn't the map's.
      if (event.target instanceof Element && event.target.closest('[data-own-scroll]')) return
      const zoomingOut = event.deltaY > 0
      // In the neighbor-star view, wheeling in returns to the system; wheeling out does nothing more.
      if (this.neighborView) {
        if (!zoomingOut) this.exitNeighborView()
        return
      }
      // Already as far out as the camera goes: the next step out leaves the system for its neighbors.
      if (zoomingOut && this.viewport.scale >= CAMERA.NEIGHBOR_VIEW_FROM_SCALE) {
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
        default:
          return
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
