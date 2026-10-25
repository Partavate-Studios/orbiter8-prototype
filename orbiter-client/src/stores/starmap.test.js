import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useStarMapStore } from './starmap'
import { useUIStore } from './ui'
import { blockData } from '@/test/star-system'

describe('importStarMapBlockData', () => {
  let starMap, ui

  beforeEach(() => {
    setActivePinia(createPinia())
    starMap = useStarMapStore()
    ui = useUIStore()
    starMap.starId = 7
  })

  it('keys sprites by identity and links parents, stations and moons by key', () => {
    starMap.importStarMapBlockData({ blockData: blockData({ withStation: true }), playerAccount: '0xabc' })
    const objects = starMap.systemObjects
    expect(Object.keys(objects)).toEqual(['star', 'planet:1', 'station:1', 'planet:2', 'moon:2:0', 'ship:5'])
    expect(objects['planet:1'].stationKey).toBe('station:1')
    expect(objects['station:1'].orbiting).toBe('planet:1')
    expect(objects['planet:2'].moons).toEqual([{ moonId: 'moon:2:0', moonName: 'Moonie' }])
    expect(objects['ship:5'].orbiting).toBe('planet:2')
    expect(starMap.myShipId).toBe('ship:5')
    expect(starMap.portForPlanet('planet:1')).toBe('station:1')
    expect(starMap.moonsForPlanet('planet:2')).toEqual(['moon:2:0'])
  })

  it('a station appearing mid-system moves nothing else and keeps the selection', () => {
    starMap.importStarMapBlockData({ blockData: blockData(), playerAccount: '0xabc' })
    ui.selectSprite('ship:5')
    const shipTelemetry = starMap.sprites['ship:5'].telemetry // animation state that carries over

    starMap.importStarMapBlockData({ blockData: blockData({ withStation: true }), playerAccount: '0xabc' })

    expect(ui.selectedSprite).toBe('ship:5')
    expect(starMap.systemObjects['ship:5'].name).toBe('Wanderer')
    expect(starMap.systemObjects['ship:5'].orbiting).toBe('planet:2')
    expect(starMap.sprites['ship:5'].telemetry).toBe(shipTelemetry)
    expect(starMap.systemObjects['moon:2:0'].orbiting).toBe('planet:2')
    expect(starMap.spriteIds.stations).toEqual(['station:1'])
  })

  it('names owners and the star from the load itself, not the previous one', () => {
    starMap.importStarMapBlockData({
      blockData: { ...blockData(), avatarNames: { '0xabc': 'Ann' } },
      playerAccount: '0xabc'
    })
    expect(starMap.systemObjects['ship:5'].ownerName).toBe('Ann')
    expect(starMap.systemObjects.star.ownerName).toBe('Ann')
    expect(starMap.systemObjects.star.objectId).toBe(7)
  })

  it('clears the selection when the selected sprite leaves the system', () => {
    starMap.importStarMapBlockData({ blockData: blockData(), playerAccount: '0xabc' })
    ui.selectSprite('ship:5')
    starMap.importStarMapBlockData({ blockData: blockData({ withShip: false }), playerAccount: '0xabc' })
    expect(ui.selectedSprite).toBe(null)
  })
})
