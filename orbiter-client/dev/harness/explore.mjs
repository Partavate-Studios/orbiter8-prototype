// Step through the app interactively: node explore.mjs <url> <outdir> [step...]
// Each step: "shot:name", "click:text", "clickxy:x,y", "move:x,y", "type:selector=value", "wait:ms", "key:k", "eval:js"
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const [url, outDir, ...steps] = process.argv.slice(2)
fs.mkdirSync(outDir, { recursive: true })
const providerSrc = fs.readFileSync(new URL('./provider.js', import.meta.url), 'utf8')

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--window-size=1440,900', '--autoplay-policy=no-user-gesture-required', '--mute-audio']
})
const page = await browser.newPage()
// TOUCH=1: a touch screen with no hover (phones), so `(hover: none)` holds and taps are touches.
await page.setViewport({
  width: Number(process.env.VW || 1440),
  height: Number(process.env.VH || 900),
  deviceScaleFactor: Number(process.env.DPR || 1),
  hasTouch: process.env.TOUCH === '1'
})
// CPU_THROTTLE=4: slow the page's CPU this many times (Chrome's throttling), to show costs a fast machine hides.
if (process.env.CPU_THROTTLE) {
  const cdp = await page.createCDPSession()
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU_THROTTLE) })
}
// INJECT=0: rely on the app's own dev wallet (dev builds) instead of the injected test wallet.
if (process.env.INJECT !== '0') {
  if (process.env.ACCOUNT) await page.evaluateOnNewDocument(`window.__TEST_ACCOUNT = '${process.env.ACCOUNT}'`)
  if (process.env.RPC) await page.evaluateOnNewDocument(`window.__TEST_RPC = '${process.env.RPC}'`)
  await page.evaluateOnNewDocument(providerSrc)
}
// PRELOAD=<file>: a script injected before the page's own (e.g. fake-gamepad.js).
if (process.env.PRELOAD) await page.evaluateOnNewDocument(fs.readFileSync(process.env.PRELOAD, 'utf8'))
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`))
page.on('dialog', (d) => d.accept())
await page.goto(url, { waitUntil: 'networkidle2' })

const clickText = async (text) => {
  // Smallest visible element whose text starts with `text`, clicked with a real mouse event at its center.
  const box = await page.evaluate((t) => {
    const hits = [...document.querySelectorAll('*')].filter((e) => {
      if (!e.textContent.trim().startsWith(t)) return false
      const r = e.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    })
    hits.sort((a, b) => a.textContent.length - b.textContent.length)
    if (!hits.length) return null
    const r = hits[0].getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, text)
  if (!box) return logs.push(`[harness] no element with text "${text}"`)
  await page.mouse.click(box.x, box.y)
}

// Alternate drag-pans and wheel zooms for `ms`, measuring frame intervals in the page.
async function panZoom(ms) {
  await page.evaluate(() => {
    window.__frames = []
    let last = performance.now()
    const loop = (t) => {
      window.__frames.push(t - last)
      last = t
      if (!window.__stopFrames) requestAnimationFrame(loop)
    }
    window.__stopFrames = false
    requestAnimationFrame(loop)
  })
  const start = Date.now()
  let cycle = 0
  while (Date.now() - start < ms) {
    const dir = cycle % 2 ? 1 : -1
    await page.mouse.move(300, 600)
    await page.mouse.down()
    for (let i = 1; i <= 30; i++) await page.mouse.move(300 + dir * i * 12, 600 + dir * i * 6)
    await page.mouse.up()
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel({ deltaY: (cycle % 4 < 2 ? -1 : 1) * 100 })
      await new Promise((r) => setTimeout(r, 60))
    }
    cycle++
  }
  return page.evaluate(() => {
    window.__stopFrames = true
    const f = window.__frames.slice(1).sort((a, b) => a - b)
    const total = f.reduce((a, b) => a + b, 0)
    return {
      frames: f.length,
      avgFps: +((1000 * f.length) / total).toFixed(1),
      p50ms: +f[Math.floor(f.length * 0.5)].toFixed(1),
      p95ms: +f[Math.floor(f.length * 0.95)].toFixed(1),
      maxMs: +f[f.length - 1].toFixed(1),
      over50ms: f.filter((x) => x > 50).length
    }
  })
}

for (const step of steps) {
  const [kind, ...rest] = step.split(':')
  const arg = rest.join(':')
  if (kind === 'shot') await page.screenshot({ path: path.join(outDir, arg + '.png') })
  else if (kind === 'click') await clickText(arg)
  else if (kind === 'type') {
    const cut = arg.lastIndexOf('=')
    const sel = arg.slice(0, cut)
    const val = arg.slice(cut + 1)
    await page.click(sel, { clickCount: 3 })
    await page.type(sel, val)
  } else if (kind === 'wait') await new Promise((r) => setTimeout(r, Number(arg)))
  else if (kind === 'key') await page.keyboard.press(arg)
  else if (kind === 'offline') await page.setOfflineMode(arg === 'on')
  else if (kind === 'eval') logs.push('[eval] ' + JSON.stringify(await page.evaluate(arg)))
  else if (kind === 'text') logs.push('[text] ' + (await page.evaluate(() => document.body.innerText)).slice(0, 1500))
  else if (kind === 'commit') {
    // commit:UI/openMenu=\"planets\" commits a store mutation (Vuex today; window.__o8commit after the upgrade).
    const cut = arg.indexOf('=')
    const name = cut < 0 ? arg : arg.slice(0, cut)
    const payload = cut < 0 ? undefined : JSON.parse(arg.slice(cut + 1))
    await page.evaluate(
      (n, p) => {
        if (window.__o8commit) return window.__o8commit(n, p)
        const vue3 = document.querySelector('[data-v-app]')
        if (vue3) return vue3.__vue_app__.config.globalProperties.$store.commit(n, p)
        document.getElementById('app').__vue__.$store.commit(n, p)
      },
      name,
      payload
    )
  } else if (kind === 'invalidations') {
    // invalidations:<name> records 3 s of paint-invalidation tracking while idle.
    await page.tracing.start({
      path: path.join(outDir, arg + '.json'),
      categories: [
        'devtools.timeline',
        'disabled-by-default-devtools.timeline.invalidationTracking',
        'disabled-by-default-devtools.timeline'
      ]
    })
    await new Promise((r) => setTimeout(r, 3000))
    await page.tracing.stop()
  } else if (kind === 'wheel') {
    // wheel:<deltaY>:<times> scrolls the mouse wheel over the map center.
    const [deltaY, times] = arg.split(':').map(Number)
    await page.mouse.move(720, 450)
    for (let i = 0; i < (times || 1); i++) {
      await page.mouse.wheel({ deltaY })
      await new Promise((r) => setTimeout(r, 30))
    }
  } else if (kind === 'wheelat') {
    // wheelat:<x>,<y>:<deltaY>:<times> scrolls the mouse wheel over a screen point.
    const [at, deltaY, times] = arg.split(':')
    const [x, y] = at.split(',').map(Number)
    await page.mouse.move(x, y)
    for (let i = 0; i < (Number(times) || 1); i++) {
      await page.mouse.wheel({ deltaY: Number(deltaY) })
      await new Promise((r) => setTimeout(r, 30))
    }
  } else if (kind === 'drag') {
    // drag:<x1>,<y1>,<x2>,<y2> drags the mouse between two screen points in small steps.
    const [x1, y1, x2, y2] = arg.split(',').map(Number)
    await page.mouse.move(x1, y1)
    await page.mouse.down()
    await page.mouse.move(x2, y2, { steps: 20 })
    await page.mouse.up()
  } else if (kind === 'tdrag') {
    // tdrag:<x1>,<y1>,<x2>,<y2> drags one finger between two screen points (needs TOUCH=1).
    const [x1, y1, x2, y2] = arg.split(',').map(Number)
    const cdp = await page.createCDPSession()
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1, id: 1 }] })
    for (let i = 1; i <= 20; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x1 + ((x2 - x1) * i) / 20, y: y1 + ((y2 - y1) * i) / 20, id: 1 }]
      })
      await new Promise((r) => setTimeout(r, 16))
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } else if (kind === 'pinch') {
    // pinch:<x>,<y>,<from>,<to> two fingers around a screen point, spreading (or closing) from one
    // distance apart to another, in pixels.
    const [x, y, from, to] = arg.split(',').map(Number)
    const cdp = await page.createCDPSession()
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 })
    const fingers = (d) => [
      { x: x - d / 2, y, id: 1 },
      { x: x + d / 2, y, id: 2 }
    ]
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: fingers(from) })
    for (let i = 1; i <= 20; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: fingers(from + ((to - from) * i) / 20)
      })
      await new Promise((r) => setTimeout(r, 16))
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } else if (kind === 'paintflash') {
    // paintflash:on|off toggles Chrome's paint-flashing overlay (green = repainted).
    const cdp = await page.createCDPSession()
    await cdp.send('DOM.enable')
    await cdp.send('Overlay.enable')
    await cdp.send('Overlay.setShowPaintRects', { result: arg === 'on' })
  } else if (kind === 'move') {
    // move:<x>,<y> moves the mouse to a screen point (hover effects, tooltips).
    const [x, y] = arg.split(',').map(Number)
    await page.mouse.move(x, y, { steps: 5 })
  } else if (kind === 'clickxy') {
    const [x, y] = arg.split(',').map(Number)
    await page.mouse.click(x, y)
  } else if (kind === 'idletrace') {
    // idletrace:<name> records a Chrome performance trace for 5 s with no input (e.g. following a ship).
    await page.tracing.start({ path: path.join(outDir, arg + '.json'), screenshots: false })
    await new Promise((r) => setTimeout(r, 5000))
    await page.tracing.stop()
  } else if (kind === 'trace') {
    // trace:<name> records a Chrome performance trace around a scripted pan/zoom session.
    await page.tracing.start({ path: path.join(outDir, arg + '.json'), screenshots: false })
    const stats = await panZoom(10000)
    await page.tracing.stop()
    logs.push('[panzoom] ' + JSON.stringify(stats))
  }
}
fs.writeFileSync(path.join(outDir, 'console.log'), logs.join('\n'))
console.log(
  logs
    .filter((l) => !l.startsWith('[log]') || l.includes('rror'))
    .slice(-40)
    .join('\n')
)
await browser.close()
