import { describe, expect, it } from 'vitest'
import { OUTLINES, ROOM_REGION, cityLayers, outsideSvg } from './intro-world'

// The intro's city is drawn once into bitmaps (libs/intro-world.js). Phones refuse canvases past a size
// (iOS: about 16.7 million pixels for one, and a budget for all), so the levels must stay inside it, and
// the drawing must be the same every time (it's seeded: the same city for everyone).
describe('the intro world', () => {
  it('keeps its bitmaps inside what phones allow', () => {
    for (const small of [true, false]) {
      const layers = cityLayers(small)
      const total = layers.reduce((sum, l) => sum + l.pxW * l.pxH, 0)
      for (const l of layers) {
        expect(l.pxW).toBeLessThanOrEqual(4096)
        expect(l.pxH).toBeLessThanOrEqual(4096)
      }
      expect(total).toBeLessThanOrEqual(small ? 9_000_000 : 14_000_000)
    }
  })

  it('draws the same city every time', () => {
    const [far] = cityLayers(false)
    expect(outsideSvg(far.region, far.pxW, far.pxH)).toBe(outsideSvg(far.region, far.pxW, far.pxH))
  })

  it('puts every thing you can use inside the room', () => {
    const [x, y, w, h] = ROOM_REGION
    for (const outline of Object.values(OUTLINES))
      for (const [px, py] of outline) {
        expect(px).toBeGreaterThanOrEqual(x)
        expect(px).toBeLessThanOrEqual(x + w)
        expect(py).toBeGreaterThanOrEqual(y)
        expect(py).toBeLessThanOrEqual(y + h)
      }
  })
})
