// Small pictures of the system's bodies and the menu's actions, for the selectors over the selection
// card (system-strip.vue, nearby-strip.vue) and its menu (selection-panel.vue). Spheres are cheap CSS;
// the rest is the game's own art (assets/art/), drawn for the tech trees and reused here.
import port from '@/assets/art/port.svg'
import yards from '@/assets/art/yards.svg'
import armory from '@/assets/art/armory.svg'
import claim from '@/assets/art/claim.svg'
import colony from '@/assets/art/colony.svg'
import siege from '@/assets/art/siege.svg'
import colonists from '@/assets/art/colonists.svg'
import holds from '@/assets/art/holds.svg'
import droneSwarm from '@/assets/art/drone-swarm.svg'
import asteroidStation from '@/assets/art/asteroid-station.svg'
import carbonaceous from '@/assets/art/asteroid-carbonaceous.svg'
import silicate from '@/assets/art/asteroid-silicate.svg'
import metallic from '@/assets/art/asteroid-metallic.svg'
import beltRocks from '@/assets/art/belt-rocks.svg'
import { PLANET_COLORS } from '@/libs/palette'

export const PORT_ART = port
export const DUST_ART = beltRocks
/** An asteroid's art by composition (BeltGen: 0 carbonaceous, 1 silicate, 2 metallic). */
export const ASTEROID_ART = [carbonaceous, silicate, metallic]

/** A body's sphere, lit from the upper left, in its light, mid and dark colors. */
export function sphere(light, mid, dark, size) {
  return {
    width: size + 'px',
    height: size + 'px',
    background: `radial-gradient(circle at 32% 30%, ${light} 0%, ${mid} 45%, ${dark} 100%)`
  }
}

/** A planet's or moon's sphere, by its class. */
export function bodySphere(object, size) {
  const colors = PLANET_COLORS[object?.class] ?? PLANET_COLORS[1]
  return sphere(colors.light, colors.mid, colors.dark, size)
}

/** The picture on each of the menu's actions, by command (none for renaming, sessions and links). */
export const ACTION_ART = {
  trade: port,
  shipyards: yards,
  armory,
  claim,
  colony,
  attack: siege,
  siege,
  recruit: colonists,
  loadout: holds,
  asteroid: asteroidStation,
  mine: droneSwarm,
  stopMining: droneSwarm
}

/** The belt's place in the system strip (not a real object: the belt is its eight sections). */
export const BELT_KEY = 'belt'

/** The belt's sections (asteroids and empty space), in section order. */
export function beltKeys(objects) {
  return Object.values(objects)
    .filter((o) => o.type === 'asteroid' || o.type === 'section')
    .sort((a, b) => a.section - b.section)
    .map((o) => o.key)
}

/**
 * What the selection belongs to: its planet's key (a planet, its station or a moon), BELT_KEY (an
 * asteroid, an empty section, or an asteroid's station), or null (the star, a ship).
 */
export function homeOf(key, objects) {
  const object = objects[key]
  if (!object) return null
  if (object.type === 'planet') return object.key
  if (object.type === 'asteroid' || object.type === 'section') return BELT_KEY
  if (object.type === 'station') return object.onAsteroid ? BELT_KEY : object.orbiting
  if (object.type === 'moon') return object.orbiting
  return null
}

/**
 * Line glyphs (24 units, centered) for the actions with no art of their own, drawn in the menu's
 * lavender: jump (a star with a course), session (a key), rename (a pen), market (out to a page),
 * the black hole (a spiral) and naming a star (a star).
 */
export const ACTION_GLYPH = {
  jump: 'M-8 6L4 -6M4 -6H-2M4 -6V0M6 -9L7 -7L9 -6.5L7 -6L6 -4L5 -6L3 -6.5L5 -7Z',
  session: 'M-3 0A4.5 4.5 0 1 1 -3 0.01M1.5 0H9M6 0V3.5M9 0V3',
  rename: 'M-7 7L-6 3L4 -7L7 -4L-3 6ZM2 -5L5 -2',
  market: 'M-6 -3H-8V8H3V6M-1 -8H8V1M8 -8L-2 2',
  traverse: 'M0 0A2 2 0 0 1 2 2A4 4 0 0 1 -2 6A6 6 0 0 1 -8 0A8 8 0 0 1 0 -8A9 9 0 0 1 9 1',
  nameStar: 'M0 -8L2.4 -2.6L8 -2.4L3.6 1.2L5 7L0 3.8L-5 7L-3.6 1.2L-8 -2.4L-2.4 -2.6Z'
}
