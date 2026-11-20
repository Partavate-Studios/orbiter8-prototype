<template>
  <!--
    Minerva's face: her owl emblem in its eight parts, alive. The parts float apart a little and the
    gaps between them breathe; her eyes are glows in the gaps, behind the parts, so they show only
    through them.

    Use:
      <minerva-face state="thinking" :size="48" ref="face" />
      this.$refs.face.play('flash')

    Props:
      state   one of STATES in minerva-poses.js: idle, talking, thinking, surprised, annoyed, nervous,
              listening, waiting (on you), scanning, alert, skeptical, offline. Changing it blends over.
      size    width in px (a number) or any CSS width ('min(320px, 80vw)'); the height follows. Works
              from about 48 (a HUD corner) to 320 (beside her console) and beyond.
      color   the parts' and eyes' color (default white, like the emblem).
      speed   1 is normal; 0.25 slows everything (for checking animations).
      motion  'auto' follows the system's reduced-motion setting; 'full' or 'reduced' forces one.
              Reduced: calmer drift and waves, no Boom or Glitch, Assemble and Disassemble fade.
      assemble-on-mount  plays Assemble when it appears.

    One-offs: play(name) plays one of ONE_OFFS (boom, no, nod, flash, blink, slowBlink, assemble,
    disassemble, glitch, ha) over the current state and returns whether it played. Emits 'done' with the
    name when one finishes. One on a busy layer replaces the one playing (it fades out quickly); one-offs on
    different layers (body, eyes, lids) play together. Eye flash is for every key pressed in an input
    box: call play('flash') from the input's keydown.

    Adding a state or a one-off: add an entry to STATES or ONE_OFFS in minerva-poses.js (its header
    says how a pose is written). Nothing here changes.

    Drawing: one transform per part per frame on the shared frame loop (libs/frame-loop.js), set on the
    elements directly, not through Vue; glows are gradients, no SVG filters.
  -->
  <svg class="minerva-face" :viewBox="viewBox" :style="sizeStyle" role="img" aria-label="Minerva" overflow="visible">
    <defs>
      <radialGradient :id="ids.halo">
        <stop offset="0%" :stop-color="color" stop-opacity="0.95" />
        <stop offset="35%" :stop-color="color" stop-opacity="0.45" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </radialGradient>
      <radialGradient :id="ids.core">
        <stop offset="0%" :stop-color="color" stop-opacity="1" />
        <stop offset="55%" :stop-color="color" stop-opacity="0.85" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </radialGradient>
    </defs>
    <g ref="face">
      <g v-for="eye in eyes" :key="eye.id" :ref="(el) => (eyeEls[eye.id] = el)">
        <ellipse class="halo" :rx="eye.rx" :ry="eye.ry" :fill="`url(#${ids.halo})`" />
        <ellipse class="core" :rx="eye.rx * 0.3" :ry="eye.ry * 0.26" :fill="`url(#${ids.core})`" />
      </g>
      <g :fill="color">
        <g v-for="part in parts" :key="part.id" :ref="(el) => (partEls[part.id] = el)">
          <path :d="part.d" :transform="`translate(${-origin} ${-origin})`" />
        </g>
      </g>
    </g>
  </svg>
</template>

<script>
import { onFrame } from '@/libs/frame-loop'
import { ART_ORIGIN, PARTS } from './minerva-parts'
import {
  BLEND_MS,
  ONE_OFFS,
  REPLACE_FADE_MS,
  STATES,
  addOneOff,
  addState,
  compileOneOff,
  compileState,
  emptyPose
} from './minerva-poses'

/** The eyes' glows: where they sit in the gaps (centered units), their tilt, and their size. */
const EYES = [
  { id: 'eyeL', cx: -27, cy: 4, angle: 10, rx: 20, ry: 9, mirror: false },
  { id: 'eyeR', cx: 27, cy: 4, angle: -10, rx: 20, ry: 9, mirror: true }
]

// Each part drifts on two slow waves of its own (ms), so the gaps never line up into one rhythm.
const DRIFT = PARTS.map((part, i) => {
  const length = Math.hypot(part.cx, part.cy)
  return {
    // The direction it moves when the face spreads: away from the center (the forehead: down).
    dx: length > 1 ? part.cx / length : 0,
    dy: length > 1 ? part.cy / length : 0,
    periodA: 2900 + i * 370,
    periodB: 4700 + i * 530,
    phase: i * 0.37
  }
})

let instances = 0
const random = (min, max) => min + Math.random() * (max - min)
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const fixed = (value) => Math.round(value * 1000) / 1000

export default {
  name: 'MinervaFace',
  props: {
    state: { type: String, default: 'idle', validator: (name) => name in STATES },
    size: { type: [Number, String], default: 120 },
    color: { type: String, default: '#ffffff' },
    speed: { type: Number, default: 1 },
    motion: { type: String, default: 'auto', validator: (value) => ['auto', 'full', 'reduced'].includes(value) },
    assembleOnMount: { type: Boolean, default: false }
  },
  emits: ['done'],
  data() {
    const id = ++instances
    return {
      parts: PARTS,
      eyes: EYES,
      origin: ART_ORIGIN,
      ids: { halo: `minerva-halo-${id}`, core: `minerva-core-${id}` },
      viewBox: '-96 -56 192 112',
      systemReduced: false
    }
  },
  computed: {
    sizeStyle() {
      const width = typeof this.size === 'number' ? `${this.size}px` : this.size
      return { width, height: 'auto', aspectRatio: '192 / 112' }
    },
    reduced() {
      return this.motion === 'reduced' || (this.motion === 'auto' && this.systemReduced)
    }
  },
  watch: {
    state(name) {
      this.enterState(name)
    }
  },
  created() {
    // Not reactive: the frame loop reads and writes these sixty times a second.
    this.partEls = {}
    this.eyeEls = {}
    this.clock = 0
    this.lastNow = null
    this.layers = [] // states blending in, oldest first: { compiled, from }
    this.active = [] // one-offs playing: { compiled, start, fadeFrom }
    this.held = null // a one-off's last pose kept after it ends (Disassemble)
    this.look = { x: 0, y: 0 }
    this.lookTarget = { x: 0, y: 0 }
    this.pose = emptyPose()
    this.enterState(this.state, true)
  },
  mounted() {
    this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (this.motionQuery) {
      this.systemReduced = this.motionQuery.matches
      this.onMotionChange = (event) => (this.systemReduced = event.matches)
      this.motionQuery.addEventListener?.('change', this.onMotionChange)
    }
    if (this.assembleOnMount) this.play('assemble')
    this.draw(0)
    this.stopFrames = onFrame((now) => this.frame(now))
  },
  beforeUnmount() {
    this.stopFrames?.()
    this.motionQuery?.removeEventListener?.('change', this.onMotionChange)
  },
  methods: {
    /**
     * Plays a one-off over the current state.
     * @param {string} name a key of ONE_OFFS
     * @returns {boolean} whether it plays (false: unknown, or skipped for reduced motion)
     */
    play(name) {
      const def = ONE_OFFS[name]
      if (!def || (this.reduced && def.reduced === 'skip')) return false
      // Apart (or coming apart): only the one-off that brings her back plays on that layer.
      const holding = [this.held, ...this.active.map((playing) => playing.compiled)].find(
        (compiled) => compiled?.def.hold && compiled.def.layer === def.layer
      )
      if (holding && !def.releases?.includes(holding.name)) return false
      for (const playing of this.active) {
        if (playing.compiled.def.layer === def.layer && playing.fadeFrom === null) playing.fadeFrom = this.clock
      }
      if (this.held && def.releases?.includes(this.held.name)) this.held = null
      this.active.push({ compiled: compileOneOff(name, this.reduced), start: this.clock, fadeFrom: null })
      return true
    },

    enterState(name, immediately = false) {
      const compiled = compileState(name)
      this.layers = immediately ? [{ compiled, from: -BLEND_MS }] : [...this.layers, { compiled, from: this.clock }]
      const { blink, glance } = compiled.def
      this.nextBlink = blink ? this.clock + random(...blink) : Infinity
      this.nextGlance = glance ? this.clock + random(...glance.every) : Infinity
      this.glanceBack = Infinity
      if (!glance) this.lookTarget = { x: 0, y: 0 }
    },

    frame(now) {
      const dt = this.lastNow === null ? 16 : Math.min(100, now - this.lastNow)
      this.lastNow = now
      this.draw(dt * this.speed)
    },

    /** Advances the clock by dt (ms), works out every part's pose, and sets it on the elements. */
    draw(dt) {
      const t = (this.clock += dt)
      const pose = this.pose
      for (const channels of Object.values(pose)) for (const channel in channels) channels[channel] = 0
      const motion = this.reduced ? 0.35 : 1

      // States, newest on top: the newest blends in over BLEND_MS and the older ones share what's left.
      let remaining = 1
      let breathe = 0
      let float = 0
      for (let i = this.layers.length - 1; i >= 0; i--) {
        const layer = this.layers[i]
        const mix = i === 0 ? 1 : smoothstep((t - layer.from) / BLEND_MS)
        const weight = remaining * mix
        remaining -= weight
        addState(pose, layer.compiled, t, weight, motion)
        breathe += (layer.compiled.def.breathe ?? 1) * weight
        float += (layer.compiled.def.float ?? 1) * weight
        if (i > 0 && mix >= 1) {
          this.layers = this.layers.slice(i)
          break
        }
      }

      this.breatheParts(pose, t, breathe * motion)
      pose.face.y += 2 * float * motion * Math.sin((2 * Math.PI * t) / 4200)
      pose.face.r += 0.5 * float * motion * Math.sin((2 * Math.PI * t) / 6100 + 1)

      this.runEvents(t, dt, motion)
      pose.eyeL.x += this.look.x
      pose.eyeR.x += this.look.x
      pose.eyeL.y += this.look.y
      pose.eyeR.y += this.look.y
      const follow = this.reduced ? 0 : (this.layers.at(-1).compiled.def.glance?.face ?? 0)
      pose.face.x += this.look.x * follow * 1.2
      pose.face.r += this.look.x * follow * 0.5

      this.addOneOffs(pose, t)
      this.render(pose)
    },

    /** The gaps breathe: each part drifts toward and away from the center, and turns a hair. */
    breatheParts(pose, t, amount) {
      if (amount <= 0) return
      PARTS.forEach((part, i) => {
        const drift = DRIFT[i]
        const a = 2 * Math.PI * (t / drift.periodA + drift.phase)
        const b = 2 * Math.PI * (t / drift.periodB + drift.phase * 2)
        const out = amount * (0.7 * Math.sin(a) + 0.4 * Math.sin(b))
        const p = pose[part.id]
        if (part.id === '7') {
          p.s += amount * 0.006 * Math.sin(a)
          return
        }
        p.x += drift.dx * out + amount * 0.35 * Math.sin(b + 1.7)
        p.y += drift.dy * out + amount * 0.35 * Math.sin(a + 0.6)
        p.r += amount * 0.6 * Math.sin(b + 0.9)
      })
    },

    /** Blinks and glances, on the current state's timers; the eyes move quickly to where they look. */
    runEvents(t, dt, motion) {
      const def = this.layers.at(-1).compiled.def
      if (t >= this.nextBlink) {
        this.play(def.blinkWith ?? 'blink')
        this.nextBlink = t + random(...def.blink)
      }
      const glance = def.glance
      if (glance && t >= this.nextGlance) {
        const center = Math.random() < 0.3
        this.lookTarget = center
          ? { x: 0, y: 0 }
          : { x: random(-glance.x, glance.x) * motion, y: random(-glance.y, glance.y) * motion }
        this.nextGlance = t + random(...glance.every)
        this.glanceBack = glance.hold ? t + random(...glance.hold) : Infinity
      } else if (t >= this.glanceBack) {
        this.lookTarget = { x: 0, y: 0 }
        this.glanceBack = Infinity
      }
      const ease = 1 - Math.exp(-dt / 70)
      this.look.x += (this.lookTarget.x - this.look.x) * ease
      this.look.y += (this.lookTarget.y - this.look.y) * ease
    },

    addOneOffs(pose, t) {
      if (this.held) addOneOff(pose, this.held, 1)
      const still = []
      for (const playing of this.active) {
        const { def, name } = playing.compiled
        const progress = (t - playing.start) / def.duration
        const weight = playing.fadeFrom === null ? 1 : 1 - (t - playing.fadeFrom) / REPLACE_FADE_MS
        if (weight <= 0) continue
        if (progress >= 1 && playing.fadeFrom === null) {
          if (def.hold) {
            this.held = playing.compiled
            addOneOff(pose, this.held, 1)
          }
          this.$emit('done', name)
          continue
        }
        addOneOff(pose, playing.compiled, Math.min(progress, 1), weight)
        still.push(playing)
      }
      this.active = still
    },

    render(pose) {
      const face = pose.face
      this.$refs.face?.setAttribute(
        'transform',
        `translate(${fixed(face.x)} ${fixed(face.y)}) rotate(${fixed(face.r)}) scale(${fixed(1 + face.s)})`
      )
      for (const part of PARTS) {
        const el = this.partEls[part.id]
        if (!el) continue
        const p = pose[part.id]
        const drift = DRIFT[PARTS.indexOf(part)]
        const x = part.cx + p.x + drift.dx * p.spread
        const y = part.cy + p.y + drift.dy * p.spread
        const sx = (1 + p.s) * (1 + p.sx)
        const sy = (1 + p.s) * (1 + p.sy)
        el.setAttribute(
          'transform',
          `translate(${fixed(x)} ${fixed(y)}) rotate(${fixed(p.r)}) scale(${fixed(sx)} ${fixed(sy)}) translate(${-part.cx} ${-part.cy})`
        )
        el.setAttribute('opacity', fixed(clamp(1 + p.o, 0, 1)))
      }
      for (const eye of EYES) {
        const el = this.eyeEls[eye.id]
        if (!el) continue
        const e = pose[eye.id]
        const size = Math.max(0, 1 + e.s)
        const open = clamp(1 + e.open, 0, 1.6)
        const bright = clamp(1 + e.b, 0, 2.2)
        const turn = eye.angle + (eye.mirror ? -e.r : e.r)
        el.setAttribute(
          'transform',
          `translate(${fixed(eye.cx + e.x)} ${fixed(eye.cy + e.y)}) rotate(${fixed(turn)}) scale(${fixed(size)} ${fixed(size * open)})`
        )
        const [halo, core] = el.children
        halo.setAttribute('opacity', fixed(Math.min(1, 0.6 * bright)))
        core.setAttribute('opacity', fixed(Math.min(1, 0.75 * bright)))
        core.setAttribute('transform', `scale(${fixed(1 + Math.max(0, bright - 1) * 0.6)})`)
      }
    }
  }
}

function smoothstep(p) {
  const x = clamp(p, 0, 1)
  return x * x * (3 - 2 * x)
}
</script>

<style scoped>
.minerva-face {
  display: block;
  overflow: visible;
}
</style>
