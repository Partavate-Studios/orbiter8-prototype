// Turning the browser's Gamepad objects into "what happened this frame". Uses the W3C standard
// mapping, which names buttons by position (so Xbox A and PlayStation ✕ are both BUTTON.SOUTH).

/** Button indexes in the standard mapping. */
export const BUTTON = {
  SOUTH: 0, // A / ✕
  EAST: 1, // B / ○
  WEST: 2, // X / □
  NORTH: 3, // Y / △
  L1: 4,
  R1: 5,
  L2: 6,
  R2: 7,
  SELECT: 8, // Back / View / Share
  START: 9, // Menu / Options
  L3: 10,
  R3: 11,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15
}

// Sticks rest a little off center; ignore anything smaller.
const STICK_DEAD_ZONE = 0.18
// A trigger counts as pressed past this.
const TRIGGER_PRESSED = 0.5

/** A stick axis with the dead zone removed and the rest rescaled to 0..1, keeping its sign. */
export function deadZone(value, zone = STICK_DEAD_ZONE) {
  const size = Math.abs(value)
  if (size < zone) return 0
  return (Math.sign(value) * (size - zone)) / (1 - zone)
}

/**
 * One frame of input from a pad.
 * @param {{ buttons: { pressed: boolean, value: number }[], axes: number[] }} pad  a Gamepad
 * @param {boolean[] | null} previousDown  which buttons were down last frame (from the last read)
 * @returns {{ down: boolean[], pressed: Set<number>, value: (button: number) => number,
 *   leftStick: { x: number, y: number }, rightStick: { x: number, y: number } }}
 *   `pressed` holds the buttons that went down this frame.
 */
export function readPad(pad, previousDown = null) {
  const value = (button) => pad.buttons[button]?.value ?? 0
  const down = pad.buttons.map((button, index) =>
    index === BUTTON.L2 || index === BUTTON.R2 ? button.value > TRIGGER_PRESSED : button.pressed
  )
  const pressed = new Set()
  down.forEach((isDown, index) => {
    if (isDown && !previousDown?.[index]) pressed.add(index)
  })
  const axis = (index) => deadZone(pad.axes[index] ?? 0)
  return {
    down,
    pressed,
    value,
    leftStick: { x: axis(0), y: axis(1) },
    rightStick: { x: axis(2), y: axis(3) }
  }
}
