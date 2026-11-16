import { describe, it, expect } from 'vitest'
import { visitorPose, VISITOR_PERIOD_S } from './title-visitor'

describe("the title's space port visitor", () => {
  const reach = 900

  it("never jumps while it's on screen, docking and leaving included", () => {
    const frame = 1 / 60
    let previous = visitorPose(0, reach)
    for (let s = frame; s < 3 * VISITOR_PERIOD_S; s += frame) {
      const pose = visitorPose(s, reach)
      if (pose.opacity > 0 && previous.opacity > 0) {
        const step = Math.hypot(pose.x - previous.x, pose.y - previous.y)
        expect(step, `at ${s.toFixed(2)} s`).toBeLessThan(40)
        const turn = Math.abs(((pose.rotation - previous.rotation + 540) % 360) - 180)
        expect(turn, `turn at ${s.toFixed(2)} s`).toBeLessThan(15)
      }
      previous = pose
    }
  })

  it('is off screen when it appears and when it goes', () => {
    const frame = 1 / 60
    let previous = visitorPose(0, reach)
    for (let s = frame; s < 2 * VISITOR_PERIOD_S; s += frame) {
      const pose = visitorPose(s, reach)
      const shown = pose.opacity > 0
      if (shown !== previous.opacity > 0) {
        const edge = shown ? pose : previous
        expect(Math.hypot(edge.x, edge.y), `at ${s.toFixed(2)} s`).toBeGreaterThan(reach * 0.9)
      }
      previous = pose
    }
  })

  it('stays docked a while, turning with the station', () => {
    const docked = []
    for (let s = 0; s < VISITOR_PERIOD_S; s += 0.5) if (visitorPose(s, reach).docked) docked.push(s)
    expect(docked.length * 0.5).toBeGreaterThan(15)
    const first = visitorPose(docked[0], reach)
    const last = visitorPose(docked.at(-1), reach)
    expect(Math.hypot(first.x, first.y)).toBeCloseTo(Math.hypot(last.x, last.y), 6)
  })
})
