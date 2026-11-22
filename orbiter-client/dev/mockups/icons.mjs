// Draws docs/mockups/together/6-small-icons.svg (and its PNG with --png): the small-icon set proposed in
// docs/ui-plan.md (section 11, recommendation 3). One 24-unit grid around 0,0, one line weight, round
// ends, no fills: made to read at 20 px, for filters, the activity window, action wells and statuses.
// A proposal for Koda's review: once approved the paths move into the game (libs/body-art.js has the
// drawer's line glyphs today).
//   node dev/mockups/icons.mjs [--png]     (from orbiter-client/)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(here, '../../../docs/mockups/together')

import { ICON_GROUPS } from './small-icons.mjs'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const icon = (cx, cy, d, size, stroke = '#ffffff', sw = 1.7) =>
  `<g transform="translate(${cx} ${cy}) scale(${size / 24})"><path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></g>`

const W = 1440
const COLS = 9
const CELL_W = 152
const CELL_H = 104
let body = ''
let y = 70
body += `<text x="40" y="44" font-size="18" font-weight="700" fill="#fff">Mockup 6 · the small-icon set</text><text x="330" y="44" font-size="12.5" fill="#c3b3da">One 24-unit grid, one line weight. Each is shown in a 44 px well, then bare at 20 px (the size that has to work), then at 14 px.</text>`
for (const [group, icons] of Object.entries(ICON_GROUPS)) {
  body += `<text x="40" y="${y + 14}" font-size="11" font-weight="700" fill="#c9b6ff" letter-spacing="1.3">${esc(group.toUpperCase())}</text><rect x="40" y="${y + 22}" width="${W - 80}" height="1" fill="#ffffff" opacity="0.12"/>`
  y += 36
  Object.entries(icons).forEach(([, [label, d]], i) => {
    const cx = 40 + (i % COLS) * CELL_W
    const cy = y + Math.floor(i / COLS) * CELL_H
    body += `<circle cx="${cx + 26}" cy="${cy + 26}" r="22" fill="#241a45" stroke="#5a4c8c" stroke-width="1.5"/>` + icon(cx + 26, cy + 26, d, 26)
    body += icon(cx + 72, cy + 26, d, 20) + icon(cx + 102, cy + 26, d, 14, '#ffffff', 2)
    body += `<text x="${cx + 4}" y="${cy + 70}" font-size="12" fill="#efe7ff">${esc(label)}</text>`
  })
  y += Math.ceil(Object.keys(icons).length / COLS) * CELL_H + 6
}
const H = y + 20
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Ubuntu, 'Segoe UI', sans-serif">\n<rect width="${W}" height="${H}" fill="#130e24"/>\n${body}\n</svg>\n`
fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, '6-small-icons.svg'), svg)
console.log('wrote 6-small-icons.svg')

if (process.argv.includes('--png')) {
  const { default: puppeteer } = await import('puppeteer-core')
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
  await page.setContent(`<body style="margin:0">${svg}</body>`)
  await page.screenshot({ path: path.join(OUT, '6-small-icons.png') })
  console.log('wrote 6-small-icons.png')
  await browser.close()
}
