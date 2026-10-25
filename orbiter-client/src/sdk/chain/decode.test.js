import { describe, expect, it } from 'vitest'
import { decodeSystem, decodePlanet, decodeStation, decodeMoon, decodeShip, decodeMyShip } from './decode'

// Tuples as the contract returns them (after toPlain), in ABI order.
describe('decoding contract tuples', () => {
  it('getPlayerSystemData', () => {
    const tuple = [7, 'Sol', 4, 1600000000, '0xABC', [2, 3, 0], [0, 11, 12], [5, 0]]
    expect(decodeSystem(tuple)).toEqual({
      id: 7,
      name: 'Sol',
      size: 4,
      birthTime: 1600000000,
      discoveredBy: '0xabc',
      neighborIds: [2, 3, 0],
      planetIds: [0, 11, 12],
      shipIds: [5, 0]
    })
  })

  it('getPlanet: [size, class, rings, orbitSpeed], one moon flag per orbit', () => {
    const moons = [true, false, false, false, false, false, false, false]
    expect(decodePlanet(11, ['Earth', 7, [12, 0, 1, 500], '0xDEF', moons, true])).toEqual({
      id: '11',
      name: 'Earth',
      star: 7,
      size: 12,
      class: 0,
      rings: 1,
      orbitSpeed: 500,
      owner: '0xdef',
      hasMoons: moons,
      hasStation: true
    })
  })

  it('getStation: inventory [equipment, fuel, organics], prices [... , holds]', () => {
    expect(decodeStation('11', ['I.S.S.', 3, [500, -1750, 1500], [140, 120, 85, 100]])).toEqual({
      id: '11',
      name: 'I.S.S.',
      size: 3,
      inventory: { equipment: 500, fuel: -1750, organics: 1500 },
      prices: { equipment: 140, fuel: 120, organics: 85, holds: 100 }
    })
  })

  it('getMoon, getShip and getMyShip', () => {
    expect(decodeMoon(11, '0', ['Luna', 2, 1, 300])).toEqual({
      id: '0',
      name: 'Luna',
      planet: 11,
      size: 2,
      class: 1,
      orbitSpeed: 300
    })
    expect(decodeShip(5, ['Rocinante', 7, 11, '0xABC'])).toEqual({
      id: 5,
      name: 'Rocinante',
      location: 7,
      orbit: 11,
      owner: '0xabc'
    })
    expect(decodeMyShip(['Rocinante', 7, 11, 10, 1, 2, 3])).toEqual({
      name: 'Rocinante',
      location: 7,
      orbit: 11,
      holds: 10,
      equipment: 1,
      fuel: 2,
      organics: 3
    })
  })
})
