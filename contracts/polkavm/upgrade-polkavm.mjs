// Upgrades the Credits proxy of a PolkaVM deployment to a freshly deployed implementation, and checks
// the ERC-1967 slot moved and the state stayed (milestone 7: UUPS on PolkaVM).
//   node --max-old-space-size=8192 upgrade-polkavm.mjs <deployment.json> <key file>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { JsonRpcProvider, Wallet, ContractFactory, Contract } from 'ethers'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { resolc } = require(path.join(here, 'node_modules/@parity/resolc/dist/resolc.js'))
const [deploymentFile, keyFile] = process.argv.slice(2)
const addresses = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))
let key = JSON.parse(fs.readFileSync(keyFile, 'utf8')).data
key = (Array.isArray(key) ? key[0] : key).private_key
const provider = new JsonRpcProvider('https://eth-rpc-testnet.polkadot.io/')
const wallet = new Wallet(key, provider)
const SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

const dir = path.join(here, 'out/build-info')
const input = JSON.parse(fs.readFileSync(path.join(dir, fs.readdirSync(dir)[0]), 'utf8')).input
for (const [k, v] of Object.entries(input.sources)) if (!v.content) v.content = fs.readFileSync(path.join(here, '..', k), 'utf8')
input.settings = { remappings: input.settings.remappings, optimizer: { enabled: true, mode: 'z', runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
const raw = resolc(JSON.stringify(input))
const out = typeof raw === 'string' ? JSON.parse(raw) : raw
const c = out.contracts['src/tokens/Credits.sol'].Credits

const credits = new Contract(addresses.credits, c.abi, wallet)
const before = await provider.getStorage(addresses.credits, SLOT)
const supply = await credits.totalSupply()
const impl = await new ContractFactory(c.abi, '0x' + c.evm.bytecode.object, wallet).deploy()
await impl.waitForDeployment()
const receipt = await (await credits.upgradeToAndCall(await impl.getAddress(), '0x')).wait()
const after = await provider.getStorage(addresses.credits, SLOT)
console.log('implementation', before, '->', after)
console.log('upgrade', receipt.status === 1 ? 'ok' : 'FAILED', '; total supply', supply.toString(), '->', (await credits.totalSupply()).toString())
