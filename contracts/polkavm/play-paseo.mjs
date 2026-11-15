// Plays a few real moves against a deployment on Polkadot Hub TestNet (milestone 7, step 2): register,
// jump to a star nobody has visited, wait for its drand round, then record the scan with the round's
// signature (the BN254 pairing check on chain). Prints each move's gas and the PAS it cost.
//
//   node play-paseo.mjs <deployment.json> <key file>     (from contracts/polkavm, after npm install ethers)
// The key file is a `cast wallet new --json` file kept outside the repo. Never commit keys.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JsonRpcProvider, Wallet, Contract, formatEther } from 'ethers'

const here = path.dirname(fileURLToPath(import.meta.url))
const abi = (name) => JSON.parse(fs.readFileSync(path.join(here, '../../sdk/src/abi', name + '.json'), 'utf8'))
const [deploymentFile, keyFile] = process.argv.slice(2)
const addresses = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))
let key = JSON.parse(fs.readFileSync(keyFile, 'utf8')).data
key = (Array.isArray(key) ? key[0] : key).private_key

const RPC = 'https://eth-rpc-testnet.polkadot.io/'
const BEACON = 'evmnet' // drand's BN254 beacon (sdk/drand.js)
const GENESIS = 1727521075
const PERIOD = 3
const provider = new JsonRpcProvider(RPC)
const wallet = new Wallet(key, provider)
const pilots = new Contract(addresses.pilots, abi('Pilots'), wallet)
const galaxy = new Contract(addresses.galaxy, abi('Galaxy'), wallet)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function move(label, send) {
  const before = await provider.getBalance(wallet.address)
  const t = Date.now()
  const tx = await send()
  const receipt = await tx.wait()
  const after = await provider.getBalance(wallet.address)
  console.log(`${label}: ${receipt.status === 1 ? 'ok' : 'FAILED'}, gas ${receipt.gasUsed}, ${formatEther(before - after)} PAS, ${((Date.now() - t) / 1000).toFixed(1)} s`)
  return receipt
}
async function drand(round) {
  for (;;) {
    const res = await fetch(`https://api.drand.sh/v2/beacons/${BEACON}/rounds/${round}`)
    if (res.ok) return '0x' + (await res.json()).signature
    await sleep(2000)
  }
}

console.log('pilot', wallet.address, formatEther(await provider.getBalance(wallet.address)), 'PAS')
const me = await pilots.pilotOf?.(wallet.address).catch(() => null)
if (!me || !me.callsign) await move('register', () => pilots.register('Spike', 'Probe One'))

// A star next to the ship's that nobody has visited yet.
const ship = await pilots.shipOf(wallet.address)
const cells = await galaxy.region(ship.cell, 2)
const target = cells.find((c) => Number(c.state) === 2 && !c.visited && Number(c.cell) !== Number(ship.cell))
if (!target) throw new Error('no unvisited star nearby: jump somewhere new first')
console.log('jumping from', Number(ship.cell), 'to', Number(target.cell))
await move('jump (first arrival, scan scheduled)', () => pilots.jump(target.cell, []))

const after = (await galaxy.region(target.cell, 0))[0]
const round = Number(after.scanRound)
const wait = GENESIS + round * PERIOD - Date.now() / 1000
console.log(`scan round ${round}, published in ${Math.max(0, wait).toFixed(0)} s`)
if (wait > 0) await sleep(wait * 1000 + 2000)
const signature = await drand(round)
const before = (await galaxy.region(target.cell, 1)).filter((c) => Number(c.state) !== 0).length
await move('record the scan (drand pairing check)', () => pilots.resolveScans([{ cell: target.cell, signature }]))
const charted = (await galaxy.region(target.cell, 1)).filter((c) => Number(c.state) !== 0).length
console.log(`cells decided around it: ${before} before, ${charted} after`)
