// Page-side: track the on-screen center of the selected sprite's selection circle for N frames.
;(async () => {
  const frames = 120
  const pinia = document.querySelector('[data-v-app]').__vue_app__.config.globalProperties.$pinia
  const ui = pinia._s.get('UI')
  const cx = ui.screenSize.width / 2
  const cy = ui.screenSize.height / 2 + ui.groupPixels * -100
  const circles = [...document.querySelectorAll('circle[stroke-dasharray="2 1"]')]
  const centerOf = (el) => {
    const r = el.getBoundingClientRect()
    return [r.left + r.width / 2, r.top + r.height / 2]
  }
  let best = null,
    bestD = 1e9
  for (const c of circles) {
    const [x, y] = centerOf(c)
    const d = Math.hypot(x - cx, y - cy)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  const xs = [],
    ys = []
  for (let i = 0; i < frames; i++) {
    await new Promise((r) => requestAnimationFrame(r))
    const [x, y] = centerOf(best)
    xs.push(x)
    ys.push(y)
  }
  const span = (a) => +(Math.max(...a) - Math.min(...a)).toFixed(3)
  let moves = 0
  for (let i = 1; i < frames; i++) if (xs[i] !== xs[i - 1] || ys[i] !== ys[i - 1]) moves++
  const scaled = [...document.querySelectorAll('[style*="scale("]')]
    .map((e) => e.style.transform)
    .filter((t) => !/scale\(1\)/.test(t))
  return {
    scaledLayers: scaled.length,
    selected: ui.selected,
    dpr: devicePixelRatio,
    offCenter: +bestD.toFixed(2),
    spanX: span(xs),
    spanY: span(ys),
    framesThatMoved: moves
  }
})()
