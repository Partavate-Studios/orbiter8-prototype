// Which ships are drawn docked at a space station. Purely a reading of what's on chain: the contract
// records every trade at a port (PortTrade: who, at which planet), so the last few pilots to trade at
// a station, whose ships are still at that planet, are drawn docked at its pads; the others orbit.
// No contract stores docking. Plain data; no Vue, DOM or chain access.

/**
 * The trades that can still dock their pilot: those after the pilot's latest arrival in a system (a
 * jump or a black hole). A trade from an earlier visit to the same star doesn't count: every new
 * arrival orbits the star until it trades again.
 * @param {Array<{ sender: string, block: number, logIndex?: number }>} trades  oldest first
 * @param {Array<{ pilot: string, block: number, logIndex?: number }>} arrivals  any order
 */
export function tradesSinceArrival(trades, arrivals) {
  const lower = (address) => String(address).toLowerCase()
  const at = (event) => [event.block, event.logIndex ?? 0]
  const latest = new Map()
  for (const arrival of arrivals) {
    const pilot = lower(arrival.pilot)
    const before = latest.get(pilot)
    if (!before || after(at(arrival), before)) latest.set(pilot, at(arrival))
  }
  return trades.filter((trade) => {
    const arrived = latest.get(lower(trade.sender))
    return !arrived || after(at(trade), arrived)
  })
}
const after = ([block, index], [otherBlock, otherIndex]) => block > otherBlock || (block === otherBlock && index > otherIndex)

/** How many ships a station's pads hold at once. */
export const MAX_DOCKED = 3
/** The station's three docking pads, in degrees round it: alternate faces, where the port's collars are;
 * the other three hold its yards, armory and autofactory (orbiter-client sprites/station.svg.vue). */
export const PADS = [0, 120, 240]

/**
 * @param {Array<{ sender: string, planetId: number | string }>} trades  recent PortTrade events, oldest first
 * @param {Array<{ id: number | string, owner: string, planetId: number | string | null }>} ships
 *   the ships in the system, and the id of the planet each is at (null if none)
 * @param {Iterable<number | string>} stationPlanetIds  the planets that have a station
 * @returns {Map<string, { planetId: string, pad: number }>}  by ship id: where it's docked
 */
export function dockedShips(trades, ships, stationPlanetIds) {
  const withStation = new Set([...stationPlanetIds].map(String))
  const lower = (address) => String(address).toLowerCase()
  const docked = new Map()
  const count = new Map()
  const seen = new Set()
  // Newest first: only a pilot's latest trade counts.
  for (let i = trades.length - 1; i >= 0; i--) {
    const sender = lower(trades[i].sender)
    if (seen.has(sender)) continue
    seen.add(sender)
    const planetId = String(trades[i].planetId)
    if (!withStation.has(planetId) || (count.get(planetId) ?? 0) >= MAX_DOCKED) continue
    // Docked only if the ship is still at the planet it traded at.
    const ship = ships.find((ship) => lower(ship.owner) === sender && String(ship.planetId) === planetId)
    if (!ship) continue
    docked.set(String(ship.id), { planetId, pad: null })
    count.set(planetId, (count.get(planetId) ?? 0) + 1)
  }
  assignPads(docked)
  return docked
}

/**
 * Gives each docked ship a pad: its own preferred one (from its id), or the next free one round. A
 * ship keeps its pad while the others docked with it stay the same.
 */
function assignPads(docked) {
  const byPlanet = new Map()
  for (const [shipId, dock] of docked) {
    if (!byPlanet.has(dock.planetId)) byPlanet.set(dock.planetId, [])
    byPlanet.get(dock.planetId).push(shipId)
  }
  for (const shipIds of byPlanet.values()) {
    const taken = new Set()
    for (const shipId of shipIds.sort((a, b) => Number(a) - Number(b))) {
      let index = Number(shipId) % PADS.length
      while (taken.has(index)) index = (index + 1) % PADS.length
      taken.add(index)
      docked.get(shipId).pad = PADS[index]
    }
  }
}
