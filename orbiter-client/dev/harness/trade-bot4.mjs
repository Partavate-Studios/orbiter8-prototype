// Demo 4's trading bot (docs/demo4-plan.md, milestone 2): a pilot on the local chain that starts a
// session key, then trades at Sol's ports and fits bays with it, logging each action's gas. Needs
// `npm run local4` running.
//
//   node dev/harness/trade-bot4.mjs [moves=40] [account=6] [out.json]
//
// Each move is one trade at the port that pays best right now (selling what it buys from the hold,
// then buying the good with the best margin elsewhere), or a bay purchase at the I.S.S. when the bot
// has spare credits: the simulator's strategy (dev/sim4/economy.mjs), against the real contracts.
import { JsonRpcProvider, Contract, Wallet, parseEther } from 'ethers'
import { readFileSync, writeFileSync } from 'node:fs'
import { buyCost, sellProceeds, fee, baysCost, MODE } from '../../src/sdk/v4/market.js'

const [moves = 40, account = 6, out] = process.argv.slice(2)
const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
const deployment = read('../local-deployment-v4.json')
const provider = new JsonRpcProvider(deployment.rpc, undefined, { pollingInterval: 250 })
const wallet = await provider.getSigner(Number(account))
const me = (await wallet.getAddress()).toLowerCase()
const abi = (name) => read(`../../src/sdk/v4/abi/${name}.json`)
const { pilots: P, market: M, credits: C } = deployment.contracts

const log = []
async function record(action, send, extra = {}) {
  const receipt = await (await send()).wait()
  const entry = { action, gas: Number(receipt.gasUsed), ...extra }
  log.push(entry)
  console.log(JSON.stringify(entry))
}

// Register and start a session from the wallet; everything after goes through the key.
const pilotsByWallet = new Contract(P, abi('Pilots'), wallet)
if (!(await pilotsByWallet.pilotOf(me)).registered) {
  await record('register', () => pilotsByWallet.register(`Trader${account}`, 'Hauler'))
}
const key = Wallet.createRandom().connect(provider)
const expiry = Math.floor(Date.now() / 1000) + 3600
await record('startSession', () => pilotsByWallet.startSession(key.address, expiry, { value: parseEther('0.5') }))
const pilots = new Contract(P, abi('Pilots'), key)
const market = new Contract(M, abi('Market'), key)
const credits = new Contract(C, abi('Credits'), provider)

const goods = (await market.goods()).map((g) => ({ base: Number(g.base), spread: Number(g.spread) }))
const t = await market.tuning()
const feeBps = Number(t.feeBps)
const YARD = 2

async function state() {
  const [ship, cargo, balance, capacity, ports] = await Promise.all([
    pilots.shipOf(me),
    pilots.cargoOf(me, goods.length),
    credits.balanceOf(me),
    market.capacity(),
    market.portsAt(0)
  ])
  return {
    bays: Number(ship.bays),
    cargo: cargo.map(Number),
    credits: Number(balance),
    capacity: Number(capacity),
    ports: ports.map((p) => ({
      port: Number(p.port),
      quotes: p.quotes.map((q) => ({ mode: Number(q.mode), shortfall: Number(q.shortfall) }))
    }))
  }
}

const buyTotal = (s, port, g, n) => {
  const c = buyCost(goods[g].base, goods[g].spread, s.capacity, port.quotes[g].shortfall, n)
  return c + fee(c, feeBps)
}
const sellTotal = (s, port, g, n) => {
  const c = sellProceeds(goods[g].base, goods[g].spread, s.capacity, port.quotes[g].shortfall, n)
  return c - fee(c, feeBps)
}

/** The trade at `port` worth most now: [lines, value]. */
function plan(s, port) {
  const lines = []
  let credits = s.credits
  let value = 0
  let free = s.bays - s.cargo.reduce((a, b) => a + b, 0)
  port.quotes.forEach((q, g) => {
    const n = Math.min(s.cargo[g], s.capacity - q.shortfall)
    if (q.mode !== MODE.BUYS || n <= 0) return
    const v = sellTotal(s, port, g, n)
    lines.push({ good: g, units: -n, limit: Math.floor(v * 0.98) })
    value += v
    credits += v
    free += n
  })
  let best = null
  port.quotes.forEach((q, g) => {
    if (q.mode !== MODE.SELLS) return
    for (const other of s.ports) {
      if (other.quotes[g].mode !== MODE.BUYS) continue
      let n = Math.min(free, s.capacity - q.shortfall, s.capacity - other.quotes[g].shortfall)
      while (n > 0 && (buyTotal(s, port, g, n) > credits || sellTotal(s, other, g, n) <= buyTotal(s, port, g, n))) n--
      const profit = n ? sellTotal(s, other, g, n) - buyTotal(s, port, g, n) : 0
      if (profit > (best?.profit ?? 0)) best = { g, n, profit, cost: buyTotal(s, port, g, n) }
    }
  })
  if (best) {
    lines.push({ good: best.g, units: best.n, limit: Math.ceil(best.cost * 1.02) })
    value += best.profit
  }
  return [lines, value]
}

for (let i = 0; i < Number(moves); i++) {
  const s = await state()
  const spare = s.credits - 60 * s.bays
  let count = 0
  while (s.bays + count < 250 && baysCost(Number(t.bayBase), Number(t.bayStep), s.bays, count + 1) <= spare) count++
  if (count >= Math.max(1, Math.floor(s.bays / 10))) {
    const cost = baysCost(Number(t.bayBase), Number(t.bayStep), s.bays, count)
    await record('buyBays', () => market.buyBays(YARD, count, cost), { count, cost })
    continue
  }
  const options = s.ports.map((port) => [port, ...plan(s, port)]).sort((a, b) => b[2] - a[2])
  const [port, lines] = options[0]
  if (!lines.length) break
  await record('trade', () => market.trade(port.port, lines), {
    port: port.port,
    lines: lines.length,
    units: lines.reduce((a, l) => a + Math.abs(l.units), 0),
    credits: s.credits
  })
}

await record('endSession', () => pilots.endSession())
const s = await state()
const byAction = {}
for (const e of log) (byAction[e.action] ??= []).push(e.gas)
const summary = {
  final: { credits: s.credits, bays: s.bays },
  gas: Object.fromEntries(
    Object.entries(byAction).map(([a, g]) => [
      a,
      { count: g.length, mean: Math.round(g.reduce((x, y) => x + y, 0) / g.length), max: Math.max(...g) }
    ])
  )
}
console.log(JSON.stringify(summary, null, 2))
if (out) writeFileSync(out, JSON.stringify({ summary, log }, null, 2) + '\n')
