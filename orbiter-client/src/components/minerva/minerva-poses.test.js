import { describe, expect, it } from 'vitest'
import {
  EASES,
  ONE_OFFS,
  POSE_SIZE,
  SLOTS,
  STATES,
  TARGETS,
  addOneOff,
  addState,
  compileOneOff,
  compilePose,
  compileState,
  compileWaves,
  emptyPose,
  oneOffKeys,
  poseValue,
  speech,
  stepSprings,
  waveValue
} from './minerva-poses'

// Minerva's expressions are data; these catch a mistyped target or channel (which would otherwise
// silently do nothing) and a one-off that doesn't return her to the state it played over.

/** A random source that repeats, so a test sees the same Glitch every run. */
function seeded(seed = 1) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647
}

const everyPose = [
  ...Object.entries(STATES).flatMap(([name, def]) => [
    [`${name} pose`, compilePose(def.pose)],
    [`${name} waves`, compileWaves(def.waves)]
  ]),
  ...Object.entries(ONE_OFFS).flatMap(([name, def]) =>
    oneOffKeys(def, seeded()).map(([at, pose]) => [`${name} at ${at}`, compilePose(pose)])
  )
]

describe("Minerva's poses", () => {
  it.each(everyPose)('%s moves only real targets and channels', (_, compiled) => {
    for (const [target, channel, value] of compiled) {
      expect(TARGETS[target], `target ${target}`).toBeDefined()
      expect(TARGETS[target], `${target}.${channel}`).toContain(channel)
      expect(Number.isFinite(value)).toBe(true)
    }
  })

  it('mirrors a pair: outward and outer-end-up on both sides', () => {
    const pose = compilePose({ brow: { x: 2, r: 5, y: 1 }, tufts: { r: 3 } })
    expect(pose).toContainEqual(['1', 'x', -2])
    expect(pose).toContainEqual(['4', 'x', 2])
    expect(pose).toContainEqual(['1', 'r', 5])
    expect(pose).toContainEqual(['4', 'r', -5])
    expect(pose).toContainEqual(['4', 'y', 1])
    expect(pose).toContainEqual(['tuftL', 'r', 3])
    expect(pose).toContainEqual(['tuftR', 'r', -3])
  })

  it.each(Object.entries(ONE_OFFS))('%s starts at rest, and ends at rest unless it holds', (name, def) => {
    const compiled = compileOneOff(name, false, seeded())
    const at = (p) => {
      const pose = emptyPose()
      addOneOff(pose, compiled, p)
      return [...pose]
    }
    expect(compiled.times[0]).toBe(0)
    expect(compiled.times.at(-1)).toBe(1)
    expect([...compiled.times]).toEqual([...compiled.times].sort((a, b) => a - b))
    if (!def.releases) expect(at(0).every((v) => v === 0)).toBe(true)
    if (!def.hold) expect(at(1).every((v) => v === 0)).toBe(true)
    for (const p of [0.1, 0.33, 0.5, 0.9]) expect(at(p).every(Number.isFinite)).toBe(true)
  })

  it('every state evaluates to finite numbers and names real one-offs', () => {
    for (const [name, def] of Object.entries(STATES)) {
      const pose = emptyPose()
      addState(pose, compileState(name), 1234, 1, 1, 0.5)
      expect(pose).toHaveLength(POSE_SIZE)
      expect([...pose].every(Number.isFinite), name).toBe(true)
      expect(def.label, name).toBeTruthy()
      expect(def.about, name).toBeTruthy()
      if (def.blink) expect(def.blink[0]).toBeLessThanOrEqual(def.blink[1])
      if (def.blinkWith) expect(ONE_OFFS[def.blinkWith], name).toBeDefined()
      if (def.enter) expect(ONE_OFFS[def.enter], name).toBeDefined()
      for (const tic of def.tics ?? []) {
        expect(ONE_OFFS[tic.play], `${name} tic ${tic.play}`).toBeDefined()
        expect(tic.every[0]).toBeLessThanOrEqual(tic.every[1])
      }
    }
  })

  it('every one-off names a real ease, and has a label and a description', () => {
    for (const [name, def] of Object.entries(ONE_OFFS)) {
      expect(def.label, name).toBeTruthy()
      expect(def.about, name).toBeTruthy()
      for (const [, , ease] of oneOffKeys(def, seeded())) if (ease) expect(EASES[ease], `${name} ${ease}`).toBeDefined()
    }
  })

  it('keeps the names the game uses', () => {
    for (const name of [
      'idle',
      'talking',
      'thinking',
      'listening',
      'waiting',
      'scanning',
      'alert',
      'annoyed',
      'skeptical',
      'offline',
      'surprised',
      'nervous'
    ]) {
      expect(STATES[name], name).toBeDefined()
    }
    for (const name of [
      'flash',
      'nod',
      'glitch',
      'assemble',
      'disassemble',
      'blink',
      'boom',
      'no',
      'slowBlink',
      'ha'
    ]) {
      expect(ONE_OFFS[name], name).toBeDefined()
    }
  })

  it('reduced motion keeps only light in a fade one-off', () => {
    const { tracks } = compileOneOff('assemble', true)
    const lightSlots = new Set()
    for (const [target, channels] of Object.entries(TARGETS)) {
      for (const channel of channels)
        if (['o', 'b', 'open', 'lid', 'under', 'tint'].includes(channel)) lightSlots.add(SLOTS[target][channel])
    }
    expect(tracks.length).toBeGreaterThan(0)
    for (const track of tracks) expect(lightSlots.has(track.slot)).toBe(true)
  })

  it('a staggered part starts late and still finishes with the rest', () => {
    const compiled = compileOneOff('assemble', false, seeded())
    const early = emptyPose()
    addOneOff(early, compiled, 0.3)
    // The beak leads and the brow facets come last: early on the beak has come further in.
    expect(poseValue(early, 'beak', 'o')).toBeGreaterThan(poseValue(early, '1', 'o'))
    const end = emptyPose()
    addOneOff(end, compiled, 1)
    expect([...end].every((v) => v === 0)).toBe(true)
  })

  it('a flipped one-off plays on the other side', () => {
    const always = () => 0 // below a half: flips
    const never = () => 0.9
    const mid = (random) => {
      const pose = emptyPose()
      addOneOff(pose, compileOneOff('tuftFlick', false, random), 0.2)
      return pose
    }
    expect(poseValue(mid(never), 'tuftL', 'r')).toBeGreaterThan(0)
    expect(poseValue(mid(never), 'tuftR', 'r')).toBe(0)
    // Mirrored: the right tuft, turning the other way on the page (which is the same way up).
    expect(poseValue(mid(always), 'tuftR', 'r')).toBeLessThan(0)
    expect(poseValue(mid(always), 'tuftL', 'r')).toBe(0)
  })

  it('no two glitches are the same', () => {
    const random = seeded(7)
    expect(oneOffKeys(ONE_OFFS.glitch, random)).not.toEqual(oneOffKeys(ONE_OFFS.glitch, random))
  })

  it('waves stay in range', () => {
    for (const shape of ['sin', 'sweep', 'noise', 'pulse', 'bump', 'talk']) {
      for (let t = 0; t < 20000; t += 37) {
        const value = waveValue(t, 1300, 0.2, shape, 1)
        expect(value, shape).toBeGreaterThanOrEqual(['sin', 'sweep', 'noise'].includes(shape) ? -1.0001 : 0)
        expect(value, shape).toBeLessThanOrEqual(1.0001)
      }
    }
  })

  it('her made-up voice stays between 0 and 1, speaks and pauses', () => {
    let loud = 0
    let quiet = 0
    for (let t = 0; t < 30000; t += 16) {
      const level = speech(t)
      expect(level).toBeGreaterThanOrEqual(0)
      expect(level).toBeLessThanOrEqual(1)
      if (level > 0.4) loud++
      if (level < 0.02) quiet++
    }
    expect(loud).toBeGreaterThan(100)
    expect(quiet).toBeGreaterThan(100)
  })

  it('springs arrive, rest exactly on target, and overshoot only when not calm', () => {
    const settle = (calm) => {
      const target = compileState('skeptical').pose
      const position = emptyPose()
      const velocity = emptyPose()
      let peak = 0
      let moving = true
      for (let frame = 0; frame < 600 && moving; frame++) {
        moving = stepSprings(position, velocity, target, 16, calm)
        // The raised brow goes up (negative y): how far past its target does it get?
        peak = Math.min(peak, poseValue(position, 'ridgeL', 'y'))
      }
      expect(moving).toBe(false)
      expect([...position]).toEqual([...target])
      return peak
    }
    const goal = poseValue(compileState('skeptical').pose, 'ridgeL', 'y')
    expect(settle(false)).toBeLessThan(goal - 0.05)
    expect(settle(true)).toBeGreaterThanOrEqual(goal - 0.01)
  })

  it('springs survive a long frame', () => {
    const target = compileState('surprised').pose
    const position = emptyPose()
    const velocity = emptyPose()
    for (let frame = 0; frame < 100; frame++) stepSprings(position, velocity, target, 200)
    expect([...position].every(Number.isFinite)).toBe(true)
    expect([...position]).toEqual([...target])
  })
})
