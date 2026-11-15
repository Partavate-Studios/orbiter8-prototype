import { describe, it, expect } from 'vitest'
import { dockedShips, MAX_DOCKED } from './docking'

const ship = (id, owner, planetId) => ({ id, owner, planetId })
const trade = (sender, planetId) => ({ sender, planetId })

describe('docking at stations', () => {
  it('docks the last few pilots to trade at a station, if their ships are still there', () => {
    const ships = [ship(1, '0xA', 3), ship(2, '0xB', 3), ship(3, '0xC', 3), ship(4, '0xD', 3), ship(5, '0xE', 4)]
    const trades = [trade('0xa', 3), trade('0xB', 3), trade('0xC', 3), trade('0xD', 3), trade('0xE', 3)]
    const docked = dockedShips(trades, ships, [3, 4])
    // E traded at 3 but its ship is at 4 now; of the rest, the newest three are docked.
    expect([...docked.keys()].sort()).toEqual(['2', '3', '4'])
    expect(docked.size).toBe(MAX_DOCKED)
  })

  it("counts only a pilot's latest trade, and only at planets with a station", () => {
    const ships = [ship(1, '0xA', 3), ship(2, '0xB', 5)]
    const trades = [trade('0xA', 3), trade('0xA', 7), trade('0xB', 5)]
    // A's latest trade was elsewhere; planet 5 has no station.
    expect(dockedShips(trades, ships, [3, 7]).size).toBe(0)
  })

  it('gives docked ships different pads, and keeps them while the same ships are docked', () => {
    const ships = [ship(6, '0xA', 3), ship(12, '0xB', 3), ship(18, '0xC', 3)]
    const first = dockedShips([trade('0xA', 3), trade('0xB', 3), trade('0xC', 3)], ships, [3])
    const pads = [...first.values()].map((dock) => dock.pad)
    expect(new Set(pads).size).toBe(3)
    const again = dockedShips([trade('0xC', 3), trade('0xA', 3), trade('0xB', 3)], ships, [3])
    for (const [id, dock] of first) expect(again.get(id).pad).toBe(dock.pad)
  })
})
