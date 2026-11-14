// Deploys the Drand library compiled for PolkaVM and dry-runs Drand.verify on a published round, with
// growing gas limits: is the drand check alone what runs out of gas on PolkaVM? (Milestone 7.)
//   node --max-old-space-size=8192 probe-drand.mjs <key file> [variant source file]
// With a variant folder, its .sol files replace or join src/randomness/ (Drand.sol and what it imports).
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { JsonRpcProvider, Wallet, ContractFactory } from 'ethers'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { resolc } = require(path.join(here, 'node_modules/@parity/resolc/dist/resolc.js'))
let key = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).data
key = (Array.isArray(key) ? key[0] : key).private_key
const provider = new JsonRpcProvider('https://eth-rpc-testnet.polkadot.io/')
const wallet = new Wallet(key, provider)

const dir = path.join(here, 'out/build-info')
const info = JSON.parse(fs.readFileSync(path.join(dir, fs.readdirSync(dir)[0]), 'utf8'))
const input = info.input
for (const [k, v] of Object.entries(input.sources)) if (!v.content) v.content = fs.readFileSync(path.join(here, '..', k), 'utf8')
// A variant: a folder whose .sol files replace or join src/randomness/ (e.g. Drand.sol and a library it imports)
if (process.argv[3]) {
  for (const f of fs.readdirSync(process.argv[3]).filter((f) => f.endsWith('.sol'))) {
    input.sources['src/randomness/' + f] = { content: fs.readFileSync(path.join(process.argv[3], f), 'utf8') }
  }
}
input.settings = {
  remappings: input.settings.remappings,
  optimizer: { enabled: true, mode: 'z', runs: 200 },
  outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } }
}
const raw = resolc(JSON.stringify(input))
const out = typeof raw === 'string' ? JSON.parse(raw) : raw
const errors = (out.errors || []).filter((e) => e.severity === 'error')
if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join('\n'))
const c = out.contracts['src/randomness/Drand.sol'].Drand
console.log('Drand on PolkaVM:', c.evm.bytecode.object.length / 2, 'bytes')
const lib = await new ContractFactory(c.abi, '0x' + c.evm.bytecode.object, wallet).deploy()
await lib.waitForDeployment()
console.log('deployed at', await lib.getAddress())

const round = Math.floor((Date.now() / 1000 - 1727521075) / 3) - 20
const sig = '0x' + (await (await fetch(`https://api.drand.sh/v2/beacons/evmnet/rounds/${round}`)).json()).signature
for (const gas of [10n ** 6n, 10n ** 7n, 10n ** 8n, 10n ** 9n]) {
  try {
    await lib.verify.staticCall(round, sig, { gasLimit: gas })
    console.log('verify with gas limit', gas.toString(), 'PASSES')
    console.log('estimated gas', (await lib.verify.estimateGas(round, sig)).toString())
    break
  } catch (e) {
    console.log('verify with gas limit', gas.toString(), 'fails:', (e.info?.error?.message || e.shortMessage || e.message).slice(0, 120))
  }
}
