// The title scene's departing ship. It leaves its place among the three ships circling the sun, spins
// up into a tight orbit, slingshots off to the upper right, flies past the viewer, then comes back in
// from the left and slides into its old place, and does it all again.
//
// Positions are in scene units (title-scene.vue), from the screen's center; angles are degrees,
// clockwise from +x, as in CSS. Time is the ships' orbit animation's own clock, so the departing ship
// always knows where its empty place is. The whole loop is a pure function of that clock: a hidden
// tab or a jump in time can't put it out of step.

/** One lap of the ships' orbit, in seconds (title-scene.vue `.orbit`). */
export const ORBIT_S = 45
/** Where the three ships are in the orbit when the orbit's clock reads 0. */
export const SLOTS = [0, 120, 240]
const ORBIT_RADIUS = 112
const TIGHT_RADIUS = 76
const LAP_SPEED = 360 / ORBIT_S
/**
 * The spin: closing in on the sun over CLOSE_IN_S while it speeds up the whole time, faster and faster,
 * from orbit speed to SPIN_SPEED (degrees per second) as it leaves. It lasts at least SPIN_S, a little
 * more so the slingshot lines up (see planFlight).
 */
const SPIN_SPEED = 280
const CLOSE_IN_S = 5
const SPIN_S = 8
/** The slingshot leaves just left of the sun's top, heading right, a little upward. */
const EXIT = 265
/** It comes back up the sun's upper left side into its place. */
const JOIN = 240
/** It leaves the screen this many times faster than it left the orbit. */
const ESCAPE_SPEED_UP = 1.9
const WAIT_OUT_S = 4
const FLYBY_S = 9
const WAIT_BACK_S = 3
/** Coming in from the left (scene units per second), slowing to orbit speed. */
const RETURN_SPEED = 150
const MIN_ORBIT_S = 25
const FIRST_SPIN_AFTER_S = 8
const ENGINE_FADE_S = 1.2
/** The flyby's scale far away and at its closest (1 = the size of the ships in orbit). */
const FAR = 0.4
const NEAR = 10

const rad = (degrees) => (degrees * Math.PI) / 180
const mod = (value, base) => ((value % base) + base) % base
const smoothstep = (x) => x * x * (3 - 2 * x)
const along = (angle, radius) => ({ x: Math.cos(rad(angle)) * radius, y: Math.sin(rad(angle)) * radius })
const plus = (a, b) => ({ x: a.x + b.x, y: a.y + b.y })
const minus = (a, b) => ({ x: a.x - b.x, y: a.y - b.y })
const times = (a, k) => ({ x: a.x * k, y: a.y * k })
const length = (a) => Math.hypot(a.x, a.y)
const unit = (a) => times(a, 1 / length(a))
/** The direction of travel of something circling clockwise at `angle`. */
const tangent = (angle) => ({ x: -Math.sin(rad(angle)), y: Math.cos(rad(angle)) })
/** The CSS rotation that points the ship art (nose up) along `direction`. */
const heading = (direction) => (Math.atan2(direction.y, direction.x) * 180) / Math.PI + 90

/**
 * How far the spinning ship has turned (degrees) `t` seconds into a spin of `spinS`. Its speed rises
 * from LAP_SPEED to SPIN_SPEED with the square of the time, so it gains faster and faster.
 */
function spinTurn(t, spinS) {
  const x = t / spinS
  return LAP_SPEED * t + ((SPIN_SPEED - LAP_SPEED) * spinS * x * x * x) / 3
}

/** A cubic Bézier walked by distance, so a speed can be put on it. */
function curve(p0, p1, p2, p3) {
  const at = (t) => {
    const u = 1 - t
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
    }
  }
  const slope = (t) => {
    const u = 1 - t
    return {
      x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
      y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
    }
  }
  const steps = 64
  const distances = [0]
  let previous = p0
  for (let i = 1; i <= steps; i++) {
    const point = at(i / steps)
    distances.push(distances[i - 1] + length(minus(point, previous)))
    previous = point
  }
  const total = distances[steps]
  /** The point `distance` along the curve, and which way it's heading there. */
  const walk = (distance) => {
    const d = Math.min(Math.max(distance, 0), total)
    let i = 1
    while (i < steps && distances[i] < d) i++
    const t = (i - 1 + (d - distances[i - 1]) / (distances[i] - distances[i - 1] || 1)) / steps
    return { position: at(t), rotation: heading(slope(t)) }
  }
  return { total, walk }
}

/**
 * Works out the loop for a screen: the paths, and when in the orbit's clock each part starts.
 * @param {{ sun: {x: number, y: number}, halfWidth: number, halfHeight: number }} scene
 *   the sun's center and half the screen's size, in scene units
 * @param {number} [slot] which of SLOTS leaves; by default the one that can leave soonest
 */
export function planFlight(scene, slot) {
  const { sun, halfWidth, halfHeight } = scene

  const exitPoint = plus(sun, along(EXIT, TIGHT_RADIUS))
  const offTopRight = { x: halfWidth + 100, y: -halfHeight - 80 }
  const escapeReach = length(minus(offTopRight, exitPoint))
  const escapeControl = plus(exitPoint, times(tangent(EXIT), escapeReach / 3))
  const escape = curve(
    exitPoint,
    escapeControl,
    minus(offTopRight, times(unit(minus(offTopRight, escapeControl)), escapeReach / 3)),
    offTopRight
  )
  const exitSpeed = rad(SPIN_SPEED) * TIGHT_RADIUS
  const escapeS = (2 * escape.total) / (exitSpeed * (1 + ESCAPE_SPEED_UP))

  const joinPoint = plus(sun, along(JOIN, ORBIT_RADIUS))
  const offLeft = { x: -halfWidth - 60, y: sun.y + 230 }
  const returnReach = length(minus(joinPoint, offLeft))
  const joinControl = minus(joinPoint, times(tangent(JOIN), returnReach / 3))
  const comeBack = curve(
    offLeft,
    plus(offLeft, times(unit(minus(joinControl, offLeft)), returnReach / 3)),
    joinControl,
    joinPoint
  )
  const orbitSpeed = rad(LAP_SPEED) * ORBIT_RADIUS
  const returnS = (2 * comeBack.total) / (RETURN_SPEED + orbitSpeed)

  // A flyby far off in the upper right, coming at the viewer and passing off the lower left. Its depth
  // closes at a steady rate, so it looks faster the closer it gets.
  const flyby = {
    from: { x: halfWidth * 0.9, y: -halfHeight * 0.9 },
    to: { x: -halfWidth - 450, y: halfHeight + 300 }
  }

  // The spin runs a little longer than SPIN_S (by under one lap's worth of its gain on the orbit) so
  // that the slingshot leaves at EXIT and the ship arrives back at JOIN just as its place in the orbit
  // gets there. Over a spin of S seconds the ship gains (SPIN_SPEED - LAP_SPEED) * S / 3 degrees on
  // its place (spinTurn).
  const afterSpin = escapeS + WAIT_OUT_S + FLYBY_S + WAIT_BACK_S + returnS
  const gainPerS = (SPIN_SPEED - LAP_SPEED) / 3
  const gap = EXIT - JOIN + LAP_SPEED * afterSpin - gainPerS * SPIN_S
  const spinS = SPIN_S + mod(gap, 360) / gainPerS
  const startAngle = mod(EXIT - spinTurn(spinS, spinS), 360)
  const busyS = spinS + afterSpin
  const firstSpinOf = (from) => mod((startAngle - from) / LAP_SPEED - FIRST_SPIN_AFTER_S, ORBIT_S) + FIRST_SPIN_AFTER_S
  slot ??= SLOTS.reduce((best, from) => (firstSpinOf(from) < firstSpinOf(best) ? from : best))
  const firstSpin = firstSpinOf(slot)

  return {
    sun,
    escape,
    comeBack,
    flyby,
    startAngle,
    spinS,
    escapeS,
    returnS,
    exitSpeed,
    orbitSpeed,
    slot,
    firstSpin,
    busyS,
    periodS: ORBIT_S * Math.ceil((busyS + MIN_ORBIT_S) / ORBIT_S)
  }
}

/** The departing ship's place in the orbit (degrees) at `seconds` on the orbit's clock. */
export function slotAngle(plan, seconds) {
  return mod(plan.slot + LAP_SPEED * seconds, 360)
}

/**
 * Where the departing ship is at `seconds` on the orbit's clock.
 * @returns {{ x: number, y: number, rotation: number, scale: number, opacity: number, engines: number }}
 *   position in scene units, CSS rotation and scale, the ship's opacity and its engine flames' (0–1)
 */
export function flightPose(plan, seconds) {
  const inOrbit = (angle) => ({
    ...plus(plan.sun, along(angle, ORBIT_RADIUS)),
    rotation: angle + 180,
    scale: 1,
    opacity: 1,
    engines: 0
  })
  const hidden = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 0, engines: 0 }
  if (seconds < plan.firstSpin) return inOrbit(slotAngle(plan, seconds))

  let t = mod(seconds - plan.firstSpin, plan.periodS)
  if (t >= plan.busyS) return inOrbit(slotAngle(plan, seconds))

  // Closing in, and speeding up faster and faster.
  if (t < plan.spinS) {
    const angle = plan.startAngle + spinTurn(t, plan.spinS)
    const radius = ORBIT_RADIUS + (TIGHT_RADIUS - ORBIT_RADIUS) * smoothstep(Math.min(1, t / CLOSE_IN_S))
    return {
      ...plus(plan.sun, along(angle, radius)),
      rotation: angle + 180,
      scale: 1,
      opacity: 1,
      engines: Math.min(1, t / ENGINE_FADE_S)
    }
  }
  t -= plan.spinS

  // The slingshot, speeding up off the top right.
  if (t < plan.escapeS) {
    const speedUp = (plan.exitSpeed * (ESCAPE_SPEED_UP - 1)) / plan.escapeS
    const { position, rotation } = plan.escape.walk(plan.exitSpeed * t + (speedUp * t * t) / 2)
    return { ...position, rotation, scale: 1, opacity: 1, engines: 1 }
  }
  t -= plan.escapeS + WAIT_OUT_S
  if (t < 0) return hidden

  // The flyby, in perspective: scale is 1 / depth, and depth closes linearly.
  if (t < FLYBY_S) {
    const { from, to } = plan.flyby
    const progress = t / FLYBY_S
    const depth = 1 / FAR + (1 / NEAR - 1 / FAR) * progress
    const x = from.x / FAR + (to.x / NEAR - from.x / FAR) * progress
    const y = from.y / FAR + (to.y / NEAR - from.y / FAR) * progress
    return {
      x: x / depth,
      y: y / depth,
      rotation: heading(minus(to, from)),
      scale: 1 / depth,
      opacity: Math.min(1, t / 1.5),
      engines: 1
    }
  }
  t -= FLYBY_S + WAIT_BACK_S
  if (t < 0) return hidden

  // Back in from the left, slowing into its place; the engines wind down as it settles.
  const slowDown = (RETURN_SPEED - plan.orbitSpeed) / plan.returnS
  const { position, rotation } = plan.comeBack.walk(RETURN_SPEED * t - (slowDown * t * t) / 2)
  return {
    ...position,
    rotation,
    scale: 1,
    opacity: 1,
    engines: Math.min(1, (plan.returnS - t) / (ENGINE_FADE_S * 1.5))
  }
}
