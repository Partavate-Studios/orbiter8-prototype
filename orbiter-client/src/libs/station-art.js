// The stations' parts (Koda's pick, 2026-11-18: docs/mockups/stages/, system E), from the standalone art
// in assets/art/ (drawn by docs/mockups/stages/gen-stations.py), inlined so they draw as plain SVG.
// Each is in the 120-unit art frame, centered on the station (core radius 22) or on the body.
import port from '@/assets/art/station-port.svg?raw'
import yards from '@/assets/art/station-yards.svg?raw'
import armory from '@/assets/art/station-armory.svg?raw'
import autofactory from '@/assets/art/station-autofactory.svg?raw'
import citadel from '@/assets/art/planet-citadel.svg?raw'
import colony from '@/assets/art/planet-colony.svg?raw'
import platform from '@/assets/art/asteroid-platform.svg?raw'
import mine from '@/assets/art/asteroid-mine.svg?raw'

/** An SVG file's drawing, without its <svg> wrapper and comments, to place inside another drawing. */
export function inner(svg) {
  return svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim()
}

export const STATION_PARTS = {
  port: inner(port),
  yards: inner(yards),
  armory: inner(armory),
  autofactory: inner(autofactory)
}
export const PLANET_MARKS = { citadel: inner(citadel), colony: inner(colony) }
export const ASTEROID_WORKS = { platform: inner(platform), mine: inner(mine) }

/**
 * A station's parts, in drawing order (all under the core): the port's docking collars at its three pads,
 * then the yards, armory and autofactory on the other three faces, as it has them.
 * @param {{ yard?: boolean, armory?: boolean, autofactory?: boolean } | null} station
 */
export function stationParts(station) {
  if (!station) return ''
  return [
    station.yard && STATION_PARTS.yards,
    station.autofactory && STATION_PARTS.autofactory,
    station.armory && STATION_PARTS.armory,
    STATION_PARTS.port
  ]
    .filter(Boolean)
    .join('')
}

/** A planet's citadel and colony marks, by its level (Sol's Federation worlds are fully built). */
export function planetMarks(planet) {
  const level = planet?.federation ? 7 : Number(planet?.info?.level ?? 0)
  return (level >= 1 ? PLANET_MARKS.citadel : '') + (level >= 2 ? PLANET_MARKS.colony : '')
}

/**
 * What's built on an asteroid's surface, under its station: the footing from the Platform, the derrick
 * and drones from the Mine; and, before there's a station to draw it, the bare core on its footing.
 * @param {{ federation?: boolean, hasStation?: boolean, info?: { level?: number } | null }} asteroid
 * @param {string} core  the station core's markup, in the same frame
 */
export function asteroidWorks(asteroid, core) {
  const level = asteroid?.federation ? 7 : Number(asteroid?.info?.level ?? 0)
  let s = ''
  if (level >= 2) s += ASTEROID_WORKS.mine
  if (level >= 1 || asteroid?.hasStation) s += ASTEROID_WORKS.platform
  if (level >= 1 && !asteroid?.hasStation) s += core
  return s
}
