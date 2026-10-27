// The title scene's space port: four ships docked side-on at the station's pads, and now and then a
// visitor that flies in, docks at a free pad, stays a while and flies off again.
//
// Positions are in the port's own units (title-scene.vue, the port's viewBox), from the station's
// center; angles are degrees, clockwise from +x, as in CSS. Time is the station's spin animation's own
// clock, so the visitor always knows where its pad is. Like the departing sun ship
// (libs/title-flight.js), the whole loop is a pure function of that clock.

/** One turn of the station, in seconds (title-scene.vue `.spin`). */
export const SPIN_S = 240
/** The station's six docking pads (the raised middle of each side), and how far out their faces are. */
export const PADS = [0, 60, 120, 180, 240, 300]
const PAD_FACE = 36.3
/** A ship's width, nose up, at scale 1 (fleet-ship.svg.vue): it docks with its side to the pad. */
const SHIP_WIDTH = 9.2
const GAP = 0.6

/** The ships that stay docked, and the pads the visitor can use. */
export const DOCKED = [
  { pad: 0, type: 'orbiter8', scale: 2.4 },
  { pad: 60, type: 'polygon', scale: 2.5 },
  { pad: 180, type: 'boba', scale: 2.7 },
  { pad: 240, type: 'moonbeam', scale: 2.5 }
]
const FREE_PADS = PADS.filter((pad) => !DOCKED.some((ship) => ship.pad === pad))
export const VISITOR_SCALE = 2.4

/** The visitor's loop: away, flying in, docked, flying off, away again. */
const PERIOD_S = 80
const AWAY_S = 14
const APPROACH_S = 7
const STAY_S = 24
const DEPART_S = 6
const ENGINES_OFF_S = 1.5

const rad = (degrees) => (degrees * Math.PI) / 180
const along = (angle, length) => ({ x: Math.cos(rad(angle)) * length, y: Math.sin(rad(angle)) * length })
const plus = (a, b) => ({ x: a.x + b.x, y: a.y + b.y })
const times = (a, k) => ({ x: a.x * k, y: a.y * k })
/** The CSS rotation that points the ship art (nose up) along a direction. */
const heading = (direction) => (Math.atan2(direction.y, direction.x) * 180) / Math.PI + 90

/** How far from the station's center a ship docked at a pad sits. */
export function dockRadius(scale) {
  return PAD_FACE + GAP + (SHIP_WIDTH * scale) / 2
}

/**
 * A docked ship's place in the station's own frame, as an SVG transform: side to the pad, nose the
 * way the station turns (clockwise), so it never looks to be flying backwards.
 */
export function dockTransform(pad, scale) {
  return `rotate(${pad}) translate(${dockRadius(scale)} 0) rotate(180) scale(${scale})`
}

/** The station's turn (degrees) at `seconds` on its clock. */
const spinAt = (seconds) => (360 * seconds) / SPIN_S

/** Where a ship docked at `pad` is in the screen's frame at `seconds`: position and rotation. */
function dockedPose(pad, scale, seconds) {
  const angle = pad + spinAt(seconds)
  return { ...along(angle, dockRadius(scale)), rotation: angle + 180, angle }
}

/** A cubic Bézier: the point at t, and which way it's heading there. */
function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t
  const point = {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
  }
  const slope = {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
  }
  return { point, slope }
}

/**
 * Where the visitor is at `seconds` on the station's clock.
 * @param {number} seconds
 * @param {number} reach  far enough from the station to be off screen, in port units
 * @returns {{ x: number, y: number, rotation: number, opacity: number, engines: number, docked: boolean }}
 */
export function visitorPose(seconds, reach) {
  const hidden = { x: 0, y: 0, rotation: 0, opacity: 0, engines: 0, docked: false }
  const cycle = Math.floor(seconds / PERIOD_S)
  let t = seconds - cycle * PERIOD_S - AWAY_S
  if (t < 0) return hidden

  // It docks at whichever free pad faces most to the right as it arrives, so it comes in and leaves on
  // the station's side of the screen rather than across the title.
  const dockAt = cycle * PERIOD_S + AWAY_S + APPROACH_S
  const pad = FREE_PADS.reduce((best, pad) =>
    Math.cos(rad(pad + spinAt(dockAt))) > Math.cos(rad(best + spinAt(dockAt))) ? pad : best
  )

  // Flying in from behind the pad and outward, slowing to a stop alongside it.
  if (t < APPROACH_S) {
    const dock = dockedPose(pad, VISITOR_SCALE, dockAt)
    const forward = along(dock.angle + 90, 1)
    const outward = along(dock.angle, 1)
    const p3 = { x: dock.x, y: dock.y }
    const p2 = plus(p3, times(forward, -18))
    const p0 = plus(p3, times(plus(times(forward, -1), times(outward, 0.8)), reach))
    const p1 = plus(p0, times(plus(times(forward, 1), times(outward, -0.5)), reach * 0.35))
    const x = t / APPROACH_S
    const { point, slope } = bezier(p0, p1, p2, p3, 1 - (1 - x) * (1 - x) * (1 - x))
    return {
      ...point,
      rotation: x < 1 ? heading(slope) : dock.rotation,
      opacity: 1,
      engines: Math.min(1, (APPROACH_S - t) / ENGINES_OFF_S),
      docked: false
    }
  }
  t -= APPROACH_S

  // Docked, turning with the station.
  if (t < STAY_S) {
    const dock = dockedPose(pad, VISITOR_SCALE, seconds)
    return { x: dock.x, y: dock.y, rotation: dock.rotation, opacity: 1, engines: 0, docked: true }
  }
  t -= STAY_S

  // Pulling away forward, speeding up, and curving off outward.
  if (t < DEPART_S) {
    const leaveAt = dockAt + STAY_S
    const dock = dockedPose(pad, VISITOR_SCALE, leaveAt)
    const forward = along(dock.angle + 90, 1)
    const outward = along(dock.angle, 1)
    const p0 = { x: dock.x, y: dock.y }
    const p1 = plus(p0, times(forward, 18))
    const p3 = plus(p0, times(plus(forward, times(outward, 0.8)), reach))
    const p2 = plus(p3, times(plus(forward, times(outward, 0.8)), -reach * 0.5))
    const x = t / DEPART_S
    const { point, slope } = bezier(p0, p1, p2, p3, x * x * x)
    return {
      ...point,
      rotation: x > 0 ? heading(slope) : dock.rotation,
      opacity: 1,
      engines: Math.min(1, t / ENGINES_OFF_S),
      docked: false
    }
  }
  return hidden
}

/** The visitor's period on the station's clock, for tests. */
export const VISITOR_PERIOD_S = PERIOD_S
