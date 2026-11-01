import { markRaw } from 'vue'
import { orbitAt } from '@/sdk/game/orbits'
import { SPRITE_TYPES, SHIP_SIZE, STATION_START_ROTATION, ART, spriteScaleOf } from '@/libs/sprite-types'

/** How fast a ship slides round its orbit to a new place among the ships sharing it. */
const PHASE_GLIDE_DEG_PER_S = 30
/** How long a ship takes to fly from its orbit to its pad, or back. */
const DOCKING_S = 3
/** A docking tube's length, as a share of the station's radius (title-visitor.js has the same look). */
const DOCK_TUBE = 0.25
/** How far out the station art's pads are, as a share of its radius. */
const PAD_FACE = 1.0

const rad = (degrees) => (degrees * Math.PI) / 180
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
        rotation += (((((pad.rotation - rotation) % 360) + 540) % 360) - 180) * k
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
  }
}
