<template>
  <!-- Every cargo hold, drawn (Koda, round 2, item 6: "draw the holds small enough to show the exact
       number"): one cell per hold, up to the 250 a ship can have, laid out in the rows and columns that
       make the cells as big as the box allows. Cells fill in order: each good in its color, then
       what's changing in a trade or a purchase, then the empty holds. In SVG units, at (0, 0) to
       (width, height); for HTML, wrap it in an <svg> of that viewBox. One path per kind of cell, so
       even 250 holds are a handful of elements. -->
  <g class="hold-grid">
    <path v-for="part in paths" :key="part.key" :d="part.d" v-bind="part.style" />
  </g>
</template>

<script>
/**
 * The rows and columns that fit `count` cells into a box as big as they can be.
 * @returns {{ rows: number, columns: number, size: number }}  size: a cell's pitch (cell and gap)
 */
export function holdLayout(count, width, height) {
  let best = { rows: 1, columns: Math.max(1, count), size: 0 }
  for (let rows = 1; rows <= Math.max(1, count); rows++) {
    const columns = Math.ceil(count / rows)
    const size = Math.min(width / columns, height / rows)
    if (size > best.size) best = { rows, columns, size }
    // past here the cells only get smaller (the rows run out of height first)
    if (height / rows < best.size) break
  }
  return best
}

/** How each kind of cell is drawn. */
const STYLES = {
  // a hold with goods in it, in the good's color
  full: (color) => ({ fill: color, stroke: 'none' }),
  // a hold this trade fills: the good's color, lighter, outlined
  incoming: (color) => ({ fill: color, 'fill-opacity': 0.4, stroke: color, 'stroke-width': 'var(--hold-line)' }),
  // a hold this trade empties: an outline in the good's color, dashed
  outgoing: (color) => ({ fill: 'none', stroke: color, 'stroke-width': 'var(--hold-line)', 'stroke-dasharray': 'var(--hold-dash)' }),
  // a hold you're buying (the shipyard): yours to come, in yellow
  added: (color) => ({ fill: color, 'fill-opacity': 0.25, stroke: color, 'stroke-width': 'var(--hold-line)' }),
  empty: () => ({ fill: '#ffffff10', stroke: '#ffffff55', 'stroke-width': 'var(--hold-line)' })
}

export default {
  name: 'HoldGrid',
  props: {
    /**
     * The cells in order: { count, color, kind } with kind full, incoming, outgoing, added or empty
     * (the rest of `total` is empty).
     */
    segments: { type: Array, default: () => [] },
    /** Holds in all: the cells drawn. */
    total: { type: Number, default: 0 },
    width: { type: Number, default: 100 },
    height: { type: Number, default: 10 }
  },
  computed: {
    layout() {
      return holdLayout(Math.max(1, this.total), this.width, this.height)
    },
    /** Each run of cells of one kind and color as one path: a rounded square per cell. */
    paths() {
      const { columns, size } = this.layout
      const gap = Math.max(size * 0.18, Math.min(0.6, size * 0.4))
      const cell = Math.max(0.3, size - gap)
      const r = Math.min(cell * 0.2, 2)
      const line = Math.max(0.25, Math.min(1, cell * 0.12))
      // the grid centered in its box
      const usedRows = Math.ceil(Math.max(1, this.total) / columns)
      const offsetX = (this.width - columns * size + gap) / 2
      const offsetY = (this.height - usedRows * size + gap) / 2
      const square = (x, y) => {
        // inset by half a line, so outlines stay inside the cell
        const i = line / 2
        const s = cell - line
        if (r <= 0.3) return `M${x + i} ${y + i}h${s}v${s}h${-s}z`
        const rr = Math.min(r, s / 2)
        return `M${x + i + rr} ${y + i}h${s - 2 * rr}a${rr} ${rr} 0 0 1 ${rr} ${rr}v${s - 2 * rr}a${rr} ${rr} 0 0 1 ${-rr} ${rr}h${-(s - 2 * rr)}a${rr} ${rr} 0 0 1 ${-rr} ${-rr}v${-(s - 2 * rr)}a${rr} ${rr} 0 0 1 ${rr} ${-rr}z`
      }
      const filled = this.segments.reduce((sum, part) => sum + Math.max(0, part.count), 0)
      const runs = [...this.segments, { count: Math.max(0, this.total - filled), kind: 'empty' }]
      const out = []
      let n = 0
      for (const [index, part] of runs.entries()) {
        let d = ''
        for (let k = 0; k < part.count && n < this.total; k++, n++) {
          d += square(offsetX + (n % columns) * size, offsetY + Math.floor(n / columns) * size)
        }
        if (!d) continue
        const style = STYLES[part.kind ?? 'full'](part.color)
        out.push({
          key: index,
          d,
          style: Object.fromEntries(
            Object.entries(style).map(([name, value]) => [
              name,
              value === 'var(--hold-line)' ? line : value === 'var(--hold-dash)' ? `${cell * 0.25} ${cell * 0.15}` : value
            ])
          )
        })
      }
      return out
    }
  }
}
</script>
