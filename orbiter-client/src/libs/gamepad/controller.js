// Polls the first connected gamepad every frame and turns it into page-level behavior: a D-pad
// focus ring over clickable things, a right-stick cursor, A to click, and named commands for the
// game (passed to onCommand). It knows nothing about the game's stores; the overlay component does.
import { BUTTON, readPad } from './read'
import { nextInDirection, nearestTo } from './spatial-nav'

// Things the D-pad can focus. Sprites in the world layer are left out (there are many, and they
// move); the right-stick cursor or L1/R1 reach those.
// The pre-game screens style spans as buttons (.button, .littlebutton, .radioButton; Minerva's .tab).
const FOCUSABLE = 'button, a, .can-click, [role="button"], .button, .littlebutton, .radioButton, .tab'
const EXCLUDED_AREA = '.world-layer'
// Right-stick cursor speed at full tilt, in pixels per second.
const CURSOR_SPEED = 900

/** Buttons that send a command when pressed. */
const BUTTON_COMMANDS = {
  [BUTTON.EAST]: 'back',
  [BUTTON.NORTH]: 'planets',
  [BUTTON.WEST]: 'jump',
  [BUTTON.L1]: 'previousPlanet',
  [BUTTON.R1]: 'nextPlanet',
  [BUTTON.START]: 'myShip',
  [BUTTON.SELECT]: 'settings',
  [BUTTON.L3]: 'labels',
  [BUTTON.R3]: 'scope',
  [BUTTON.L2]: 'zoomOutPressed',
  [BUTTON.R2]: 'zoomInPressed'
}
const DIRECTIONS = { [BUTTON.UP]: 'up', [BUTTON.DOWN]: 'down', [BUTTON.LEFT]: 'left', [BUTTON.RIGHT]: 'right' }

function visibleFocusables() {
  return [...document.querySelectorAll(FOCUSABLE)].filter((element) => {
    if (element.closest(EXCLUDED_AREA)) return false
    const rect = element.getBoundingClientRect()
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right > 0 &&
      rect.bottom > 0 &&
      rect.left < innerWidth &&
      rect.top < innerHeight
    )
  })
}

function hover(element, isOver) {
  element?.dispatchEvent(new MouseEvent(isOver ? 'mouseover' : 'mouseout', { bubbles: true }))
}

function click(element) {
  if (!element) return
  if (typeof element.click === 'function' && !(element instanceof SVGElement)) element.click()
  else element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

/**
 * @param {object} handlers
 * @param {(command: string, detail?: object) => void} handlers.onCommand  game commands:
 *   the BUTTON_COMMANDS names, plus continuous 'pan' ({ x, y, seconds }) and 'zoom' ({ in, out, seconds })
 * @param {(state: { active: boolean, focused: Element | null, cursor: { x: number, y: number } | null }) => void} handlers.onChange
 */
export function createGamepadController({ onCommand, onChange }) {
  const state = { active: false, focused: null, cursor: null }
  let previousDown = null
  let lastTime = null
  let usingCursor = false

  const changed = () => onChange({ ...state })

  const moveFocus = (direction) => {
    const candidates = visibleFocusables()
    if (candidates.length === 0) return
    const rects = candidates.map((element) => element.getBoundingClientRect())
    let index
    if (!state.focused || !state.focused.isConnected || !candidates.includes(state.focused)) {
      index = nearestTo({ x: innerWidth / 2, y: innerHeight / 2 }, rects)
    } else {
      index = nextInDirection(state.focused.getBoundingClientRect(), rects, direction)
      if (index === -1) return
    }
    hover(state.focused, false)
    state.focused = candidates[index]
    hover(state.focused, true)
    usingCursor = false
  }

  return {
    /** Call once per animation frame. */
    poll(now) {
      const seconds = lastTime === null ? 0 : Math.min(0.1, (now - lastTime) / 1000)
      lastTime = now
      const pad = [...(navigator.getGamepads?.() ?? [])].find(Boolean)
      if (!pad) return
      const input = readPad(pad, previousDown)
      previousDown = input.down

      const { leftStick, rightStick } = input
      const zoomIn = input.value(BUTTON.R2)
      const zoomOut = input.value(BUTTON.L2)
      const anything =
        input.pressed.size > 0 ||
        leftStick.x ||
        leftStick.y ||
        rightStick.x ||
        rightStick.y ||
        zoomIn > 0.05 ||
        zoomOut > 0.05
      if (!anything) return
      if (!state.active) state.active = true

      for (const button of input.pressed) {
        if (DIRECTIONS[button]) moveFocus(DIRECTIONS[button])
        else if (button === BUTTON.SOUTH)
          click(usingCursor && state.cursor ? document.elementFromPoint(state.cursor.x, state.cursor.y) : state.focused)
        else if (BUTTON_COMMANDS[button]) onCommand(BUTTON_COMMANDS[button])
      }
      if (rightStick.x || rightStick.y) {
        const cursor = state.cursor ?? { x: innerWidth / 2, y: innerHeight / 2 }
        state.cursor = {
          x: Math.min(innerWidth - 1, Math.max(0, cursor.x + rightStick.x * CURSOR_SPEED * seconds)),
          y: Math.min(innerHeight - 1, Math.max(0, cursor.y + rightStick.y * CURSOR_SPEED * seconds))
        }
        usingCursor = true
      }
      if (leftStick.x || leftStick.y) onCommand('pan', { x: leftStick.x, y: leftStick.y, seconds })
      if (zoomIn > 0.05 || zoomOut > 0.05) onCommand('zoom', { in: zoomIn, out: zoomOut, seconds })
      changed()
    },
    /** The mouse took over: hide the focus ring and cursor until the pad is used again. */
    deactivate() {
      if (!state.active) return
      hover(state.focused, false)
      state.active = false
      state.focused = null
      state.cursor = null
      usingCursor = false
      changed()
    }
  }
}
