import { describe, expect, it } from 'vitest'
import {
  ONE_OFFS,
  STATES,
  TARGETS,
  addOneOff,
  addState,
  compileOneOff,
  compilePose,
  compileState,
  compileWaves,
  emptyPose
} from './minerva-poses'

// Minerva's expressions are data; these catch a mistyped target or channel (which would otherwise
// silently do nothing) and a one-off that doesn't return her to the state it played over.

const everyPose = [
  ...Object.entries(STATES).flatMap(([name, def]) => [
    [`${name} pose`, compilePose(def.pose)],
    [`${name} waves`, compileWaves(def.waves)]
  ]),
  ...Object.entries(ONE_OFFS).flatMap(([name, def]) =>
    def.keys.map(([at, pose]) => [`${name} at ${at}`, compilePose(pose)])
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
    const pose = compilePose({ brow: { x: 2, r: 5, y: 1 } })
    expect(pose).toContainEqual(['1', 'x', -2])
    expect(pose).toContainEqual(['4', 'x', 2])
    expect(pose).toContainEqual(['1', 'r', 5])
    expect(pose).toContainEqual(['4', 'r', -5])
    expect(pose).toContainEqual(['4', 'y', 1])
  })

  it.each(Object.entries(ONE_OFFS))('%s starts at rest, and ends at rest unless it holds', (name, def) => {
    const compiled = compileOneOff(name)
    const at = (p) => {
      const pose = emptyPose()
      addOneOff(pose, compiled, p)
      return Object.values(pose).flatMap(Object.values)
    }
    expect(def.keys[0][0]).toBe(0)
    expect(def.keys.at(-1)[0]).toBe(1)
    if (!def.releases) expect(at(0).every((v) => v === 0)).toBe(true)
    if (!def.hold) expect(at(1).every((v) => v === 0)).toBe(true)
    expect(at(0.5).every(Number.isFinite)).toBe(true)
  })

  it('every state evaluates to finite numbers and names valid timers', () => {
    for (const [name, def] of Object.entries(STATES)) {
      const pose = emptyPose()
      addState(pose, compileState(name), 1234)
      expect(Object.values(pose).flatMap(Object.values).every(Number.isFinite), name).toBe(true)
      if (def.blink) expect(def.blink[0]).toBeLessThanOrEqual(def.blink[1])
      if (def.blinkWith) expect(ONE_OFFS[def.blinkWith], name).toBeDefined()
    }
  })

  it('reduced motion keeps only fading and brightness in a fade one-off', () => {
    const { keys } = compileOneOff('assemble', true)
    for (const [, pose] of keys) for (const [, channel] of pose) expect(['o', 'b', 'open']).toContain(channel)
  })
})
