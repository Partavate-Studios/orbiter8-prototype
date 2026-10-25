// Per-type settings for the objects in a star system.

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

/** How much a sprite of this size is scaled up from its artwork (world units per sprite unit). */
export function spriteScale (size) {
  return size * 0.02 + 0.1
}
