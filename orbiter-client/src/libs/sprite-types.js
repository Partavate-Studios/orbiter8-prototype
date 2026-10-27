// Per-type settings for the objects in a star system.
import { planetOrbitRadius } from '@/sdk/game/orbits'

/**
 * @typedef {object} SpriteType
 * @property {number} selectorSize  radius of the click target, in the sprite's own units
 *   (for the star it is multiplied by the star's size)
 * @property {number} cameraScale  the zoom the camera moves to when the sprite is selected
 */

/** @type {Record<'star' | 'planet' | 'station' | 'moon' | 'ship', SpriteType>} */
export const SPRITE_TYPES = {
  star: { selectorSize: 40, cameraScale: 0.6 },
  planet: { selectorSize: 14, cameraScale: 0.3 },
  station: { selectorSize: 12, cameraScale: 0.1 },
  moon: { selectorSize: 6, cameraScale: 0.05 },
  ship: { selectorSize: 10, cameraScale: 0.06 }
}

/** Every ship is drawn at this size. */
export const SHIP_SIZE = 10

/** Stations start a little turned, so they don't all line up with their planet. */
export const STATION_START_ROTATION = -15

// Sizes follow Enterprise Circuit's proportions (adopted 2026-10-27; the formulas before, and how
// these were derived, are in UPGRADE_NOTES.md, "Sizes and speeds: history"). Planets and the star
// are sized against the whole system (Enterprise Circuit's is SYSTEM_RATIO times this one's);
// moons, stations and ships against their orbit around their planet. Each formula gives the world
// units per sprite unit for that sprite's artwork.
const SYSTEM_RATIO = planetOrbitRadius(8) / (500 + 480 * 8)
// The artwork's size at scale 1 (sprites/*.svg.vue): a disc's radius, or a ship's length.
export const ART = { star: 130, planet: 10, moon: 2, station: 7.25, ship: 11.5 }

/**
 * How much a sprite is scaled up from its artwork (world units per sprite unit).
 * @param {import('@/sdk/system').GameObject} object
 * @param {Record<string, import('@/sdk/system').GameObject>} objects  the system (for the parent planet's size)
 */
export function spriteScaleOf(object, objects) {
  const size = Number(object.size)
  const parent = objects?.[object.orbiting]
  const planetSize = parent?.type === 'planet' ? Number(parent.size) : null
  const orbit = object.orbit?.radius ?? 0
  switch (object.type) {
    case 'star':
      // A radius of 13 x (size + 0.5) in Enterprise Circuit's units.
      return (SYSTEM_RATIO * 13 * (size + 0.5)) / ART.star
    case 'planet':
      // A radius of 10 x (size / 16 + 0.5): small planets get a floor, so they don't vanish.
      return (SYSTEM_RATIO * 10 * (size / 16 + 0.5)) / ART.planet
    case 'moon': {
      const position = Number(object.orbitalPosition)
      const radius = 4 * (size / 12 + 0.5)
      return ((radius / (65 + 30 * position + 1.5 * (planetSize ?? 0))) * orbit) / ART.moon
    }
    case 'station': {
      const radius = 290 * (size / 1000 + 0.02)
      return ((radius / (40 + 1.5 * (planetSize ?? 0))) * orbit) / ART.station
    }
    case 'ship': {
      // 9.2 long, orbiting 12 + 1.5 x the planet's size out (or 240 from the star).
      const ecOrbit = planetSize === null ? 240 : 12 + 1.5 * planetSize
      return ((9.2 / ecOrbit) * orbit) / ART.ship
    }
  }
  return 1
}

// On-screen radius (pixels) below which an orbit ring is hidden, and above which it's fully shown.
const RING_HIDDEN_BELOW = 6
const RING_SHOWN_ABOVE = 24

/**
 * Orbit rings: ordinary ones stay faint, so they don't compete with the bodies on them; the ring of
 * what's selected or under the pointer is drawn bright and thick, so it shows which path is whose.
 */
export const RING_COLOR = { faint: '#c3b3da', bright: '#e6dcf5' }
/** An ordinary ring's opacity, next to the selected or hovered one's (1). */
export const RING_FAINT = 0.4

/**
 * An orbit ring's line width in world units: thin in the world (thicker when emphasized), but never
 * under 0.6 of a pixel (two when emphasized), so rings don't vanish when zoomed out.
 */
export function ringWidth(emphasized, pixelsPerUnit) {
  return emphasized ? Math.max(0.05, 2 / pixelsPerUnit) : Math.max(0.01, 0.6 / pixelsPerUnit)
}

/** How visible an orbit ring is at this on-screen radius: tiny rings fade out instead of piling up. */
export function ringOpacity(radiusPixels) {
  const fade = (radiusPixels - RING_HIDDEN_BELOW) / (RING_SHOWN_ABOVE - RING_HIDDEN_BELOW)
  return Math.min(1, Math.max(0, fade))
}
