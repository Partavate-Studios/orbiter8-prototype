// The eight goods as the HUD shows them: a three-letter code (the ports' tickers, as in the story's
// port panel) and an icon (assets/art/good-*.svg), by good id in the Market's order (Water ice, Metals,
// Rare elements, Helium-3, Organics, Silicon, Equipment, Electronics). Colors are libs/palette.js
// GOODS_COLORS. The SDK names the goods; this is only how they look.
import water from '@/assets/art/good-water.svg'
import metals from '@/assets/art/good-metals.svg'
import rare from '@/assets/art/good-rare.svg'
import he3 from '@/assets/art/good-he3.svg'
import organics from '@/assets/art/good-organics.svg'
import silicon from '@/assets/art/good-silicon.svg'
import equipment from '@/assets/art/good-equipment.svg'
import electronics from '@/assets/art/good-electronics.svg'

export const GOOD_CODES = ['WAT', 'MET', 'RAR', 'HE3', 'ORG', 'SIL', 'EQP', 'ELC']
export const GOOD_ICONS = [water, metals, rare, he3, organics, silicon, equipment, electronics]

/** A good's code; a good added later gets the first three letters of its name. */
export const goodCode = (id, name = '') => GOOD_CODES[id] ?? name.slice(0, 3).toUpperCase()
export const goodIcon = (id) => GOOD_ICONS[id] ?? null

/**
 * A port's trade code, one letter per good in the Market's order: S it sells, B it buys, - neither
 * (the planets menu's code). A B is `wanted` when the port buys something the ship carries: yellow.
 * @param {{ id: number, mode: string }[]} stationGoods
 * @param {number} count  goods in the economy
 * @param {number[]} cargo  the ship's units by good id
 */
export function portCode(stationGoods, count, cargo = []) {
  return Array.from({ length: count }, (_, id) => {
    const good = stationGoods.find((g) => g.id === id)
    const letter = good?.mode === 'sells' ? 'S' : good?.mode === 'buys' ? 'B' : '-'
    return { id, letter, wanted: letter === 'B' && (cargo[id] ?? 0) > 0 }
  })
}

/**
 * What fills a ship's holds, in order, for drawing every hold (components/hud/hold-grid.svg.vue): each
 * good in its color, the colonists (100 to a hold, lavender), then the rest of the holds in use (fitted
 * parts, holds lost to damage: sdk/client.js usedBays) in a quiet gray.
 * @param {{ cargo?: number[], colonists?: number, usedHolds?: number }} ship
 * @param {(id: number) => string} colorOf  a good's color
 * @param {{ text2: string, text3: string }} colors
 */
export function shipHolds(ship, colorOf, { text2, text3 }) {
  const goods = (ship?.cargo ?? []).map((units, id) => ({ count: units ?? 0, color: colorOf(id), kind: 'full' }))
  const { colonists, other } = otherHolds(ship)
  return [...goods, { count: colonists, color: text2, kind: 'full' }, { count: other, color: text3, kind: 'full' }].filter((part) => part.count > 0)
}

/** Holds in use for something other than goods: colonists, and the rest (fitted parts, damage). */
export function otherHolds(ship) {
  const goods = (ship?.cargo ?? []).reduce((sum, units) => sum + (units ?? 0), 0)
  const colonists = Math.ceil((ship?.colonists ?? 0) / 100)
  return { colonists, other: Math.max(0, (ship?.usedHolds ?? goods + colonists) - goods - colonists) }
}
