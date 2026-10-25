import { markRaw } from 'vue'
import { orbitAt, planetOrbitRadius, shipOrbitSpeed, STATION_ORBIT_SPEED } from '@/game/orbits'
import { SPRITE_TYPES, SHIP_SIZE, STATION_START_ROTATION } from '@/game/sprite-types'

/** The star at the center of every system has a fixed key. */
export const STAR_KEY = 'star'

/**
 * A stable identity for a sprite, built from contract ids, so it stays the same across reloads even
 * when other objects appear or disappear (a new station no longer shifts every sprite after it).
 * Moons are numbered per planet, so their key includes the planet.
 */
export function spriteKey(type, { id, planet }) {
  switch (type) {
    case 'star':
      return STAR_KEY
    case 'moon':
      return `moon:${planet}:${id}`
    default:
      return `${type}:${id}`
  }
}

export default class Sprite {
  constructor(type, autoFillValues) {
    // defaults, overridden by the values from the chain
    this.objectId = parseInt(autoFillValues.id)
    this.orbiting = 0
    this.distance = 0
    this.speed = 100
    this.isMine = false
    this.owner = 0
    this.ownerName = ''
    this.telemetry = {
      translatex: 0,
      translatey: 0,
      rotation: 0
    }
    // Absolute position in the star system (telemetry is relative to the parent it orbits).
    this.position = { x: 0, y: 0 }

    for (const [key, value] of Object.entries(autoFillValues)) {
      this[key] = value
    }

    // type-specific settings
    this.type = type
    this.key = spriteKey(type, autoFillValues)
    this.selectorSize = SPRITE_TYPES[type].selectorSize
    this.cameraScale = SPRITE_TYPES[type].cameraScale
    switch (type) {
      case 'star':
        this.selectorSize *= this.size
        break
      case 'planet':
        this.distance = planetOrbitRadius(this.orbitalPosition)
        break
      case 'station':
        this.speed = STATION_ORBIT_SPEED
        this.orbitalPosition = 0
        this.telemetry.rotation = STATION_START_ROTATION
        break
      case 'moon':
        // The contract's moon speed is per unit of distance.
        this.speed = this.speed * this.distance
        break
      case 'ship':
        this.speed = shipOrbitSpeed(this.id)
        this.size = SHIP_SIZE
        break
    }
    // Telemetry changes every frame; the frame loop updates it and components read it per frame.
    return markRaw(this)
  }

  updateTelemetry(gameTime) {
    const orbit = orbitAt(this.distance, this.speed, gameTime)
    this.telemetry.translatex = orbit.x
    this.telemetry.translatey = orbit.y
    // Sprites face along their orbit's radius; stations spin four times as fast, the other way.
    this.telemetry.rotation = this.type == 'station' ? -orbit.angle * 4 : orbit.angle
    return this.telemetry
  }

  //carry over non-chain data from an old sprite
  consumeSpriteData(oldSprite) {
    if (this.matchesSprite(oldSprite)) {
      this.telemetry = oldSprite.telemetry
    }
  }

  matchesSprite(sprite) {
    return this.key === sprite.key
  }

  /** The actions offered in this sprite's card menu. */
  getMenu() {
    let menu = []
    switch (this.type) {
      case 'star':
        menu.push({
          text: 'Jump To Neighbor Star',
          enabled: true,
          command: 'jump'
        })
        break

      case 'moon':
        if (this.isMine) {
          menu.push({
            text: 'Build Infrastructure',
            enabled: false,
            command: 'build'
          })
        }
        menu.push({
          text: 'Visit Planet',
          enabled: true,
          command: 'visitPlanet',
          value: this.objectId
        })
        break

      case 'planet':
        if (parseInt(this.owner) === 0) {
          menu.push({
            text: 'Claim Planet',
            enabled: true,
            command: 'claim',
            value: this.objectId
          })
        } else if (this.isMine) {
          if (!this.hasStation) {
            menu.push({
              text: 'Build Space Station',
              enabled: true,
              command: 'buildStation',
              value: this.objectId
            })
          }
        } else {
          menu.push({
            text: 'Attack',
            enabled: false,
            command: 'attack'
          })
        }
        if (this.hasStation) {
          menu.push({
            text: 'Visit Space Station',
            enabled: true,
            command: 'visitStation',
            value: this.objectId
          })
        }
        if (this.moons.length > 0) {
          menu.push({
            text: 'Visit Moon',
            enabled: true,
            command: 'visitMoon',
            value: this.objectId
          })
        }
        menu.push({
          text: 'View on OpenSea',
          enabled: true,
          command: 'opensea',
          value: this.objectId
        })
        break

      case 'ship':
        if (this.isMine) {
          menu.push({
            text: 'Visit Star',
            enabled: true,
            command: 'jump'
          })
        } else {
          menu.push({
            text: 'Attack',
            enabled: false,
            command: 'attack'
          })
        }
        break

      case 'station':
        menu.push({
          text: 'Trade at Port',
          enabled: false,
          command: 'trade'
        })
        menu.push({
          text: 'Dock at Shipyards',
          enabled: false,
          command: 'shipyards'
        })
        menu.push({
          text: 'Visit Planet',
          enabled: true,
          command: 'visitPlanet',
          value: this.objectId
        })
        break
    }

    if (this.isMine) {
      menu.push({
        text: 'Rename ' + this.type.charAt(0).toUpperCase() + this.type.slice(1),
        enabled: true,
        command: 'rename'
      })
    } else {
      if (this.owner != null && this.owner.length === 0) {
        menu.push({
          text: 'Claim Ownership',
          enabled: true,
          command: 'claim'
        })
      }
    }

    return menu
  }
}
