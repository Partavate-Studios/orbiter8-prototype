<template>
  <!--
    Minerva's face: her owl emblem in its parts, alive. The parts float apart a little and the gaps
    between them breathe; her eyes sit in the sockets between the parts, behind them: round and hard-edged
    like an owl's, with a pupil you can see through.

    Use:
      <minerva-face state="thinking" :size="48" ref="face" />
      this.$refs.face.play('flash')

    Props:
      state   one of STATES in minerva-poses.js: idle, talking, thinking, surprised, annoyed, nervous,
              listening, waiting (on you), scanning, alert, skeptical, offline. Changing it springs her
              to the new pose, eyes first, then brow, then the rest; some states start with an accent
              (Alert starts, Annoyed huffs).
      size    width in px (a number) or any CSS width ('min(320px, 80vw)'); the height follows. Works
              from 22 (a screen across the room) to 320 (beside her console) and beyond. She draws
              outside her box when she moves (Boom, Peer, which brings her half again closer), so leave
              her room or clip her container. She measures
              how big she's drawn: below about 110 px her movements and eyes grow to stay readable.
      crop    'auto' (default): under about 80 px wide she's drawn closer, so an icon-sized Minerva is a
              face and not a speck. Her eyes, brow and beak stay inside her box and the rest (first the
              tips of her tufts) reaches past it, for the frame she's in to cut off: give that frame
              `overflow: hidden`, and she fills it to its edge. 'none' always draws all of her inside her
              box; a number draws her that many times closer.
      clip    cuts her off at her own box instead, where the frame around her can't do it.
      color   the parts' and eyes' color (default white, like the emblem).
      accent  the color her eyes take when something needs the player's attention (default the game's
              pink): Alert, a pulse in Waiting on you, a flare in Glitch and Huff. Poses call it `tint`.
      cool    the color her eyes and the scan line take while she's working on something (default a
              cyan): Scanning. Poses call it `cool`.
      speed   1 is normal; 0.25 slows everything (for checking animations).
      motion  'auto' follows the system's reduced-motion setting; 'full' or 'reduced' forces one.
              Reduced: calmer drift and waves, nothing overshoots, her head doesn't turn after her eyes,
              no Boom, Glitch or entry accents, and Assemble and Disassemble only fade.
      assemble-on-mount  plays Assemble when it appears.
      pokeable  she reacts when clicked or tapped, a little more sharply each time: a flash, a side-eye,
              a shake of the head, a huff, a glitch; poked POKES_TO_BURST times in quick succession, she
              bursts apart and puts herself back together (Koda). Emits 'poke' with the count in the
              streak and whether she burst.

    One-offs: play(name) plays one of ONE_OFFS (boom, no, nod, flash, blink, slowBlink, assemble,
    disassemble, glitch, ha, noted, wince, paid, sideEye, peer, and the tics and accents) over the current state
    and returns whether it played. Emits 'done' with the name when one finishes. One on a busy layer
    replaces the one playing (it fades out quickly); one-offs on different layers (body, eyes, lids,
    accent) play together. Eye flash is for every key pressed in an input box: call play('flash') from the
    input's keydown.

    Her voice: Talking moves to a made-up voice (speech() in minerva-poses.js). To have it follow her
    real one, call setVoice(level) with its loudness, 0 to 1, as often as you have it (each animation
    frame is ideal). When the calls stop for VOICE_STALE_MS she goes back to the made-up one;
    setVoice(null) does that at once.

    Adding a state or a one-off: add an entry to STATES or ONE_OFFS in minerva-poses.js (its header
    says how a pose is written). Nothing here changes.

    Drawing: one transform per part per frame on the shared frame loop (libs/frame-loop.js), set on the
    elements directly, not through Vue, and only when it changed; no SVG filters. Her lids and pupils
    are clip paths, moved by a transform like everything else. A
    face that's off screen doesn't draw, and one under SMALL_PX wide draws every other frame.
  -->
  <svg
    class="minerva-face"
    :class="{ pokeable, clipped: clip && zoom > 1 }"
    :viewBox="viewBox"
    :overflow="clip && zoom > 1 ? 'hidden' : 'visible'"
    :style="sizeStyle"
    role="img"
    aria-label="Minerva"
    @click="pokeable && poke($event)"
  >
    <defs>
      <radialGradient v-for="glow in glows" :id="glow.id" :key="glow.id">
        <stop
          v-for="stop in glow.stops"
          :key="stop[0]"
          :offset="stop[0]"
          :stop-color="glow.color"
          :stop-opacity="stop[1]"
        />
      </radialGradient>
      <template v-for="eye in eyes" :key="eye.id">
        <!-- Her lids: the band of the eye left open between them (a rectangle, moved and squeezed). -->
        <clipPath :id="`${ids.lids}-${eye.id}`">
          <rect :data-part="`${eye.id}.lids`" x="-30" y="-1" width="60" height="2" />
        </clipPath>
        <!-- Her pupil: everything but a circle one unit across (scaled and moved), so the pupil is a hole. -->
        <clipPath :id="`${ids.pupil}-${eye.id}`">
          <path :data-part="`${eye.id}.pupil`" :d="pupilHole" clip-rule="evenodd" />
        </clipPath>
      </template>
    </defs>
    <g data-part="face">
      <g v-for="eye in eyes" :key="eye.id" :data-part="eye.id">
        <!-- A glow that shows only when she flashes. -->
        <circle :r="eye.radius * 2.6" :fill="`url(#${ids.flare})`" opacity="0" />
        <g :clip-path="`url(#${ids.lids}-${eye.id})`">
          <!-- The iris: her own color, then the attention color and the working color over it (faded
               in by `tint` and `cool`). The pupil is cut out of all three. -->
          <g :clip-path="`url(#${ids.pupil}-${eye.id})`">
            <circle :r="eye.radius" :fill="`url(#${ids.iris})`" />
            <circle :r="eye.radius" :fill="`url(#${ids.irisAccent})`" opacity="0" />
            <circle :r="eye.radius" :fill="`url(#${ids.irisCool})`" opacity="0" />
          </g>
        </g>
      </g>
      <g data-part="beam" opacity="0">
        <ellipse rx="11" ry="58" :fill="`url(#${ids.beam})`" />
        <ellipse rx="1.3" ry="54" :fill="`url(#${ids.beamCore})`" />
      </g>
      <g :fill="color">
        <g v-for="part in facets" :key="part.id" :data-part="part.id">
          <path :d="part.d" :transform="artOffset" />
        </g>
        <g data-part="7">
          <g v-for="side in frameSides" :key="side.ridge.id" :data-part="side.ridge.id">
            <path :d="side.ridge.d" :transform="artOffset" />
            <g :data-part="side.tuft.id">
              <path :d="side.tuft.d" :transform="artOffset" />
            </g>
          </g>
          <g data-part="beak">
            <path :d="beak.d" :transform="artOffset" />
          </g>
        </g>
        <g data-part="8">
          <path :d="forehead.d" :transform="artOffset" />
        </g>
      </g>
    </g>
  </svg>
</template>

<script>
import { onFrame } from '@/libs/frame-loop'
import { ART_ORIGIN, FRAME_PIECES, PARTS } from './minerva-parts'
import {
  BLEND_MS,
  ONE_OFFS,
  REPLACE_FADE_MS,
  SLOTS,
  STATES,
  addOneOff,
  addWaves,
  compileOneOff,
  compileState,
  emptyPose,
  speech,
  stepSprings
} from './minerva-poses'

/**
 * Her eyes, after an owl's: a round iris with a hard edge and a round pupil, which is a hole (you see
 * through it, like the gaps between her parts). They sit in the sockets behind the parts, so her brow
 * ridge cuts across the top of each, which is where an owl's stare comes from. Like an owl's they barely
 * move in their sockets: she turns her head to look. cx, cy: where each sits (centered units); angle:
 * how its lids slope (down toward the beak); radius, pupil: the iris and the pupil at rest; lid: how far
 * the upper lid sits open at rest, a little under 1, which makes her look composed rather than startled.
 */
const EYES = [
  { id: 'eyeL', cx: -28.6, cy: 2.6, angle: 14, radius: 6.3, pupil: 3.5, lid: 0.68, mirror: false },
  { id: 'eyeR', cx: 28.6, cy: 2.6, angle: -14, radius: 6.3, pupil: 3.5, lid: 0.68, mirror: true }
]
/** What the pupil's clip keeps: a square far bigger than the eye, less a circle one unit across. */
const PUPIL_HOLE = 'M-999,-999H999V999H-999Z M1,0A1,1 0 1 0 -1,0A1,1 0 1 0 1,0Z'
/** The least iris left around the pupil when it's wide or looking aside (units). */
const IRIS_RIM = 1.1
/** How far forward her eyes sit, for turning her head (see MOVERS' depth). */
const EYE_DEPTH = 0.45

const byId = (list, id) => list.find((part) => part.id === id)
const FACETS = ['1', '2', '3', '4', '5', '6'].map((id) => byId(PARTS, id))

/**
 * Everything that moves as a part, in the order it's drawn. For each:
 *   dx, dy   the way it goes when the face spreads (away from the center);
 *   depth    how far forward it sits, 1 the beak … below 0 behind the face. Turning her head (face.turn,
 *            face.pitch) moves each part by its depth, so the beak leads and the tufts trail;
 *   under    the part it rides on (a tuft on its ridge, the pieces on the frame): its depth and position
 *            are then measured from that part;
 *   lightX   where it is across the face, for the scan line to light it as it passes. null: it stays lit
 *            (the frame's pieces overlap, and dimming them one by one would show where);
 *   sway     how it drifts while she breathes: 'facet' wanders, 'tuft' and 'ridge' only stir.
 */
const MOVERS = [
  ...FACETS.map((part) => ({ ...part, depth: { 1: 0.3, 2: 0.25, 3: 0.5 }[((part.id - 1) % 3) + 1], sway: 'facet' })),
  { id: '7', cx: 0, cy: 0, depth: 0, lightX: null },
  { ...byId(FRAME_PIECES, 'ridgeL'), under: '7', depth: 0.6, dx: -0.5, dy: -0.87, lightX: null, sway: 'ridge' },
  { ...byId(FRAME_PIECES, 'tuftL'), under: 'ridgeL', depth: -0.1, dx: -0.87, dy: -0.5, lightX: null, sway: 'tuft' },
  { ...byId(FRAME_PIECES, 'ridgeR'), under: '7', depth: 0.6, dx: 0.5, dy: -0.87, lightX: null, sway: 'ridge' },
  { ...byId(FRAME_PIECES, 'tuftR'), under: 'ridgeR', depth: -0.1, dx: 0.87, dy: -0.5, lightX: null, sway: 'tuft' },
  { ...byId(FRAME_PIECES, 'beak'), under: '7', depth: 0.8, dx: 0, dy: 1, lightX: null },
  { ...byId(PARTS, '8'), depth: 0.95, lightX: 0 }
].map((mover, i, all) => {
  const length = Math.hypot(mover.cx, mover.cy)
  const parent = all.find((other) => other.id === mover.under)
  return {
    ...mover,
    slot: SLOTS[mover.id].x,
    dx: mover.dx ?? (length > 1 ? mover.cx / length : 0),
    dy: mover.dy ?? (length > 1 ? mover.cy / length : 0),
    // Measured from the part it rides on (which is measured from the frame, which doesn't turn).
    depth: mover.depth - (parent?.depth ?? 0),
    lightX: mover.lightX === undefined ? mover.cx : mover.lightX,
    // Each part drifts on two slow waves of its own (ms), so the gaps never line up into one rhythm.
    periodA: 2900 + i * 370,
    periodB: 4700 + i * 530,
    phase: i * 0.37
  }
})

// The channels of a part, an eye, the face and the beam, as offsets from the target's first slot.
const [X, Y, R, S, SX, SY, SPREAD, O] = [0, 1, 2, 3, 4, 5, 6, 7]
const [EYE_X, EYE_Y, EYE_R, EYE_S, EYE_OPEN, EYE_LID, EYE_UNDER, EYE_B, EYE_TINT] = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const [EYE_PUPIL, EYE_COOL] = [9, 10]
const FACE = SLOTS.face.x
const [FACE_X, FACE_Y, FACE_R, FACE_S, FACE_TURN, FACE_PITCH] = [FACE, FACE + 1, FACE + 2, FACE + 3, FACE + 4, FACE + 5]
const [FACE_Z, FACE_FX, FACE_FY] = [FACE + 6, FACE + 7, FACE + 8]
const BEAM_X = SLOTS.beam.x
const BEAM_O = SLOTS.beam.o
const EYE_SLOTS = EYES.map((eye) => SLOTS[eye.id].x)

/** How wide the scan line's light falls on the parts, and how much the parts it isn't on dim. */
const BEAM_REACH = 26
const BEAM_DIM = 0.45

// SIZE. Below FULL_PX wide, movement that would be under a pixel grows so it still reads, up to MAX_GAIN
// at the smallest sizes, and her eyes grow and brighten with it: on the HUD's plate she's read at a
// glance, by her eyes and her outline.
const FULL_PX = 110
const MAX_GAIN = 2.2

// CROP. At icon sizes all of her doesn't fit in enough pixels to know her by, so she's drawn closer and
// what doesn't fit in her box reaches past it: first the tips of her tufts, then, smallest, the peaks of
// her brow and the very tip of her beak. Her eyes, brow and beak, which are what make her her, stay
// inside. The frame she's in cuts off the rest (or her own box does, with the `clip` prop). Each pair
// is [width in px, how many times closer]; in between it slides.
const CROP_STEPS = [
  [80, 1],
  [56, 1.34],
  [22, 1.7]
]
function autoZoom(px) {
  if (px >= CROP_STEPS[0][0]) return 1
  for (let i = 1; i < CROP_STEPS.length; i++) {
    const [wide, wideZoom] = CROP_STEPS[i - 1]
    const [narrow, narrowZoom] = CROP_STEPS[i]
    if (px >= narrow) return wideZoom + ((wide - px) / (wide - narrow)) * (narrowZoom - wideZoom)
  }
  return CROP_STEPS[CROP_STEPS.length - 1][1]
}
/** The art's box (units), and how far down the beak's tip is. */
const ART_WIDTH = 192
const ART_HEIGHT = 112
const BEAK_TIP = 47.6
/** Under this width a face draws every other frame: nobody can see 60 fps in 22 px. */
const SMALL_PX = 30

/** A real voice level older than this (ms) is stale: she goes back to her made-up voice. */
const VOICE_STALE_MS = 300

const TAU = 2 * Math.PI
const RADIANS = Math.PI / 180
const compiledStates = {}
const stateFor = (name) => (compiledStates[name] ??= compileState(name in STATES ? name : 'idle'))

let instances = 0
const random = (min, max) => min + Math.random() * (max - min)
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const smoothstep = (p) => {
  const x = clamp(p, 0, 1)
  return x * x * (3 - 2 * x)
}

/** Pokes closer together than this (ms) count as one streak. */
const POKE_GAP_MS = 900
const POKES_TO_BURST = 6
const POKE_REACTIONS = ['flash', 'sideEye', 'no', 'huff', 'glitch']

export default {
  name: 'MinervaFace',
  props: {
    state: { type: String, default: 'idle', validator: (name) => name in STATES },
    size: { type: [Number, String], default: 120 },
    color: { type: String, default: '#ffffff' },
    accent: { type: String, default: '#e1177c' },
    cool: { type: String, default: '#2ec4e6' },
    crop: { type: [String, Number], default: 'auto' },
    clip: { type: Boolean, default: false },
    speed: { type: Number, default: 1 },
    motion: { type: String, default: 'auto', validator: (value) => ['auto', 'full', 'reduced'].includes(value) },
    assembleOnMount: { type: Boolean, default: false },
    pokeable: { type: Boolean, default: false }
  },
  emits: ['done', 'poke'],
  data() {
    const id = ++instances
    return {
      facets: FACETS,
      frameSides: [
        { ridge: byId(FRAME_PIECES, 'ridgeL'), tuft: byId(FRAME_PIECES, 'tuftL') },
        { ridge: byId(FRAME_PIECES, 'ridgeR'), tuft: byId(FRAME_PIECES, 'tuftR') }
      ],
      beak: byId(FRAME_PIECES, 'beak'),
      forehead: byId(PARTS, '8'),
      eyes: EYES,
      artOffset: `translate(${-ART_ORIGIN} ${-ART_ORIGIN})`,
      ids: {
        iris: `minerva-iris-${id}`,
        irisAccent: `minerva-iris-accent-${id}`,
        irisCool: `minerva-iris-cool-${id}`,
        flare: `minerva-flare-${id}`,
        beam: `minerva-beam-${id}`,
        beamCore: `minerva-beam-core-${id}`,
        lids: `minerva-lids-${id}`,
        pupil: `minerva-pupil-${id}`
      },
      pupilHole: PUPIL_HOLE,
      // How much closer she's drawn at small sizes (see CROP); set from her measured width.
      zoom: 1,
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
    },
    /** The part of the art she's drawn from: all of it, or closer in at small sizes (see CROP). */
    viewBox() {
      const width = ART_WIDTH / this.zoom
      const height = ART_HEIGHT / this.zoom
      // Closer in, keep the beak's tip in view for as long as the brow's peaks fit too, then share the loss.
      const middle = Math.min(BEAK_TIP + 1.5 - height / 2, 7.5 + (this.zoom - 1.35) * 10)
      const top = this.zoom > 1 ? Math.max(-ART_HEIGHT / 2, middle - height / 2) : -ART_HEIGHT / 2
      return `${-width / 2} ${top} ${width} ${height}`
    },
    /** Her gradients: [offset, opacity] stops from the middle out. */
    glows() {
      // An iris is solid to its edge, a shade deeper at the rim.
      const iris = [
        ['0%', 1],
        ['60%', 1],
        ['100%', 0.95]
      ]
      const soft = [
        ['0%', 0.75],
        ['40%', 0.3],
        ['100%', 0]
      ]
      const core = [
        ['0%', 1],
        ['50%', 0.9],
        ['100%', 0]
      ]
      return [
        { id: this.ids.iris, color: this.color, stops: iris },
        { id: this.ids.irisAccent, color: this.accent, stops: iris },
        { id: this.ids.irisCool, color: this.cool, stops: iris },
        { id: this.ids.flare, color: this.color, stops: soft },
        { id: this.ids.beam, color: this.cool, stops: soft },
        { id: this.ids.beamCore, color: this.color, stops: core }
      ]
    }
  },
  watch: {
    state(name) {
      this.enterState(name)
    },
    crop() {
      this.setWidth(this.px)
    },
    size() {
      // A number is her width; a CSS width is measured once she's laid out (see mounted).
      if (typeof this.size === 'number') this.setWidth(this.size)
    }
  },
  created() {
    // Not reactive: the frame loop reads and writes these sixty times a second.
    this.clock = 0
    this.lastNow = null
    this.owed = 0 // time not yet drawn, while a small face skips a frame
    this.visible = true
    this.layers = [] // states cross-fading, oldest first: { compiled, from }
    this.active = [] // one-offs playing: { compiled, start, fadeFrom }
    this.held = null // a one-off's last pose kept after it ends (Disassemble)
    this.pose = emptyPose() // this frame's pose, added up
    this.sprung = emptyPose() // where the springs are: the state's pose, in transit
    this.velocity = emptyPose()
    this.settling = false
    this.look = { x: 0, y: 0 }
    this.lookTarget = { x: 0, y: 0 }
    this.headTurn = 0 // her head, following her eyes a beat late
    this.voice = 0
    this.voiceFed = null
    this.voiceFedAt = 0
    this.ticAt = []
    this.setWidth(typeof this.size === 'number' ? this.size : 120)
    this.enterState(this.state, true)
  },
  mounted() {
    this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (this.motionQuery) {
      this.systemReduced = this.motionQuery.matches
      this.onMotionChange = (event) => (this.systemReduced = event.matches)
      this.motionQuery.addEventListener?.('change', this.onMotionChange)
    }
    this.collectElements()
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(([entry]) => this.setWidth(entry.contentRect.width))
      this.resizeObserver.observe(this.$el)
    }
    if (typeof IntersectionObserver !== 'undefined') {
      this.viewObserver = new IntersectionObserver(([entry]) => (this.visible = entry.isIntersecting))
      this.viewObserver.observe(this.$el)
    }
    if (this.assembleOnMount) this.play('assemble')
    this.draw(0)
    this.stopFrames = onFrame((now) => this.frame(now))
  },
  beforeUnmount() {
    clearTimeout(this.pokeTimer)
    this.stopFrames?.()
    this.resizeObserver?.disconnect()
    this.viewObserver?.disconnect()
    this.motionQuery?.removeEventListener?.('change', this.onMotionChange)
  },
  methods: {
    /** A click on her: each poke in a streak gets a sharper reaction, and enough of them in a row burst her apart. */
    poke(event) {
      event.stopPropagation()
      const now = performance.now()
      if (this.bursting) return
      this.pokes = now - (this.lastPoke ?? -Infinity) < POKE_GAP_MS ? (this.pokes ?? 0) + 1 : 1
      this.lastPoke = now
      if (this.pokes >= POKES_TO_BURST) {
        this.pokes = 0
        this.bursting = true
        this.play('disassemble')
        this.pokeTimer = setTimeout(() => {
          this.play('assemble')
          this.pokeTimer = setTimeout(() => (this.bursting = false), ONE_OFFS.assemble.duration)
        }, 1400)
        return this.$emit('poke', POKES_TO_BURST, true)
      }
      // With reduced motion some reactions don't play; she still answers every poke.
      if (!this.play(POKE_REACTIONS[(this.pokes - 1) % POKE_REACTIONS.length])) this.play('flash')
      this.$emit('poke', this.pokes, false)
    },

    /**
     * Plays a one-off over the current state.
     * @param {string} name a key of ONE_OFFS
     * @returns {boolean} whether it plays (false: unknown, skipped for reduced motion, or she's apart)
     */
    play(name) {
      const def = ONE_OFFS[name]
      if (!def || (this.reduced && def.reduced === 'skip')) return false
      // Apart (or coming apart): only the one-off that brings her back plays on that layer.
      let holding = this.held?.def.layer === def.layer ? this.held : null
      for (const playing of this.active) {
        if (playing.compiled.def.hold && playing.compiled.def.layer === def.layer) holding = playing.compiled
      }
      if (holding && !def.releases?.includes(holding.name)) return false
      for (const playing of this.active) {
        if (playing.compiled.def.layer === def.layer && playing.fadeFrom === null) playing.fadeFrom = this.clock
      }
      if (this.held && def.releases?.includes(this.held.name)) this.held = null
      this.active.push({ compiled: compileOneOff(name, this.reduced), start: this.clock, fadeFrom: null })
      return true
    },

    /**
     * Feeds her real voice to Talking: how loud it is right now, 0 to 1. Call it as often as you have a
     * level; null (or silence from you for VOICE_STALE_MS) hands Talking back to her made-up voice.
     * @param {number | null} level
     */
    setVoice(level) {
      this.voiceFed = level === null || level === undefined ? null : clamp(level, 0, 1)
      this.voiceFedAt = performance.now()
    },

    /** Whether a one-off is playing (and not already fading out) on a layer. */
    layerBusy(layer) {
      if (this.held?.def.layer === layer) return true
      for (const playing of this.active) {
        if (playing.compiled.def.layer === layer && playing.fadeFrom === null) return true
      }
      return false
    },

    /** Plays a one-off only if nothing else is using its layer: for what she does on her own. */
    playIfFree(name) {
      const def = ONE_OFFS[name]
      return Boolean(def) && !this.layerBusy(def.layer) && this.play(name)
    },

    enterState(name, immediately = false) {
      const compiled = stateFor(name)
      if (immediately) {
        this.layers = [{ compiled, from: -BLEND_MS }]
        this.sprung.set(compiled.pose)
        this.velocity.fill(0)
      } else {
        this.layers.push({ compiled, from: this.clock })
        this.settling = true
        if (compiled.def.enter) this.play(compiled.def.enter)
      }
      const { blink, glance, tics } = compiled.def
      this.nextBlink = blink ? this.clock + random(...blink) : Infinity
      this.nextGlance = glance ? this.clock + random(...glance.every) : Infinity
      this.glanceBack = Infinity
      this.ticAt = (tics ?? []).map((tic) => this.clock + random(...tic.every))
      if (!glance) {
        this.lookTarget.x = 0
        this.lookTarget.y = 0
      }
    },

    /**
     * Her drawn width in px sets how close she's drawn (see CROP) and how much small movements and her
     * eyes are enlarged (see SIZE).
     */
    setWidth(px) {
      if (!(px > 0)) return
      this.px = px
      const zoom = typeof this.crop === 'number' ? Math.max(1, this.crop) : this.crop === 'none' ? 1 : autoZoom(px)
      // Reactive, so only touched when it changes (it redraws the viewBox).
      if (Math.abs(zoom - this.zoom) > 0.005) this.zoom = zoom
      this.gain = clamp((FULL_PX / (px * zoom)) ** 0.6, 1, MAX_GAIN)
    },

    /**
     * Finds the elements she moves, and gives each a transform she can write numbers into: setting a
     * matrix on an SVGTransform costs no string to build or parse, unlike setAttribute.
     */
    collectElements() {
      const svg = this.$el
      const matrix = svg.createSVGMatrix?.()
      const moved = (el, transforms = true) => {
        let transform = null
        if (transforms && matrix && el.transform?.baseVal) {
          transform = el.transform.baseVal.initialize(svg.createSVGTransform())
        }
        // `last`: what was last written, so a part that hasn't moved isn't written again.
        return { el, transform, last: new Float64Array(6).fill(NaN), opacity: NaN }
      }
      const part = (id) => svg.querySelector(`[data-part="${id}"]`)
      this.matrix = matrix
      this.faceEl = moved(part('face'))
      this.beamEl = moved(part('beam'))
      this.moverEls = MOVERS.map((mover) => moved(part(mover.id)))
      this.eyeEls = EYES.map((eye) => {
        const [flare, lidded] = part(eye.id).children
        const [own, accent, cool] = lidded.children[0].children
        return {
          eye: moved(part(eye.id)),
          lids: moved(part(`${eye.id}.lids`)),
          pupil: moved(part(`${eye.id}.pupil`)),
          // These only fade.
          flare: moved(flare, false),
          own: moved(own, false),
          accent: moved(accent, false),
          cool: moved(cool, false)
        }
      })
    },

    frame(now) {
      const dt = this.lastNow === null ? 16 : Math.min(100, now - this.lastNow)
      this.lastNow = now
      if (!this.visible) return
      this.owed += dt
      // A very small face draws every other frame.
      if (this.px < SMALL_PX && (this.skipped = !this.skipped)) return
      this.draw(this.owed * this.speed)
      this.owed = 0
    },

    /** Advances the clock by dt (ms), works out every part's pose, and sets it on the elements. */
    draw(dt) {
      const t = (this.clock += dt)
      const pose = this.pose
      const motion = this.reduced ? 0.35 : 1

      // The state's pose: springs carry it from the last state's.
      const top = this.layers[this.layers.length - 1].compiled
      if (this.settling) this.settling = stepSprings(this.sprung, this.velocity, top.pose, dt, this.reduced)
      pose.set(this.sprung)

      // What keeps moving, newest state on top: it fades in over BLEND_MS and the older ones share what's left.
      const voice = top.talks ? this.voiceLevel(t, dt) : 0
      let remaining = 1
      let breathe = 0
      let float = 0
      for (let i = this.layers.length - 1; i >= 0; i--) {
        const layer = this.layers[i]
        const mix = i === 0 ? 1 : smoothstep((t - layer.from) / BLEND_MS)
        const weight = remaining * mix
        remaining -= weight
        addWaves(pose, layer.compiled, t, weight, motion, voice)
        breathe += (layer.compiled.def.breathe ?? 1) * weight
        float += (layer.compiled.def.float ?? 1) * weight
        if (i > 0 && mix >= 1) {
          this.layers.splice(0, i)
          break
        }
      }

      this.breatheParts(pose, t, breathe * motion)
      pose[FACE_Y] += 2 * float * motion * Math.sin((TAU * t) / 4200)
      pose[FACE_R] += 0.5 * float * motion * Math.sin((TAU * t) / 6100 + 1)

      this.runEvents(t, dt, motion, top.def)
      for (const slot of EYE_SLOTS) {
        pose[slot + EYE_X] += this.look.x
        pose[slot + EYE_Y] += this.look.y
      }
      pose[FACE_TURN] += this.headTurn
      pose[FACE_R] += this.headTurn * 0.25

      this.addOneOffs(pose, t)
      this.render(pose)
    },

    /** How loud she is right now (0…1): her real voice if the game is feeding it, else her made-up one. */
    voiceLevel(t, dt) {
      const real = this.voiceFed !== null && performance.now() - this.voiceFedAt < VOICE_STALE_MS
      const level = real ? this.voiceFed : speech(t)
      // The beak opens faster than it closes.
      const ease = 1 - Math.exp(-dt / (level > this.voice ? 35 : 90))
      return (this.voice += (level - this.voice) * ease)
    },

    /**
     * The gaps breathe: each facet drifts toward and away from the center and turns a hair, all of them
     * swell together on a slow breath, and the tufts and ridges stir.
     */
    breatheParts(pose, t, amount) {
      if (amount <= 0) return
      const breath = 0.45 * amount * Math.sin((TAU * t) / 5200)
      for (const mover of MOVERS) {
        if (!mover.sway) continue
        const a = TAU * (t / mover.periodA + mover.phase)
        const b = TAU * (t / mover.periodB + mover.phase * 2)
        const slot = mover.slot
        if (mover.sway === 'tuft') {
          pose[slot + R] += amount * 0.9 * Math.sin(b) * (mover.cx < 0 ? 1 : -1)
        } else if (mover.sway === 'ridge') {
          pose[slot + R] += amount * 0.35 * Math.sin(a) * (mover.cx < 0 ? 1 : -1)
        } else {
          const out = amount * (0.7 * Math.sin(a) + 0.4 * Math.sin(b)) + breath
          pose[slot + X] += mover.dx * out + amount * 0.35 * Math.sin(b + 1.7)
          pose[slot + Y] += mover.dy * out + amount * 0.35 * Math.sin(a + 0.6)
          pose[slot + R] += amount * 0.6 * Math.sin(b + 0.9)
        }
      }
    },

    /**
     * What she does on her own, on the current state's timers: blinks, glances, tics. Her eyes jump to
     * where they look and her head turns after them, a beat late.
     */
    runEvents(t, dt, motion, def) {
      if (t >= this.nextBlink) {
        this.playIfFree(def.blinkWith ?? 'blink')
        this.nextBlink = t + random(...def.blink)
      }
      for (let i = 0; i < this.ticAt.length; i++) {
        if (t < this.ticAt[i]) continue
        const tic = def.tics[i]
        this.playIfFree(tic.play)
        this.ticAt[i] = t + random(...tic.every)
      }
      const glance = def.glance
      const target = this.lookTarget
      if (glance && t >= this.nextGlance) {
        const before = target.x
        const center = Math.random() < 0.3
        target.x = center ? 0 : random(-glance.x, glance.x) * motion
        target.y = center ? 0 : random(-glance.y, glance.y) * motion
        this.nextGlance = t + random(...glance.every)
        this.glanceBack = glance.hold ? t + random(...glance.hold) : Infinity
        // A long look across is covered by a blink, as eyes do.
        if (Math.abs(target.x - before) > 0.7 * glance.x && Math.random() < 0.5) this.playIfFree('blink')
      } else if (t >= this.glanceBack) {
        target.x = 0
        target.y = 0
        this.glanceBack = Infinity
      }
      const eyes = 1 - Math.exp(-dt / 55)
      this.look.x += (target.x - this.look.x) * eyes
      this.look.y += (target.y - this.look.y) * eyes
      const follow = this.reduced ? 0 : (glance?.face ?? 0)
      this.headTurn += (this.look.x * follow - this.headTurn) * (1 - Math.exp(-dt / 260))
    },

    addOneOffs(pose, t) {
      if (this.held) addOneOff(pose, this.held, 1)
      const active = this.active
      let kept = 0
      for (let i = 0; i < active.length; i++) {
        const playing = active[i]
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
        active[kept++] = playing
      }
      active.length = kept
    },

    /** Writes a transform (the six numbers of a matrix) to an element, if it changed. */
    setTransform(target, a, b, c, d, e, f) {
      const last = target.last
      if (
        Math.abs(last[4] - e) < 0.004 &&
        Math.abs(last[5] - f) < 0.004 &&
        Math.abs(last[0] - a) < 0.0004 &&
        Math.abs(last[1] - b) < 0.0004 &&
        Math.abs(last[2] - c) < 0.0004 &&
        Math.abs(last[3] - d) < 0.0004
      ) {
        return
      }
      last[0] = a
      last[1] = b
      last[2] = c
      last[3] = d
      last[4] = e
      last[5] = f
      if (target.transform) {
        const matrix = this.matrix
        matrix.a = a
        matrix.b = b
        matrix.c = c
        matrix.d = d
        matrix.e = e
        matrix.f = f
        target.transform.setMatrix(matrix)
      } else {
        target.el.setAttribute('transform', `matrix(${a} ${b} ${c} ${d} ${e} ${f})`)
      }
    },

    /** Writes an opacity to an element, if it changed by enough to see. */
    setOpacity(target, opacity) {
      // (Fully there and fully gone are always written, so a fade never stops a hair short.)
      if (
        Math.abs(target.opacity - opacity) < 0.004 &&
        (target.opacity === opacity || (opacity !== 0 && opacity !== 1))
      )
        return
      target.opacity = opacity
      target.el.setAttribute('opacity', Math.round(opacity * 1000) / 1000)
    },

    /**
     * Writes a part's transform: at (x, y), turned r degrees and scaled (sx, sy) about its own center
     * (cx, cy).
     */
    place(target, cx, cy, x, y, r, sx, sy) {
      const cos = r === 0 ? 1 : Math.cos(r * RADIANS)
      const sin = r === 0 ? 0 : Math.sin(r * RADIANS)
      const a = cos * sx
      const b = sin * sx
      const c = -sin * sy
      const d = cos * sy
      this.setTransform(target, a, b, c, d, x - (a * cx + c * cy), y - (b * cx + d * cy))
    },

    render(pose) {
      if (!this.moverEls) return
      const gain = this.gain
      const turnGain = 1 + (gain - 1) * 0.5
      const turn = pose[FACE_TURN] * gain
      const pitch = pose[FACE_PITCH] * gain
      const beam = clamp(pose[BEAM_O], 0, 1)
      const beamX = pose[BEAM_X]

      // Her whole face: floated and turned, and brought toward you or drawn back (z). As she comes close,
      // the point of her face named by fx, fy is what arrives at the middle (an eye, when she peers).
      const zoom = (1 + pose[FACE_S]) * Math.max(0.1, 1 + pose[FACE_Z])
      this.place(
        this.faceEl,
        pose[FACE_FX],
        pose[FACE_FY],
        pose[FACE_X] * gain,
        pose[FACE_Y] * gain,
        pose[FACE_R] * turnGain,
        zoom,
        zoom
      )

      for (let i = 0; i < MOVERS.length; i++) {
        const mover = MOVERS[i]
        const target = this.moverEls[i]
        const slot = mover.slot
        const spread = pose[slot + SPREAD]
        const grow = 1 + pose[slot + S]
        this.place(
          target,
          mover.cx,
          mover.cy,
          mover.cx + (pose[slot + X] + mover.dx * spread) * gain + turn * mover.depth,
          mover.cy + (pose[slot + Y] + mover.dy * spread) * gain + pitch * mover.depth,
          pose[slot + R] * turnGain,
          grow * (1 + pose[slot + SX]),
          grow * (1 + pose[slot + SY])
        )
        let opacity = clamp(1 + pose[slot + O], 0, 1)
        if (beam > 0 && mover.lightX !== null) {
          // The scan line lights what it's passing; everything else dims a little, so the light shows.
          const lit = Math.max(0, 1 - Math.abs(mover.lightX - beamX) / BEAM_REACH)
          opacity *= 1 - BEAM_DIM * beam * (1 - lit)
        }
        this.setOpacity(target, opacity)
      }

      this.place(this.beamEl, 0, 0, beamX, 0, 0, 1, 1)
      this.setOpacity(this.beamEl, beam * 0.85)

      const eyeGain = 1 + (gain - 1) * 0.4
      const eyeBoost = 1 + (gain - 1) * 0.35
      for (let i = 0; i < EYES.length; i++) {
        const eye = EYES[i]
        const els = this.eyeEls[i]
        const slot = EYE_SLOTS[i]
        const open = pose[slot + EYE_OPEN]
        const upper = clamp((1 + open + pose[slot + EYE_LID]) * eye.lid, 0, 1.2)
        const lower = clamp(1 + open + pose[slot + EYE_UNDER], 0, 1.2)
        const x = pose[slot + EYE_X] * eyeGain
        const y = pose[slot + EYE_Y] * eyeGain
        let bright = 1 + pose[slot + EYE_B]
        if (beam > 0) bright += 0.6 * beam * Math.max(0, 1 - Math.abs(eye.cx - beamX) / BEAM_REACH)
        bright = clamp(bright, 0, 2.2)
        // Past full brightness she can only get bigger: a flash swells the eye and throws a glow.
        const flash = Math.max(0, bright - 1)
        const size = Math.max(0, 1 + pose[slot + EYE_S]) * eyeBoost * (1 + flash * 0.12)
        const angle = eye.angle + (eye.mirror ? -pose[slot + EYE_R] : pose[slot + EYE_R])
        // The eye shifts only a little in its socket; the pupil leads the look inside it.
        this.place(
          els.eye,
          0,
          0,
          eye.cx + x * 0.45 + turn * EYE_DEPTH,
          eye.cy + y * 0.45 + pitch * EYE_DEPTH,
          angle,
          size,
          size
        )
        // The lids: the open band runs from the upper lid's edge to the lower's.
        const radius = eye.radius
        this.setTransform(els.lids, 1, 0, 0, ((upper + lower) / 2) * radius, 0, ((lower - upper) / 2) * radius)
        // The pupil: wider or tighter, and off-center toward where she looks, always inside the iris.
        const pupil = clamp(eye.pupil * (1 + pose[slot + EYE_PUPIL]), 0.4, radius - IRIS_RIM)
        const reach = radius - IRIS_RIM - pupil
        this.setTransform(els.pupil, pupil, 0, 0, pupil, clamp(x * 0.55, -reach, reach), clamp(y * 0.55, -reach, reach))
        const glow = Math.min(1, bright)
        const tint = clamp(pose[slot + EYE_TINT], 0, 1)
        const cool = clamp(pose[slot + EYE_COOL], 0, 1) * (1 - tint)
        this.setOpacity(els.own, glow * (1 - tint - cool))
        this.setOpacity(els.accent, glow * tint)
        this.setOpacity(els.cool, glow * cool)
        this.setOpacity(els.flare, Math.min(1, flash) * 0.6)
      }
    }
  }
}
</script>

<style scoped>
.minerva-face {
  display: block;
  overflow: visible;
}
.minerva-face.clipped {
  overflow: hidden;
}
.minerva-face.pokeable {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>
