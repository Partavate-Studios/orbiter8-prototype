import { describe, it, expect } from 'vitest'
import { SHIP_PARTS, partRoom } from './parts'

const part = (field) => SHIP_PARTS.find((p) => p.field === field)
const none = { drones: 0, miningDrones: 0, repairBots: 0, pointDefense: 0, railguns: 0, missiles: 0, armor: 0, shields: 0 }

describe('how many more of a part fit a ship', () => {
  it('weapons share six mounts: railguns and missile racks two each, point defense one', () => {
    const ship = { droneBays: 0, loadout: { ...none, railguns: 2 } }
    expect(partRoom(part('railguns'), ship, { freeBays: 0 })).toEqual({ fits: 1, why: '' })
    expect(partRoom(part('pointDefense'), ship, { freeBays: 0 })).toEqual({ fits: 2, why: '' })
    const full = { droneBays: 0, loadout: { ...none, railguns: 2, missiles: 1 } }
    expect(partRoom(part('pointDefense'), full, { freeBays: 9 })).toEqual({ fits: 0, why: 'No mounts free' })
  })

  it('drones of both kinds share the drone bays', () => {
    const ship = { droneBays: 3, loadout: { ...none, drones: 4, miningDrones: 1 } }
    expect(partRoom(part('drones'), ship, { freeBays: 0, dronesPerBay: 2 })).toEqual({ fits: 1, why: '' })
    expect(partRoom(part('miningDrones'), { droneBays: 0, loadout: none }, { freeBays: 50 })).toEqual({ fits: 0, why: 'No drone bay free' })
  })

  it('bots, armor and shields take free holds, and armor and shields have a limit', () => {
    const ship = { droneBays: 0, loadout: { ...none, armor: 4, shields: 3 } }
    expect(partRoom(part('repairBots'), ship, { freeBays: 12 })).toEqual({ fits: 2, why: '' })
    expect(partRoom(part('armor'), ship, { freeBays: 100 })).toEqual({ fits: 1, why: '' })
    expect(partRoom(part('armor'), ship, { freeBays: 9 })).toEqual({ fits: 0, why: 'No free holds' })
    expect(partRoom(part('shields'), ship, { freeBays: 100 })).toEqual({ fits: 0, why: 'At its limit' })
  })
})
