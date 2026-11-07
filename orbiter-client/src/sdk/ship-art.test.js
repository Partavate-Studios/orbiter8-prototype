import { describe, it, expect } from 'vitest'
import { keccak256, toUtf8Bytes } from 'ethers'
import { shipSvg } from './ship-art'

const ship = (bays, loadout, rangeLost) => ({ bays, rangeLost, baysLost: 0, loadout })
const none = { drones: 0, repairBots: 0, pointDefense: 0, railguns: 0, missiles: 0, armor: 0, shields: 0 }

describe('the ship picture matches the NFT', () => {
  it('draws the same string as ShipArt.sol (contracts/test/vectors/ShipArt.t.sol)', () => {
    expect(keccak256(toUtf8Bytes(shipSvg(ship(5, none, 0))))).toBe(
      '0xd70d2e68a1b68b5aede3ea54067839137f41cefaff60c05b75c6a830f41cda8e'
    )
    const armed = { drones: 25, repairBots: 2, pointDefense: 1, railguns: 2, missiles: 1, armor: 3, shields: 2 }
    expect(keccak256(toUtf8Bytes(shipSvg(ship(230, armed, 1))))).toBe(
      '0x52874e7a27d68cfeeae7248e5e2bd0705ff1d6c29a89aedd0ce7bef1b2456cc2'
    )
  })
})
