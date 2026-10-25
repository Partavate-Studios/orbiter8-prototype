// Planet classes, as numbered by the contracts.

export const PLANET_TYPE_NAMES = [
  'Terrestrial',
  'Rocky',
  'Oceanic',
  'Desert',
  'Ice',
  'Volcanic',
  'Gaseous',
  'Ferrous',
  'Lava',
  'Swamp'
]

/**
 * Display name for a planet class. Unknown classes come back as the number itself.
 * @param {number} planetClass
 * @returns {string | number}
 */
export function planetTypeName (planetClass) {
  return PLANET_TYPE_NAMES[planetClass] ?? planetClass
}
