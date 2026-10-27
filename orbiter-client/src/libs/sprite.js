import { markRaw } from 'vue'
import { orbitAt } from '@/sdk/game/orbits'
import { SPRITE_TYPES, SHIP_SIZE, STATION_START_ROTATION } from '@/libs/sprite-types'
import { tunedTime } from '@/libs/tuning'

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
    // Telemetry changes every frame; the frame loop updates it and components read it per frame.
    return markRaw(this)
  }

  /** @param {Record<string, object>} [objects]  the system's objects (the speed slider needs parents' sizes) */
  updateTelemetry(gameTime, objects) {
    const time = tunedTime(this.object, objects, gameTime)
    const orbit = orbitAt(this.object.orbit.radius, this.object.orbit.speed, time)
    this.telemetry.translatex = orbit.x
    this.telemetry.translatey = orbit.y
    // Sprites face along their orbit's radius; stations spin four times as fast, the other way.
    this.telemetry.rotation = this.type == 'station' ? -orbit.angle * 4 : orbit.angle
    return this.telemetry
  }

  /** Keeps the previous sprite's animation state when the same object is reloaded. */
  carryOver(previous) {
    if (previous.key === this.key) this.telemetry = previous.telemetry
  }
}
