// A system's ports, for the ports menu (ports-panel.vue) and the system strip's signs (system-strip.vue).

/** Every port in the system with the body it's at (a planet or an asteroid), in orbit order. */
export function portsOf(objects) {
  return Object.values(objects)
    .filter((o) => o.type === 'station')
    .map((station) => ({ station, home: objects[station.orbiting] ?? null }))
    .sort((a, b) => (a.home?.orbit?.radius ?? 0) - (b.home?.orbit?.radius ?? 0))
}

/**
 * What a port has for the pilot now: it buys something the ship carries (`buys`), and it has
 * shipyards or an armory (`services`).
 * @param {{ goods?: { id: number, mode: string }[], yard?: boolean, armory?: boolean } | null} station
 * @param {number[]} cargo  units aboard by good id
 */
export function portSigns(station, cargo = []) {
  if (!station) return { buys: false, services: false }
  return {
    buys: (station.goods ?? []).some((g) => g.mode === 'buys' && (cargo[g.id] ?? 0) > 0),
    services: Boolean(station.yard || station.armory)
  }
}
