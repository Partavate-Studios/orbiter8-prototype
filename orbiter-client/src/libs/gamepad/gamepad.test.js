import { describe, expect, it } from 'vitest'
import { BUTTON, deadZone, readPad } from './read'
import { nextInDirection, nearestTo } from './spatial-nav'

const pad = (pressedButtons = [], axes = [0, 0, 0, 0], triggers = {}) => ({
  buttons: Array.from({ length: 17 }, (_, index) => {
    const value = triggers[index] ?? (pressedButtons.includes(index) ? 1 : 0)
    return { pressed: value > 0, value }
  }),
  axes
})

describe('reading a pad', () => {
  it('ignores stick drift and rescales the rest', () => {
    expect(deadZone(0.1)).toBe(0)
    expect(deadZone(-0.1)).toBe(0)
    expect(deadZone(1)).toBe(1)
    expect(deadZone(-1)).toBe(-1)
    expect(deadZone(0.59)).toBeCloseTo(0.5, 2)
  })

  it('reports a button once, on the frame it goes down', () => {
    const first = readPad(pad([BUTTON.SOUTH]))
    expect(first.pressed.has(BUTTON.SOUTH)).toBe(true)
    const held = readPad(pad([BUTTON.SOUTH]), first.down)
    expect(held.pressed.size).toBe(0)
    const again = readPad(pad([BUTTON.SOUTH]), readPad(pad(), held.down).down)
    expect(again.pressed.has(BUTTON.SOUTH)).toBe(true)
  })

  it('counts a trigger as pressed only past half-way, and keeps its analog value', () => {
    const light = readPad(pad([], undefined, { [BUTTON.R2]: 0.3 }))
    expect(light.pressed.has(BUTTON.R2)).toBe(false)
    expect(light.value(BUTTON.R2)).toBeCloseTo(0.3)
    expect(readPad(pad([], undefined, { [BUTTON.R2]: 0.8 })).pressed.has(BUTTON.R2)).toBe(true)
  })

  it('reads both sticks', () => {
    const state = readPad(pad([], [1, 0, 0, -1]))
    expect(state.leftStick).toEqual({ x: 1, y: 0 })
    expect(state.rightStick.y).toBe(-1)
  })
})

describe('D-pad focus movement', () => {
  const box = (x, y) => ({ left: x - 10, top: y - 10, width: 20, height: 20 })
  // A HUD-like layout: a column of buttons on the left, one on the right.
  const buttons = [box(50, 100), box(50, 200), box(50, 300), box(500, 210)]

  it('moves along a column, and across to the nearest in that direction', () => {
    expect(nextInDirection(buttons[0], buttons, 'down')).toBe(1)
    expect(nextInDirection(buttons[1], buttons, 'up')).toBe(0)
    expect(nextInDirection(buttons[1], buttons, 'right')).toBe(3)
    expect(nextInDirection(buttons[3], buttons, 'left')).toBe(1)
  })

  it('stays put when there is nothing that way', () => {
    expect(nextInDirection(buttons[0], buttons, 'up')).toBe(-1)
    expect(nextInDirection(buttons[3], buttons, 'right')).toBe(-1)
  })

  it('starts from whatever is nearest', () => {
    expect(nearestTo({ x: 480, y: 220 }, buttons)).toBe(3)
    expect(nearestTo({ x: 0, y: 0 }, [])).toBe(-1)
  })
})
