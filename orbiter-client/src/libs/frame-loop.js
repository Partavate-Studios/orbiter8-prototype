// One requestAnimationFrame loop drives all animation. Components subscribe with onFrame()
// and call the returned function on unmount. The browser pauses rAF while the tab is hidden,
// so nothing animates in the background.

const subscribers = new Set()
let frameId = null

function tick (now) {
  frameId = requestAnimationFrame(tick)
  for (const callback of subscribers) callback(now)
}

/**
 * Calls `callback(now)` once per animation frame until the returned unsubscribe function is called.
 * @param {(now: DOMHighResTimeStamp) => void} callback
 * @returns {() => void}
 */
export function onFrame (callback) {
  subscribers.add(callback)
  if (frameId === null) frameId = requestAnimationFrame(tick)
  return () => {
    subscribers.delete(callback)
    if (subscribers.size === 0 && frameId !== null) {
      cancelAnimationFrame(frameId)
      frameId = null
    }
  }
}
