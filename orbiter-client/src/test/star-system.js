// A star system as loadStarMap assembles it from contract reads.
export function blockData({ withStation = false, withShip = true } = {}) {
  const planet = (id, extra = {}) => ({
    id: String(id),
    name: 'Planet ' + id,
    star: '7',
    size: 12,
    class: 0,
    rings: 0,
    orbitSpeed: 500,
    owner: '0x0000000000000000000000000000000000000000',
    hasMoons: false,
    moons: {},
    hasStation: false,
    ...extra
  })
  return {
    id: 7,
    starName: 'Testar',
    starSize: 4,
    birthTime: 0,
    discoveredBy: '0xabc',
    neighbors: [],
    avatarNames: {},
    planets: {
      0: planet(
        1,
        withStation ? { hasStation: true, station: { name: 'New Station', size: 3, inventory: {}, prices: {} } } : {}
      ),
      1: planet(2, { hasMoons: true, moons: { 0: { name: 'Moonie', size: 2, class: 0, orbitSpeed: 300 } } })
    },
    ships: withShip ? { 5: { id: 5, name: 'Wanderer', location: 7, orbit: 2, owner: '0xabc' } } : {}
  }
}
