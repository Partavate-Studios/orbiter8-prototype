import { markRaw } from 'vue'
import { orbitAt } from '@/sdk/game/orbits'
import { SPRITE_TYPES, SHIP_SIZE, STATION_START_ROTATION } from '@/libs/sprite-types'

/** How fast a ship slides round its orbit to a new place among the ships sharing it. */
const PHASE_GLIDE_DEG_PER_S = 30

/**
 * How one game object (sdk/system.js) is drawn: its click target, the zoom the camera moves to when
 * it's selected, and where it is this frame. The game data itself stays on `object`.
 */
export default class Sprite {
  /** @param {import('@/sdk/system').GameObject} object */
  constructor(object) {
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
    // Telemetry changes every frame; the frame loop updates it and components read it per frame.
    return markRaw(this)
  }

  updateTelemetry(gameTime) {
    this.glidePhase(gameTime)
    const orbit = orbitAt(this.object.orbit.radius, this.object.orbit.speed, gameTime, this.phase)
    this.telemetry.translatex = orbit.x
    this.telemetry.translatey = orbit.y
    // Sprites face along their orbit's radius; stations spin four times as fast, the other way.
    this.telemetry.rotation = this.type == 'station' ? -orbit.angle * 4 : orbit.angle
    return this.telemetry
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
  }
}
