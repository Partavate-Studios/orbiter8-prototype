import { describe, it, expect } from 'vitest'
import Sprite from './sprite'

const planet = (id, radius) => ({
  key: `planet:${id}`,
  type: 'planet',
  id,
  size: 12,
  orbiting: 'star',
  orbit: { radius, speed: 50 }
})
const objects = { 'planet:1': planet(1, 150), 'planet:3': planet(3, 330) }
const ship = (at) => ({
  key: 'ship:2',
  type: 'ship',
  id: 2,
  orbiting: at,
  orbit: { radius: 12, speed: 7000, phase: 0 },
  dock: null
})

/** One frame as the star map runs it: orbits, then absolute positions, then the flight. */
function frame(sprite, gameTime) {
  sprite.updateTelemetry(gameTime)
  const parent = objects[sprite.orbiting]
  const p = new Sprite(parent, objects)
  p.updateTelemetry(gameTime)
  sprite.position.x = sprite.telemetry.translatex + p.telemetry.translatex
  sprite.position.y = sprite.telemetry.translatey + p.telemetry.translatey
  return sprite.transit ? sprite.fly(gameTime) : true
}

describe('a ship moving to another planet', () => {
  it('flies there without jumping, even when the system reloads mid-flight', () => {
    let sprite = new Sprite(ship('planet:1'), objects)
    frame(sprite, 1e6)
    const moved = new Sprite(ship('planet:3'), objects)
    moved.carryOver(sprite)
    sprite = moved
    let previous = null
    let biggestStep = 0
    for (let t = 1e6; t < 1e6 + 12000; t += 16) {
      // The game reloads again shortly after a move.
      if (t === 1e6 + 1600) {
        const reloaded = new Sprite(ship('planet:3'), objects)
        reloaded.carryOver(sprite)
        sprite = reloaded
      }
      frame(sprite, t)
      if (previous)
        biggestStep = Math.max(biggestStep, Math.hypot(sprite.position.x - previous.x, sprite.position.y - previous.y))
      previous = { ...sprite.position }
    }
    expect(sprite.transit).toBe(null)
    // About 220 units a second at most, so a frame moves a few units, never the whole way.
    expect(biggestStep).toBeLessThan(15)
  })
})
