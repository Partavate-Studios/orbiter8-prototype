// Probes a pending scan on a deployment: dry-runs recording it with growing gas limits, to tell an
// estimate that's too low from a check that can't fit in a block. (Milestone 7, the PolkaVM drand check.)
//   node probe-scan.mjs <deployment.json> <key file>
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JsonRpcProvider, Wallet, Contract } from 'ethers'

const here = path.dirname(fileURLToPath(import.meta.url))
const abi = (name) => JSON.parse(fs.readFileSync(path.join(here, '../../orbiter-client/src/sdk/abi', name + '.json'), 'utf8'))
const [deploymentFile, keyFile] = process.argv.slice(2)
const addresses = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))
let key = JSON.parse(fs.readFileSync(keyFile, 'utf8')).data
key = (Array.isArray(key) ? key[0] : key).private_key
const provider = new JsonRpcProvider('https://eth-rpc-testnet.polkadot.io/')
const wallet = new Wallet(key, provider)
const pilots = new Contract(addresses.pilots, abi('Pilots'), wallet)
const galaxy = new Contract(addresses.galaxy, abi('Galaxy'), wallet)

const ship = await pilots.shipOf(wallet.address)
const [cell] = await galaxy.region(ship.cell, 0)
console.log('cell', Number(cell.cell), 'visited', cell.visited, 'scanned', cell.scanned, 'round', Number(cell.scanRound))
const res = await fetch(`https://api.drand.sh/v2/beacons/evmnet/rounds/${Number(cell.scanRound)}`)
const signature = '0x' + (await res.json()).signature
const block = await provider.send('eth_getBlockByNumber', ['latest', false])
console.log('block gas limit', block.gasLimit ? BigInt(block.gasLimit).toString() : '(not given)')
for (const gas of [10n ** 7n, 10n ** 8n, 10n ** 9n, 10n ** 10n, 10n ** 11n, 10n ** 12n]) {
  try {
    await pilots.resolveScans.staticCall([{ cell: cell.cell, signature }], { gasLimit: gas })
    console.log('gas limit', gas.toString(), 'PASSES')
    break
  } catch (e) {
    console.log('gas limit', gas.toString(), 'fails:', (e.info?.error?.message || e.shortMessage || e.message).slice(0, 140))
  }
}
