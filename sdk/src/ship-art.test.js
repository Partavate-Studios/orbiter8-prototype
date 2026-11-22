import { describe, it, expect } from 'vitest'
import { keccak256, toUtf8Bytes } from 'ethers'
import { shipSvg } from './ship-art'

// (range 3, as contracts/test/vectors/ShipArt.t.sol's ships have)
const ship = (bays, loadout, rangeLost) => ({ range: 3, bays, rangeLost, baysLost: 0, loadout })
const none = { drones: 0, repairBots: 0, pointDefense: 0, railguns: 0, missiles: 0, armor: 0, shields: 0 }

describe('the ship picture matches the NFT', () => {
  it('draws the same string as ShipArt.sol (contracts/test/vectors/ShipArt.t.sol)', () => {
    expect(keccak256(toUtf8Bytes(shipSvg(ship(5, none, 0))))).toBe(
      '0x1430f1c0074a548f240b7d4b1f64dbfdc34732a5af1c752ac4448b7e7e170577'
    )
    const armed = { drones: 25, repairBots: 2, pointDefense: 1, railguns: 2, missiles: 1, armor: 3, shields: 2 }
    expect(keccak256(toUtf8Bytes(shipSvg(ship(230, armed, 1))))).toBe(
      '0x8dc2d44ade6b644b9c12b5b96d41ef635188d3bf8b0740ffffddeb54594c9a72'
    )
  })
})
