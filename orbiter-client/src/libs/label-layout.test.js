import { describe, expect, it } from 'vitest'
import { placeLabels } from './label-layout'

const label = (x, y, priority, width = 60) => ({ x, y, radius: 5, width, height: 14, priority })

describe('placing names on the map', () => {
  it('puts every name below its sprite when there is room', () => {
    const placements = placeLabels(
      new Map([
        ['planet:1', label(0, 0, 50)],
        ['planet:2', label(200, 0, 50)]
      ])
    )
    expect(placements).toEqual({ 'planet:1': 'below', 'planet:2': 'below' })
  })

  it('moves a less important name above its sprite, then hides it, when names would overlap', () => {
    const placements = placeLabels(
      new Map([
        ['ship:5', label(10, 0, 80)],
        ['planet:3', label(0, 2, 50)],
        ['planet:4', label(20, 4, 40)]
      ])
    )
    expect(placements).toEqual({ 'ship:5': 'below', 'planet:3': 'above', 'planet:4': 'hidden' })
  })
})
