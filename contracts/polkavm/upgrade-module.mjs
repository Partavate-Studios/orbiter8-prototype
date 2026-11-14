// Upgrades one module of a PolkaVM deployment to a fresh build of its implementation, compiled with a
// given heap size, keeping the proxy and its state. For modules that call no external library (Market,
// Planets, Credits…). Found with: big list reads (Sol's ports and planets) fail on PolkaVM with
// resolc's default memory (docs/polkadot-direction.md).
//   node --max-old-space-size=8192 upgrade-module.mjs <deployment.json> <key file> <Module> [heap:stack bytes]
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { JsonRpcProvider, Wallet, ContractFactory, Contract } from 'ethers'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { resolc } = require(path.join(here, 'node_modules/@parity/resolc/dist/resolc.js'))
const [deploymentFile, keyFile, name, heap] = process.argv.slice(2)
const addresses = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))
let key = JSON.parse(fs.readFileSync(keyFile, 'utf8')).data
key = (Array.isArray(key) ? key[0] : key).private_key
const provider = new JsonRpcProvider('https://eth-rpc-testnet.polkadot.io/')
const wallet = new Wallet(key, provider)

const dir = path.join(here, 'out/build-info')
const input = JSON.parse(fs.readFileSync(path.join(dir, fs.readdirSync(dir)[0]), 'utf8')).input
for (const [k, v] of Object.entries(input.sources)) if (!v.content) v.content = fs.readFileSync(path.join(here, '..', k), 'utf8')
const file = Object.keys(input.sources).find((f) => new RegExp(`(^|\\s)contract ${name}\\b`).test(input.sources[f].content))
input.settings = {
  remappings: input.settings.remappings,
  optimizer: { enabled: true, mode: 'z', runs: 200 },
  outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } },
  ...(heap ? { polkavm: { memoryConfig: { heapSize: Number(heap.split(':')[0]), stackSize: Number(heap.split(':')[1] ?? 65536) } } } : {})
}
const raw = resolc(JSON.stringify(input))
const out = typeof raw === 'string' ? JSON.parse(raw) : raw
const errors = (out.errors || []).filter((e) => e.severity === 'error')
if (errors.length) throw new Error(errors.map((e) => e.formattedMessage || e.message).join('\n'))
const c = out.contracts[file][name]
console.log(`${name}: ${c.evm.bytecode.object.length / 2} bytes, heap ${heap ?? 'default'}`)

const proxy = new Contract(addresses[name.toLowerCase()], c.abi, wallet)
const impl = await new ContractFactory(c.abi, '0x' + c.evm.bytecode.object, wallet).deploy()
await impl.waitForDeployment()
const receipt = await (await proxy.upgradeToAndCall(await impl.getAddress(), '0x')).wait()
console.log('upgrade', receipt.status === 1 ? 'ok' : 'FAILED', '→', await impl.getAddress())
