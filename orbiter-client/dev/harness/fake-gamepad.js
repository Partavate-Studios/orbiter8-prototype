// A scriptable standard-mapping gamepad for the harness (PRELOAD=dev/harness/fake-gamepad.js).
// From a step: eval:__pad.press(0) taps a button for a few frames; __pad.hold(7, 1) holds a trigger
// or button at a value; __pad.stick(0, 1) sets an axis; __pad.release() lets go of everything.
;(() => {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }))
  const axes = [0, 0, 0, 0]
  const pad = { id: 'Harness Pad', index: 0, connected: true, mapping: 'standard', buttons, axes, timestamp: 0 }
  navigator.getGamepads = () => [pad, null, null, null]
  const set = (index, value) => Object.assign(buttons[index], { pressed: value > 0, touched: value > 0, value })
  window.__pad = {
    press(index) {
      set(index, 1)
      return new Promise((resolve) => setTimeout(() => (set(index, 0), resolve(index)), 100))
    },
    hold: (index, value = 1) => set(index, value),
    stick: (axis, value) => (axes[axis] = value),
    release() {
      buttons.forEach((_, index) => set(index, 0))
      axes.fill(0)
    }
  }
})()
