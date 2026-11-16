// Every hold is drawn, one cell each (round 2, item 6): the layout always has room for all of them,
// up to the 250 a ship can have, in the boxes the HUD draws them in.
import { describe, expect, it } from 'vitest'
import { MAX_CARGO_HOLDS } from '@orbiter8/sdk/game/trade'
import { holdLayout } from './hold-grid.svg.vue'

describe('holdLayout', () => {
  const boxes = [
    [152, 13], // the pilot plate
    [250, 13], // a phone's pilot strip
    [250, 90], // the trade drawing
    [120, 66], // the trade drawing on a phone
    [15, 14] // the shipyard's ship
  ]
  for (const [width, height] of boxes) {
    it(`fits every hold, 1 to ${MAX_CARGO_HOLDS}, in ${width}×${height}`, () => {
      for (let holds = 1; holds <= MAX_CARGO_HOLDS; holds++) {
        const { rows, columns, size } = holdLayout(holds, width, height)
        expect(rows * columns).toBeGreaterThanOrEqual(holds)
        expect(columns * size).toBeLessThanOrEqual(width + 1e-9)
        expect(rows * size).toBeLessThanOrEqual(height + 1e-9)
      }
    })
  }

  it('keeps 250 holds in the pilot plate at least about 2 px apart', () => {
    expect(holdLayout(250, 152, 13).size).toBeGreaterThan(2)
  })
})
