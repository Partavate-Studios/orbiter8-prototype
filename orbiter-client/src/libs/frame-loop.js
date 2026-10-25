// One requestAnimationFrame loop drives all animation. Components subscribe with onFrame()
// and call the returned function on unmount. The browser pauses rAF while the tab is hidden,
// so nothing animates in the background.

/** Game logic (time, orbits, camera) runs first; layers that draw that state run after it. */
export const FRAME_ORDER = { game: 0, render: 1 }

/** @type {{ callback: (now: number) => void, order: number }[]} */
let subscribers = []
let frameId = null

function tick(now) {
  frameId = requestAnimationFrame(tick)
  for (const { callback } of subscribers) callback(now)
}

/**
 * Calls `callback(now)` once per animation frame until the returned unsubscribe function is called.
 * @param {(now: DOMHighResTimeStamp) => void} callback
 * @param {number} [order] lower runs first within a frame (see FRAME_ORDER)
 * @returns {() => void}
 */
export function onFrame(callback, order = FRAME_ORDER.game) {
  const subscriber = { callback, order }
  subscribers = [...subscribers, subscriber].sort((a, b) => a.order - b.order)
  if (frameId === null) frameId = requestAnimationFrame(tick)
  return () => {
    subscribers = subscribers.filter((entry) => entry !== subscriber)
    if (subscribers.length === 0 && frameId !== null) {
      cancelAnimationFrame(frameId)
      frameId = null
    }
  }
}
