// Deploys the game compiled for PolkaVM (resolc) to Polkadot Hub TestNet (milestone 7, step 2):
//   1. compile everything (the four external libraries first), 2. deploy the libraries,
//   3. compile again with their addresses (PolkaVM links libraries at compile time, not at deploy),
//   4. deploy each module's implementation and its ERC1967 proxy, 5. wire them as Deploy.s.sol does.
// Writes ../deployments/polkavm-<chainId>.json (gitignored) and prints what each step cost.
//
//   node --max-old-space-size=8192 deploy-polkavm.mjs <key file>
// Needs forge's compiler input first: (cd .. && forge build --build-info --out polkavm/out --skip test)
// The key file is a `cast wallet new --json` file kept outside the repo. Never commit keys.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { JsonRpcProvider, Wallet, ContractFactory, Contract, Interface, formatEther, id } from 'ethers'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { resolc } = require(path.join(here, 'node_modules/@parity/resolc/dist/resolc.js'))
const RPC = 'https://eth-rpc-testnet.polkadot.io/'
const SEED = id('orbiter8 demo 4')
const SCAN_DELAY = 30

let key = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).data
key = (Array.isArray(key) ? key[0] : key).private_key
const provider = new JsonRpcProvider(RPC)
const wallet = new Wallet(key, provider)

// forge's standard-JSON input (every source, with OpenZeppelin's proxy among them)
const dir = path.join(here, 'out/build-info')
const info = JSON.parse(fs.readFileSync(path.join(dir, fs.readdirSync(dir)[0]), 'utf8'))
const base = info.input
for (const [k, v] of Object.entries(base.sources)) if (!v.content) v.content = fs.readFileSync(path.join(here, '..', k), 'utf8')

function compile(libraries = {}) {
  const input = structuredClone(base)
  input.settings = {
    remappings: base.settings.remappings,
    optimizer: { enabled: true, mode: 'z', runs: 200 },
    libraries,
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } }
  }
  const raw = resolc(JSON.stringify(input))
  const out = typeof raw === 'string' ? JSON.parse(raw) : raw
  const errors = (out.errors || []).filter((e) => e.severity === 'error')
  if (errors.length) throw new Error(errors.map((e) => e.formattedMessage || e.message).join('\n'))
  const find = (name) => {
    for (const [file, contracts] of Object.entries(out.contracts)) if (contracts[name]) return { file, ...contracts[name] }
    throw new Error('not compiled: ' + name)
  }
  return find
}

let spent = 0n
async function send(label, txPromise) {
  const before = await provider.getBalance(wallet.address)
  const tx = await txPromise
  const receipt = await (tx.wait ? tx.wait() : tx.deploymentTransaction().wait())
  const cost = before - (await provider.getBalance(wallet.address))
  spent += cost
  console.log(`${label.padEnd(34)} ${receipt.status === 1 ? 'ok' : 'FAILED'}  ${formatEther(cost)} PAS`)
  return receipt
}
async function deploy(find, name, args = []) {
  const c = find(name)
  const factory = new ContractFactory(c.abi, '0x' + c.evm.bytecode.object, wallet)
  const contract = await factory.deploy(...args)
  await send(`deploy ${name}`, contract)
  return { address: await contract.getAddress(), abi: c.abi }
}

console.log('deployer', wallet.address, formatEther(await provider.getBalance(wallet.address)), 'PAS')
let t = Date.now()
const first = compile()
console.log(`compiled (no libraries) in ${((Date.now() - t) / 1000).toFixed(0)} s`)

const libs = {}
for (const [file, name] of [
  ['src/randomness/Drand.sol', 'Drand'],
  ['src/galaxy/Spiral.sol', 'Spiral'],
  ['src/galaxy/ScanRules.sol', 'ScanRules'],
  ['src/battle/Combat.sol', 'Combat']
]) {
  libs[file] = { [name]: (await deploy(first, name)).address }
}

t = Date.now()
const linked = compile(libs)
console.log(`compiled (libraries linked) in ${((Date.now() - t) / 1000).toFixed(0)} s`)

const admin = wallet.address
const game = {}
const proxyOf = async (name, initArgs) => {
  const impl = await deploy(linked, name)
  const init = new Interface(impl.abi).encodeFunctionData('initialize', initArgs)
  const proxy = await deploy(linked, 'ERC1967Proxy', [impl.address, init])
  game[name.toLowerCase()] = new Contract(proxy.address, impl.abi, wallet)
  return proxy.address
}
await proxyOf('Credits', [admin])
await proxyOf('Ships', [admin])
await proxyOf('Galaxy', [admin, SEED, SCAN_DELAY])
await proxyOf('Pilots', [admin, game.galaxy.target, game.credits.target, game.ships.target])
await proxyOf('Market', [admin, game.pilots.target, game.credits.target])
await proxyOf('Deeds', [admin])
await proxyOf('Planets', [admin, game.galaxy.target, game.pilots.target, game.market.target, game.credits.target, game.deeds.target])
await proxyOf('Factory', [admin, game.pilots.target, game.planets.target, game.credits.target])
await proxyOf('Battle', [admin, game.pilots.target, game.planets.target])
await proxyOf('Armory', [admin, game.pilots.target, game.planets.target, game.factory.target, game.market.target, game.credits.target, game.battle.target])

// Deploy.s.sol's wire()
const role = await game.galaxy.GAME_MODULE()
const grants = [
  ['galaxy', 'pilots'], ['galaxy', 'planets'], ['ships', 'pilots'], ['credits', 'pilots'], ['credits', 'market'],
  ['pilots', 'market'], ['credits', 'planets'], ['credits', 'factory'], ['pilots', 'planets'], ['market', 'planets'],
  ['deeds', 'planets'], ['planets', 'factory'], ['battle', 'pilots'], ['battle', 'armory'], ['pilots', 'battle'],
  ['pilots', 'armory'], ['planets', 'battle'], ['factory', 'armory'], ['credits', 'armory']
]
for (const [on, to] of grants) await send(`grant ${on} -> ${to}`, game[on].grantRole(role, game[to].target))
await send('pilots.setBattle', game.pilots.setBattle(game.battle.target))
await send('ships.setPilots', game.ships.setPilots(game.pilots.target))

const chainId = Number((await provider.getNetwork()).chainId)
const addresses = Object.fromEntries(Object.entries(game).map(([k, c]) => [k, c.target]))
fs.writeFileSync(path.join(here, `../deployments/polkavm-${chainId}.json`), JSON.stringify(addresses, null, 2) + '\n')
console.log('total', formatEther(spent), 'PAS; addresses in deployments/polkavm-' + chainId + '.json')
