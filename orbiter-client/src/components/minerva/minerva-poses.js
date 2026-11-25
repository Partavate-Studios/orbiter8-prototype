// Minerva's expressions, as data. minerva-face.vue draws them; this file says how each part sits and
// moves. Adding a state or a one-off is an entry in STATES or ONE_OFFS below, nothing else.
//
// POSES. A pose says how far each target moves from where the emblem draws it, in the art's units (the
// owl is about 178 wide). Targets:
//   '1'…'6', '8'  one facet (minerva-parts.js numbers them). Channels: x, y (move; +x right, +y down),
//            r (turn, degrees, clockwise), s (grow: 0.1 is 10% bigger), sx, sy (grow one way),
//            spread (move away from the face's center), o (fade: -1 is gone).
//   '7'      the whole frame (tufts, ridges and beak together), same channels.
//   tuftL, tuftR, ridgeL, ridgeR, beak  the frame's five pieces (FRAME_PIECES), same channels. A tuft
//            turns about its root and rides on its ridge: move a ridge and its tuft comes along. A
//            ridge is hinged where it meets the beak, so r lifts or lowers the brow like an eyebrow
//            and it stays joined: raise a brow with r, press one down with y (moving a ridge up with
//            y pulls it off the beak and shows the cut).
//   brow, cheek, jaw  a mirrored pair of facets (1+4, 2+5, 3+6); ridge, tufts: the mirrored pieces. In a
//            pair, x means outward (away from the beak) and r means "outer end up", so one number poses
//            both sides alike.
//   sides    all six facets, mirrored the same way. all: the facets, the forehead and the frame (for
//            spread, y, o). pieces: the frame's five pieces.
//   eyeL, eyeR, eyes  the eyes in their sockets. Channels: x, y (look; both eyes the same way), s (size),
//            open (-1 shut, +0.3 wide: both lids), lid (the upper lid alone: -0.5 is half-lidded),
//            under (the lower lid alone: -0.5 is the squint of a smile), b (brightness: +1 is a flash,
//            -1 dark), tint (0 her own color … 1 the attention color, pink), cool (0 … 1 the working
//            color, teal), pupil (0 at rest, +0.5 wide: interest, the dark; -0.5 pinned: alarm, a hard
//            stare), r (tilts the lids). x and y move the pupil inside the iris and the eye only a
//            little: like an owl she looks by turning her head (a state's `glance.face`).
//   face     the whole owl: x, y, r, s, and turn and pitch, which turn her head a little in depth (the
//            beak and forehead lead, the tufts trail): turn +1 looks to the right, pitch +1 down.
//            z moves her toward you (+0.5 is half again as big) or away (-0.2: she's drawn back, busy
//            with something); fx, fy say which point of her face (in the art's units) comes to the
//            middle as she does, so she can bring one eye up to the glass (Peer).
//   beam     the scan line behind the parts: x (where it is), o (how visible, 0…1). Facets it passes
//            light up and the rest dim.
//
// STATES loop, one at a time. Each has:
//   pose     where the parts sit while in the state
//   waves    what keeps moving: { target: { channel: [amount, period ms, phase 0–1, shape] } }. Shapes:
//            'sin' (default), 'talk' (follows her voice: see speech()), 'pulse' (a heartbeat, 0…1),
//            'bump' (one short bump per period, 0…1: stagger phases for a chase), 'sweep' (side to side
//            at a steady pace), 'noise' (wanders, never repeats visibly)
//   breathe  how much the gaps between the parts drift (1 is the idle drift; 0 still)
//   float    how much the whole owl floats
//   blink    [min, max] ms between blinks (null: none), blinkWith: the one-off that blinks (default 'blink')
//   glance   { every: [min, max] ms, x, y: how far the eyes look, hold: [min, max] ms, face: how much the
//            head turns after them } (null: none)
//   tics     small things she does now and then: [{ play: a one-off, every: [min, max] ms }]. A tic waits
//            its turn: it never cuts off a one-off the game played.
//   enter    a one-off played as she enters the state (an accent: a start, a huff)
// Switching states: the pose springs to the new one, the eyes first, then the brow, then the rest (see
// springFor); waves, drift and float cross-fade over BLEND_MS.
//
// ONE_OFFS play once over the state, then let go: { layer, duration ms, keys: [[0–1, pose, ease], …] },
// the pose eased from key to key. `ease` names how she arrives at that key: 'smooth' (default), 'in',
// 'out', 'back' (overshoots and settles), 'spring', 'linear', 'snap' (holds, then jumps). step: true snaps
// every key. Keys left out of a pose are 0, so a one-off that starts and ends with {} returns exactly to
// the state. More options:
//   stagger  { target or alias: delay 0–1 }: those targets start late, so parts move one after another
//   flip     true: half the time it plays mirrored (a tuft flick isn't always the same tuft)
//   keys     may be a function of a random source that returns the keys, so no two plays match (Glitch)
// One-offs on different layers (body, eyes, lids, accent) play together; firing one on a layer that's busy
// fades the old one out quickly and starts the new one (restart, never queue: she reacts to the latest
// thing). hold: true keeps the last key's pose after it ends, until a one-off that names it in `releases`
// plays; until then, other one-offs on its layer don't play. reduced: 'skip' doesn't play with reduced
// motion; 'fade' keeps only its light (fading, brightness, lids, tint).

export const BLEND_MS = 450
/** How quickly a one-off that's been replaced fades out (ms). */
export const REPLACE_FADE_MS = 160

const FACET_IDS = ['1', '2', '3', '4', '5', '6']
const PART_IDS = [...FACET_IDS, '7', '8']
const PIECE_IDS = ['tuftL', 'ridgeL', 'beak', 'ridgeR', 'tuftR']
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
  ridge: [
    ['ridgeL', true],
    ['ridgeR', false]
  ],
  tufts: [
    ['tuftL', true],
    ['tuftR', false]
  ],
  sides: [...LEFT.map((id) => [id, true]), ...RIGHT.map((id) => [id, false])],
  all: PART_IDS.map((id) => [id, null]),
  pieces: PIECE_IDS.map((id) => [id, null]),
  eyes: [
    ['eyeL', null],
    ['eyeR', null]
  ]
}

export const PART_CHANNELS = ['x', 'y', 'r', 's', 'sx', 'sy', 'spread', 'o']
export const EYE_CHANNELS = ['x', 'y', 'r', 's', 'open', 'lid', 'under', 'b', 'tint', 'pupil', 'cool']
export const FACE_CHANNELS = ['x', 'y', 'r', 's', 'turn', 'pitch', 'z', 'fx', 'fy']
export const BEAM_CHANNELS = ['x', 'o']
/** Every target a pose can reach, after aliases, and its channels. */
export const TARGETS = {
  ...Object.fromEntries([...PART_IDS, ...PIECE_IDS].map((id) => [id, PART_CHANNELS])),
  eyeL: EYE_CHANNELS,
  eyeR: EYE_CHANNELS,
  face: FACE_CHANNELS,
  beam: BEAM_CHANNELS
}

// A pose in memory is one flat row of numbers, a slot per target and channel, so the face can add poses up
// sixty times a second without making objects.
/** target → channel → its slot in a pose. */
export const SLOTS = {}
const SLOT_TARGET = []
const SLOT_CHANNEL = []
for (const [target, channels] of Object.entries(TARGETS)) {
  SLOTS[target] = {}
  for (const channel of channels) {
    SLOTS[target][channel] = SLOT_TARGET.length
    SLOT_TARGET.push(target)
    SLOT_CHANNEL.push(channel)
  }
}
export const POSE_SIZE = SLOT_TARGET.length

/** Channels that are light, not movement: reduced motion keeps them. */
const LIGHT_CHANNELS = ['o', 'b', 'open', 'lid', 'under', 'tint', 'pupil', 'cool']
/** 1 where a slot is light, 0 where it's movement. */
export const SLOT_IS_LIGHT = Uint8Array.from(SLOT_CHANNEL, (channel) => (LIGHT_CHANNELS.includes(channel) ? 1 : 0))

/** A blank pose: every slot at 0. */
export function emptyPose() {
  return new Float64Array(POSE_SIZE)
}

/** Reads one target's channel from a pose. */
export function poseValue(pose, target, channel) {
  return pose[SLOTS[target][channel]]
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

const TAU = 2 * Math.PI
const clamp01 = (p) => Math.min(1, Math.max(0, p))
const smooth = (p) => p * p * (3 - 2 * p)
const fraction = (p) => p - Math.floor(p)
/** A bump of height 1 at `center`, `width` wide to each side, on a cycle 0–1. */
function bumpAt(cycle, center, width) {
  let distance = Math.abs(cycle - center)
  if (distance > 0.5) distance = 1 - distance
  const fall = 1 - (distance / width) * (distance / width)
  return fall > 0 ? fall * fall : 0
}

/**
 * Her voice when nothing feeds the face a real one: how loud she is at time t (ms), 0…1. Syllables of
 * uneven length and stress, in phrases with pauses between them, from waves that never line up, so it
 * doesn't loop where anyone can see.
 */
export function speech(t) {
  const syllable = Math.max(
    0,
    Math.sin((TAU * t) / 185 + 1.9 * Math.sin((TAU * t) / 1130) + 0.8 * Math.sin((TAU * t) / 467))
  )
  const stress = 0.62 + 0.38 * Math.sin((TAU * t) / 730 + 2 * Math.sin((TAU * t) / 2900))
  const phrase = Math.sin((TAU * t) / 2600 + 1.2 * Math.sin((TAU * t) / 6100)) + 0.45
  return syllable * stress * smooth(clamp01((phrase + 0.25) / 0.35))
}

/**
 * A wave's value at time t (ms): -1…1 for 'sin', 'sweep' and 'noise'; 0…1 for 'pulse', 'bump' and 'talk'.
 * `voice` is how loud she is right now (0…1), which 'talk' follows.
 */
export function waveValue(t, period, phase, shape, voice = 0) {
  const cycle = t / period + phase
  switch (shape) {
    case 'talk':
      // Her voice, a little different for each part that follows it, so they don't move as one.
      return voice * (0.75 + 0.25 * Math.sin(TAU * cycle))
    case 'pulse': {
      // A heartbeat: a beat and a softer one right after, then rest.
      const c = fraction(cycle)
      return bumpAt(c, 0.08, 0.08) + 0.55 * bumpAt(c, 0.27, 0.09)
    }
    case 'bump':
      return bumpAt(fraction(cycle), 0, 0.2)
    case 'sweep': {
      // Side to side at a steady pace, easing only as it turns around.
      const triangle = 1 - 4 * Math.abs(fraction(cycle) - 0.5)
      return 0.7 * triangle + 0.3 * Math.sin((Math.PI / 2) * triangle)
    }
    case 'noise': {
      const a = TAU * cycle
      return Math.max(-1, Math.min(1, (Math.sin(a) + Math.sin(a * 0.618 + 1.3) + Math.sin(a * 0.383 + 4.1)) / 2.4))
    }
    default:
      return Math.sin(TAU * cycle)
  }
}

/** Waves that run one bump around the listed targets, each after the last: a chase. */
function chase(ids, period, channels) {
  return Object.fromEntries(
    ids.map((id, i) => [
      id,
      Object.fromEntries(
        Object.entries(channels).map(([channel, amount]) => [channel, [amount, period, 1 - i / ids.length, 'bump']])
      )
    ])
  )
}

// SPRINGS. A state's pose is where each part is headed; a spring takes it there. Different parts answer at
// different speeds, so a change of state reads as a thought, not a tween: the eyes get there first, the
// brow follows and settles with a small overshoot, the rest of the face comes after.
/**
 * How one target's channel springs to a new pose.
 * @returns {{ stiffness: number, damping: number }} stiffness in 1/s²; damping 1 settles without
 *   overshoot, less overshoots.
 */
export function springFor(target, channel) {
  if (LIGHT_CHANNELS.includes(channel)) return { stiffness: target.startsWith('eye') ? 520 : 160, damping: 1 }
  if (target.startsWith('eye')) return { stiffness: 620, damping: 0.9 }
  if (target.startsWith('ridge') || target.startsWith('tuft')) return { stiffness: 300, damping: 0.5 }
  if (target === 'face' || target === 'beam') return { stiffness: 110, damping: 0.75 }
  if (target === '1' || target === '4') return { stiffness: 300, damping: 0.6 }
  return { stiffness: 170, damping: 0.62 }
}

const SPRING_STIFFNESS = new Float64Array(POSE_SIZE)
const SPRING_DAMPING = new Float64Array(POSE_SIZE)
const SPRING_DAMPING_CALM = new Float64Array(POSE_SIZE)
for (let slot = 0; slot < POSE_SIZE; slot++) {
  const { stiffness, damping } = springFor(SLOT_TARGET[slot], SLOT_CHANNEL[slot])
  SPRING_STIFFNESS[slot] = stiffness
  SPRING_DAMPING[slot] = 2 * damping * Math.sqrt(stiffness)
  SPRING_DAMPING_CALM[slot] = 2 * Math.sqrt(stiffness)
}

/**
 * Moves every slot of `position` toward `target` on its spring, for dt ms. `calm` (reduced motion) springs
 * settle without overshoot.
 * @returns {boolean} whether anything is still moving (false: all have arrived, and were set exactly on target)
 */
export function stepSprings(position, velocity, target, dt, calm = false) {
  const damping = calm ? SPRING_DAMPING_CALM : SPRING_DAMPING
  const steps = Math.max(1, Math.ceil(dt / 8))
  const h = dt / steps / 1000
  let moving = false
  for (let slot = 0; slot < POSE_SIZE; slot++) {
    let x = position[slot]
    let v = velocity[slot]
    const goal = target[slot]
    if (x === goal && v === 0) continue
    for (let step = 0; step < steps; step++) {
      v += (SPRING_STIFFNESS[slot] * (goal - x) - damping[slot] * v) * h
      x += v * h
    }
    if (Math.abs(goal - x) < 0.002 && Math.abs(v) < 0.02) {
      x = goal
      v = 0
    } else {
      moving = true
    }
    position[slot] = x
    velocity[slot] = v
  }
  return moving
}

// Where the parts start from when she assembles (and end when she comes apart): flung out, turned, faded.
const SCATTER = {
  sides: { spread: 70, o: -1 },
  1: { r: -40, y: -10 },
  2: { r: 25, y: 6 },
  3: { r: -30, y: 14 },
  4: { r: 35, y: -12 },
  5: { r: -20, y: 8 },
  6: { r: 28, y: 16 },
  8: { y: 30, r: 90, o: -1 },
  ridge: { spread: 46, r: -24, o: -1 },
  tufts: { spread: 34, r: 60, o: -1 },
  beak: { spread: 52, s: 0.25, o: -1 },
  eyes: { b: -1, open: -1 }
}

export const STATES = {
  idle: {
    label: 'Idle',
    about:
      'Floating; the gaps drift; now and then a blink, a glance, a flick of a tuft; once in a long while she peers out at you.',
    breathe: 1,
    float: 1,
    blink: [2600, 6200],
    glance: { every: [2800, 7500], x: 4.5, y: 1.4, hold: [600, 1900], face: 0.8 },
    tics: [
      { play: 'tuftFlick', every: [9000, 24000] },
      { play: 'ruffle', every: [16000, 38000] },
      { play: 'slowBlink', every: [22000, 50000] },
      { play: 'blinkOne', every: [14000, 34000] },
      { play: 'peer', every: [50000, 120000] }
    ]
  },
  talking: {
    label: 'Talking',
    about: 'A message is showing: the beak and facets move with her words (her voice, if the game feeds it).',
    breathe: 0.7,
    float: 0.8,
    waves: {
      beak: { y: [2.6, 240, 0, 'talk'], sy: [0.03, 240, 0.1, 'talk'] },
      8: { y: [-1.1, 320, 0.2, 'talk'] },
      jaw: { y: [1.3, 290, 0.3, 'talk'], x: [0.7, 290, 0.3, 'talk'] },
      cheek: { x: [0.7, 410, 0.5, 'talk'] },
      ridge: { r: [0.9, 520, 0.6, 'talk'] },
      tufts: { r: [1.6, 610, 0.1, 'talk'] },
      eyes: { b: [0.14, 480, 0, 'talk'] },
      face: { pitch: [0.9, 380, 0.4, 'talk'], turn: [1.3, 5200, 0, 'noise'], r: [0.7, 6800, 0.3, 'noise'] }
    },
    blink: [1900, 4600],
    glance: { every: [2200, 5000], x: 2, y: 0.6, hold: [400, 900], face: 0.3 }
  },
  thinking: {
    label: 'Thinking',
    about:
      'A move is going through on chain: she draws back, off working on it, looks away and up, and a notch circles her facets.',
    breathe: 0.4,
    float: 0.6,
    pose: {
      face: { r: 2, turn: -1.2, pitch: -0.8, z: -0.2 },
      eyes: { x: -3.2, y: -1.6, lid: -0.3 },
      ridgeL: { r: 3.5 },
      tuftL: { r: 3 }
    },
    waves: {
      ...chase(['1', '2', '3', '6', '5', '4'], 1500, { o: -0.62, spread: 1.8 }),
      eyeL: { b: [0.22, 1500, 0] },
      eyeR: { b: [0.22, 1500, 0.5] },
      eyes: { x: [1.1, 3900, 0, 'noise'] },
      face: { z: [0.03, 5600, 0] }
    },
    blink: [3800, 7500]
  },
  surprised: {
    label: 'Surprised',
    about: 'Parts spread, tufts up, eyes wide.',
    breathe: 1.3,
    float: 1,
    enter: 'startle',
    pose: {
      ridge: { r: 5.5, y: -0.6 },
      tufts: { r: 9 },
      brow: { y: -2.4, r: -4, x: 0.8 },
      cheek: { x: 2, y: 1.2 },
      jaw: { x: 2.5, y: 2.5 },
      beak: { y: 2.2 },
      8: { y: -1.5 },
      eyes: { s: 0.14, open: 0.45, b: 0.2, pupil: -0.3 }
    },
    blink: [5000, 9000]
  },
  annoyed: {
    label: 'Annoyed',
    about: 'A move failed: brow pressed down, tufts flat, a hard half-lidded stare.',
    breathe: 0.45,
    float: 0.45,
    enter: 'huff',
    pose: {
      ridge: { y: 2.4, r: 3 },
      tufts: { r: -8 },
      brow: { y: 2, r: 6, x: -0.5 },
      cheek: { x: -1, y: -1 },
      jaw: { x: -0.8, y: -1.4 },
      beak: { y: -0.8 },
      8: { y: 1.2 },
      face: { pitch: 1.2 },
      eyes: { lid: -0.5, under: -0.15, s: -0.04, pupil: -0.3, r: 5 }
    },
    blink: [3200, 6500],
    glance: { every: [4200, 8500], x: 2.5, y: 0.4, hold: [900, 1800], face: 0.2 },
    tics: [{ play: 'twitch', every: [3800, 9000] }]
  },
  nervous: {
    label: 'Nervous',
    about: 'Looking around: the eyes and face dart side to side, the tufts tremble.',
    breathe: 1.4,
    float: 0.6,
    pose: { ridge: { y: -1, r: -3 }, brow: { y: -1.2, r: -4 }, tufts: { r: 3 }, eyes: { s: 0.1, open: 0.1 } },
    waves: { tuftL: { r: [1.3, 310, 0] }, tuftR: { r: [1.3, 270, 0.4] } },
    blink: [1100, 2800],
    glance: { every: [260, 900], x: 7, y: 2, hold: [150, 500], face: 0.9 }
  },
  listening: {
    label: 'Listening',
    about: 'An input box has focus: she leans in, tufts pricked, and holds still, eyes on you.',
    breathe: 0.5,
    float: 0.4,
    enter: 'perk',
    pose: {
      face: { z: 0.06, pitch: 1.4 },
      tufts: { r: 5 },
      ridge: { r: 1.6 },
      brow: { y: -0.8 },
      eyes: { s: 0.1, open: 0.2, pupil: 0.3 }
    },
    blink: [3500, 7000],
    tics: [{ play: 'tuftFlick', every: [5000, 12000] }]
  },
  waiting: {
    label: 'Waiting on you',
    about: 'The wallet is waiting for you to sign: head tilted, half-lidded, a slow pulse in her eyes.',
    breathe: 0.6,
    float: 0.7,
    pose: {
      face: { r: -4, turn: 1 },
      ridgeR: { r: -4.5 },
      ridgeL: { y: 0.6 },
      tuftR: { r: -4 },
      eyes: { lid: -0.32, tint: 0.12 }
    },
    waves: {
      eyes: { b: [0.4, 2400, 0, 'pulse'], tint: [0.3, 2400, 0, 'pulse'], s: [0.08, 2400, 0, 'pulse'] },
      face: { r: [1.1, 4800, 0] }
    },
    blink: [3200, 5200],
    blinkWith: 'slowBlink',
    tics: [{ play: 'tuftFlick', every: [3500, 7000] }]
  },
  scanning: {
    label: 'Scanning',
    about: 'A scan is running: she holds still, eyes wide and teal, and a line of teal light sweeps across her.',
    breathe: 0.35,
    float: 0.3,
    pose: { beam: { o: 1 }, tufts: { r: 3 }, eyes: { open: 0.25, s: 0.08, cool: 0.9, pupil: 0.15 } },
    waves: {
      beam: { x: [64, 2600, 0, 'sweep'] },
      eyes: { x: [3, 2600, 0, 'sweep'], pupil: [0.12, 1300, 0] }
    },
    blink: null
  },
  alert: {
    label: 'Alert',
    about: 'A siege or another urgent warning: drawn tight, tufts up, eyes pink and beating.',
    breathe: 0.25,
    float: 0.25,
    enter: 'startle',
    pose: {
      face: { s: 0.04 },
      all: { spread: -1.5 },
      ridge: { y: 1.4, r: 2.5 },
      tufts: { r: 7 },
      brow: { y: 1, r: 4 },
      eyes: { b: 0.35, s: 0.1, open: 0.3, tint: 0.9, pupil: -0.45 }
    },
    waves: { eyes: { b: [0.45, 1150, 0, 'pulse'], s: [0.1, 1150, 0, 'pulse'] } },
    blink: [6000, 10000]
  },
  skeptical: {
    label: 'Skeptical',
    about: "You're about to do something unwise: one brow raised, the other eye narrowed.",
    breathe: 0.7,
    float: 0.7,
    pose: {
      face: { r: 3.5, turn: 1.2 },
      ridgeL: { r: 9, y: -0.5 },
      tuftL: { r: 5 },
      1: { y: -3.4, r: -5 },
      2: { y: -0.6 },
      ridgeR: { y: 1.6, r: 1.5 },
      tuftR: { r: 5 },
      4: { y: 1.8, r: -6 },
      eyeL: { open: 0.4, s: 0.12, y: -0.8, pupil: -0.2 },
      eyeR: { lid: -0.62, under: -0.2, b: -0.12 }
    },
    blink: [3200, 6500],
    blinkWith: 'slowBlink'
  },
  offline: {
    label: 'Offline',
    about: 'No connection, or the terminal is idle: loose, drooping and dim; her eyes try to catch a signal.',
    breathe: 2,
    float: 0.35,
    pose: {
      all: { spread: 3, o: -0.42 },
      face: { y: 1.5, r: -1.5, pitch: 1.5, z: -0.08 },
      tufts: { r: -9, y: 0.8 },
      ridge: { y: 1.2, r: -2 },
      beak: { y: 1.8 },
      eyes: { b: -0.7, s: -0.1, lid: -0.45, pupil: 0.4 }
    },
    waves: { eyes: { b: [0.08, 3700, 0, 'noise'] } },
    blink: null,
    tics: [{ play: 'flicker', every: [2600, 7500] }]
  },
  // The apartment's radio (intro-console.vue): the waves aren't locked to the music, so their periods are
  // only near the tracks' tempos (Funkytunz about 92 bpm, a beat every 650 ms; Carrier of Life about 62).
  grooving: {
    label: 'Grooving',
    about: 'Music with a beat is on: her head bobs to it, eyes easy, the tufts catching the off-beat.',
    breathe: 0.8,
    float: 0.3,
    pose: { eyes: { lid: -0.22, under: -0.12 }, tufts: { r: 1.5 } },
    waves: {
      face: { y: [3, 650, 0, 'bump'], pitch: [0.6, 650, 0, 'bump'], r: [1.6, 2600, 0] },
      beak: { y: [0.8, 650, 0.04, 'bump'] },
      tufts: { r: [3.5, 650, 0.5, 'bump'] }
    },
    blink: [2500, 5500],
    tics: [{ play: 'tuftFlick', every: [5000, 11000] }]
  },
  swaying: {
    label: 'Swaying',
    about: 'Slow music is on: eyes half closed, a slow sway from side to side.',
    breathe: 1.2,
    float: 0.8,
    pose: { eyes: { lid: -0.45, under: -0.2 }, tufts: { r: -2 }, face: { pitch: 0.4 } },
    waves: {
      face: { r: [3, 3900, 0], x: [2, 3900, 0.25], turn: [0.3, 3900, 0] },
      tufts: { r: [1.5, 1950, 0] }
    },
    blink: [3500, 7000],
    blinkWith: 'slowBlink'
  }
}

/** The rows of her face, top to bottom: a glitch shifts whole rows sideways, like a bad scan line. */
const GLITCH_ROWS = [
  ['ridgeL', 'ridgeR'],
  ['1', '4', '8', 'eyeL', 'eyeR'],
  ['2', '5', '3', '6', 'beak']
]

/** Glitch's keys, different on every play: four bursts of shifted rows, a dropped facet, pink in an eye. */
function glitchKeys(random) {
  const burst = () => {
    const pose = {}
    for (const row of GLITCH_ROWS) {
      if (random() < 0.35) continue
      const shift = (random() < 0.5 ? -1 : 1) * (2 + random() * 4.5)
      for (const id of row) pose[id] = { x: shift }
    }
    const dropped = FACET_IDS[Math.floor(random() * FACET_IDS.length)]
    pose[dropped] = { ...pose[dropped], o: -0.85 }
    const eye = random() < 0.5 ? 'eyeL' : 'eyeR'
    pose[eye] = { ...pose[eye], b: random() < 0.5 ? -0.8 : 0.5, tint: 1 }
    return pose
  }
  return [
    [0, {}],
    [0.06, burst()],
    [0.2, burst()],
    [0.3, {}],
    [0.42, burst()],
    [0.56, burst()],
    [0.7, {}],
    [1, {}]
  ]
}

export const ONE_OFFS = {
  boom: {
    label: 'Boom',
    about: 'She draws in, every part bursts outward, then snaps back.',
    layer: 'body',
    duration: 950,
    reduced: 'skip',
    keys: [
      [0, {}],
      [0.13, { sides: { spread: -2.5 }, pieces: { spread: -1.5 }, face: { s: -0.04 }, eyes: { open: -0.4 } }, 'out'],
      [
        0.34,
        {
          sides: { spread: 17 },
          pieces: { spread: 9 },
          tufts: { r: 14 },
          8: { spread: 6 },
          face: { s: 0.06 },
          eyes: { s: 0.5, b: 0.7, open: 0.3 }
        },
        'out'
      ],
      [0.78, { sides: { spread: -1.2 }, pieces: { spread: -0.6 } }, 'smooth'],
      [1, {}]
    ]
  },
  no: {
    label: 'No',
    about: 'She shakes her head: the beak leads, the tufts trail.',
    layer: 'body',
    duration: 800,
    stagger: { tufts: 0.07 },
    keys: [
      [0, {}],
      [0.16, { face: { turn: -8, x: -3, r: -2 }, tufts: { r: -3 }, eyes: { x: -2, lid: -0.3 } }, 'out'],
      [0.4, { face: { turn: 7, x: 2.6, r: 2 }, tufts: { r: 3 }, eyes: { x: 2, lid: -0.3 } }],
      [0.63, { face: { turn: -4.5, x: -1.6, r: -1 }, tufts: { r: -2 }, eyes: { x: -1, lid: -0.2 } }],
      [0.83, { face: { turn: 1.6, x: 0.6 } }],
      [1, {}]
    ]
  },
  nod: {
    label: 'Nod',
    about: 'A transaction went through: one small, deadpan nod, eyes closing on the way down.',
    layer: 'body',
    duration: 680,
    stagger: { tufts: 0.06 },
    keys: [
      [0, {}],
      [0.14, { face: { pitch: -1.4, y: -0.6 } }, 'out'],
      [0.42, { face: { pitch: 5.5, y: 2.6, s: -0.015 }, tufts: { r: 2 }, eyes: { y: 1, lid: -0.75 } }],
      [0.8, { face: { pitch: -0.5 } }],
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
      [0.15, { eyes: { b: 0.9, s: 0.14, pupil: -0.3 } }, 'out'],
      [1, {}]
    ]
  },
  blink: {
    label: 'Blink',
    about: 'A blink, for timing with dialogue (states blink on their own too): shut fast, open slower.',
    layer: 'lids',
    duration: 190,
    keys: [
      [0, {}],
      [0.36, { eyes: { open: -1 }, brow: { y: 1.3 }, cheek: { y: -0.5 }, ridge: { y: 0.4 } }, 'in'],
      [1, {}, 'out']
    ]
  },
  blinkOne: {
    label: 'One-eyed blink',
    about: 'New. One eye blinks and the other stays on you, as owls do (an idle tic; either eye).',
    layer: 'lids',
    duration: 260,
    flip: true,
    keys: [
      [0, {}],
      [0.38, { eyeL: { open: -1 }, 1: { y: 1.3 }, 2: { y: -0.5 }, ridgeL: { y: 0.4 } }, 'in'],
      [1, {}, 'out']
    ]
  },
  slowBlink: {
    label: 'Slow blink',
    about: 'A long, unimpressed blink (Waiting on you and Skeptical blink this way).',
    layer: 'lids',
    duration: 760,
    keys: [
      [0, {}],
      [0.3, { eyes: { open: -1 }, brow: { y: 1.5 }, cheek: { y: -0.5 }, ridge: { y: 0.8 } }],
      [0.58, { eyes: { open: -1 }, brow: { y: 1.5 }, cheek: { y: -0.5 }, ridge: { y: 0.8 } }],
      [1, {}]
    ]
  },
  assemble: {
    label: 'Assemble',
    about: 'Her console opens: the parts fly in one after another, lock into place, and her eyes light.',
    layer: 'body',
    duration: 1300,
    reduced: 'fade',
    releases: ['disassemble'],
    stagger: { beak: 0, ridge: 0.08, tufts: 0.16, jaw: 0.2, cheek: 0.27, brow: 0.34, 8: 0.4, eyes: 0.4 },
    keys: [
      [0, SCATTER],
      [0.66, { sides: { spread: -1.4 }, pieces: { spread: -0.8 }, eyes: { b: -1, open: -1 } }, 'out'],
      [0.8, { eyes: { b: 0.8, s: 0.15 } }],
      [1, {}]
    ]
  },
  disassemble: {
    label: 'Disassemble',
    about: 'The console closes: her eyes go out and she comes apart (Assemble brings her back).',
    layer: 'body',
    duration: 950,
    reduced: 'fade',
    hold: true,
    stagger: { 8: 0, brow: 0.04, cheek: 0.08, jaw: 0.12, tufts: 0.14, ridge: 0.18, beak: 0.22 },
    keys: [
      [0, {}],
      [0.22, { eyes: { b: -1, open: -1 }, sides: { spread: -1.6 }, pieces: { spread: -0.8 } }, 'out'],
      [1, SCATTER, 'in']
    ]
  },
  glitch: {
    label: 'Glitch',
    about: 'A move failed or the network hiccuped: rows of her face jump sideways, pink in her eyes, then snap back.',
    layer: 'body',
    duration: 460,
    reduced: 'skip',
    step: true,
    keys: glitchKeys
  },
  ha: {
    label: 'Deadpan “ha”',
    about: 'After one of her jokes: a single drop of the beak, the eyes narrowing from below.',
    layer: 'body',
    duration: 460,
    keys: [
      [0, {}],
      [
        0.26,
        { beak: { y: 2.6 }, 8: { y: -1.6 }, jaw: { y: 0.9 }, eyes: { under: -0.5 }, face: { pitch: -0.8 } },
        'out'
      ],
      [0.62, { beak: { y: -0.4 }, eyes: { under: -0.3 } }],
      [1, {}]
    ]
  },
  noted: {
    label: 'Noted',
    about: 'New. A trade made a profit: tufts up, eyes brighten and narrow from below, the smallest dip of the head.',
    layer: 'body',
    duration: 1100,
    stagger: { tufts: 0.05 },
    keys: [
      [0, {}],
      [
        0.22,
        {
          tufts: { r: 6 },
          ridge: { r: 2 },
          cheek: { y: -1.4 },
          eyes: { under: -0.5, b: 0.35 },
          face: { pitch: 1.6 }
        },
        'back'
      ],
      [
        0.62,
        { tufts: { r: 4 }, ridge: { r: 1.3 }, cheek: { y: -1 }, eyes: { under: -0.42, b: 0.2 }, face: { pitch: 0.6 } }
      ],
      [1, {}]
    ]
  },
  wince: {
    label: 'Wince',
    about: 'New. A trade lost money: eyes shut hard, tufts back, she pulls away, then recovers her composure.',
    layer: 'body',
    duration: 900,
    keys: [
      [0, {}],
      [
        0.14,
        {
          eyes: { open: -0.92 },
          ridge: { y: 2, r: 2 },
          tufts: { r: -10 },
          brow: { y: 1.6 },
          cheek: { y: -1.2 },
          face: { s: -0.035, pitch: -1.6, y: 0.8 }
        },
        'out'
      ],
      [
        0.42,
        {
          eyes: { open: -0.8 },
          ridge: { y: 1.6, r: 1.5 },
          tufts: { r: -8 },
          brow: { y: 1.2 },
          face: { s: -0.02, pitch: -1 }
        }
      ],
      [1, {}]
    ]
  },
  paid: {
    label: 'Paid in full',
    about:
      'New. The starting debt is cleared: a slow bow with eyes shut, then she rises, eyes bright, and her facets ripple out.',
    layer: 'body',
    duration: 1900,
    stagger: { jaw: 0.03, cheek: 0.07, brow: 0.11, tufts: 0.05 },
    keys: [
      [0, {}],
      [0.26, { face: { pitch: 6, y: 3 }, eyes: { open: -1 }, tufts: { r: -3 } }],
      [0.44, { face: { pitch: 6, y: 3 }, eyes: { open: -1 }, tufts: { r: -3 } }],
      [
        0.62,
        {
          face: { pitch: -1.2, s: 0.03 },
          eyes: { b: 0.8, s: 0.18, open: 0.15 },
          tufts: { r: 8 },
          sides: { spread: 4.5 }
        },
        'out'
      ],
      [0.82, { eyes: { b: 0.3 }, tufts: { r: 4 }, sides: { spread: -0.8 } }],
      [1, {}]
    ]
  },
  sideEye: {
    label: 'Side-eye',
    about: 'New. Her eyes slide to one side and back; her head stays where it is.',
    layer: 'eyes',
    duration: 1250,
    flip: true,
    keys: [
      [0, {}],
      [0.16, { eyes: { x: 6.5, lid: -0.36 }, face: { turn: -0.8 } }, 'out'],
      [0.7, { eyes: { x: 6.5, lid: -0.36 }, face: { turn: -0.8 } }],
      [1, {}]
    ]
  },
  peer: {
    label: 'Peer',
    about:
      'New (Koda). She comes right up to the glass: one eye squinted shut, the other wide, brought close and looking about, as if to see out at you. Then back (an idle tic, rarely; either eye).',
    layer: 'body',
    duration: 3000,
    reduced: 'skip',
    flip: true,
    keys: [
      [0, {}],
      [0.08, { face: { z: -0.07 }, eyes: { lid: -0.25 } }, 'out'],
      [
        0.26,
        {
          face: { z: 0.6, fx: -28.5, fy: 3.2, r: -5 },
          eyeL: { open: 0.45, s: 0.12, pupil: 0.4 },
          eyeR: { lid: -0.8, under: -0.4, b: -0.2 },
          ridgeL: { r: 7 },
          ridgeR: { y: 1.4, r: 1 },
          1: { y: -2.2 },
          4: { y: 1.6 },
          5: { y: -1 },
          tuftL: { r: 5 }
        },
        'back'
      ],
      [
        0.42,
        {
          face: { z: 0.64, fx: -28.5, fy: 3.2, r: -5 },
          eyeL: { open: 0.45, s: 0.12, pupil: -0.25, x: 2.6 },
          eyeR: { lid: -0.8, under: -0.4, b: -0.2 },
          ridgeL: { r: 7 },
          ridgeR: { y: 1.4, r: 1 },
          1: { y: -2.2 },
          4: { y: 1.6 },
          5: { y: -1 },
          tuftL: { r: 5 }
        },
        'out'
      ],
      [
        0.58,
        {
          face: { z: 0.64, fx: -28.5, fy: 3.2, r: -3 },
          eyeL: { open: 0.45, s: 0.12, pupil: -0.25, x: -2.8, y: 0.6 },
          eyeR: { lid: -0.8, under: -0.4, b: -0.2 },
          ridgeL: { r: 7 },
          ridgeR: { y: 1.4, r: 1 },
          1: { y: -2.2 },
          4: { y: 1.6 },
          5: { y: -1 },
          tuftL: { r: 5 }
        },
        'out'
      ],
      [
        0.76,
        {
          face: { z: 0.6, fx: -28.5, fy: 3.2, r: -4 },
          eyeL: { open: 0.15, s: 0.08, b: 0.1 },
          eyeR: { lid: -0.8, under: -0.4, b: -0.2 },
          ridgeL: { r: 5 },
          ridgeR: { y: 1.4, r: 1 },
          1: { y: -1.6 },
          4: { y: 1.6 },
          5: { y: -1 },
          tuftL: { r: 3 }
        }
      ],
      [1, {}]
    ]
  },
  ruffle: {
    label: 'Ruffle',
    about: 'New. Her facets shiver once, from the outside in, like feathers settling (an idle tic).',
    layer: 'body',
    duration: 720,
    stagger: { tufts: 0, brow: 0.08, cheek: 0.16, jaw: 0.24, 8: 0.3 },
    keys: [
      [0, {}],
      [0.2, { sides: { spread: 2.2, r: 3 }, tufts: { r: 5 }, 8: { y: -1 } }, 'out'],
      [0.45, { sides: { spread: -0.6, r: -1.5 }, tufts: { r: -2.5 } }],
      [0.7, { sides: { spread: 0.4, r: 0.6 }, tufts: { r: 1 } }],
      [1, {}]
    ]
  },
  tuftFlick: {
    label: 'Tuft flick',
    about: 'New. One ear tuft flicks (an idle tic; either side).',
    layer: 'body',
    duration: 420,
    flip: true,
    keys: [
      [0, {}],
      [0.22, { tuftL: { r: 10 } }, 'out'],
      [0.5, { tuftL: { r: -3 } }],
      [0.75, { tuftL: { r: 1.2 } }],
      [1, {}]
    ]
  },
  twitch: {
    label: 'Twitch',
    about: 'New. One eye narrows for an instant (Annoyed does this now and then; either side).',
    layer: 'lids',
    duration: 300,
    flip: true,
    keys: [
      [0, {}],
      [0.3, { eyeL: { lid: -0.35, under: -0.3 }, 1: { y: 1 }, ridgeL: { y: 0.6 } }, 'out'],
      [0.5, { eyeL: { lid: -0.1 } }],
      [0.7, { eyeL: { lid: -0.3, under: -0.2 }, 1: { y: 0.7 } }],
      [1, {}]
    ]
  },
  startle: {
    label: 'Startle',
    about: 'New. A start: her head goes back, tufts up, eyes wide (how she enters Alert and Surprised).',
    layer: 'accent',
    duration: 560,
    reduced: 'skip',
    keys: [
      [0, {}],
      [
        0.18,
        {
          sides: { spread: 4 },
          tufts: { r: 9 },
          ridge: { r: 3.5 },
          face: { s: 0.05, pitch: -2 },
          eyes: { s: 0.25, b: 0.5 }
        },
        'out'
      ],
      [0.6, { sides: { spread: -0.8 }, tufts: { r: -1.5 } }],
      [1, {}]
    ]
  },
  huff: {
    label: 'Huff',
    about:
      'New. A short, sharp breath out: the brow drops, pink flares in her eyes and drains away (how she enters Annoyed).',
    layer: 'accent',
    duration: 1500,
    reduced: 'fade',
    keys: [
      [0, {}],
      [
        0.1,
        {
          ridge: { y: 2.4 },
          beak: { y: 1.8 },
          face: { s: 0.03, y: 1.2 },
          sides: { spread: 1.5 },
          eyes: { tint: 0.9, b: 0.4 }
        },
        'out'
      ],
      [0.3, { ridge: { r: 0.6 }, sides: { spread: -0.5 }, eyes: { tint: 0.7, b: 0.1 } }],
      [1, {}]
    ]
  },
  perk: {
    label: 'Perk',
    about: 'New. Her tufts prick up (how she enters Listening).',
    layer: 'accent',
    duration: 460,
    reduced: 'skip',
    stagger: { tuftR: 0.12 },
    keys: [
      [0, {}],
      [0.3, { tufts: { r: 7 }, eyes: { s: 0.1, b: 0.2 } }, 'out'],
      [0.6, { tufts: { r: -2 } }],
      [1, {}]
    ]
  },
  flicker: {
    label: 'Flicker',
    about: 'New. Her eyes catch for a moment and fail (Offline does this while it looks for a signal).',
    layer: 'eyes',
    duration: 520,
    step: true,
    keys: [
      [0, {}],
      [0.08, { eyes: { b: 0.7, lid: 0.3 } }],
      [0.2, { eyes: { b: -0.2 } }],
      [0.3, { eyes: { b: 0.5, lid: 0.3 } }],
      [0.62, { eyes: { b: -0.3 } }],
      [0.74, { eyes: { b: 0.2 } }],
      [0.84, {}],
      [1, {}]
    ]
  }
}

/** Adds a compiled pose (list of [target, channel, value]) into the pose `acc`, times `weight`. */
export function addCompiled(acc, compiled, weight = 1) {
  for (const [target, channel, value] of compiled) acc[SLOTS[target][channel]] += value * weight
}

/** How she arrives at a key: progress 0–1 between two keys → how far along she is. */
export const EASES = {
  smooth,
  linear: (p) => p,
  in: (p) => p * p,
  out: (p) => 1 - (1 - p) * (1 - p) * (1 - p),
  back: (p) => (p <= 0 ? 0 : 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2),
  spring: (p) => 1 - Math.exp(-6 * p) * Math.cos(11 * p) * (1 - p),
  snap: () => 0
}

const MIRROR = { tuftL: 'tuftR', ridgeL: 'ridgeR', eyeL: 'eyeR', 1: '4', 2: '5', 3: '6' }
for (const [left, right] of Object.entries(MIRROR)) MIRROR[right] = left
/** The same move on the other side of her face. An eye's own turn (r) is already mirrored when drawn. */
function mirrored(target, channel, value) {
  const flips = ['x', 'turn', 'fx'].includes(channel) || (channel === 'r' && !target.startsWith('eye'))
  return [MIRROR[target] ?? target, flips ? -value : value]
}

/** A one-off's keys: as written, or made fresh by its function. */
export function oneOffKeys(def, random = Math.random) {
  return typeof def.keys === 'function' ? def.keys(random) : def.keys
}

/**
 * Compiles a one-off for the face: a track per slot it moves (its value at each key, and how late it
 * starts), with reduced motion's and `flip`'s choices made.
 * @param {() => number} [random] the random source (tests pass a fixed one)
 * @returns {{ name, def, times: number[], eases: Function[], tracks: { slot, delay, values }[], span: number }}
 */
export function compileOneOff(name, reduced = false, random = Math.random) {
  const def = ONE_OFFS[name]
  const keys = oneOffKeys(def, random)
  const flip = Boolean(def.flip) && random() < 0.5
  const fadeOnly = reduced && def.reduced === 'fade'
  const bySlot = new Map()
  keys.forEach(([, pose], k) => {
    for (const [target, channel, value] of compilePose(pose)) {
      if (fadeOnly && !LIGHT_CHANNELS.includes(channel)) continue
      const [onTarget, onValue] = flip ? mirrored(target, channel, value) : [target, value]
      const slot = SLOTS[onTarget][channel]
      if (!bySlot.has(slot)) bySlot.set(slot, { slot, delay: 0, values: new Float64Array(keys.length) })
      bySlot.get(slot).values[k] += onValue
    }
  })
  const tracks = [...bySlot.values()]
  let latest = 0
  for (const [key, delay] of Object.entries(def.stagger ?? {})) {
    const targets = (ALIASES[key] ?? [[key]]).map(([target]) => (flip ? (MIRROR[target] ?? target) : target))
    for (const track of tracks) if (targets.includes(SLOT_TARGET[track.slot])) track.delay = delay
    latest = Math.max(latest, delay)
  }
  return {
    name,
    def,
    times: keys.map(([at]) => at),
    eases: keys.map(([, , ease]) => EASES[def.step ? 'snap' : (ease ?? 'smooth')]),
    tracks,
    span: 1 - latest
  }
}

/** Adds a compiled one-off's pose at progress p (0–1) into `acc`, times `weight`. */
export function addOneOff(acc, compiled, p, weight = 1) {
  const { times, eases, tracks, span } = compiled
  const last = times.length - 1
  for (const track of tracks) {
    // A staggered track runs the same keys, starting `delay` late and finishing with the rest.
    const q = p >= 1 ? 1 : clamp01((p - track.delay) / span)
    let value
    if (q >= 1) {
      value = track.values[last]
    } else {
      let i = 0
      while (i < last - 1 && q >= times[i + 1]) i++
      const from = times[i]
      const mix = eases[i + 1](clamp01((q - from) / (times[i + 1] - from || 1)))
      value = track.values[i] + (track.values[i + 1] - track.values[i]) * mix
    }
    acc[track.slot] += value * weight
  }
}

/** Compiles a state: its pose as a full row of slots (what the springs head for), its waves, and whether any follow her voice. */
export function compileState(name) {
  const def = STATES[name]
  const pose = emptyPose()
  addCompiled(pose, compilePose(def.pose))
  const waves = compileWaves(def.waves).map(([target, channel, amount, period, phase, shape]) => ({
    slot: SLOTS[target][channel],
    amount,
    period,
    phase,
    shape
  }))
  return { name, def, pose, waves, talks: waves.some((wave) => wave.shape === 'talk') }
}

/**
 * Adds a compiled state's waves at time t into `acc`, times `weight`. Movement is scaled by `motion`
 * too (reduced motion); light isn't. `voice` is how loud she is (0…1), for 'talk' waves.
 */
export function addWaves(acc, compiled, t, weight = 1, motion = 1, voice = 0) {
  for (const wave of compiled.waves) {
    const scale = SLOT_IS_LIGHT[wave.slot] ? weight : weight * motion
    acc[wave.slot] += wave.amount * waveValue(t, wave.period, wave.phase, wave.shape, voice) * scale
  }
}

/** Adds a compiled state's pose and waves at time t into `acc`: the whole state, as if she'd settled in it. */
export function addState(acc, compiled, t, weight = 1, motion = 1, voice = 0) {
  for (let slot = 0; slot < POSE_SIZE; slot++) acc[slot] += compiled.pose[slot] * weight
  addWaves(acc, compiled, t, weight, motion, voice)
}
