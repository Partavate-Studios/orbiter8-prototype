// Minerva's expressions, as data. minerva-face.vue draws them; this file says how each part sits and
// moves. Adding a state or a one-off is an entry in STATES or ONE_OFFS below, nothing else.
//
// POSES. A pose says how far each target moves from where the emblem draws it, in the art's units (the
// owl is about 178 wide). Targets:
//   '1'…'8'  one part (minerva-parts.js numbers them). Channels: x, y (move; +x right, +y down),
//            r (turn, degrees, clockwise), s (grow: 0.1 is 10% bigger), sx, sy (grow one way),
//            spread (move away from the face's center), o (fade: -1 is gone).
//   brow, cheek, jaw  a mirrored pair (1+4, 2+5, 3+6). Here x means outward (away from the beak) and
//            r means "outer end up", so one number poses both sides alike.
//   sides    all six facets, mirrored the same way. all: all eight parts (for spread, y, o).
//   eyeL, eyeR, eyes  the glows in the gaps. Channels: x, y (look; both eyes the same way), s (size),
//            open (-1 shut, +0.3 wide), b (brightness: +1 is a flash, -1 dark), r.
//   face     the whole owl: x, y, r, s.
//
// STATES loop, one at a time. Each has:
//   pose     where the parts sit while in the state
//   waves    what keeps moving: { target: { channel: [amount, period ms, phase 0–1, shape] } },
//            shape 'sin' (default) or 'talk' (uneven bursts, like syllables)
//   breathe  how much the gaps between the parts drift (1 is the idle drift; 0 still)
//   float    how much the whole owl floats
//   blink    [min, max] ms between blinks (null: none), blinkWith: the one-off that blinks (default 'blink')
//   glance   { every: [min, max] ms, x, y: how far the eyes look, hold: [min, max] ms, face: how much the
//            owl turns with them } (null: none)
// Switching states blends from one to the next over BLEND_MS.
//
// ONE_OFFS play once over the state, then let go: { layer, duration ms, keys: [[0–1, pose], …] }, the
// pose eased from key to key (step: true snaps instead). Keys left out of a pose are 0, so a one-off that
// starts and ends with {} returns exactly to the state. One-offs on different layers play together;
// firing one on a layer that's busy fades the old one out quickly and starts the new one (restart, never
// queue: she reacts to the latest thing). hold: true keeps the last key's pose after it ends, until a
// one-off that names it in `releases` plays; until then, other one-offs on its layer don't play. reduced: 'skip' doesn't play with reduced motion; 'fade'
// keeps only its fading and brightness.

export const BLEND_MS = 450
/** How quickly a one-off that's been replaced fades out (ms). */
export const REPLACE_FADE_MS = 160

const PART_IDS = ['1', '2', '3', '4', '5', '6', '7', '8']
const LEFT = ['1', '2', '3']
const RIGHT = ['4', '5', '6']

/** Alias → [target, mirror] (mirror: x and r flip for the left side, see the header). */
const ALIASES = {
  brow: [
    ['1', true],
    ['4', false]
  ],
  cheek: [
    ['2', true],
    ['5', false]
  ],
  jaw: [
    ['3', true],
    ['6', false]
  ],
  sides: [...LEFT.map((id) => [id, true]), ...RIGHT.map((id) => [id, false])],
  all: PART_IDS.map((id) => [id, null]),
  eyes: [
    ['eyeL', null],
    ['eyeR', null]
  ]
}

export const PART_CHANNELS = ['x', 'y', 'r', 's', 'sx', 'sy', 'spread', 'o']
export const EYE_CHANNELS = ['x', 'y', 'r', 's', 'open', 'b']
export const FACE_CHANNELS = ['x', 'y', 'r', 's']
/** Every target a pose can reach, after aliases, and its channels. */
export const TARGETS = {
  ...Object.fromEntries(PART_IDS.map((id) => [id, PART_CHANNELS])),
  eyeL: EYE_CHANNELS,
  eyeR: EYE_CHANNELS,
  face: FACE_CHANNELS
}

/**
 * One key (an alias or a target) and channel → the targets it moves and by what factor.
 * mirror true: the left side, where outward is -x; outer-end-up on the left is clockwise (+r) and on
 * the right counterclockwise, so the right side flips r.
 */
function expand(key, channel) {
  const alias = ALIASES[key]
  if (!alias) return [[key, 1]]
  return alias.map(([target, left]) => {
    if (left === null) return [target, 1]
    if (channel === 'x') return [target, left ? -1 : 1]
    if (channel === 'r') return [target, left ? 1 : -1]
    return [target, 1]
  })
}

/** A pose as written → a flat list of [target, channel, value]. */
export function compilePose(pose = {}) {
  const out = []
  for (const [key, channels] of Object.entries(pose)) {
    for (const [channel, value] of Object.entries(channels)) {
      for (const [target, factor] of expand(key, channel)) out.push([target, channel, value * factor])
    }
  }
  return out
}

/** Waves as written → a flat list of [target, channel, amount, period, phase, shape]. */
export function compileWaves(waves = {}) {
  const out = []
  for (const [key, channels] of Object.entries(waves)) {
    for (const [channel, [amount, period, phase = 0, shape = 'sin']] of Object.entries(channels)) {
      for (const [target, factor] of expand(key, channel)) {
        out.push([target, channel, amount * factor, period, phase, shape])
      }
    }
  }
  return out
}

/** A wave's value at time t (ms): -1…1 for 'sin', 0…1 for 'talk'. */
export function waveValue(t, period, phase, shape) {
  const a = 2 * Math.PI * (t / period + phase)
  if (shape === 'talk') {
    // Syllables: a bump per period, uneven in height, with short rests where the slower wave dips.
    const bump = Math.max(0, Math.sin(a))
    const phrase = 0.55 + 0.45 * Math.sin(a / 2.7 + 1.3)
    return bump * Math.max(0, phrase)
  }
  return Math.sin(a)
}

/** Waves that move each listed part in a small circle, each a little behind the last: "working". */
function orbit(ids, radius, period) {
  return Object.fromEntries(
    ids.map((id, i) => [
      id,
      {
        x: [radius, period, i / ids.length],
        y: [radius, period, i / ids.length + 0.25]
      }
    ])
  )
}

// Where the parts start from when she assembles (and end when she comes apart): flung out, turned, faded.
const SCATTER = {
  all: { spread: 70, o: -1 },
  1: { r: -40, y: -10 },
  2: { r: 25, y: 6 },
  3: { r: -30, y: 14 },
  4: { r: 35, y: -12 },
  5: { r: -20, y: 8 },
  6: { r: 28, y: 16 },
  7: { s: 0.4, r: 4 },
  8: { y: 30, r: 90 },
  eyes: { b: -1, open: -1 }
}

export const STATES = {
  idle: {
    label: 'Idle',
    about: 'Floating; the gaps drift; now and then a blink or a glance.',
    breathe: 1,
    float: 1,
    blink: [2500, 6500],
    glance: { every: [2500, 7000], x: 4, y: 1.2, hold: [500, 1600], face: 0.15 }
  },
  talking: {
    label: 'Talking',
    about: 'A message is showing: the beak and facets move with her words.',
    breathe: 0.7,
    float: 0.8,
    waves: {
      8: { y: [1.8, 240, 0, 'talk'] },
      7: { sy: [0.022, 240, 0.05, 'talk'] },
      jaw: { y: [1.6, 240, 0.08, 'talk'], x: [0.7, 240, 0.08, 'talk'] },
      cheek: { x: [0.8, 480, 0.2, 'talk'] },
      eyes: { b: [0.15, 480, 0, 'talk'] }
    },
    blink: [2000, 5000],
    glance: { every: [1800, 4000], x: 2, y: 0.6, hold: [400, 900], face: 0.1 }
  },
  thinking: {
    label: 'Thinking',
    about: 'A move is going through on chain: the parts circle, the eyes scan.',
    breathe: 0.5,
    float: 0.6,
    pose: { eyes: { open: -0.3 } },
    waves: {
      ...orbit(['1', '2', '3', '8', '6', '5', '4'], 1.4, 2400),
      eyes: { x: [5, 2200, 0], b: [0.15, 1100, 0] }
    },
    blink: [4000, 8000]
  },
  surprised: {
    label: 'Surprised',
    about: 'Parts spread, eyes wide.',
    breathe: 1.3,
    float: 1,
    pose: {
      brow: { y: -3.5, r: -5, x: 0.8 },
      cheek: { x: 2, y: 1 },
      jaw: { x: 2.5, y: 2.5 },
      8: { y: -1.5 },
      7: { sy: 0.04 },
      eyes: { s: 0.35, open: 0.3, b: 0.35 }
    },
    blink: [5000, 9000]
  },
  annoyed: {
    label: 'Annoyed',
    about: 'Brow pressed down, a tighter face.',
    breathe: 0.5,
    float: 0.5,
    pose: {
      7: { sy: -0.06, sx: 0.015 },
      brow: { y: 2.2, r: 9, x: -0.5 },
      cheek: { x: -1, y: -1 },
      jaw: { x: -0.8, y: -1.5 },
      8: { y: 1 },
      eyes: { open: -0.55, s: -0.05 }
    },
    blink: [3000, 6000],
    glance: { every: [4000, 8000], x: 2.5, y: 0.5, hold: [800, 1600], face: 0.1 }
  },
  nervous: {
    label: 'Nervous',
    about: 'Looking around: the eyes and face dart side to side.',
    breathe: 1.4,
    float: 0.6,
    pose: { brow: { y: -1.5, r: -5 }, eyes: { s: 0.1 } },
    blink: [1200, 3000],
    glance: { every: [250, 900], x: 7, y: 2, hold: [150, 500], face: 0.6 }
  },
  listening: {
    label: 'Listening',
    about: 'An input box has focus: she leans in and holds still, eyes on you.',
    breathe: 0.6,
    float: 0.5,
    pose: { face: { s: 0.04, y: 1 }, brow: { y: -0.8 }, eyes: { s: 0.08, b: 0.15 } },
    blink: [3500, 7000],
    glance: { every: [4000, 8000], x: 1.5, y: 0.6, hold: [600, 1200], face: 0 }
  },
  waiting: {
    label: 'Waiting on you',
    about: 'The wallet is waiting for you to sign: patient, a little pointed.',
    breathe: 0.7,
    float: 0.8,
    pose: { face: { r: -3 }, 1: { y: -1 }, 4: { y: 0.6 }, eyes: { open: -0.15 } },
    waves: { face: { r: [1, 6000, 0] } },
    blink: [3000, 5000],
    blinkWith: 'slowBlink'
  },
  scanning: {
    label: 'Scanning',
    about: 'A scan is running: a steady sweep across the eyes.',
    breathe: 0.6,
    float: 0.6,
    pose: { eyes: { open: -0.25, s: 0.1 } },
    waves: {
      eyes: { x: [7, 1600, 0], b: [0.25, 800, 0.25] },
      cheek: { x: [0.6, 800, 0.25] }
    },
    blink: null
  },
  alert: {
    label: 'Alert',
    about: 'A siege or another urgent warning: tight, bright, steady.',
    breathe: 0.3,
    float: 0.3,
    pose: {
      face: { s: 0.03 },
      all: { spread: -1.5 },
      7: { sy: -0.02 },
      brow: { y: 1, r: 4 },
      eyes: { b: 0.5, s: 0.1, open: 0.1 }
    },
    waves: { eyes: { b: [0.2, 900, 0] } },
    blink: [6000, 10000]
  },
  skeptical: {
    label: 'Skeptical',
    about: "You're about to do something unwise: one brow raised.",
    breathe: 0.7,
    float: 0.7,
    pose: {
      face: { r: 3.5 },
      1: { y: -5, r: -8 },
      2: { y: -1 },
      4: { y: 1.8, r: -7 },
      eyeL: { open: 0.3, s: 0.15, y: -1 },
      eyeR: { open: -0.6, b: -0.15 }
    },
    blink: [3000, 6000]
  },
  offline: {
    label: 'Offline',
    about: 'No connection, or the terminal is idle: loose and dim.',
    breathe: 2.2,
    float: 0.4,
    pose: { all: { spread: 3, o: -0.35 }, eyes: { b: -0.65, s: -0.2, open: -0.6 } },
    waves: { eyes: { b: [0.12, 3500, 0] } },
    blink: null
  }
}

export const ONE_OFFS = {
  boom: {
    label: 'Boom',
    about: 'Every part expands outward, then back.',
    layer: 'body',
    duration: 900,
    reduced: 'skip',
    keys: [
      [0, {}],
      [0.3, { all: { spread: 16 }, 7: { s: 0.14 }, eyes: { s: 0.5, b: 0.6 } }],
      [1, {}]
    ]
  },
  no: {
    label: 'No',
    about: 'She shakes her head.',
    layer: 'body',
    duration: 750,
    keys: [
      [0, {}],
      [0.18, { face: { x: -7, r: -3 }, eyes: { x: -2 } }],
      [0.4, { face: { x: 6, r: 3 }, eyes: { x: 2 } }],
      [0.62, { face: { x: -4, r: -1.5 }, eyes: { x: -1 } }],
      [0.82, { face: { x: 2 } }],
      [1, {}]
    ]
  },
  nod: {
    label: 'Nod',
    about: 'A transaction went through: one small, deadpan nod.',
    layer: 'body',
    duration: 600,
    keys: [
      [0, {}],
      [0.35, { face: { y: 4, s: -0.02 }, brow: { y: 1 }, eyes: { y: 1, open: -0.2 } }],
      [1, {}]
    ]
  },
  flash: {
    label: 'Eye flash',
    about: 'A key pressed in an input box: she reads as you type.',
    layer: 'eyes',
    duration: 260,
    keys: [
      [0, {}],
      [0.15, { eyes: { b: 0.9, s: 0.12 } }],
      [1, {}]
    ]
  },
  blink: {
    label: 'Blink',
    about: 'A blink, for timing with dialogue (states blink on their own too).',
    layer: 'lids',
    duration: 170,
    keys: [
      [0, {}],
      [0.45, { eyes: { open: -1 } }],
      [1, {}]
    ]
  },
  slowBlink: {
    label: 'Slow blink',
    about: 'A long, unimpressed blink (Waiting on you blinks this way).',
    layer: 'lids',
    duration: 650,
    keys: [
      [0, {}],
      [0.3, { eyes: { open: -1 }, brow: { y: 0.6 } }],
      [0.55, { eyes: { open: -1 }, brow: { y: 0.6 } }],
      [1, {}]
    ]
  },
  assemble: {
    label: 'Assemble',
    about: 'Her console opens: the parts fly in and lock into place.',
    layer: 'body',
    duration: 1100,
    reduced: 'fade',
    releases: ['disassemble'],
    keys: [
      [0, SCATTER],
      [0.75, { all: { spread: -1 }, eyes: { b: -1, open: -1 } }],
      [0.85, { eyes: { b: 0.6 } }],
      [1, {}]
    ]
  },
  disassemble: {
    label: 'Disassemble',
    about: 'The console closes: she comes apart (Assemble brings her back).',
    layer: 'body',
    duration: 900,
    reduced: 'fade',
    hold: true,
    keys: [
      [0, {}],
      [0.2, { eyes: { b: -1, open: -1 }, all: { spread: -1 } }],
      [1, SCATTER]
    ]
  },
  glitch: {
    label: 'Glitch',
    about: 'A move failed or the network hiccuped: parts jitter out of place and snap back.',
    layer: 'body',
    duration: 420,
    reduced: 'skip',
    step: true,
    keys: [
      [0, {}],
      [0.08, { 2: { x: 3 }, 6: { x: -2.5, y: 1 }, 8: { x: 2 }, eyes: { x: 3, b: 0.5 } }],
      [0.2, { 1: { x: -3, y: -1 }, 5: { x: 2.5 }, 7: { x: 1.2 }, eyeL: { b: -0.8 } }],
      [0.3, {}],
      [0.42, { 3: { y: 2.5 }, 4: { x: 3 }, 7: { x: -1.5, sy: 0.02 }, eyes: { x: -3, b: 0.4 } }],
      [0.55, { 2: { x: -2 }, 8: { y: -2 }, eyeR: { b: -0.8 } }],
      [0.68, { face: { x: 2 } }],
      [0.78, {}],
      [1, {}]
    ]
  },
  ha: {
    label: 'Deadpan “ha”',
    about: 'After one of her jokes: a single, tiny bounce of the beak.',
    layer: 'body',
    duration: 450,
    keys: [
      [0, {}],
      [0.3, { 8: { y: -2 }, 7: { sy: 0.025 }, eyes: { open: -0.35 } }],
      [1, {}]
    ]
  }
}

/** A blank pose: every target's channels at 0. */
export function emptyPose() {
  return Object.fromEntries(
    Object.entries(TARGETS).map(([target, channels]) => [target, Object.fromEntries(channels.map((c) => [c, 0]))])
  )
}

/** Adds a compiled pose (list of [target, channel, value]) into `acc`, times `weight`. */
export function addCompiled(acc, compiled, weight = 1) {
  for (const [target, channel, value] of compiled) acc[target][channel] += value * weight
}

const smooth = (p) => p * p * (3 - 2 * p)

/**
 * Compiles a one-off for the face: its keys as compiled poses, and whether it plays with reduced motion.
 * @returns {{ name, def, keys: [number, any[]][] }}
 */
export function compileOneOff(name, reduced = false) {
  const def = ONE_OFFS[name]
  const keep =
    reduced && def.reduced === 'fade'
      ? (channel) => channel === 'o' || channel === 'b' || channel === 'open'
      : () => true
  const keys = def.keys.map(([at, pose]) => [at, compilePose(pose).filter(([, channel]) => keep(channel))])
  return { name, def, keys }
}

/** Adds a compiled one-off's pose at progress p (0–1) into `acc`, times `weight`. */
export function addOneOff(acc, compiled, p, weight = 1) {
  const { keys, def } = compiled
  if (p >= 1) return addCompiled(acc, keys[keys.length - 1][1], weight)
  let i = 0
  while (i < keys.length - 2 && p >= keys[i + 1][0]) i++
  const [a, poseA] = keys[i]
  const [b, poseB] = keys[i + 1]
  if (def.step) return addCompiled(acc, poseA, weight)
  const mix = smooth(Math.min(1, Math.max(0, (p - a) / (b - a || 1))))
  addCompiled(acc, poseA, weight * (1 - mix))
  addCompiled(acc, poseB, weight * mix)
}

/** Compiles a state: its pose and waves, ready to add each frame. */
export function compileState(name) {
  const def = STATES[name]
  return { name, def, pose: compilePose(def.pose), waves: compileWaves(def.waves) }
}

/** Adds a compiled state's pose and waves at time t into `acc`, times `weight` (waves times `motion` too). */
export function addState(acc, compiled, t, weight = 1, motion = 1) {
  addCompiled(acc, compiled.pose, weight)
  for (const [target, channel, amount, period, phase, shape] of compiled.waves) {
    acc[target][channel] += amount * waveValue(t, period, phase, shape) * weight * motion
  }
}
