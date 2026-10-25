// Measure frame rate in Firefox at ship zoom and zoomed out: node ffps.mjs <url> <profileDir>
import puppeteer from 'puppeteer-core'
const [url, profile] = process.argv.slice(2)
const browser = await puppeteer.launch({
  browser: 'firefox',
  executablePath: process.env.FIREFOX_PATH || '/usr/bin/firefox',
  headless: true,
  userDataDir: profile,
  extraPrefsFirefox: { 'gfx.webrender.software': false, 'nglayout.debug.paint_flashing': process.env.FLASH === '1' }
})
const page = await browser.newPage()
await page.setViewport({
  width: Number(process.env.VW || 1440),
  height: Number(process.env.VH || 900),
  deviceScaleFactor: Number(process.env.DPR || 1)
})
// Time each animation-frame callback including the Vue update it triggers (microtasks queued during it).
await page.evaluateOnNewDocument(`
  window.__scriptMs = [];
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => raf(t => { const s = performance.now(); cb(t); queueMicrotask(() => setTimeout(() => {}, 0)); Promise.resolve().then(() => Promise.resolve()).then(() => window.__scriptMs.push(performance.now() - s)) });
`)
if (process.env.MARGIN) await page.evaluateOnNewDocument(`window.__O8_WORLD_MARGIN = ${process.env.MARGIN}`)
await page.goto(url, { waitUntil: 'load' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clickText = async (t) => {
  const box = await page.evaluate((t) => {
    const hits = [...document.querySelectorAll('*')].filter(
      (e) => e.textContent.trim().startsWith(t) && e.getBoundingClientRect().width > 0
    )
    hits.sort((a, b) => a.textContent.length - b.textContent.length)
    if (!hits[0]) return null
    const r = hits[0].getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, t)
  if (!box) return false
  await page.mouse.click(box.x, box.y)
  return true
}
await sleep(6000)
console.log('play', await clickText('Play'))
let took = false
for (let i = 0; i < 20 && !took; i++) {
  await sleep(1000)
  took = await clickText('Take Command')
}
console.log(
  'take command',
  took,
  (await page.evaluate(() => document.body.innerText)).slice(0, 120).replace(/\n/g, ' | ')
)
await sleep(12000)
const measure = () =>
  page
    .evaluate(
      () =>
        new Promise((resolve) => {
          const frames = []
          let last = performance.now()
          const loop = (t) => {
            frames.push(t - last)
            last = t
            if (frames.length < 180) requestAnimationFrame(loop)
            else resolve(frames)
          }
          requestAnimationFrame(loop)
        })
    )
    .then((f) => {
      f = f.slice(1).sort((a, b) => a - b)
      const total = f.reduce((a, b) => a + b, 0)
      return {
        fps: +((1000 * f.length) / total).toFixed(1),
        p50: +f[f.length >> 1].toFixed(1),
        p95: +f[Math.floor(f.length * 0.95)].toFixed(1)
      }
    })
if (process.env.Q) {
  await page.evaluate((q) => window.__o8commit('Config/setGraphicsQuality', q), Number(process.env.Q))
  await sleep(2000)
}
console.log('ship selected (cards)', JSON.stringify(await measure()))
const wheel = async (deltaY, ms) => {
  const end = Date.now() + ms
  await page.mouse.move(700, 500)
  while (Date.now() < end) {
    await page.mouse.wheel({ deltaY })
    await sleep(60)
  }
}
await page.evaluate(() => {
  window.__mut = {}
  new MutationObserver((list) => {
    for (const m of list) {
      const el = m.target.nodeType === 1 ? m.target : m.target.parentElement
      const where = el.closest('.hud-layer')
        ? 'hud'
        : el.closest('.planet-layers')
          ? 'planets'
          : el.closest('#gamelayer')
            ? 'world'
            : el.closest('.background')
              ? 'background'
              : el.closest('.world-layer')
                ? 'world-wrapper'
                : 'other'
      const key = where + ' ' + el.tagName + ' ' + (m.attributeName || m.type)
      window.__mut[key] = (window.__mut[key] || 0) + 1
    }
  }).observe(document.body, { subtree: true, attributes: true, childList: true, characterData: true })
})
const [whileWheeling] = await Promise.all([measure(), wheel(100, 3000)])
console.log('wheeling out', JSON.stringify(whileWheeling))
const muts = await page.evaluate(() =>
  Object.entries(window.__mut)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
)
console.log('mutations during 3 s of wheeling out:')
for (const [k, v] of muts) console.log('  ', v, k)
console.log(
  'renderer',
  await page.evaluate(() => {
    const c = document.createElement('canvas').getContext('webgl')
    const d = c && c.getExtension('WEBGL_debug_renderer_info')
    return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'no webgl'
  })
)
await browser.close()
