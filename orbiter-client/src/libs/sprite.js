import { markRaw } from 'vue'
import { orbitAt, shipOrbitRadius, SHIP_ORBIT_SPEED } from '@/sdk/game/orbits'
import { SPRITE_TYPES, SHIP_SIZE, STATION_START_ROTATION, ART, spriteScaleOf } from '@/libs/sprite-types'

/** How fast a ship slides round its orbit to a new place among the ships sharing it. */
const PHASE_GLIDE_DEG_PER_S = 30
/** How long a ship takes to fly from its orbit to its pad, or back. */
const DOCKING_S = 3
/** A docking tube's length, as a share of the station's radius (title-visitor.js has the same look). */
const DOCK_TUBE = 0.25
/** How far out the station art's pads are, as a share of its radius. */
const PAD_FACE = 1.0

/**
 * A ship moving to another planet flies at about this speed (world units per second), taking at least
 * TRANSIT_MIN_S and at most TRANSIT_MAX_S.
 */
const TRANSIT_SPEED = 220
const TRANSIT_MIN_S = 3
const TRANSIT_MAX_S = 10

const rad = (degrees) => (degrees * Math.PI) / 180
/** The difference between two angles in degrees, the short way round (-180 to 180). */
const turn = (from, to) => ((((to - from) % 360) + 540) % 360) - 180
const smoothstep = (x) => x * x * (3 - 2 * x)

/**
 * How one game object (sdk/system.js) is drawn: its click target, the zoom the camera moves to when
 * it's selected, and where it is this frame. The game data itself stays on `object`.
 */
export default class Sprite {
  /**
   * @param {import('@/sdk/system').GameObject} object
   * @param {Record<string, import('@/sdk/system').GameObject>} [objects]  the whole system, for docking
   */
  constructor(object, objects) {
    this.object = object
    this.key = object.key
    this.type = object.type
    this.orbiting = object.orbiting
    // Ships have no size on chain; every ship is drawn at the same size.
    this.size = object.type === 'ship' ? SHIP_SIZE : object.size
    this.selectorSize = SPRITE_TYPES[object.type].selectorSize
    if (object.type === 'star') this.selectorSize *= this.size
    this.cameraScale = SPRITE_TYPES[object.type].cameraScale
    // Position relative to what it orbits, and its facing.
    this.telemetry = {
      translatex: 0,
      translatey: 0,
      rotation: object.type === 'station' ? STATION_START_ROTATION : 0
    }
    // Absolute position in the star system.
    this.position = { x: 0, y: 0 }
    // Degrees ahead on its orbit (ships sharing one are spread out; see sdk/game/orbits.js
    // shipOrbitPhases). When the ships sharing an orbit change, it glides to its new place.
    this.phase = object.orbit?.phase ?? 0
    this.phaseTime = null
    // Docked at a station (ships): 0 in orbit, 1 at the pad, between while flying from one to the other.
    this.dock = this.dockGeometry(object, objects)
    this.docking = this.dock ? 1 : 0
    // Flying from the planet it was at to a new one (ships; see carryOver and fly).
    this.transit = null
    // My ship, in my own view only: the planet it has flown to because I selected it (see visitPlanet).
    this.visit = null
    // Telemetry changes every frame; the frame loop updates it and components read it per frame.
    return markRaw(this)
  }

  updateTelemetry(gameTime) {
    const elapsed = this.phaseTime == null ? 0 : Math.max(0, gameTime - this.phaseTime) / 1000
    this.glidePhase(gameTime)
    const orbit = orbitAt(this.object.orbit.radius, this.object.orbit.speed, gameTime, this.phase)
    let x = orbit.x
    let y = orbit.y
    // Sprites face along their orbit's radius; stations spin four times as fast, the other way.
    let rotation = this.type == 'station' ? -orbit.angle * 4 : orbit.angle

    if (this.type === 'ship') {
      const target = this.dock ? 1 : 0
      const step = elapsed / DOCKING_S
      this.docking =
        Math.abs(target - this.docking) <= step ? target : this.docking + Math.sign(target - this.docking) * step
      if (this.docking > 0) {
        const pad = this.padPose(gameTime)
        const k = smoothstep(this.docking)
        x += (pad.x - x) * k
        y += (pad.y - y) * k
        rotation += turn(rotation, pad.rotation) * k
      }
    }
    this.telemetry.translatex = x
    this.telemetry.translatey = y
    this.telemetry.rotation = rotation
    return this.telemetry
  }

  /**
   * Where a docked ship sits, from what it needs of the station: the station's orbit, how big it's
   * drawn, and the ship's size. Null when the ship isn't docked.
   */
  dockGeometry(object, objects) {
    const station = object.dock && objects?.[object.dock.station]
    if (!station) return null
    const stationRadius = ART.station * spriteScaleOf(station, objects)
    const shipScale = spriteScaleOf(object, objects)
    const tube = stationRadius * DOCK_TUBE
    return {
      orbit: station.orbit,
      pad: object.dock.pad,
      distance: stationRadius * PAD_FACE + tube + (ART.ship * shipScale) / 2,
      // The tube in the ship's own drawing units, from just inside its side to just inside the pad.
      tube: { from: ART.ship / 2 - 0.5, to: ART.ship / 2 + tube / shipScale + 0.5 }
    }
  }

  /**
   * The ship at its pad (relative to the planet): side-on to the station, nose the way it turns, so it
   * turns with the station as if attached. Matches the station's own rotation in updateTelemetry.
   */
  padPose(gameTime) {
    const dock = this.dock ?? this.lastDock
    const station = orbitAt(dock.orbit.radius, dock.orbit.speed, gameTime)
    const direction = -station.angle * 4 + dock.pad
    return {
      x: station.x + Math.cos(rad(direction)) * dock.distance,
      y: station.y + Math.sin(rad(direction)) * dock.distance,
      // The ship art is drawn turned 180° (sprite-transform), so this points its nose anticlockwise.
      rotation: direction + 180
    }
  }

  /** Moves the phase toward the orbit's, by the shorter way round, at PHASE_GLIDE_DEG_PER_S. */
  glidePhase(gameTime) {
    const target = this.object.orbit?.phase ?? 0
    const elapsed = this.phaseTime == null ? 0 : Math.max(0, gameTime - this.phaseTime) / 1000
    this.phaseTime = gameTime
    const off = ((((target - this.phase) % 360) + 540) % 360) - 180
    const step = PHASE_GLIDE_DEG_PER_S * elapsed
    this.phase = Math.abs(off) <= step ? target : this.phase + Math.sign(off) * step
  }

  /** Keeps the previous sprite's animation state when the same object is reloaded. */
  carryOver(previous) {
    if (previous.key !== this.key) return
    this.telemetry = previous.telemetry
    this.phase = previous.phase
    this.phaseTime = previous.phaseTime
    // Undocking flies back from the pad it was at; docking flies in from where it was.
    this.docking = previous.docking ?? this.docking
    if (!this.dock && previous.dock) this.lastDock = previous.dock
    // At another planet now (a ship's place is wherever its pilot last made a move): it flies there,
    // from wherever it was, instead of jumping. It arrives already docked, or in its orbit.
    if (this.type === 'ship' && previous.orbiting !== this.orbiting) {
      this.transit = {
        from: { ...previous.position },
        facing: previous.telemetry.rotation,
        start: null
      }
      this.docking = this.dock ? 1 : 0
    } else if (previous.transit) {
      // Reloaded mid-flight (the game reloads again right after a move): the flight carries on.
      this.transit = previous.transit
    }
    this.visit = previous.visit
  }

  /**
   * My ship sets off for another planet in my own view (null: back to where it really is), from where
   * it's shown now. Nothing is sent to the chain; the real ship stays where it is.
   * @param {string | null} planetKey
   * @param {{ x: number, y: number, rotation: number }} shown  where it was drawn last frame
   */
  visitPlanet(planetKey, shown) {
    this.visit = planetKey
    this.transit = { from: { x: shown.x, y: shown.y }, facing: shown.rotation, start: null }
  }

  /**
   * While visiting: puts the ship in orbit round the visited planet, where it would be if it were
   * really there (fly then eases it there). Its telemetry stays relative to the planet it's really at.
   */
  placeAtVisit(planet, home, gameTime) {
    const orbit = orbitAt(shipOrbitRadius(planet.object.size), SHIP_ORBIT_SPEED, gameTime, this.phase)
    this.position.x = planet.position.x + orbit.x
    this.position.y = planet.position.y + orbit.y
    this.telemetry.translatex = this.position.x - home.position.x
    this.telemetry.translatey = this.position.y - home.position.y
    this.telemetry.rotation = orbit.angle
  }

  /**
   * Moves a ship along its flight to a new planet, this frame. Called after its position has been
   * worked out as usual (where it's headed); replaces that with where it is on the way. The flight
   * spirals round the star, from where it set off to where it's headed, easing in and out, nose along
   * its path. Returns true when it has arrived.
   */
  fly(gameTime) {
    const flight = this.transit
    const target = { x: this.position.x, y: this.position.y }
    const parent = { x: target.x - this.telemetry.translatex, y: target.y - this.telemetry.translatey }
    if (flight.start == null) {
      flight.start = gameTime
      const seconds = Math.hypot(target.x - flight.from.x, target.y - flight.from.y) / TRANSIT_SPEED
      flight.duration = Math.min(TRANSIT_MAX_S, Math.max(TRANSIT_MIN_S, seconds)) * 1000
    }
    const x = (gameTime - flight.start) / flight.duration
    if (x >= 1) {
      this.transit = null
      return true
    }
    const k = smoothstep(x)
    const r0 = Math.hypot(flight.from.x, flight.from.y)
    const r1 = Math.hypot(target.x, target.y)
    const a0 = Math.atan2(flight.from.y, flight.from.x)
    const a1 = Math.atan2(target.y, target.x)
    const r = r0 + (r1 - r0) * k
    const sweep = rad(turn((a0 * 180) / Math.PI, (a1 * 180) / Math.PI))
    const a = a0 + sweep * k
    const position = { x: r * Math.cos(a), y: r * Math.sin(a) }

    // Nose along its path (the art is drawn turned 180°, so its nose points 90° past its rotation),
    // turning from the way it faced as it sets off, and into its new orbit's facing as it arrives.
    // The path's direction here (its derivative along the spiral), so the nose doesn't twitch with the
    // destination circling its planet.
    const dx = (r1 - r0) * Math.cos(a) - r * sweep * Math.sin(a)
    const dy = (r1 - r0) * Math.sin(a) + r * sweep * Math.cos(a)
    const heading = Math.hypot(dx, dy) > 1e-9 ? (Math.atan2(dy, dx) * 180) / Math.PI - 90 : flight.facing
    let rotation = flight.facing + turn(flight.facing, heading) * Math.min(1, x / 0.1)
    rotation += turn(rotation, this.telemetry.rotation) * Math.max(0, (x - 0.85) / 0.15)

    this.position.x = position.x
    this.position.y = position.y
    this.telemetry.translatex = position.x - parent.x
    this.telemetry.translatey = position.y - parent.y
    this.telemetry.rotation = rotation
    return false
  }
}
