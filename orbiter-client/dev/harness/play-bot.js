// A play bot, for measuring what the game costs to play. Load it with PRELOAD=dev/harness/play-bot.js
// and drive it with eval steps, e.g. `eval:bot.register('Prospector', 'Ledger')`, `eval:bot.trade(10)`.
// It plays through the client's own actions (window.__o8game, dev builds) and wallet, the way a
// careful player would: sell what a port buys, fill the holds with whatever it sells that has the best
// margin at another port in this system, head for that buyer, and spend spare credits on holds.
// Every move is logged with its gas, the credits and holds after it, how long it took, and how many
// JSON-RPC calls the client made meanwhile (bot.log; bot.rpc counts calls by method).
;(() => {
  const GOODS = ['equipment', 'fuel', 'organics']
  // Credits kept per hold for buying cargo, before spending the rest on holds.
  const CAPITAL_PER_HOLD = 160
  const HOLD_PRICE = 250
  const MAX_HOLDS = 250

  const rpc = {}
  const realFetch = window.fetch
  window.fetch = function (input, init) {
    try {
      const body = init?.body ? JSON.parse(init.body) : null
      for (const call of [].concat(body ?? [])) if (call?.method) rpc[call.method] = (rpc[call.method] ?? 0) + 1
    } catch {
      // not JSON-RPC
    }
    return realFetch.call(this, input, init)
  }
  const rpcTotal = () => Object.values(rpc).reduce((a, b) => a + b, 0)
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const game = () => window.__o8game

  /** Waits until nothing is loading, then reloads the player and system and waits again. */
  async function settle() {
    const idle = async () => {
      while (game().state.loading.system || game().state.loading.player) await sleep(50)
    }
    await idle()
    await Promise.all([game().refreshPlayer(), game().refreshSystem()])
    await idle()
  }

  function snapshot() {
    const { player, system } = game().state
    const avatar = player.avatar
    const ports = Object.values(system?.planets ?? {})
      .filter((planet) => planet.hasStation)
      .map((planet) => ({
        id: String(planet.id),
        name: planet.station.name,
        inv: planet.station.inventory,
        prices: planet.station.prices
      }))
    return {
      credits: avatar.credits,
      holds: avatar.ship.holds,
      cargo: { equipment: avatar.ship.equipment, fuel: avatar.ship.fuel, organics: avatar.ship.organics },
      at: String(avatar.ship.orbit),
      system: system?.id,
      ports
    }
  }

  async function act(kind, send, extra = {}) {
    const started = performance.now()
    const calls = rpcTotal()
    const receipt = await send()
    await settle()
    const after = snapshot()
    const entry = {
      kind,
      gas: Number(receipt?.gasUsed ?? 0),
      gasPrice: Number(receipt?.gasPrice ?? receipt?.effectiveGasPrice ?? 0),
      credits: after.credits,
      holds: after.holds,
      ms: Math.round(performance.now() - started),
      rpc: rpcTotal() - calls,
      ...extra
    }
    bot.log.push(entry)
    return entry
  }

  /** Where to trade next: at `port`, sell what it buys and buy the best-margin good it sells. */
  function plan(state, port) {
    const amounts = { equipment: 0, fuel: 0, organics: 0 }
    let credits = state.credits
    let used = GOODS.reduce((sum, good) => sum + state.cargo[good], 0)
    for (const good of GOODS) {
      if (port.inv[good] < 0 && state.cargo[good] > 0) {
        const units = Math.min(state.cargo[good], -port.inv[good])
        amounts[good] = -units
        credits += units * port.prices[good]
        used -= units
      }
    }
    // The best thing to buy here: the biggest margin at another port that wants it.
    const options = GOODS.filter((good) => port.inv[good] > 0)
      .map((good) => {
        const buyers = state.ports.filter((other) => other.id !== port.id && other.inv[good] < 0)
        const best = buyers.sort((a, b) => b.prices[good] - a.prices[good])[0]
        return best && { good, margin: best.prices[good] - port.prices[good], buyer: best }
      })
      .filter((option) => option && option.margin > 0)
      .sort((a, b) => b.margin - a.margin)
    const choice = options[0]
    if (choice) {
      const free = state.holds - used
      // Strictly less than the balance (the contract's check), net of what's sold here.
      const affordable = Math.floor((credits - 1) / port.prices[choice.good])
      const units = Math.max(0, Math.min(free, port.inv[choice.good], affordable, -choice.buyer.inv[choice.good]))
      amounts[choice.good] = units
    }
    return { amounts, next: choice?.buyer ?? null, margin: choice?.margin ?? 0 }
  }

  const bot = {
    log: [],
    rpc,
    snapshot,
    /** Any one move through the client, logged like the rest: bot.act('jump', () => __o8game.actions.moveTo(id)). */
    act,
    async register(callsign, shipName) {
      await act('register callsign', () => game().actions.createAvatar(callsign))
      await act('launch ship', () => game().actions.launchShip(shipName))
      return bot.log.slice(-2)
    },
    /**
     * Makes up to `count` trades, buying holds when credits allow. Starts at the port that best buys
     * what's aboard (or the first port), then follows each plan's next port.
     */
    async trade(count = 10) {
      await settle()
      let state = snapshot()
      let port =
        state.ports.find((p) => p.id === bot.nextPort) ?? state.ports.find((p) => p.id === state.at) ?? state.ports[0]
      for (let i = 0; i < count && state.holds <= MAX_HOLDS; i++) {
        const { amounts, next, margin } = plan(state, port)
        if (GOODS.every((good) => amounts[good] === 0)) {
          // Nothing to do here: try the port with the best margin from scratch.
          bot.log.push({ kind: 'stuck', at: port.name, credits: state.credits, holds: state.holds })
          break
        }
        const units = GOODS.reduce((sum, good) => sum + Math.abs(amounts[good]), 0)
        await act('trade', () => game().actions.trade(port.id, amounts), { at: port.name, units, margin })
        state = snapshot()
        const room = MAX_HOLDS - state.holds
        const spare = state.credits - (state.holds + 1) * CAPITAL_PER_HOLD
        const holds = Math.min(room, 255, Math.floor(spare / (HOLD_PRICE + CAPITAL_PER_HOLD)))
        if (holds > 0) {
          await act('buy holds', () => game().actions.buyHolds(port.id, holds), { at: port.name, units: holds })
          state = snapshot()
        }
        port = (next && state.ports.find((p) => p.id === next.id)) ?? port
        bot.nextPort = port.id
      }
      return bot.summary()
    },
    summary() {
      const s = snapshot()
      return { credits: s.credits, holds: s.holds, cargo: s.cargo, moves: bot.log.length, last: bot.log.slice(-3) }
    }
  }
  window.bot = bot
})()
