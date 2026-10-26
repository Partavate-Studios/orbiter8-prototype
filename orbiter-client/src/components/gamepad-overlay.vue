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
import { CAMERA } from '@/constants'
import { onFrame, FRAME_ORDER } from '@/libs/frame-loop'
import { createGamepadController } from '@/libs/gamepad/controller'
import { useUIStore } from '@/stores/ui'
import { useStarMapStore } from '@/stores/starmap'

// Left-stick panning at full tilt, in screen pixels per second.
const PAN_SPEED = 900
// Trigger zoom at full pressure: the scale changes by e^ZOOM_RATE per second (about 7x).
const ZOOM_RATE = 2
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
    ...mapState(useUIStore, ['selected', 'viewport', 'neighborView', 'menuState', 'isMenuOn', 'livePixelsPerUnit']),
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
    this.stopFrames = onFrame((now) => {
      this.controller.poll(now)
      if (this.active) this.frameCount++
    }, FRAME_ORDER.render)
    this.onMouseMove = () => this.controller.deactivate()
    window.addEventListener('mousemove', this.onMouseMove)
  },
  unmounted() {
    this.stopFrames()
    window.removeEventListener('mousemove', this.onMouseMove)
  },
  methods: {
    ...mapActions(useUIStore, [
      'selectSprite',
      'selectNone',
      'openMenu',
      'closeMenu',
      'jumpMenuOn',
      'jumpMenuOff',
      'toggleShowLabels',
      'toggleScope',
      'viewTo',
      'scaleBy',
      'enterNeighborView',
      'exitNeighborView'
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
          return this.menuState.jumpMenu ? this.jumpMenuOff() : this.jumpMenuOn()
        case 'previousPlanet':
          return this.stepPlanet(-1)
        case 'nextPlanet':
          return this.stepPlanet(1)
        case 'myShip':
          return this.selectSprite(this.myShipId)
        case 'labels':
          return this.toggleShowLabels()
        case 'scope':
          return this.toggleScope()
        case 'zoomOutPressed':
          // Already as far out as the camera goes: leave the system for its neighbors.
          if (!this.neighborView && this.viewport.scale >= CAMERA.NEIGHBOR_VIEW_FROM_SCALE) this.enterNeighborView()
          return
        case 'zoomInPressed':
          if (this.neighborView) this.exitNeighborView()
          return
        case 'pan':
          return this.pan(detail)
        case 'zoom':
          return this.zoom(detail)
      }
    },
    /** B: undo the most recent thing — close a view or menu, then let go of the selection. */
    back() {
      if (this.neighborView) return this.exitNeighborView()
      if (this.menuState.jumpMenu) return this.jumpMenuOff()
      if (this.isMenuOn || this.menuState.chatMenu || this.menuState.leaderboardMenu) return this.closeMenu()
      if (this.selected != null) return this.selectNone()
    },
    stepPlanet(step) {
      const planets = this.spriteIds.planets
      if (planets.length === 0) return
      const index = planets.indexOf(this.selected)
      const next = index === -1 ? (step > 0 ? 0 : planets.length - 1) : (index + step + planets.length) % planets.length
      this.selectSprite(planets[next])
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
