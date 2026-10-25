// Paint flashing on the production build: node paint.mjs <url> <outdir> — screenshots with Chrome's repaint rectangles shown.
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const [url, outDir] = process.argv.slice(2)
fs.mkdirSync(outDir, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--window-size=1440,900']
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.evaluateOnNewDocument(`window.__TEST_ACCOUNT = '${process.env.ACCOUNT}'`)
await page.evaluateOnNewDocument(fs.readFileSync(new URL('./provider.js', import.meta.url), 'utf8'))
await page.goto(url, { waitUntil: 'networkidle2' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const click = async (t) => {
  const box = await page.evaluate((t) => {
    const e = [...document.querySelectorAll('*')]
      .filter((e) => e.textContent.trim().startsWith(t) && e.getBoundingClientRect().width > 0)
      .sort((a, b) => a.textContent.length - b.textContent.length)[0]
    if (!e) return null
    const r = e.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, t)
  if (box) await page.mouse.click(box.x, box.y)
}
await sleep(5000)
await click('Play')
await sleep(2000)
await click('Take Command')
await sleep(14000)
const cdp = await page.createCDPSession()
await cdp.send('DOM.enable')
await cdp.send('Overlay.enable')
await cdp.send('Overlay.setShowPaintRects', { result: true })
await sleep(1500)
await page.screenshot({ path: outDir + '/idle-ship.png' })
// zoom out with the wheel to the whole system, then idle
await page.mouse.move(720, 450)
for (let i = 0; i < 14; i++) {
  await page.mouse.wheel({ deltaY: 100 })
  await sleep(120)
}
await sleep(3000)
await page.screenshot({ path: outDir + '/idle-system.png' })
await browser.close()
