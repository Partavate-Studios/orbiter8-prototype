// A fully built system on the local chain, for measuring the heaviest reads (read-costs.mjs) and
// playing with one: a pilot claims every planet and asteroid at a star next to Sol and builds each
// to the top of its line, with people landed and mining drones on every asteroid, then lets them
// produce for two hours. The admin makes buildings free and instant first, and pays the pilot: this
// is a test chain's shortcut, never a real deployment's (it changes the tuning).
//
// usage (from orbiter-client/, `npm run local` running): node dev/harness/build-out.mjs [cell] [account]
//   cell: a charted star next to Sol (default 1, with 5 planets and a full belt on the local seed)
//   LOCAL_FILE=-8547 picks dev/local-deployment-8547.json.
import { readFileSync } from 'node:fs'
import { JsonRpcProvider, Contract } from 'ethers'

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
const deployment = read(`../local-deployment${process.env.LOCAL_FILE ?? ''}.json`)
const provider = new JsonRpcProvider(deployment.rpc, undefined, { pollingInterval: 100 })
const [cellArg = '1', account = '4'] = process.argv.slice(2)
const cell = Number(cellArg)
const admin = await provider.getSigner(0)
const pilot = await provider.getSigner(Number(account))
const me = await pilot.getAddress()
const abi = (n) => read(`../../../sdk/src/abi/${n}.json`)
const at = (name, signer) => new Contract(deployment.contracts[name], abi(name[0].toUpperCase() + name.slice(1)), signer)
const send = async (p) => (await (await p).wait()).status
const skip = async (s) => (await provider.send('evm_increaseTime', [s]), await provider.send('evm_mine', []))

const [credits, planets] = [at('credits', admin), at('planets', admin)]
await send(credits.grantRole(await credits.GAME_MODULE(), await admin.getAddress()))
await send(credits.mint(me, 1_000_000_000))
// Free and instant buildings, both lines (planets 1–7, asteroids at the step + 8).
for (const b of [1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 14]) await send(planets.setCost(b, [0, 1, 0, [0, 0, 0], [0, 0, 0]]))

const P = (n) => at(n, pilot)
const [pilots, market, armory, drones] = [P('pilots'), P('market'), P('armory'), P('drones')]
const mine = { planets: P('planets'), claims: P('claims') }
if (!(await pilots.pilotOf(me)).registered) await send(pilots.register(`Builder${account}`, 'Hammer'))
// The belt's asteroids: the sections whose id has a view (an empty section's doesn't).
const rocks = []
for (let i = 0; i < 8; i++) {
  const id = cell * 65536 + 256 + i
  if (await planets.planetView(id, 0).then(() => true, () => false)) rocks.push(id)
}
const views = async () => ({ planets: await planets.system(cell, 0), belt: rocks.length ? await planets.views(rocks, 0) : [] })
const { planets: ps, belt } = await views()
// Mining drones for every asteroid (4 each), colonists for every planet (100 each), at Sol.
const dronesNeeded = belt.length * 4
await send(market.buyDroneBays(2, dronesNeeded, 10n ** 12n))
await send(market.buyBays(2, ps.length + 2, 10n ** 12n))
await send(armory.buy(2, 9, dronesNeeded, 10n ** 12n))
await send(mine.planets.recruit(ps.length * 100))
await send(pilots.jump(cell, []))
for (const p of ps) {
  const id = p.id
  await send(mine.claims.claim(id))
  await send(mine.planets.land(id, 100))
  for (const b of [1, 2, 3, 4, 5, 6, 7]) (await skip(2), await send(mine.planets.build(id, b)))
}
for (const a of belt) {
  const id = a.id
  await send(mine.claims.claim(id))
  for (const b of [1, 2, 4, 6]) (await skip(2), await send(mine.planets.build(id, b)))
  await send(drones.land(id, 4))
  await send(drones.setDefense(id, 1))
}
await skip(2 * 3600)
const after = await views()
console.log(JSON.stringify({
  cell,
  pilot: me,
  planets: after.planets.map((p) => ({ id: Number(p.id), level: Number(p.level), autofactory: p.autofactory, population: Number(p.population) })),
  asteroids: after.belt.map((a) => ({ id: Number(a.id), level: Number(a.level) })),
  ports: (await market.portIds(cell)).length
}))
