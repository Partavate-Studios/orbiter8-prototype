// Small reads over the game's state that several panels share.
import { usedBays } from '@orbiter8/sdk/client'
import { MODE } from '@orbiter8/sdk/market'
import { game } from './store'

export const LEVELS = ['Claimed', 'Citadel', 'Colony', 'Station', 'Port', 'Yards', 'Armory']
export const BUILDINGS = ['', 'Citadel', 'Colony', 'Station', 'Port', 'Yards', 'Armory', 'Autofactory']

export const ship = () => game.state.pilot?.ship ?? null
export const shipCell = () => ship()?.cell ?? 0
export const reach = () => (ship() ? Math.max(1, ship().range - ship().rangeLost) : 1)
export const freeBays = () => (ship() ? Math.max(0, ship().bays - usedBays(ship())) : 0)
export const goodName = (id) => game.state.economy?.goods[id]?.name ?? `Good ${id}`
/** Planets of the system the ship is in, in orbit order. */
export const worlds = () => Object.values(game.state.system?.planets ?? {})
export const worldOf = (id) => worlds().find((p) => Number(p.id) === Number(id)) ?? null
/** A port's name: its station's, with the planet it circles. */
export function portName(port, withPlanet = false) {
  const world = worldOf(port)
  if (!world) return `Port ${port}`
  const station = world.station?.name ?? world.name
  return withPlanet ? `${station} · ${world.name}` : station
}
/** Ports at this star with a shipyard, and planets with an armory. */
export const yards = () => game.state.ports.filter((p) => p.yard)
export const armories = () => worlds().filter((p) => p.station?.armory)
/** Goods a planet class produces (what its ports sell), from any port of that class here, else unknown. */
export function sellsHere(port) {
  return port.quotes.map((q, id) => ({ q, id })).filter(({ q }) => q.mode === MODE.SELLS).map(({ id }) => id)
}
export const armed = (s = ship()) => Boolean(s) && s.loadout.railguns + s.loadout.missiles + s.loadout.drones > 0
