// Summarize main-thread and raster time by category from a Chrome trace: node trace-summary.mjs <trace.json>
import fs from 'node:fs'

const { traceEvents } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const groups = {
  script: ['FunctionCall', 'EvaluateScript', 'TimerFire', 'FireAnimationFrame', 'EventDispatch', 'v8.callFunction'],
  styleLayout: ['UpdateLayoutTree', 'Layout', 'RecalculateStyles', 'PrePaint'],
  paint: ['Paint', 'PaintImage'],
  layerize: ['UpdateLayer', 'UpdateLayerTree', 'Layerize', 'CompositeLayers', 'Commit'],
  raster: ['RasterTask', 'GPUTask', 'ImageDecodeTask']
}
const totals = Object.fromEntries(Object.keys(groups).map((k) => [k, 0]))
const counts = Object.fromEntries(Object.keys(groups).map((k) => [k, 0]))
let start = Infinity
let end = 0
for (const e of traceEvents) {
  if (e.ph !== 'X' || !e.dur) continue
  start = Math.min(start, e.ts)
  end = Math.max(end, e.ts + e.dur)
  for (const [group, names] of Object.entries(groups)) {
    if (names.includes(e.name)) {
      totals[group] += e.dur / 1000
      counts[group]++
    }
  }
}
const seconds = (end - start) / 1e6
const out = { traceSeconds: +seconds.toFixed(2) }
for (const k of Object.keys(totals)) out[k] = { ms: Math.round(totals[k]), events: counts[k] }
console.log(JSON.stringify(out, null, 2))
