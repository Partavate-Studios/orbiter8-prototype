// Draws a simulated region of the galaxy as an SVG, for judging star density by eye (Koda, 2026-11-19).
// The cells come from the contracts' own scan rules (contracts/test/sim/DensityMap.t.sol):
//   cd contracts && DENSITY_MAP=1 RINGS=60 forge test --match-contract DensityMap -vv > /tmp/map.txt
//   node orbiter-client/dev/sim/density-map.mjs /tmp/map.txt docs/mockups/density/map.svg
// Each hex is drawn at its place: stars as dots, black holes as rings, cells the scans left empty as faint
// hexes, never-reached cells not at all; behind them, the spiral's density (the arms) as a purple haze.
import fs from 'node:fs'
import { position } from '../../../sdk/src/hex.js'

const [input, output = 'density-map.svg'] = process.argv.slice(2)
const ONE = 1e9 // Fixed.ONE: densities are 0..1e9
const cells = []
let scans = 0
for (const line of fs.readFileSync(input, 'utf8').split('\n')) {
  const m = line.match(/CELL (\d+) (\d) (-?\d+)/)
  if (m) cells.push({ cell: Number(m[1]), state: Number(m[2]), density: Number(m[3]) / ONE })
  const s = line.match(/SCANS (\d+)/)
  if (s) scans = Number(s[1])
}
if (!cells.length) throw new Error('no CELL lines in ' + input)

const S = 10 // pixels per hex step
const pts = cells.map((c) => ({ ...c, xy: position(c.cell) }))
const maxR = Math.max(...pts.map((p) => Math.hypot(...p.xy)))
const half = Math.ceil((maxR + 2) * S)
const hex = (x, y, r) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6
    return `${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')

const counts = { undecided: 0, empty: 0, stars: 0, holes: 0 }
let haze = ''
let empty = ''
let stars = ''
for (const p of pts) {
  const [x, y] = [p.xy[0] * S, p.xy[1] * S]
  if (p.density > 0.05) haze += `<polygon points="${hex(x, y, S * 0.6)}" fill="#7a4fc7" fill-opacity="${(p.density * 0.45).toFixed(2)}"/>`
  if (p.state === 0) counts.undecided++
  else if (p.state === 1) {
    counts.empty++
    empty += `<polygon points="${hex(x, y, S * 0.5)}" fill="none" stroke="#5b4a80" stroke-width="0.6"/>`
  } else if (p.state === 2) {
    counts.stars++
    stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(S * 0.28).toFixed(1)}" fill="#fff4d6"/>`
  } else if (p.state === 3) {
    counts.holes++
    stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(S * 0.3).toFixed(1)}" fill="none" stroke="#ff7ab8" stroke-width="1.6"/>`
  }
}
const sol = `<circle cx="0" cy="0" r="${S * 0.45}" fill="#ffd34d"/>`
const decided = counts.empty + counts.stars + counts.holes
const lines = [
  `Simulated exploration: ${cells.length.toLocaleString()} cells (${Math.round(maxR)} rings), ${scans.toLocaleString()} scans`,
  `${counts.stars.toLocaleString()} stars, ${counts.holes} black holes (pink rings), ${counts.empty.toLocaleString()} empty (faint hexes), ${counts.undecided.toLocaleString()} never reached`,
  `stars in charted cells: ${((100 * (counts.stars + counts.holes)) / Math.max(1, decided)).toFixed(0)}%   haze: the spiral's density (arms)   yellow: Sol`
]
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-half} ${-half - 70} ${2 * half} ${2 * half + 70}" width="${2 * half}" height="${2 * half + 70}" font-family="Ubuntu, sans-serif">
<rect x="${-half}" y="${-half - 70}" width="${2 * half}" height="${2 * half + 70}" fill="#0d0a17"/>
${lines.map((l, i) => `<text x="${-half + 16}" y="${-half - 46 + i * 20}" fill="#e6dcf5" font-size="15">${l}</text>`).join('\n')}
<g>${haze}</g><g>${empty}</g><g>${stars}</g>${sol}
</svg>
`
fs.writeFileSync(output, svg)
console.log(lines.join('\n'))
