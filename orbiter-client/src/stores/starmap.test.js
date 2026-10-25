import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useStarMapStore } from './starmap'
import { useUIStore } from './ui'

// A star system as loadStarMap assembles it from contract reads.
function blockData ({ withStation = false, withShip = true } = {}) {
  const planet = (id, extra = {}) => ({
    id: String(id), name: 'Planet ' + id, star: '7', size: 12, class: 0, rings: 0, orbitSpeed: 500,
    owner: '0x0000000000000000000000000000000000000000', hasMoons: false, moons: {}, hasStation: false, ...extra
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
      0: planet(1, withStation
        ? { hasStation: true, station: { name: 'New Station', size: 3, inventory: {}, prices: {} } }
        : {}),
      1: planet(2, { hasMoons: true, moons: { 0: { name: 'Moonie', size: 2, class: 0, orbitSpeed: 300 } } })
    },
    ships: withShip ? { 5: { id: 5, name: 'Wanderer', location: 7, orbit: 2, owner: '0xabc' } } : {}
  }
}

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
    expect(objects['planet:1'].stationSprite).toBe('station:1')
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
    const shipTelemetry = starMap.systemObjects['ship:5'].telemetry // animation state that carries over

    starMap.importStarMapBlockData({ blockData: blockData({ withStation: true }), playerAccount: '0xabc' })

    expect(ui.selectedSprite).toBe('ship:5')
    expect(starMap.systemObjects['ship:5'].name).toBe('Wanderer')
    expect(starMap.systemObjects['ship:5'].orbiting).toBe('planet:2')
    expect(starMap.systemObjects['ship:5'].telemetry).toBe(shipTelemetry)
    expect(starMap.systemObjects['moon:2:0'].orbiting).toBe('planet:2')
    expect(starMap.spriteIds.stations).toEqual(['station:1'])
  })

  it('clears the selection when the selected sprite leaves the system', () => {
    starMap.importStarMapBlockData({ blockData: blockData(), playerAccount: '0xabc' })
    ui.selectSprite('ship:5')
    starMap.importStarMapBlockData({ blockData: blockData({ withShip: false }), playerAccount: '0xabc' })
    expect(ui.selectedSprite).toBe(null)
  })
})
