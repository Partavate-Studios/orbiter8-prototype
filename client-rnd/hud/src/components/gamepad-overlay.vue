<template>
  <!-- Gamepad support (libs/gamepad/controller.js): the D-pad focus ring and the right-stick cursor,
       shown only while a pad is in use; moving the mouse hides them. -->
  <div v-if="active" class="gamepad-overlay">
    <div v-if="ring" class="focus-ring" :style="ring" />
    <div v-if="cursor" class="cursor" :style="{ left: cursor.x + 'px', top: cursor.y + 'px' }" />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { createGamepadController } from '@/libs/gamepad/controller'
import { useUIStore } from '@/stores/ui'
import { useStarMapStore } from '@/stores/starmap'

// Left-stick panning at full tilt, in screen pixels per second.
const PAN_SPEED = 900
// Trigger zoom at full pressure: the scale changes by e^ZOOM_RATE per second (about 20x), so a full
// pull crosses the whole zoom range in about three seconds.
const ZOOM_RATE = 3
// Padding around the focused element's outline, in pixels.
const RING_PADDING = 6

export default {
  name: 'GamepadOverlay',
  data() {
    return {
      active: false,
      focused: null,
      cursor: null,
      // Bumped each frame while active, so the ring follows elements that move.
      frameCount: 0
    }
  },
  computed: {
    ...mapState(useUIStore, ['selected', 'viewport', 'neighborView', 'isMenuOn', 'livePixelsPerUnit']),
    ...mapState(useStarMapStore, ['mapDataLoaded', 'spriteIds', 'myShipId']),
    ring() {
      void this.frameCount
      if (!this.focused || !this.focused.isConnected) return null
      const rect = this.focused.getBoundingClientRect()
      return {
        left: rect.left - RING_PADDING + 'px',
        top: rect.top - RING_PADDING + 'px',
        width: rect.width + 2 * RING_PADDING + 'px',
        height: rect.height + 2 * RING_PADDING + 'px'
      }
    },
    /** Commands that act on the star map only make sense while it's on screen. */
    onStarMap() {
      return this.mapDataLoaded && this.$route?.path === '/play'
    }
  },
  mounted() {
    this.controller = createGamepadController({
      onCommand: this.run,
      onChange: (state) => {
        this.active = state.active
        this.focused = state.focused
        this.cursor = state.cursor
      }
    })
    // Poll only while a controller is connected: browsers announce one (gamepadconnected) once its
    // first button is pressed, so players without one pay nothing per frame.
    this.stopFrames = null
    this.onConnect = () => {
      this.stopFrames ??= onFrame((now) => {
        this.controller.poll(now)
        if (this.active) this.frameCount++
      }, FRAME_ORDER.render)
    }
    this.onDisconnect = () => {
      if ([...(navigator.getGamepads?.() ?? [])].some(Boolean)) return
      this.stopFrames?.()
      this.stopFrames = null
    }
    window.addEventListener('gamepadconnected', this.onConnect)
    window.addEventListener('gamepaddisconnected', this.onDisconnect)
    if ([...(navigator.getGamepads?.() ?? [])].some(Boolean)) this.onConnect()
    this.onMouseMove = () => this.controller.deactivate()
    window.addEventListener('mousemove', this.onMouseMove)
  },
  unmounted() {
    this.stopFrames?.()
    window.removeEventListener('gamepadconnected', this.onConnect)
    window.removeEventListener('gamepaddisconnected', this.onDisconnect)
    window.removeEventListener('mousemove', this.onMouseMove)
  },
  methods: {
    ...mapActions(useUIStore, [
      'selectSprite',
      'selectNone',
      'openMenu',
      'closeMenu',
      'zoomOutToNeighbors',
      'toggleScope',
      'viewTo',
      'scaleBy',
      'enterNeighborView',
      'exitNeighborView',
      'back',
      'stepPlanet'
    ]),
    run(command, detail) {
      if (command === 'back') return this.back()
      if (!this.onStarMap) return
      switch (command) {
        case 'planets':
          return this.openMenu('planets')
        case 'settings':
          return this.openMenu('settings')
        case 'jump':
          return this.zoomOutToNeighbors()
        case 'previousPlanet':
          return this.stepPlanet({ planets: this.spriteIds.planets, step: -1 })
        case 'nextPlanet':
          return this.stepPlanet({ planets: this.spriteIds.planets, step: 1 })
        case 'myShip':
          return this.selectSprite(this.myShipId)
        case 'scope':
          return this.toggleScope()
        case 'zoomOutPressed':
          // Already as far out as the camera goes: leave the system for its neighbors.
          if (!this.neighborView && this.viewport.scale >= useUIStore().neighborSwitchScale * 0.97) this.enterNeighborView()
          return
        case 'zoomInPressed':
          if (this.neighborView) useUIStore().zoomInToStar()
          return
        case 'pan':
          return this.pan(detail)
        case 'zoom':
          return this.zoom(detail)
      }
    },
    /** Left stick: look around, like dragging the map (which also lets go of the selection). */
    pan({ x, y, seconds }) {
      if (this.neighborView || this.isMenuOn) return
      if (this.selected != null) this.selectNone()
      const distance = (PAN_SPEED * seconds) / this.livePixelsPerUnit
      this.viewTo({ x: this.viewport.x - x * distance, y: this.viewport.y - y * distance })
    },
    /** Triggers: R2 zooms in, L2 zooms out, faster the harder they're pressed. */
    zoom({ in: zoomIn, out: zoomOut, seconds }) {
      if (this.neighborView) return
      this.scaleBy(Math.exp((zoomOut - zoomIn) * ZOOM_RATE * seconds))
    }
  }
}
</script>

<style scoped>
.gamepad-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
}
.focus-ring {
  position: fixed;
  border: 2px solid #ffffff;
  border-radius: 10px;
  box-shadow:
    0 0 0 3px #5c1aae88,
    0 0 12px #e5cfff88;
}
.cursor {
  position: fixed;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: #e5cfff44;
}
</style>
