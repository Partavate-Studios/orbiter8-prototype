<template>
  <!--
    The intro: a new pilot's last night on Earth, and the way into the game (it replaced the title's
    call-sign and ship wizard, 2026-11-19; the approved mockup is docs/mockups/intro/). The power is off
    until you scan your ID card and file your name (the first transaction); then the room is yours: the
    TV's ads, the door's curfew, the balcony and its vape, and Minerva's terminals. The housing computer
    subscribes you to a corporation; its job board has one opening you qualify for; naming your ship
    accepts it (the second transaction), an escort comes for you, and you wake in orbit.

    Layers, back to front: the room (still art, libs/intro-art.js) and what lives in it (the lights,
    Minerva's faces on the scanner and the terminal, the TV's picture, the things you can use, your hand),
    moved by one camera; the balcony's view; then the overlays (the scanner's prompt, the TV, the door,
    Minerva's console, her notices), the status line, and the white of processing.
  -->
  <div
    class="intro-screen"
    :class="{ portrait, instant, reduced }"
    @pointerdown.capture="skipTransition"
    @keydown.capture="skipTransition"
  >
    <!-- the room, through the camera -->
    <div
      class="world"
      :class="{ away: view === 'balcony' }"
      :style="cameraStyle"
      :aria-hidden="view !== 'room' || overlayOpen"
    >
      <!-- eslint-disable-next-line vue/no-v-html -- the game's own SVG art (libs/intro-art.js), not user content -->
      <svg class="room-art" viewBox="-400 0 2400 1400" aria-hidden="true" v-html="roomSvg"></svg>
      <!-- the ceiling strip: it flickers on with the power -->
      <div class="strip" :class="{ on: lightsOn }"></div>
      <!-- the TV's picture -->
      <!-- eslint-disable-next-line vue/no-v-html -- the game's own SVG art (libs/intro-art.js), not user content -->
      <div class="tv-screen" :class="{ on: tvOn }" :style="placeAt(SCREENS.tv)" v-html="tvSvg"></div>
      <!-- Minerva on the housing computer -->
      <div class="screen-face" :style="placeAt(SCREENS.terminal)">
        <minerva-face v-if="terminalOn" :state="terminalState" :size="120" assemble-on-mount />
      </div>
      <!-- the dark: everything but the scanner, until the power comes on -->
      <div class="blackout" :class="{ off: lightsOn }"></div>
      <!-- Minerva on the ID scanner: in the dark, the only light there is -->
      <div class="scanner-glow" :class="{ off: lightsOn }"></div>
      <div class="screen-face scanner" :style="placeAt(SCREENS.scanner)">
        <minerva-face :state="scannerState" :size="54" />
      </div>
      <div class="lock-light" :class="{ open: escortHere }"></div>

      <!-- the things you can use: real buttons, so mouse, touch, keys and the gamepad all reach them -->
      <button
        v-for="spot in spots"
        :key="spot.key"
        type="button"
        class="hotspot"
        :class="{ hinted: hintRings, focused: focusKey === spot.key, locked: isLocked(spot.key) }"
        :style="placeAt(spot)"
        :aria-label="spot.label"
        :tabindex="view === 'room' && !overlayOpen ? 0 : -1"
        @click="use(spot.key)"
        @focus="focusKey = spot.key"
        @mouseenter="$event.target.focus({ preventScroll: true })"
      >
        <span class="spot-label">{{ spot.label }}</span>
      </button>

      <!-- your hand: pointing at what has focus; in the dark, holding your card to the scanner -->
      <!-- eslint-disable vue/no-v-html -- the game's own SVG art (libs/intro-art.js), not user content -->
      <svg
        class="hand"
        :style="handStyle"
        width="1"
        height="1"
        overflow="visible"
        aria-hidden="true"
        v-html="handSvg"
      ></svg>
      <!-- eslint-enable vue/no-v-html -->
    </div>

    <!-- the balcony -->
    <intro-balcony
      v-if="view === 'balcony' || leavingBalcony"
      :class="{ near: view === 'balcony' }"
      :health="health"
      :hits="hits"
      @hit="takeHit"
      @terminal="openConsole()"
      @inside="goInside"
    />

    <!-- the status line -->
    <header class="status">
      <span class="status-text">{{ statusText }}</span>
      <span class="status-buttons">
        <button type="button" class="o8-button quiet small" @click="toTitle">Title</button>
        <button v-if="canSkip" type="button" class="o8-button quiet small" @click="skipIntro">Skip intro</button>
      </span>
    </header>

    <!-- phones: the room's things along the bottom, in the room's order -->
    <nav
      v-if="portrait && phase === 'lit' && view === 'room' && !overlayOpen"
      class="strip-nav"
      aria-label="In the room"
    >
      <button
        v-for="item in stripItems"
        :key="item.key"
        type="button"
        class="strip-button"
        :class="{ current: focusKey === item.key, locked: isLocked(item.key) }"
        @click="stripPress(item.key)"
      >
        <!-- eslint-disable-next-line vue/no-v-html -- the game's own SVG art (libs/intro-art.js), not user content -->
        <span class="strip-icon" aria-hidden="true" v-html="item.icon"></span>
        <span>{{ item.label }}</span>
      </button>
    </nav>
    <div v-if="portrait && phase === 'dark' && !overlayOpen" class="dark-action">
      <button type="button" class="o8-button primary big" @click="use('scanner')">Scan your ID card</button>
    </div>

    <!-- the overlays -->
    <transition name="intro-pop">
      <intro-scanner
        v-if="phase === 'name' || phase === 'filing'"
        :phase="phase"
        :registration="callsignRegistration"
        @submit="fileName"
        @retry="retryName"
        @close="phase = 'dark'"
      />
    </transition>
    <transition name="intro-pop">
      <intro-tv v-if="overlay === 'tv'" :corp-names="corporationNames" @close="closeOverlay" />
    </transition>
    <transition name="intro-pop">
      <section v-if="overlay === 'door'" class="door-panel" role="dialog" aria-labelledby="door-heading">
        <div class="door-card" :style="{ '--corp': corp ? corp.color : '#9088aa' }">
          <h2 id="door-heading" :style="{ fontFamily: corp?.font }">
            {{ corp ? corp.name + ' · Curfew' : 'Minerva · Public notice' }}
          </h2>
          <p :style="{ fontFamily: corp?.font }">{{ corp ? corp.curfew : curfewNotice }}</p>
          <button ref="doorOk" type="button" class="o8-button primary" @click="closeOverlay">OK</button>
        </div>
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
        @close="closeOverlay"
      />
    </transition>
    <transition name="intro-slide">
      <intro-notice v-if="notice" :key="notice.key" v-bind="notice" @close="notice = null" />
    </transition>

    <!-- processing, left unsaid: white, then the ship -->
    <div class="whiteout" :class="{ on: whiteout }"></div>
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
import { HOTSPOTS, ROOM, SCREENS, adArt, artDefs, handArt, roomArt, CARD_ART } from '@/libs/intro-art'
import IntroScanner from './intro-scanner.vue'
import IntroConsole from './intro-console.vue'
import IntroTv from './intro-tv.vue'
import IntroBalcony from './intro-balcony.vue'
import IntroNotice from './intro-notice.vue'
import IntroWake from './intro-wake.vue'

const STRIP = [
  {
    key: 'balcony',
    label: 'Balcony',
    icon: '<svg viewBox="-16 -16 32 32"><path d="M-15 -4h30M-15 -4v18M-5 -4v18M5 -4v18M15 -4v18" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>'
  },
  {
    key: 'tv',
    label: 'TV',
    icon: '<svg viewBox="-16 -16 32 32"><rect x="-15" y="-11" width="30" height="20" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M-7 15h14" stroke="currentColor" stroke-width="2.5"/></svg>'
  },
  {
    key: 'terminal',
    label: 'Terminal',
    icon: '<svg viewBox="-16 -16 32 32"><rect x="-14" y="-11" width="28" height="19" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M-4 14h8M0 8v6" stroke="currentColor" stroke-width="2.5"/></svg>'
  },
  {
    key: 'door',
    label: 'Door',
    icon: '<svg viewBox="-16 -16 32 32"><rect x="-9" y="-15" width="18" height="30" rx="2" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="-4" cy="2" r="2" fill="currentColor"/></svg>'
  }
]
const NOTICE_MS = 7000
const RING_HINT_MS = 7000

export default {
  name: 'IntroScreen',
  components: { MinervaFace, IntroScanner, IntroConsole, IntroTv, IntroBalcony, IntroNotice, IntroWake },
  data() {
    return {
      SCREENS,
      BALANCE,
      phase: 'dark',
      view: 'room',
      leavingBalcony: false,
      overlay: null,
      consoleTab: 'Account',
      jobStep: 'board',
      consoleFrom: null,
      focusKey: 'scanner',
      lightsOn: false,
      tvOn: false,
      terminalOn: false,
      hintRings: false,
      subscription: null,
      health: HEALTH,
      hits: VAPE_HITS_BEFORE,
      notice: null,
      noticeCount: 0,
      whiteout: false,
      escortHere: false,
      shipName: '',
      vw: window.innerWidth,
      vh: window.innerHeight,
      instant: false,
      reduced: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
      roomSvg: artDefs('intro-') + roomArt('intro-')
    }
  },
  computed: {
    ...mapState(useChainStore, ['chainId', 'account', 'walletStatus', 'contractsLoaded']),
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
    spots() {
      if (this.phase === 'dark' || this.phase === 'name' || this.phase === 'filing')
        return [{ key: 'scanner', ...HOTSPOTS.scanner }]
      return ['balcony', 'tv', 'terminal', 'scanner', 'door'].map((key) => ({ key, ...HOTSPOTS[key] }))
    },
    stripItems() {
      return STRIP
    },
    scannerState() {
      if (this.phase === 'name') return 'listening'
      if (this.phase === 'filing') return this.callsignRegistration?.status === 'confirm' ? 'waiting' : 'thinking'
      return this.lightsOn ? 'idle' : 'idle'
    },
    terminalState() {
      return this.subscription ? 'idle' : 'talking'
    },
    tvSvg() {
      if (!this.lightsOn) return ''
      const look = corporation(this.subscription ?? 1, this.corporationNames)
      return `<svg viewBox="0 0 468 300" preserveAspectRatio="xMidYMid slice">${artDefs('tv-')}${adArt('tv-', look.key, look)}</svg>`
    },
    handSvg() {
      const dark = this.phase === 'dark'
      return `<g transform="scale(0.75)">${handArt(dark ? 'hold' : 'point', dark ? CARD_ART : '')}</g>`
    },
    /** The hand's place: the focused thing's lower middle, or the card held up to the scanner. */
    handStyle() {
      const spot = HOTSPOTS[this.focusKey] ?? HOTSPOTS.scanner
      const x = this.phase === 'dark' ? spot.x - 70 : spot.x + spot.w * 0.55
      const y = this.phase === 'dark' ? spot.y + spot.h + 120 : spot.y + Math.min(spot.h * 0.75, 160)
      const hidden = this.overlayOpen || this.view !== 'room'
      return { transform: `translate(${x}px, ${y}px)`, opacity: hidden ? 0 : 1 }
    },
    /** The camera over the room: covering the screen, panning on phones, leaning in on the scanner, through the glass to the balcony. */
    camera() {
      const { vw, vh } = this
      let k = this.portrait ? vh / ROOM.h : Math.max(vw / ROOM.w, vh / ROOM.h)
      let tx
      if (this.portrait) {
        const spot = HOTSPOTS[this.focusKey] ?? HOTSPOTS.scanner
        const cx = spot.x + spot.w / 2
        tx = Math.min(80 * k, Math.max(vw - (ROOM.w + 80) * k, vw / 2 - cx * k))
      } else tx = (vw - ROOM.w * k) / 2
      let ty = (vh - ROOM.h * k) / 2
      // lean in on a point: it stays where it is on screen while everything grows around it
      const lean = (px, py, z) => {
        const sx = tx + px * k
        const sy = ty + py * k
        k *= z
        tx = sx - px * k
        ty = sy - py * k
      }
      if (this.phase === 'name' || this.phase === 'filing') lean(1275, 480, 1.3)
      if (this.view === 'balcony') lean(170, 520, 2.6)
      return { k, tx, ty }
    },
    cameraStyle() {
      const { k, tx, ty } = this.camera
      return { transform: `translate(${tx}px, ${ty}px) scale(${k})` }
    },
    /** The console grows out of the terminal it was opened from. */
    consoleOrigin() {
      const { k, tx, ty } = this.camera
      if (this.consoleFrom === 'balcony') return { '--grow-x': '78%', '--grow-y': '72%' }
      const s = SCREENS.terminal
      const x = tx + (s.x + s.w / 2) * k
      const y = ty + (s.y + s.h / 2) * k
      return { '--grow-x': `${(x / this.vw) * 100}%`, '--grow-y': `${(y / this.vh) * 100}%` }
    },
    statusText() {
      if (!this.lightsOn) return this.portrait ? '23:41 · No power' : '23:41 · Unit 7-2216 · No power'
      return this.portrait ? '23:41 · Curfew' : `23:41 · Curfew: ${CURFEW_WHY} · Block 7 · Unit 7-2216`
    },
    curfewNotice() {
      return TICKER.replace('MINERVA PUBLIC NOTICE · ', '').replaceAll(' · ', '. ') + '.'
    },
    /** Skipping jumps to the next thing that needs you; nothing skips a move on its way. */
    canSkip() {
      if (this.phase === 'filing' || this.phase === 'wake' || this.whiteout) return false
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
    phase(phase) {
      // the room's things take focus again when an overlay closes
      if (phase === 'lit') this.$nextTick(() => this.focusSpot(this.focusKey))
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
    if (start === 'filing') this.phase = 'filing'
    if (start === 'lit' || start === 'escort') this.powerOn({ quietly: true })
    if (start === 'escort') {
      this.shipName = this.registration.name
      this.openConsole('Jobs', 'escort')
    }
    this.loadCallsigns()
    this.loadCorporations()
  },
  mounted() {
    this.onResize = () => {
      this.vw = window.innerWidth
      this.vh = window.innerHeight
    }
    window.addEventListener('resize', this.onResize)
    this.$nextTick(() => this.focusSpot(this.focusKey))
    // In the dark, the unit's system speaks first: what this is, what to do, and what comes after
    if (this.phase === 'dark')
      this.later(900, () => {
        if (this.phase !== 'dark') return
        this.say('Minerva', SAY.opening, { hold: true })
        this.o8audio?.speak('introWelcome')
      })
  },
  beforeUnmount() {
    this.o8audio?.speaking?.pause() // her intro lines end with the room
    window.removeEventListener('resize', this.onResize)
    clearTimeout(this.noticeTimer)
    clearTimeout(this.ringTimer)
    this.timers?.forEach(clearTimeout)
  },
  methods: {
    ...mapActions(useOnboardingStore, ['register', 'clearRegistration', 'loadCallsigns', 'loadCorporations']),
    placeAt(r) {
      return { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` }
    },
    later(ms, run) {
      this.timers = this.timers ?? []
      this.timers.push(setTimeout(run, this.reduced ? Math.min(ms, 150) : ms))
    },
    click() {
      this.o8audio?.playEffect('click')
    },
    focusSpot(key) {
      this.$el?.querySelector?.(`.hotspot[aria-label="${HOTSPOTS[key]?.label}"]`)?.focus({ preventScroll: true })
    },
    /** Any press while something animates skips it to its end. */
    skipTransition() {
      if (!this.animating) return
      this.instant = true
      requestAnimationFrame(() => requestAnimationFrame(() => (this.instant = false)))
    },
    /** Uses a thing in the room. */
    use(key) {
      this.click()
      this.focusKey = key
      if (this.phase === 'dark') {
        if (key === 'scanner') {
          this.notice = null
          this.phase = 'name'
        }
        return
      }
      if (this.isLocked(key)) this.say('No corporate sponsor', SAY.locked, { state: 'skeptical' })
      else if (key === 'scanner')
        this.say('Name on file: ' + this.pilotName, 'Your card’s registered with me. There’s nothing else on it.')
      else if (key === 'tv' || key === 'door') {
        this.notice = null
        this.overlay = key
        if (key === 'door') this.$nextTick(() => this.$refs.doorOk?.focus())
      } else if (key === 'terminal') this.openConsole()
      else if (key === 'balcony') this.goOutside()
    },
    stripPress(key) {
      if (this.focusKey !== key) {
        this.click()
        this.focusKey = key
        this.$nextTick(() => this.focusSpot(key))
      } else this.use(key)
    },
    /** Minerva's console, opened from a terminal: the first boot until you've subscribed. */
    openConsole(tab, jobStep) {
      this.notice = null
      this.consoleFrom = this.view === 'balcony' ? 'balcony' : 'terminal'
      this.consoleTab = this.subscription ? (tab ?? this.consoleTab ?? 'Account') : 'boot'
      if (jobStep) this.jobStep = jobStep
      this.overlay = 'console'
    },
    closeOverlay() {
      this.click()
      this.overlay = null
      this.$nextTick(() => this.focusSpot(this.focusKey))
    },
    /** The balcony and the door stay locked until the unit has a corporate sponsor (Koda, 2026-11-20).
     *  The TV doesn't: its ads are how you choose. */
    isLocked(key) {
      return this.phase === 'lit' && !this.subscription && (key === 'balcony' || key === 'door')
    },
    /** A notice from Minerva; `hold` keeps it up until it's dismissed or replaced. */
    say(title, body, { hold = false, ...more } = {}) {
      clearTimeout(this.noticeTimer)
      this.notice = { key: ++this.noticeCount, title, body, state: 'talking', ...more }
      if (!hold) this.noticeTimer = setTimeout(() => (this.notice = null), NOTICE_MS)
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
    /** The power comes on: the strip flickers, the room fades up, the TV and then the terminal start. */
    powerOn({ quietly = false } = {}) {
      this.phase = 'lit'
      this.focusKey = 'terminal'
      this.lightsOn = true
      this.animating = !quietly
      if (quietly) {
        this.tvOn = true
        this.terminalOn = true
        return
      }
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

    // ---- the balcony
    goOutside() {
      this.view = 'balcony'
    },
    goInside() {
      this.click()
      this.view = 'room'
      this.leavingBalcony = true
      this.later(900, () => (this.leavingBalcony = false))
      this.$nextTick(() => this.focusSpot('balcony'))
    },
    takeHit() {
      this.hits++
      this.health = Math.max(1, this.health - 1)
      // Minerva notices once the vapor clears, unless you've gone in or opened a terminal by then
      this.later(1600, () => {
        if (this.view !== 'balcony' || this.overlay) return
        this.say(`Health score ${this.health} (−1)`, SAY.vape(this.hits, this.health), {
          attention: true,
          state: 'skeptical'
        })
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
        this.whiteout = true
      })
      this.later(2900, () => {
        this.phase = 'wake'
        this.clearRegistration()
      })
      this.later(3300, () => {
        this.whiteout = false
        this.animating = false
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
      } else if (this.phase === 'lit') {
        this.view = 'room'
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
}

/* ---- the room, through the camera */
.world {
  position: absolute;
  left: 0;
  top: 0;
  width: 1600px;
  height: 1000px;
  transform-origin: 0 0;
  transition:
    transform 0.8s cubic-bezier(0.5, 0, 0.2, 1),
    opacity 0.8s;
}
.world.away {
  opacity: 0;
}
.room-art {
  position: absolute;
  left: -400px;
  top: 0;
  width: 2400px;
  height: 1400px;
}
.strip {
  position: absolute;
  left: 560px;
  top: 76px;
  width: 260px;
  height: 6px;
  border-radius: 3px;
  background: #d8d4e4;
  opacity: 0;
  box-shadow: 0 0 0 #0000;
}
.strip.on {
  animation: strip-flicker 0.9s steps(1, end) forwards;
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
  52% {
    opacity: 0.85;
  }
  100% {
    opacity: 0.85;
  }
}
.tv-screen {
  position: absolute;
  overflow: hidden;
  transform: scaleY(0.01);
  opacity: 0;
  transition:
    transform 0.3s ease-out,
    opacity 0.15s;
}
.tv-screen.on {
  transform: none;
  opacity: 1;
}
.tv-screen :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
.screen-face {
  position: absolute;
  display: grid;
  place-items: center;
  pointer-events: none;
}
.blackout {
  position: absolute;
  left: -400px;
  top: -100px;
  width: 2400px;
  height: 1500px;
  pointer-events: none;
  background: radial-gradient(circle 340px at 1675px 580px, #0000 0, #0000008c 30%, #000000f7 75%, #000 100%);
  transition: opacity 0.9s 0.25s;
}
.blackout.off,
.scanner-glow.off {
  opacity: 0;
}
.scanner-glow {
  position: absolute;
  left: 1125px;
  top: 330px;
  width: 300px;
  height: 300px;
  pointer-events: none;
  background: radial-gradient(closest-side, #e6dcf573, #e6dcf500);
  transition: opacity 0.9s 0.25s;
}
.lock-light {
  position: absolute;
  left: 1387px;
  top: 515px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #b9a0ff;
  transition: background 0.4s;
}
.lock-light.open {
  background: #ebff99;
}

/* the things you can use */
.hotspot {
  position: absolute;
  padding: 0;
  margin: 0;
  background: none;
  border: 3px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.hotspot.hinted {
  border: 3px dashed #b9a0ffaa;
}
.hotspot:hover,
.hotspot:focus-visible,
.hotspot.focused:focus {
  border: 3px solid #b9a0ff;
  outline: none;
}
.spot-label {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  white-space: nowrap;
  font:
    500 17px 'Ubuntu',
    system-ui,
    sans-serif;
  color: #1c0838;
  background: #c3b3da;
  border-radius: 999px;
  padding: 4px 14px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}
.hotspot.hinted .spot-label {
  opacity: 0.85;
  background: #0b0916e6;
  color: #f1eefa;
  border: 1px solid #b9a0ff;
}
.hotspot:hover .spot-label,
.hotspot:focus-visible .spot-label,
.hotspot.focused:focus .spot-label {
  opacity: 1;
  background: #c3b3da;
  color: #1c0838;
}
/* the balcony and the door, until the unit has a corporate sponsor */
.strip-button.locked {
  opacity: 0.5;
}
.hotspot.locked .spot-label::after {
  content: ' · locked';
}
.hand {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
  transition:
    transform 0.25s ease-out,
    opacity 0.2s;
}

/* ---- the status line */
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

/* ---- phones: the room's things along the bottom */
.strip-nav {
  position: absolute;
  inset: auto 0 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 0.6em 0.3em 1em;
  background: #030306e6;
  border-top: 1px solid #3f3566;
  z-index: 4;
}
.strip-button {
  display: grid;
  justify-items: center;
  gap: 0.35em;
  background: none;
  border: 0;
  color: #bdb5d4;
  font:
    13px 'Ubuntu',
    system-ui,
    sans-serif;
  cursor: pointer;
  padding: 0.3em 0;
}
.strip-icon {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #3a1a66;
  border: 1px solid #ffffff55;
  color: #ffffff;
}
.strip-icon :deep(svg) {
  width: 32px;
  height: 32px;
}
.strip-button.current {
  color: #f1eefa;
}
.strip-button.current .strip-icon {
  background: #c3b3da;
  color: #1c0838;
  outline: 2.5px solid #b9a0ff;
  outline-offset: 3px;
}
.dark-action {
  position: absolute;
  inset: auto 1em 2em;
  display: grid;
  z-index: 4;
}
.o8-button.big {
  font-size: 1.2em;
  padding: 0.7em 1em;
}

/* ---- the door's warning */
.door-panel {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: #030306a6;
  z-index: 6;
}
.door-card {
  width: min(34em, 100% - 2em);
  box-sizing: border-box;
  background: #0b0912f2;
  border: 1.5px solid #c3b3da;
  border-top: 3px solid var(--corp);
  border-radius: 14px;
  padding: 1.4em 1.6em;
  display: grid;
  gap: 0.9em;
  justify-items: start;
}
.door-card h2 {
  margin: 0;
  font-size: 1.05em;
  font-weight: 600;
}
.door-card p {
  margin: 0;
  font-size: 1.2em;
  line-height: 1.4;
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

/* ---- the overlays' motion: popping from the scanner, growing from a terminal, notices sliding in */
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

/* the city lives: billboards flicker, traffic drifts (classes from libs/intro-art.js) */
.intro-screen :deep(.intro-flicker) {
  animation: billboard-flicker 7s infinite steps(1, end);
}
@keyframes billboard-flicker {
  0%,
  100% {
    opacity: 1;
  }
  91% {
    opacity: 1;
  }
  92% {
    opacity: 0.45;
  }
  93% {
    opacity: 1;
  }
  95% {
    opacity: 0.6;
  }
  96% {
    opacity: 1;
  }
}
.intro-screen :deep(.intro-traffic) {
  animation: traffic 50s linear infinite;
}
@keyframes traffic {
  from {
    transform: translateX(-60px);
  }
  to {
    transform: translateX(60px);
  }
}

/* any press skips a transition to its end */
.instant,
.instant * {
  transition-duration: 0s !important;
  animation-duration: 0s !important;
}
/* reduced motion: fades in place of camera moves, no flicker */
.reduced .world {
  transition: opacity 0.4s;
}
.reduced .strip.on {
  animation: none;
  opacity: 0.85;
}
.reduced :deep(.intro-flicker),
.reduced :deep(.intro-traffic) {
  animation: none;
}
.reduced .intro-grow-enter-from,
.reduced .intro-grow-leave-to,
.reduced .intro-pop-enter-from,
.reduced .intro-pop-leave-to {
  transform: none;
}
</style>
