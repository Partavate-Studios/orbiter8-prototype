// Compiles the game's contracts for PolkaVM with Parity's resolc, from forge's standard-JSON input, and
// reports errors, warnings and sizes (milestone 7, docs/polkadot-direction.md). From contracts/polkavm/:
//   npm install
//   (cd .. && forge build --build-info --out polkavm/out --skip test --skip script)
//   node --max-old-space-size=8192 compile.cjs
const fs = require('fs')
const path = require('path')
const { resolc, version } = require(path.join(__dirname, 'node_modules/@parity/resolc/dist/resolc.js'))
const dir = path.join(__dirname, 'out/build-info')
const info = JSON.parse(fs.readFileSync(path.join(dir, fs.readdirSync(dir)[0]), 'utf8'))
const input = info.input
for (const [k, v] of Object.entries(input.sources)) {
  if (!v.content) v.content = fs.readFileSync(path.join(path.join(__dirname, '..'), k), 'utf8')
}
input.settings.optimizer = { enabled: true, mode: 'z', runs: 200 }
input.settings.outputSelection = { '*': { '*': ['evm.bytecode'] } }
delete input.settings.viaIR
delete input.settings.evmVersion
delete input.settings.metadata
console.log('resolc', version())
const t = Date.now()
const raw = resolc(JSON.stringify(input)); const out = typeof raw === 'string' ? JSON.parse(raw) : raw
console.log('took', ((Date.now() - t) / 1000).toFixed(0), 's')
const errors = (out.errors || []).filter((e) => e.severity === 'error')
for (const e of errors.slice(0, 15)) console.log('ERROR', (e.formattedMessage || e.message).split('\n').slice(0, 4).join(' | '))
for (const e of (out.errors || []).filter((e) => e.severity === 'warning')) console.log('WARNING', (e.formattedMessage || e.message).split('\n').slice(0, 6).join(' | '))
console.log('errors', errors.length, 'warnings', (out.errors || []).filter((e) => e.severity === 'warning').length)
const rows = []
for (const [file, contracts] of Object.entries(out.contracts || {})) {
  if (!file.startsWith('src/')) continue
  for (const [name, c] of Object.entries(contracts)) {
    const hex = c.evm?.bytecode?.object || ''
    if (hex.length) rows.push([name, hex.length / 2])
  }
}
rows.sort((a, b) => b[1] - a[1])
for (const [n, b] of rows) console.log(n.padEnd(24), String(b).padStart(9), 'bytes')
