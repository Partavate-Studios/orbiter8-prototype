// Test helpers for the local chain only (anvil's unlocked accounts; the first is the game's admin):
//   node dev/cheat.js mint <account N> <credits>   credits for a pilot, to reach late-game screens
//   node dev/cheat.js warp <seconds>               moves the chain's clock on (buildings, siege rounds)
//   node dev/cheat.js quick                        makes every building take 20 s
// Warping puts the chain ahead of real time, so scans (which wait on real drand rounds) stall after it.
import { readFileSync } from 'node:fs'
import { JsonRpcProvider, Contract, id } from 'ethers'

const deployment = JSON.parse(readFileSync(new URL('./local-deployment.json', import.meta.url), 'utf8'))
const provider = new JsonRpcProvider(deployment.rpc)
const accounts = await provider.send('eth_accounts', [])
const admin = await provider.getSigner(accounts[0])
const [command, a, b] = process.argv.slice(2)

if (command === 'mint') {
  const credits = new Contract(deployment.contracts.credits, ['function grantRole(bytes32,address)', 'function mint(address,uint256)'], admin)
  await (await credits.grantRole(id('GAME_MODULE'), accounts[0])).wait()
  await (await credits.mint(accounts[Number(a) - 1], BigInt(b))).wait()
  console.log(`Minted ${b} credits to account ${a} (${accounts[Number(a) - 1]})`)
} else if (command === 'warp') {
  await provider.send('evm_increaseTime', [Number(a)])
  await provider.send('evm_mine', [])
  console.log(`The chain's clock moved on ${a} s`)
} else if (command === 'quick') {
  const abi = ['function costOf(uint8) view returns (tuple(uint64 credits,uint32 time,uint32 people,uint8[3] goods,uint32[3] amounts))', 'function setCost(uint8,tuple(uint64 credits,uint32 time,uint32 people,uint8[3] goods,uint32[3] amounts))']
  const planets = new Contract(deployment.contracts.planets, abi, admin)
  for (let building = 1; building <= 7; building++) {
    const c = await planets.costOf(building)
    await (await planets.setCost(building, [c.credits, 20, c.people, [...c.goods], [...c.amounts]])).wait()
  }
  console.log('Every building now takes 20 s')
} else {
  console.log('Usage: node dev/cheat.js mint <account N> <credits> | warp <seconds> | quick')
}
