<template>
  <!--
    The intro: a new pilot's last night on Earth, and the way into the game. The power is off until you
    scan your ID card and file your name (the first transaction); then the room is yours. The housing
    computer subscribes you to a corporation, its job board has one opening you qualify for, naming your
    ship accepts it (the second transaction), an escort comes for you, and you wake in orbit.

    One isometric world through one camera (Koda, 2026-11-20; docs/mockups/intro-zoom/): the city,
    Block 7's tower, and unit 7-2216 cut open in it, you in it with a yellow outline. There are no menus in
    the world: you click the thing itself (the TV, the terminal, the vape, the glass, the window, the
    door, the ID scanner), and using it is the camera zooming in, never a change of scene. Scroll, pinch,
    the + and − keys or the gamepad's triggers pull back as far as the whole block. Menus live only in
    Minerva's console. Through the glass the view fills the screen: the balcony.

    How it stays fast (libs/intro-world.js): the city and the tower's outside never change, so they're
    drawn once into three bitmaps (far, middle, near) that the camera slides and scales; only the room is
    live SVG. The camera is one CSS transform of the plane all of it sits in.
  -->
  <div
    class="intro-screen"
    :class="{ instant, reduced, moving }"
    @pointerdown.capture="skipTransition"
    @keydown.capture="skipTransition"
    @wheel.prevent="onWheel"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <!-- the world, through the camera -->
    <div
      class="world"
      :class="['ease-' + ease, { ready: farReady }]"
      :style="cameraStyle"
      :aria-hidden="Boolean(vista) || overlayOpen"
      @click="worldClick"
      @transitionend.self="moving = false"
    >
      <!-- the city and the tower's outside: bitmaps, far to near -->
      <div ref="tiers" class="tiers"></div>
      <!-- the unit's light, seen from far away -->
      <div class="unit-glow" :class="{ on: lightsOn }" :style="unitGlowStyle"></div>

      <!-- the room, live -->
      <!-- eslint-disable vue/no-v-html -- the game's own SVG art (libs/intro-world.js), not user content -->
      <svg
        class="room"
        :class="{ lit: lightsOn }"
        :viewBox="ROOM_REGION.join(' ')"
        :style="regionStyle(ROOM_REGION)"
        aria-hidden="true"
        v-html="roomSvg"
      ></svg>
      <!-- eslint-enable vue/no-v-html -->
      <!-- the TV's picture -->
      <!-- eslint-disable-next-line vue/no-v-html -- the game's own SVG art (libs/intro-art.js), not user content -->
      <div class="tv-screen" :class="{ on: tvOn }" :style="tvStyle" v-html="tvSvg"></div>
      <!-- Minerva on the housing computer and on the ID scanner -->
      <div class="screen-face" :style="planeStyle(TERMINAL_SCREEN)">
        <minerva-face v-if="terminalOn" :state="terminalState" :size="44" assemble-on-mount />
      </div>
      <div class="screen-face" :style="planeStyle(SCANNER_SCREEN)">
        <minerva-face ref="padFace" :state="scannerState" :size="22" />
      </div>
      <!-- the dark: everything in the unit but the scanner, until the power comes on -->
      <svg
        class="blackout"
        :class="{ off: lightsOn }"
        :viewBox="ROOM_REGION.join(' ')"
        :style="regionStyle(ROOM_REGION)"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="intro-dark" gradientUnits="userSpaceOnUse" :cx="scannerAt[0]" :cy="scannerAt[1]" r="260">
            <stop offset="0" stop-color="#000" stop-opacity="0" />
            <stop offset="0.25" stop-color="#000" stop-opacity="0.55" />
            <stop offset="1" stop-color="#000" stop-opacity="0.94" />
          </radialGradient>
          <radialGradient id="intro-scanglow">
            <stop offset="0" stop-color="#e6dcf5" stop-opacity="0.45" />
            <stop offset="1" stop-color="#e6dcf5" stop-opacity="0" />
          </radialGradient>
        </defs>
        <polygon :points="UNIT_OUTLINE.map((p) => p.join(',')).join(' ')" fill="url(#intro-dark)" />
        <circle :cx="scannerAt[0]" :cy="scannerAt[1]" r="90" fill="url(#intro-scanglow)" />
      </svg>

      <!-- you: a silhouette with a yellow outline (yellow is you); ringed when the camera is far out -->
      <div class="you" :class="{ gone: Boolean(vista) }" :style="youStyle">
        <svg :viewBox="'-60 -130 120 150'" width="120" height="150" overflow="visible" aria-hidden="true">
          <circle
            class="you-ring"
            :class="{ on: camera.k < 12 }"
            cx="0"
            cy="-45"
            :r="ringR"
            :stroke-width="ringR / 20"
          />
          <ellipse rx="22" ry="7" fill="#000" opacity="0.5" />
          <template v-if="sitting">
            <path
              class="you-body"
              d="M-12 -4 L-9 -40 Q0 -48 9 -40 L11 -12 L26 -22 L34 -18 L42 2 L33 5 L27 -8 L12 2 Z"
            />
            <circle class="you-body" cy="-56" r="9" />
            <!-- the near arm, over the body: the hand rests on your knee, and comes up to your mouth for a hit -->
            <g class="arm" :class="{ up: hitting }" transform="translate(5 -38)">
              <g class="upper">
                <line class="limb-edge" x2="15.8" />
                <line class="limb" x2="15.8" />
                <g class="fore">
                  <line class="limb-edge" x2="13" />
                  <line class="limb" x2="13" />
                  <rect x="11" y="-1.2" width="8" height="2.4" rx="1.2" class="vape-pen" />
                  <circle cx="11.6" r="0.9" class="vape-led" />
                  <circle cx="13" r="2.4" class="you-body" />
                </g>
              </g>
            </g>
          </template>
          <template v-else>
            <path
              class="you-body"
              d="M-9 0 l2 -34 q-6 -2 -6 -16 l2 -14 q2 -8 11 -8 q9 0 11 8 l2 14 q0 14 -6 16 l2 34 l-6 0 l-3 -26 l-3 26z"
            />
            <circle class="you-body" cy="-80" r="8" />
          </template>
        </svg>
        <span v-if="puffs" :key="puffs" class="vapor" aria-hidden="true"><i></i><i></i><i></i></span>
      </div>

      <!-- what you can use: the focused one's outline, and real buttons so mouse, touch, keys and the gamepad all reach them -->
      <svg class="outlines" :viewBox="ROOM_REGION.join(' ')" :style="regionStyle(ROOM_REGION)" aria-hidden="true">
        <polygon
          v-if="outlineKey"
          :points="OUTLINES[outlineKey].map((p) => p.join(',')).join(' ')"
          class="outline"
          :class="{ hinted: hintRings && !focusKey }"
        />
      </svg>
      <button
        v-for="spot in spots"
        :key="spot.key"
        type="button"
        class="hotspot"
        :class="{ locked: isLocked(spot.key) }"
        :style="spot.style"
        :aria-label="spot.label + (isLocked(spot.key) ? ' (locked)' : '')"
        :tabindex="spotsReachable ? 0 : -1"
        @click.stop="use(spot.key)"
        @focus="focusKey = spot.key"
        @mouseenter="hoverKey = focusKey = spot.key"
        @mouseleave="leaveSpot(spot.key)"
      >
        <span class="spot-name">{{ spot.label }}</span>
      </button>
    </div>

    <!-- the focused thing's name, at its top, the size of the screen's words -->
    <span v-if="nameTag" class="name-tag" :style="nameTag.style">{{ nameTag.text }}</span>

    <!-- through the glass, or the window: the view fills the screen -->
    <transition name="intro-fade">
      <intro-balcony
        v-if="vista"
        :mode="vista"
        :vista-url="vistaUrl"
        :health="health"
        :hits="hits"
        @hit="takeHit"
        @terminal="openConsole()"
        @inside="back"
      />
    </transition>

    <!-- the status line -->
    <header class="status">
      <span class="status-text">{{ statusText }}</span>
      <span class="status-buttons">
        <button type="button" class="o8-button quiet small" @click="toTitle">Title</button>
        <button v-if="canSkip" type="button" class="o8-button quiet small" @click="skipIntro">Skip intro</button>
      </span>
    </header>

    <!-- what to do here, in a line (words, not buttons) -->
    <p v-if="hint" class="hint-line" aria-live="polite">{{ hint }}</p>

    <!-- the overlays -->
    <transition name="intro-pop">
      <intro-scanner
        v-if="phase === 'name' || phase === 'filing'"
        :phase="phase"
        :registration="callsignRegistration"
        @submit="fileName"
        @retry="retryName"
        @close="closeScanner"
      />
    </transition>
    <transition name="intro-slide-up">
      <section
        v-if="view === 'door' && !overlay"
        class="door-card"
        role="dialog"
        aria-labelledby="door-heading"
        :style="{ '--corp': corp ? corp.color : '#9088aa' }"
        @click.stop
      >
        <h2 id="door-heading" :style="{ fontFamily: corp?.font }">
          {{ corp ? corp.name + ' · Curfew' : 'Minerva · Public notice' }}
        </h2>
        <p :style="{ fontFamily: corp?.font }">{{ corp ? corp.curfew : curfewNotice }}</p>
        <button ref="doorClose" type="button" class="o8-pill small close" aria-label="Step back" @click="back">
          ✕
        </button>
      </section>
    </transition>
    <transition name="intro-grow">
      <intro-console
        v-if="overlay === 'console'"
        :style="consoleOrigin"
        :tab="consoleTab"
        :job-step="jobStep"
        :corp="corp"
        :corp-names="corporationNames"
        :subscription="subscription"
        :health="health"
        :hits="hits"
        :registration="shipRegistration"
        :pilot-name="pilotName"
        @tab="consoleTab = $event"
        @job-step="jobStep = $event"
        @subscribe="subscribe"
        @submit-ship="nameShip"
        @retry="retryShip"
        @close="closeConsole"
      />
    </transition>
    <transition name="intro-slide">
      <intro-notice v-if="notice" :key="notice.key" v-bind="notice" @close="notice = null" />
    </transition>

    <!-- processing, left unsaid: white, then the ship -->
    <!-- body storage: out of the white, the pod freezing; then black, and waking -->
    <intro-freeze v-if="phase === 'freeze'" :pilot-name="pilotName" @done="frozen" />
    <div class="whiteout" :class="{ on: whiteout }"></div>
    <div class="blackout-fade" :class="{ on: blackFade }"></div>
    <intro-wake v-if="phase === 'wake'" :ship-name="shipName" :corp="corp" :debt="-BALANCE" @done="enterGame" />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { useOnboardingStore } from '@/stores/onboarding'
import MinervaFace from '@/components/minerva/minerva-face.vue'
import {
  BALANCE,
  CURFEW_WHY,
  HEALTH,
  SAY,
  TICKER,
  VAPE_HITS_BEFORE,
  corporation,
  introStart,
  loadSubscription,
  saveSubscription
} from '@/libs/intro'
import { adArt, artDefs } from '@/libs/intro-art'
import {
  K0,
  OUTLINES,
  ROOM_BOX,
  ROOM_REGION,
  SPOTS,
  STANDS,
  T,
  UNIT_OUTLINE,
  VIEW_AT,
  bounds,
  cityLayers,
  cssOnY,
  outsideSvg,
  roomSvg,
  tvPicture,
  ws
} from '@/libs/intro-world'
import { vistaSvg } from '@/libs/intro-vista'
import { svgToCanvas, svgToImageUrl } from '@/libs/raster'
import IntroScanner from './intro-scanner.vue'
import IntroConsole from './intro-console.vue'
import IntroBalcony from './intro-balcony.vue'
import IntroNotice from './intro-notice.vue'
import IntroWake from './intro-wake.vue'
import IntroFreeze from './intro-freeze.vue'

const NOTICE_MS = 7000
const RING_HINT_MS = 7000
const AD_MS = 8000
const LABELS = {
  glass: 'Balcony',
  window: 'Window',
  tv: 'TV',
  terminal: 'Terminal',
  scanner: 'ID scanner',
  door: 'Door',
  vape: 'Vape'
}
/** Screens where HTML sits on the room's walls: [x0, y, zTop, w, h] in world units. */
const TV_SCREEN = [2.9, 16.98, T.zu + 2.48, 2, 1.28]
const TERMINAL_SCREEN = [6.17, 16.88, T.zu + 2.52, 1.36, 0.84]
const SCANNER_SCREEN = [8.17, 16.4, T.zu + 5.6 - 2.28, 0.41, 0.38]
/** How long the pad by the door scans when it's clicked (ms): one sweep of Minerva's scan line and a bit. */
const PAD_SCAN_MS = 2800
/** Views the camera zooms into from the room, and how much of the screen the thing fills. */
const ZOOMS = { tv: 0.84, terminal: 0.5, door: 0.62, scanner: 0.22, glass: 1.4, window: 1.5 }
const VAPE_BOX = bounds([ws(0.4, 17, T.zu), ws(2.9, 17, T.zu + 2.6), ws(2.9, 20.8, T.zu), ws(0.4, 20.8, T.zu + 2.6)])
const DARK_BOX = bounds([
  ws(5.2, 16.4, T.zu),
  ws(5.2, 16.4, T.zu + 5.6),
  ws(10.4, 16.4, T.zu + 5.6),
  ws(10.4, 21, T.zu)
])

export default {
  name: 'IntroScreen',
  components: { MinervaFace, IntroScanner, IntroConsole, IntroBalcony, IntroNotice, IntroWake, IntroFreeze },
  data() {
    return {
      padScan: false,
      BALANCE,
      ROOM_REGION,
      OUTLINES,
      UNIT_OUTLINE,
      TERMINAL_SCREEN,
      SCANNER_SCREEN,
      scannerAt: ws(SCANNER_SCREEN[0] + 0.2, 16.4, SCANNER_SCREEN[2] - 0.2),
      phase: 'dark',
      /** Where the camera is: block, dark, room, or a thing zoomed into (tv, terminal, door, scanner, vape, glass, window). */
      view: 'block',
      /** In the room, how far you've pulled back: 0 the room, 1 the whole block. */
      pull: 0,
      ease: 'move',
      moving: false,
      vista: null,
      overlay: null,
      consoleTab: 'Account',
      jobStep: 'board',
      focusKey: null,
      hoverKey: null,
      lightsOn: false,
      tvOn: false,
      terminalOn: false,
      hintRings: false,
      channel: 0,
      subscription: null,
      health: HEALTH,
      hits: VAPE_HITS_BEFORE,
      sitting: false,
      vapeInHand: false,
      puffs: 0,
      notice: null,
      noticeCount: 0,
      whiteout: false,
      blackFade: false,
      escortHere: false,
      shipName: '',
      vw: window.innerWidth,
      vh: window.innerHeight,
      instant: false,
      reduced: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
      farReady: false,
      vistaUrl: ''
    }
  },
  computed: {
    ...mapState(useChainStore, ['chainId', 'account']),
    ...mapState(useGameStateStore, ['haveAvatar', 'haveShip', 'gameDataLoaded', 'avatar']),
    ...mapState(useOnboardingStore, ['registration', 'callsigns', 'corporationNames']),
    portrait() {
      return this.vw / this.vh < 0.9
    },
    corp() {
      return this.subscription ? corporation(this.subscription, this.corporationNames) : null
    },
    pilotName() {
      return this.avatar?.name || this.callsignRegistration?.name || ''
    },
    callsignRegistration() {
      return this.registration?.kind === 'callsign' ? this.registration : null
    },
    shipRegistration() {
      return this.registration?.kind === 'ship' ? this.registration : null
    },
    overlayOpen() {
      return Boolean(this.overlay) || this.phase === 'name' || this.phase === 'filing'
    },
    /** The things you can use now; in the dark, only the scanner. */
    spotKeys() {
      if (this.phase === 'dark' || this.phase === 'name' || this.phase === 'filing') return ['scanner']
      if (this.phase !== 'lit') return []
      // on the bed you can still reach the TV: watching it from there, you stay sitting
      if (this.view === 'vape') return ['vape', 'tv']
      if (this.view === 'tv') return ['tv']
      return ['glass', 'window', 'tv', 'terminal', 'scanner', 'door', 'vape']
    },
    spotsReachable() {
      return !this.overlayOpen && !this.vista && this.view !== 'door'
    },
    /** Hotspots: each thing's outline's box, at least a thumb wide on screen. */
    spots() {
      const min = (44 * K0) / this.camera.k
      return this.spotKeys.map((key) => {
        const b = key === 'vape' && this.view === 'vape' ? VAPE_BOX : bounds(OUTLINES[key])
        const w = Math.max(b.w, min)
        const h = Math.max(b.h, min)
        return {
          key,
          label: LABELS[key],
          style: {
            left: `${b.x + b.w / 2 - w / 2}px`,
            top: `${b.y + b.h / 2 - h / 2}px`,
            width: `${w}px`,
            height: `${h}px`
          }
        }
      })
    },
    outlineKey() {
      if (this.view !== 'room' && this.view !== 'dark') return null
      if (this.overlayOpen || this.vista || this.moving) return null
      return this.focusKey && this.spotKeys.includes(this.focusKey) ? this.focusKey : null
    },
    nameTag() {
      const key = this.outlineKey
      if (!key || this.pull > 0.25) return null
      const b = bounds(OUTLINES[key])
      const [x, y] = this.toScreen(b.x + b.w / 2, b.y)
      return {
        text: LABELS[key] + (this.isLocked(key) ? ' · locked' : ''),
        style: { left: `${x}px`, top: `${Math.max(56, y - 12)}px` }
      }
    },
    scannerState() {
      if (this.padScan) return 'scanning'
      if (this.phase === 'name') return 'listening'
      if (this.phase === 'filing') return this.callsignRegistration?.status === 'confirm' ? 'waiting' : 'thinking'
      return 'idle'
    },
    terminalState() {
      return this.subscription ? 'idle' : 'talking'
    },
    tvSvg() {
      if (!this.lightsOn) return ''
      const look = corporation(this.channel + 1, this.corporationNames)
      return tvPicture(artDefs('tv-') + adArt('tv-', look.key, look))
    },
    roomSvg() {
      return roomSvg({ vapeInHand: this.vapeInHand, escort: this.escortHere })
    },

    // ---- the camera
    /** Fits a box (WS px) in the screen below the status line: its scale (k, px per world unit) and center. */
    fitter() {
      const top = 48
      const bottom = this.hint ? 40 : 12
      return (box, fill = 0.9) => {
        const k = K0 * Math.min((this.vw * fill) / box.w, ((this.vh - top - bottom) * fill) / box.h)
        const cx = box.x + box.w / 2
        const cy = box.y + box.h / 2 - ((top - bottom) / 2) * (K0 / k)
        return { k, cx, cy }
      }
    },
    blockCamera() {
      // far enough out to see the block, never past the far bitmap's edges
      const far = cityLayers(this.small)[0]
      const k = Math.max(this.portrait ? 2.6 : 3.3, (far.k * this.vw) / far.pxW, (far.k * this.vh) / far.pxH)
      const [cx, cy] = ws(...VIEW_AT.block)
      return { k, cx, cy }
    },
    roomCamera() {
      return this.fitter(ROOM_BOX, this.portrait ? 0.98 : 0.88)
    },
    camera() {
      const v = this.view
      if (v === 'block') return this.blockCamera
      if (v === 'dark') return this.fitter(DARK_BOX, this.portrait ? 0.95 : 0.7)
      if (v === 'vape') return this.fitter(VAPE_BOX, 0.7)
      if (ZOOMS[v]) return this.fitter(bounds(OUTLINES[v]), ZOOMS[v])
      // the room, pulled back toward the block by scrolling or pinching: scale in steps of its log
      const a = this.roomCamera
      const b = this.blockCamera
      const t = this.pull
      if (t <= 0) return a
      const k = Math.exp(Math.log(a.k) * (1 - t) + Math.log(b.k) * t)
      // the center moves so that you stay in view
      const u = (Math.log(a.k) - Math.log(k)) / (Math.log(a.k) - Math.log(b.k))
      return { k, cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u }
    },
    cameraStyle() {
      const { k, cx, cy } = this.camera
      const s = k / K0
      return { transform: `translate(${this.vw / 2 - cx * s}px, ${this.vh / 2 - cy * s}px) scale(${s})` }
    },
    small() {
      return Math.min(this.vw, this.vh) < 600
    },
    ringR() {
      return (40 * K0) / this.camera.k
    },
    youStyle() {
      const key = this.sitting ? 'vape' : this.view === 'block' ? (this.phase === 'dark' ? 'dark' : 'room') : this.view
      const [x, y] = STANDS[key] ?? STANDS.room
      const [sx, sy] = ws(x, y, T.zu + (this.sitting ? 0.45 : 0))
      return { transform: `translate(${sx}px, ${sy}px)` }
    },
    unitGlowStyle() {
      const [x, y] = ws(5, 20, T.zu + 2.5)
      const r = 22 * K0
      return {
        left: `${x - r}px`,
        top: `${y - r}px`,
        width: `${2 * r}px`,
        height: `${2 * r}px`,
        opacity: this.lightsOn && this.camera.k < 14 ? 1 : 0
      }
    },
    tvStyle() {
      return this.planeStyle(TV_SCREEN)
    },
    /** The console grows out of the terminal it was opened from. */
    consoleOrigin() {
      if (this.vista) return { '--grow-x': '78%', '--grow-y': '72%' }
      const [x, y] = this.toScreen(...ws(SPOTS.terminal[0], SPOTS.terminal[1], SPOTS.terminal[2]))
      return { '--grow-x': `${(x / this.vw) * 100}%`, '--grow-y': `${(y / this.vh) * 100}%` }
    },
    statusText() {
      if (!this.lightsOn) return this.portrait ? '23:41 · No power' : '23:41 · Unit 7-2216 · No power'
      return this.portrait ? '23:41 · Curfew' : `23:41 · Curfew: ${CURFEW_WHY} · Block 7 · Unit 7-2216`
    },
    curfewNotice() {
      return TICKER.replace('MINERVA PUBLIC NOTICE · ', '').replaceAll(' · ', '. ') + '.'
    },
    hint() {
      if (this.vista || this.overlayOpen || this.phase === 'wake' || this.phase === 'freeze' || this.whiteout) return ''
      const touch = this.portrait
      const back = touch ? 'tap anywhere else to step back' : 'Esc, B or a click elsewhere steps back'
      if (this.phase === 'dark')
        return this.view === 'block'
          ? ''
          : touch
            ? 'Tap the ID scanner by the door'
            : 'Click the ID scanner by the door'
      if (this.view === 'tv') return `${touch ? 'Tap' : 'Click'} the TV to change channel · ${back}`
      if (this.view === 'vape') return `${touch ? 'Tap' : 'Click'} the vape for another hit, or the TV · ${back}`
      if (this.view === 'door') return back[0].toUpperCase() + back.slice(1)
      if (this.view === 'room' && this.phase === 'lit')
        return touch
          ? 'Tap a thing to use it · pinch to pull back'
          : 'Click a thing to use it · scroll or + − to pull back, as far as the block'
      return ''
    },
    /** Skipping jumps to the next thing that needs you; nothing skips a move on its way. */
    canSkip() {
      if (['filing', 'freeze', 'wake'].includes(this.phase) || this.whiteout) return false
      return !(this.overlay === 'console' && this.jobStep === 'escort')
    }
  },
  watch: {
    'registration.status'(status) {
      const reg = this.registration
      if (!reg) return
      if (reg.kind === 'callsign' && status === 'done') this.powerOn()
      if (reg.kind === 'ship' && status === 'done') this.escortArrives()
    },
    /** On the balcony the radio is behind the glass: quieter. */
    vista(view) {
      this.o8audio?.muffleRadio(view === 'balcony')
    },
    camera(next, prev) {
      if (!prev || (next.k === prev.k && next.cx === prev.cx && next.cy === prev.cy)) return
      this.moving = !this.instant
      // (if the transition never ends, as when it's skipped, the room is still drawn sharp soon)
      clearTimeout(this.movingTimer)
      this.movingTimer = setTimeout(() => (this.moving = false), 3000)
    }
  },
  created() {
    // Only a connected pilot without a ship belongs here (the route checks too).
    if (!this.gameDataLoaded || this.haveShip) {
      this.$router.replace(this.haveShip ? '/play' : '/')
      return
    }
    this.subscription = loadSubscription(this.chainId, this.account)
    const pending = this.registration?.status === 'sent' ? this.registration.kind : null
    const start = introStart({ haveAvatar: this.haveAvatar, haveShip: this.haveShip, pending })
    if (start === 'filing') {
      this.phase = 'filing'
      this.view = 'scanner'
    }
    if (start === 'lit' || start === 'escort') this.powerOn({ quietly: true })
    if (start === 'escort') {
      this.shipName = this.registration.name
      this.openConsole('Jobs', 'escort')
    }
    this.loadCallsigns()
    this.loadCorporations()
  },
  async mounted() {
    this.onResize = () => {
      this.vw = window.innerWidth
      this.vh = window.innerHeight
    }
    window.addEventListener('resize', this.onResize)
    // keys on the window, so Esc works wherever focus has gone (clicking the view drops it on the page)
    this.onKeyDown = (event) => this.onKey(event)
    window.addEventListener('keydown', this.onKeyDown)
    this.onIntroCommand = (event) => this.gamepad(event.detail)
    window.addEventListener('o8-intro', this.onIntroCommand)
    this.adTimer = setInterval(() => {
      if (this.view !== 'tv') this.channel = (this.channel + 1) % 3
    }, AD_MS)
    await this.drawWorld()
  },
  beforeUnmount() {
    clearTimeout(this.padScanTimer)
    this.gone = true
    this.o8audio?.speaking?.pause() // her intro lines end with the room
    this.o8audio?.stopRadio()
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('o8-intro', this.onIntroCommand)
    window.removeEventListener('keydown', this.onKeyDown)
    clearTimeout(this.noticeTimer)
    clearTimeout(this.ringTimer)
    clearTimeout(this.movingTimer)
    clearInterval(this.adTimer)
    this.timers?.forEach(clearTimeout)
    if (this.vistaUrl) URL.revokeObjectURL(this.vistaUrl)
  },
  methods: {
    ...mapActions(useOnboardingStore, ['register', 'clearRegistration', 'loadCallsigns', 'loadCorporations']),

    // ---- drawing the world once
    /** The city's bitmaps, far first (the opening shows it), then the view through the glass, then the nearer ones. */
    async drawWorld() {
      const layers = cityLayers(this.small)
      const add = async (layer) => {
        const canvas = await svgToCanvas(outsideSvg(layer.region, layer.pxW, layer.pxH), layer.pxW, layer.pxH)
        if (this.gone) return
        Object.assign(canvas.style, this.regionStyle(layer.region))
        this.$refs.tiers?.appendChild(canvas)
      }
      try {
        await add(layers[0])
        this.farReady = true
        if (this.phase === 'dark' && this.view === 'block') this.later(this.reduced ? 0 : 1200, () => this.fallIn())
        this.vistaUrl = await svgToImageUrl(vistaSvg(), 1440, 900)
        await add(layers[1])
        await add(layers[2])
      } catch (error) {
        // Without the bitmaps the room still works, over the dark: say so in the console, carry on.
        console.warn('The intro’s city could not be drawn:', error)
        this.farReady = true
        if (this.phase === 'dark' && this.view === 'block') this.fallIn()
      }
    },
    /** The opening: from the whole block, the camera falls into your dark unit; then Minerva speaks. */
    fallIn() {
      if (this.phase !== 'dark' || this.view !== 'block') return
      this.ease = 'fall'
      this.view = 'dark'
      this.later(this.reduced ? 200 : 2600, () => {
        this.ease = 'move'
        if (this.phase !== 'dark') return
        this.say('Minerva', SAY.opening, { hold: true })
        this.o8audio?.speak('introWelcome')
      })
    },

    // ---- placing things in the plane
    regionStyle([x, y, w, h]) {
      return { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` }
    },
    /** An HTML screen on the plane y = const: [x0, y, zTop, w, h] in world units. */
    planeStyle([x0, y1, zTop, w, h]) {
      return { width: `${w * K0}px`, height: `${h * K0}px`, transform: cssOnY(x0, y1, zTop) }
    },
    /** A point of the plane (WS px) on the screen, through the camera. */
    toScreen(x, y) {
      const { k, cx, cy } = this.camera
      const s = k / K0
      return [this.vw / 2 + (x - cx) * s, this.vh / 2 + (y - cy) * s]
    },
    later(ms, run) {
      this.timers = this.timers ?? []
      this.timers.push(setTimeout(run, this.reduced ? Math.min(ms, 150) : ms))
    },
    click() {
      this.o8audio?.playEffect('click')
    },
    spotFocused() {
      return document.activeElement?.classList?.contains('hotspot')
    },
    /** Any press while something animates skips it to its end (and lets the browser start the radio). */
    skipTransition() {
      this.o8audio?.unlock()
      if (!this.animating) return
      this.instant = true
      requestAnimationFrame(() => requestAnimationFrame(() => (this.instant = false)))
    },

    // ---- using things
    use(key) {
      this.click()
      this.focusKey = key
      if (key === 'scanner') this.scanPad()
      if (this.phase === 'dark') {
        if (key === 'scanner') {
          this.notice = null
          this.phase = 'name'
          this.view = 'scanner'
        }
        return
      }
      if (this.phase !== 'lit') return
      if (this.view === 'tv' && key === 'tv') return (this.channel = (this.channel + 1) % 3)
      if (this.view === 'vape' && key === 'vape') return this.hit()
      if (this.isLocked(key)) return this.say('No corporate sponsor', SAY.locked, { state: 'skeptical' })
      this.pull = 0
      this.notice = null
      if (key === 'scanner') {
        this.view = 'scanner'
        this.say('Name on file: ' + this.pilotName, 'Your card’s registered with me. There’s nothing else on it.')
      } else if (key === 'tv') this.view = 'tv'
      else if (key === 'door') {
        this.view = 'door'
        this.$nextTick(() => this.$refs.doorClose?.focus({ preventScroll: true }))
      } else if (key === 'terminal') this.openConsole()
      else if (key === 'vape') this.sitDown()
      else if (key === 'glass' || key === 'window') this.lookOut(key)
    },
    /** The pad by the door scans whenever it's clicked, whether or not that does anything (Koda): a sweep, then a
     *  flash as it reads the card. */
    scanPad() {
      clearTimeout(this.padScanTimer)
      this.padScan = true
      this.padScanTimer = setTimeout(() => {
        this.padScan = false
        this.$refs.padFace?.play('flash')
      }, PAD_SCAN_MS)
    },
    /** A click in the plane that isn't on a thing steps back out of a zoom. */
    worldClick(event) {
      if (event.target.closest('.hotspot')) return
      if (['tv', 'door', 'vape', 'scanner'].includes(this.view) && this.phase === 'lit') this.back()
    },
    /** Back out one step: the view, the console, a zoom. */
    back() {
      if (this.phase === 'name') return this.closeScanner()
      if (this.overlay === 'console') return this.closeConsole()
      if (this.vista) {
        this.click()
        this.vista = null
        this.view = 'room'
        return
      }
      if (this.view === 'tv' && this.sitting && this.phase === 'lit') {
        this.click()
        this.view = 'vape'
        return
      }
      if (this.view !== 'room' && this.phase === 'lit') {
        this.click()
        this.sitting = false
        this.vapeInHand = false
        this.view = 'room'
        this.$nextTick(
          () =>
            this.focusKey &&
            this.$el.querySelector(`.hotspot[aria-label^="${LABELS[this.focusKey]}"]`)?.focus({ preventScroll: true })
        )
      }
    },
    onKey(event) {
      if (event.target.closest?.('input, textarea')) return
      // (inside the console, its own Esc closes it and stops there)
      if (event.key === 'Escape') this.back()
      else if ((event.key === '-' || event.key === '_') && this.canPull()) this.pullBy(0.12)
      else if ((event.key === '+' || event.key === '=') && this.canPull()) this.pullBy(-0.12)
    },

    // ---- pulling back: scroll, pinch, keys, triggers
    canPull() {
      return this.view === 'room' && this.phase === 'lit' && !this.overlayOpen && !this.vista
    },
    pullBy(amount) {
      this.ease = 'pull'
      this.pull = Math.min(1, Math.max(0, this.pull + amount))
      clearTimeout(this.easeTimer)
      this.easeTimer = setTimeout(() => (this.ease = 'move'), 300)
    },
    /**
     * The wheel is the camera: out pulls back toward the block, in comes back to the room, and in again
     * while over a thing uses it, as a click would (Koda, 2026-11-20). Out of a zoomed thing steps back.
     */
    onWheel(event) {
      const now = performance.now()
      if (now < (this.wheelQuietUntil ?? 0)) return
      const zoomIn = event.deltaY < 0
      if (
        !zoomIn &&
        ['tv', 'door', 'vape', 'scanner', 'glass', 'window'].includes(this.view) &&
        this.phase === 'lit' &&
        !this.overlayOpen
      ) {
        // (out on the balcony or at the window, wheeling out takes you back inside)
        this.wheelQuietUntil = now + 600
        return this.back()
      }
      if (!this.canPull()) return
      // already all the way in, and the wheel has rested a moment since it got there: use the thing under it
      if (zoomIn && this.pull === 0 && this.hoverKey && now - (this.lastPullAt ?? 0) > 300) {
        this.wheelQuietUntil = now + 700
        return this.use(this.hoverKey)
      }
      const before = this.pull
      this.pullBy(Math.max(-0.2, Math.min(0.2, event.deltaY * 0.0012)))
      if (this.pull !== before) this.lastPullAt = now
    },
    leaveSpot(key) {
      if (this.hoverKey === key) this.hoverKey = null
      if (this.focusKey === key && !this.spotFocused()) this.focusKey = null
    },
    onPointerDown(event) {
      if (event.pointerType !== 'touch') return
      this.touches = this.touches ?? new Map()
      this.touches.set(event.pointerId, [event.clientX, event.clientY])
      this.pinchFrom = this.touches.size === 2 ? this.pinchDistance() : null
    },
    onPointerMove(event) {
      if (!this.touches?.has(event.pointerId)) return
      this.touches.set(event.pointerId, [event.clientX, event.clientY])
      if (this.touches.size === 2 && this.pinchFrom && this.canPull()) {
        const d = this.pinchDistance()
        this.pullBy(Math.log(this.pinchFrom / d) * 0.6)
        this.pinchFrom = d
      }
    },
    onPointerUp(event) {
      this.touches?.delete(event.pointerId)
      if ((this.touches?.size ?? 0) < 2) this.pinchFrom = null
    },
    pinchDistance() {
      const [a, b] = [...this.touches.values()]
      return Math.hypot(a[0] - b[0], a[1] - b[1]) || 1
    },
    /** The gamepad (gamepad-overlay.vue forwards its commands here): triggers pull back, B steps back. */
    gamepad({ command, ...detail }) {
      if (command === 'back') this.back()
      else if (command === 'zoom' && this.canPull())
        this.pullBy(((detail.out ?? 0) - (detail.in ?? 0)) * (detail.seconds ?? 0.016) * 1.4)
    },

    // ---- your name: the first transaction
    fileName(name) {
      this.phase = 'filing'
      this.register('callsign', name)
    },
    retryName() {
      this.clearRegistration()
      this.phase = 'name'
    },
    closeScanner() {
      this.phase = 'dark'
      this.view = 'dark'
    },
    /** The power comes on: the strip flickers, the room fades up, the TV and then the terminal start. */
    powerOn({ quietly = false } = {}) {
      this.phase = 'lit'
      this.view = 'room'
      this.lightsOn = true
      this.animating = !quietly
      if (quietly) {
        this.tvOn = true
        this.terminalOn = true
        // back in the apartment after a reload: Minerva welcomes you back
        this.o8audio?.speak('welcomeBack')
        this.o8audio?.startRadio()
        return
      }
      this.focusKey = 'terminal'
      // the radio can be tuned now (it starts off: Minerva's console, Music)
      this.o8audio?.startRadio()
      this.later(700, () => (this.tvOn = true))
      this.later(1000, () => (this.terminalOn = true))
      this.later(1400, () => {
        this.animating = false
        this.say('Name on file: ' + this.pilotName, SAY.lightsOn, { oneOff: 'nod', hold: true })
        this.o8audio?.speak('introSignedIn')
        this.hintRings = true
        this.ringTimer = setTimeout(() => (this.hintRings = false), RING_HINT_MS)
      })
      this.clearRegistration()
    },

    // ---- the console
    openConsole(tab, jobStep) {
      this.notice = null
      if (!this.vista) this.view = 'terminal'
      this.consoleTab = this.subscription ? (tab ?? this.consoleTab ?? 'Account') : 'boot'
      if (jobStep) this.jobStep = jobStep
      this.overlay = 'console'
    },
    closeConsole() {
      this.click()
      this.overlay = null
      if (!this.vista) this.view = 'room'
      this.$nextTick(() => this.$el.querySelector('.hotspot[aria-label="Terminal"]')?.focus({ preventScroll: true }))
    },
    /** The balcony and the door stay locked until the unit has a corporate sponsor (Koda, 2026-11-20). */
    isLocked(key) {
      return this.phase === 'lit' && !this.subscription && (key === 'glass' || key === 'door')
    },
    /** A notice from Minerva; `hold` keeps it up until it's dismissed or replaced. */
    say(title, body, { hold = false, ...more } = {}) {
      clearTimeout(this.noticeTimer)
      this.notice = { key: ++this.noticeCount, title, body, state: 'talking', ...more }
      if (!hold) this.noticeTimer = setTimeout(() => (this.notice = null), NOTICE_MS)
    },

    // ---- the vape: you sit on the mattress and take a hit; Minerva counts
    sitDown() {
      this.view = 'vape'
      this.later(650, () => {
        if (this.view !== 'vape') return
        this.sitting = true
        this.vapeInHand = true
        this.later(400, () => this.hit())
      })
    },
    hit() {
      if (this.hitting) return
      this.hitting = true
      this.later(2200, () => (this.hitting = false))
      this.puffs++
      this.takeHit()
    },
    takeHit() {
      this.hits++
      const before = this.health
      this.health = Math.max(1, this.health - 1)
      // Minerva notices once the vapor clears, unless a terminal is open by then
      this.later(1600, () => {
        if (this.overlay) return
        this.say(
          `Health score ${this.health}${this.health < before ? ' (−1)' : ''}`,
          SAY.vape(this.hits, this.health),
          {
            attention: true,
            state: 'skeptical'
          }
        )
      })
    },

    // ---- through the glass or the window: the camera pushes through and the view fills the screen
    lookOut(key) {
      this.view = key
      this.later(this.reduced ? 0 : 700, () => {
        if (this.view === key) this.vista = key === 'glass' ? 'balcony' : 'window'
      })
    },

    // ---- the corporation, the job, your ship: the second transaction
    subscribe(id) {
      this.subscription = id
      saveSubscription(this.chainId, this.account, id)
      useOnboardingStore().corporation = id
    },
    nameShip(name) {
      this.shipName = name
      useOnboardingStore().corporation = this.subscription
      this.jobStep = 'escort'
      this.register('ship', name)
    },
    retryShip() {
      this.clearRegistration()
      this.jobStep = 'ship'
    },
    /** The escort is at the door: its light turns, then white. Processing is left unsaid. */
    escortArrives() {
      this.escortHere = true
      this.animating = true
      this.later(1400, () => {
        this.overlay = null
        this.vista = null
        this.whiteout = true
        // the apartment's radio fades with the room; the ship's music takes over in the game
        this.o8audio?.stopRadio(1500)
      })
      // out of the white into body storage (intro-freeze.vue), which says when it's done
      this.later(2900, () => {
        this.phase = 'freeze'
        this.clearRegistration()
      })
      this.later(3300, () => (this.whiteout = false))
    },
    /** The pod is frozen: black, then waking in orbit. */
    frozen() {
      this.blackFade = true
      this.later(1300, () => {
        this.phase = 'wake'
        this.later(200, () => {
          this.blackFade = false
          this.animating = false
        })
      })
    },
    enterGame() {
      this.click()
      this.$router.push('/play')
    },

    // ---- leaving
    toTitle() {
      this.click()
      this.$router.push('/')
    },
    skipIntro() {
      this.click()
      if (this.phase === 'dark') {
        this.notice = null
        this.phase = 'name'
        this.view = 'scanner'
      } else if (this.phase === 'lit') {
        this.vista = null
        this.sitting = false
        this.vapeInHand = false
        this.pull = 0
        this.openConsole('Jobs', 'job')
      }
    }
  }
}
</script>

<style scoped>
.intro-screen {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #030306;
  color: #f1eefa;
  font-family: 'Ubuntu', system-ui, sans-serif;
  text-align: left;
  user-select: none;
  touch-action: none;
}

/* ---- the world, through the camera: one transform of one plane */
.world {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  transform-origin: 0 0;
  opacity: 0;
  transition:
    transform 0.9s cubic-bezier(0.5, 0, 0.2, 1),
    opacity 0.8s;
}
.world.ready {
  opacity: 1;
}
.world.ease-fall {
  transition:
    transform 2.6s cubic-bezier(0.6, 0, 0.15, 1),
    opacity 0.8s;
}
.world.ease-pull {
  transition:
    transform 0.25s ease-out,
    opacity 0.8s;
}
/* while the camera moves, the live layers are scaled as pictures; still, they're drawn sharp again */
.moving .world .room,
.moving .world .tv-screen,
.moving .world .screen-face {
  will-change: transform;
}
.world > * {
  position: absolute;
}
.tiers {
  left: 0;
  top: 0;
}
.tiers :deep(canvas) {
  position: absolute;
  display: block;
}
.unit-glow {
  border-radius: 50%;
  background: radial-gradient(closest-side, #e6dcf573, #e6dcf500);
  pointer-events: none;
  transition: opacity 0.9s;
}
.room,
.blackout,
.outlines {
  overflow: visible;
  pointer-events: none;
}
/* the lights: off until the name is filed; the strip flickers on */
.room :deep(.light-strip) {
  opacity: 0;
}
.room.lit :deep(.light-strip) {
  animation: strip-flicker 0.9s steps(1, end) forwards;
}
.room :deep(.room-glow) {
  opacity: 0;
  transition: opacity 0.9s 0.25s;
}
.room.lit :deep(.room-glow) {
  opacity: 1;
}
.room :deep(.lock-light) {
  fill: #b9a0ff;
  transition: fill 0.4s;
}
.room :deep(.lock-light.open) {
  fill: #ebff99;
}
@keyframes strip-flicker {
  0% {
    opacity: 0.8;
  }
  12% {
    opacity: 0;
  }
  24% {
    opacity: 0.9;
  }
  36% {
    opacity: 0.1;
  }
  52%,
  100% {
    opacity: 0.85;
  }
}
.blackout {
  transition: opacity 0.9s 0.25s;
}
.blackout.off {
  opacity: 0;
}
.tv-screen {
  left: 0;
  top: 0;
  transform-origin: 0 0;
  overflow: hidden;
  pointer-events: none;
}
.tv-screen :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  transform: scaleY(0.01);
  opacity: 0;
  transition:
    transform 0.3s ease-out,
    opacity 0.15s;
}
.tv-screen.on :deep(svg) {
  transform: none;
  opacity: 1;
}
.screen-face {
  left: 0;
  top: 0;
  transform-origin: 0 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  /* small, her face reaches past its box: the screen's edge cuts it off */
  overflow: hidden;
}

/* you */
.you {
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  pointer-events: none;
  transition:
    transform 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.4s;
}
.you.gone {
  opacity: 0;
}
.you svg {
  position: absolute;
  left: -72px;
  top: -156px;
  width: 144px;
  height: 180px;
}
.you-body {
  fill: #030306;
  stroke: #ccff00;
  stroke-width: 1.8;
  stroke-linejoin: round;
}
/* the arm: an outlined limb (a yellow line under a black one) in two parts that turn at the shoulder and the
   elbow, so the hand swings up to the mouth rather than jumping there */
.arm .limb-edge {
  stroke: #ccff00;
  stroke-width: 7.6;
  stroke-linecap: round;
}
.arm .limb {
  stroke: #030306;
  stroke-width: 4;
  stroke-linecap: round;
}
.arm .upper,
.arm .fore {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.arm .upper {
  transform: rotate(72deg);
}
.arm .fore {
  transform: translate(15.8px, 0) rotate(-86deg);
}
.arm.up .upper {
  transform: rotate(-11deg);
}
.arm.up .fore {
  transform: translate(15.8px, 0) rotate(-126deg);
}
.vape-pen {
  fill: #2a2440;
  stroke: #b9a0ff;
  stroke-width: 0.5;
}
.vape-led {
  fill: #e6dcf5;
  transition: fill 0.3s;
}
.arm.up .vape-led {
  fill: #ffffff;
  filter: drop-shadow(0 0 1.5px #ffffff);
}
.you-ring {
  fill: none;
  stroke: #ccff00;
  opacity: 0;
  transition: opacity 0.6s;
}
.you-ring.on {
  opacity: 0.85;
}
.vapor {
  position: absolute;
  left: 14px;
  top: -66px;
}
.vapor i {
  position: absolute;
  width: 46px;
  height: 34px;
  margin: -17px 0 0 -23px;
  border-radius: 50%;
  background: radial-gradient(closest-side, #d8d4e480, #d8d4e400);
  opacity: 0;
  animation: puff 2.4s ease-out 0.9s forwards;
}
/* (the exhale comes once the hand is down from the mouth's height: after the inhale) */
.vapor i:nth-child(2) {
  animation-delay: 1.15s;
}
.vapor i:nth-child(3) {
  animation-delay: 1.4s;
}
@keyframes puff {
  0% {
    opacity: 0.9;
    transform: translate(0, 0) scale(0.4);
  }
  100% {
    opacity: 0;
    transform: translate(-14px, -110px) scale(2.6);
  }
}

/* the things you can use */
.outline {
  fill: #b9a0ff10;
  stroke: #b9a0ff;
  stroke-width: 2.5;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.outline.hinted {
  stroke-dasharray: 8 6;
}
.hotspot {
  padding: 0;
  margin: 0;
  background: none;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.hotspot:focus-visible {
  outline: none;
}
/* its name, there for screen readers and the harness, not seen */
.spot-name {
  position: absolute;
  inset: 0;
  overflow: hidden;
  color: transparent;
  font-size: 1px;
}
.name-tag {
  position: absolute;
  transform: translate(-50%, -100%);
  white-space: nowrap;
  font:
    500 15px 'Ubuntu',
    system-ui,
    sans-serif;
  color: #1c0838;
  background: #c3b3da;
  border-radius: 999px;
  padding: 3px 13px;
  pointer-events: none;
  z-index: 3;
}

/* ---- the status line and the hint */
.status {
  position: absolute;
  inset: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1em;
  padding: 0.55em 1em 0.55em 1.5em;
  background: #030306cc;
  font:
    14px 'Ubuntu Mono',
    ui-monospace,
    monospace;
  color: #bdb5d4;
  z-index: 5;
}
.status-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-buttons {
  display: flex;
  gap: 0.5em;
  font-family: 'Ubuntu', system-ui, sans-serif;
}
.hint-line {
  position: absolute;
  inset: auto 0 0;
  margin: 0;
  padding: 0.6em 1em 0.75em;
  text-align: center;
  background: linear-gradient(#03030600, #030306cc);
  color: #bdb5d4;
  font-size: 14px;
  pointer-events: none;
  z-index: 4;
}

/* ---- the door's curfew, in your corporation's voice: it slides up from the bottom, the door above it */
.door-card {
  position: absolute;
  left: 50%;
  bottom: 3.2em;
  transform: translateX(-50%);
  width: min(34em, 100% - 2em);
  box-sizing: border-box;
  background: #0b0912f2;
  border: 1.5px solid #5a4c8c;
  border-top: 3px solid var(--corp);
  border-radius: 14px;
  padding: 1.2em 3em 1.3em 1.5em;
  display: grid;
  gap: 0.7em;
  z-index: 6;
}
.door-card h2 {
  margin: 0;
  font-size: 1.05em;
  font-weight: 600;
}
.door-card p {
  margin: 0;
  font-size: 1.15em;
  line-height: 1.4;
}
.door-card .close {
  position: absolute;
  top: 0.7em;
  right: 0.7em;
}

/* ---- processing */
.whiteout {
  position: absolute;
  inset: 0;
  background: #f4f2fa;
  opacity: 0;
  pointer-events: none;
  transition: opacity 1.2s ease-in;
  z-index: 20;
}
.whiteout.on {
  opacity: 1;
}
.blackout-fade {
  position: absolute;
  inset: 0;
  background: #000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 1.2s ease-in-out;
  z-index: 20;
}
.blackout-fade.on {
  opacity: 1;
}

/* ---- the overlays' motion */
.intro-pop-enter-active,
.intro-pop-leave-active {
  transition:
    opacity 0.3s,
    transform 0.35s cubic-bezier(0.3, 0, 0.2, 1);
}
.intro-pop-enter-from,
.intro-pop-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
.intro-grow-enter-active,
.intro-grow-leave-active {
  transition:
    opacity 0.3s,
    transform 0.35s cubic-bezier(0.3, 0, 0.2, 1);
  transform-origin: var(--grow-x, 50%) var(--grow-y, 50%);
}
.intro-grow-enter-from,
.intro-grow-leave-to {
  opacity: 0;
  transform: scale(0.08);
}
.intro-slide-enter-active,
.intro-slide-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s ease-out;
}
.intro-slide-enter-from,
.intro-slide-leave-to {
  opacity: 0;
  transform: translateY(-1.5em);
}
.intro-slide-up-enter-active,
.intro-slide-up-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s ease-out;
}
.intro-slide-up-enter-from,
.intro-slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 1.5em);
}
.intro-fade-enter-active,
.intro-fade-leave-active {
  transition: opacity 0.5s;
}
.intro-fade-enter-from,
.intro-fade-leave-to {
  opacity: 0;
}

/* any press skips a transition to its end */
.instant,
.instant * {
  transition-duration: 0s !important;
  animation-duration: 0s !important;
}
/* reduced motion: fades in place of camera moves, no flicker */
.reduced .world {
  transition: opacity 0.4s !important;
}
.reduced .room.lit :deep(.light-strip) {
  animation: none;
  opacity: 0.85;
}
.reduced .intro-grow-enter-from,
.reduced .intro-grow-leave-to,
.reduced .intro-pop-enter-from,
.reduced .intro-pop-leave-to {
  transform: none;
}
</style>
