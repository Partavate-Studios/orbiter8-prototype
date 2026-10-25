// Selected-sprite jitter in Firefox: node ffjitter.mjs <url> <profileDir>
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const [url, profile] = process.argv.slice(2)
const J = fs.readFileSync(new URL('./jitter.js', import.meta.url), 'utf8')
const browser = await puppeteer.launch({
  browser: 'firefox',
  executablePath: process.env.FIREFOX_PATH || '/usr/bin/firefox',
  headless: true,
  userDataDir: profile,
  extraPrefsFirefox: { 'gfx.webrender.software': false }
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: Number(process.env.DPR || 1) })
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
await clickText('Play')
let took = false
for (let i = 0; i < 20 && !took; i++) {
  await sleep(1000)
  took = await clickText('Take Command')
}
await sleep(10000)
const commit = (n, p) => page.evaluate((n, p) => window.__o8commit(n, p), n, p)
await commit('UI/closeMenu')
for (const key of ['ship:1', 'moon:3:1', 'moon:5:2', 'station:3', 'planet:3']) {
  await commit('UI/selectSprite', key)
  await sleep(4000)
  console.log(JSON.stringify(await page.evaluate(J)))
}
await browser.close()
