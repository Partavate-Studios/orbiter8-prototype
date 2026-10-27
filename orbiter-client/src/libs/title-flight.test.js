import { describe, expect, it } from 'vitest'
import { flightPose, planFlight, slotAngle } from './title-flight'

// The landscape and portrait layouts of title-scene.vue, on a 16:9 and a 9:16 screen.
const SCREENS = {
  landscape: { sun: { x: -560, y: -280 }, halfWidth: 800, halfHeight: 450 },
  portrait: { sun: { x: -260, y: -640 }, halfWidth: 450, halfHeight: 800 }
}

describe('the title scene departing ship', () => {
  for (const [name, scene] of Object.entries(SCREENS)) {
    const plan = planFlight(scene)

    it(`leaves for the first time soon after the page opens (${name})`, () => {
      expect(plan.firstSpin).toBeGreaterThanOrEqual(8)
      expect(plan.firstSpin).toBeLessThan(8 + 15)
    })

    it(`never jumps while it's on screen (${name})`, () => {
      // Two whole loops, a frame at a time: anything visible moves less than a frame's worth.
      const frame = 1 / 60
      let previous = flightPose(plan, 0)
      for (let s = frame; s < plan.firstSpin + 2 * plan.periodS; s += frame) {
        const pose = flightPose(plan, s)
        if (pose.opacity > 0 && previous.opacity > 0 && pose.scale < 1.5) {
          const step = Math.hypot(pose.x - previous.x, pose.y - previous.y)
          expect(step, `at ${s.toFixed(2)} s`).toBeLessThan(12)
        }
        previous = pose
      }
    })

    it(`leaves from and comes back to its own place in the orbit (${name})`, () => {
      const start = plan.firstSpin
      const back = start + plan.busyS
      for (const s of [start, back, back + 10]) {
        const pose = flightPose(plan, s)
        const angle = slotAngle(plan, s)
        expect(pose.x).toBeCloseTo(scene.sun.x + 112 * Math.cos((angle * Math.PI) / 180), 0)
        expect(pose.y).toBeCloseTo(scene.sun.y + 112 * Math.sin((angle * Math.PI) / 180), 0)
        expect(pose.engines).toBeCloseTo(0, 1)
      }
    })
  }
})
