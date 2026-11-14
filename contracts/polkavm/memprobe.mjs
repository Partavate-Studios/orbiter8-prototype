// Deploys Market compiled with different PolkaVM memory settings, alone, and checks it runs (its
// proxiableUUID answers): which heap and stack sizes work on Polkadot Hub TestNet. (Spike, step 3.)
//   node --max-old-space-size=8192 memprobe.mjs <key file> <heap>:<stack> [<heap>:<stack>…]   ("default" for none)
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { JsonRpcProvider, Wallet, ContractFactory } from 'ethers'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { resolc } = require(path.join(here, 'node_modules/@parity/resolc/dist/resolc.js'))
const [keyFile, ...configs] = process.argv.slice(2)
let key = JSON.parse(fs.readFileSync(keyFile, 'utf8')).data
key = (Array.isArray(key) ? key[0] : key).private_key
const wallet = new Wallet(key, new JsonRpcProvider('https://eth-rpc-testnet.polkadot.io/'))
const dir = path.join(here, 'out/build-info')
const base = JSON.parse(fs.readFileSync(path.join(dir, fs.readdirSync(dir)[0]), 'utf8')).input
for (const [k, v] of Object.entries(base.sources)) if (!v.content) v.content = fs.readFileSync(path.join(here, '..', k), 'utf8')
// Market and what it imports only, to compile faster
const input = structuredClone(base)
for (const config of configs) {
  const [heap, stack] = config.split(':').map(Number)
  input.settings = {
    remappings: base.settings.remappings,
    optimizer: { enabled: true, mode: 'z', runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } },
    ...(config === 'default' ? {} : { polkavm: { memoryConfig: { heapSize: heap, stackSize: stack } } })
  }
  const raw = resolc(JSON.stringify(input))
  const out = typeof raw === 'string' ? JSON.parse(raw) : raw
  const errors = (out.errors || []).filter((e) => e.severity === 'error')
  if (errors.length) { console.log(config, 'compile error:', errors[0].formattedMessage || errors[0].message); continue }
  const c = out.contracts['src/market/Market.sol'].Market
  try {
    const impl = await new ContractFactory(c.abi, '0x' + c.evm.bytecode.object, wallet).deploy()
    await impl.waitForDeployment()
    const uuid = await impl.proxiableUUID()
    console.log(config, 'runs; proxiableUUID', uuid.slice(0, 10), 'at', await impl.getAddress())
  } catch (e) {
    console.log(config, 'FAILS:', (e.info?.error?.message || e.shortMessage || e.message).slice(0, 160))
  }
}
