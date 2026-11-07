// The Demo 4 galaxy as the player sees it (docs/demo4-plan.md, milestone 1): the wallet, the
// universe, the player's pilot and ship, and the cells loaded so far, region by region as the player
// looks around (D18). Moves send any published pending scans along, so scans never need their own
// approval (D21).
import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { discoverWallets, preferredWallet, connectWallet, getSession } from '@/sdk/chain/wallet'
import { createGame, STATE, REGION_RADIUS } from '@/sdk/v4/game'
import { deployment } from '@/sdk/v4/config'
import { distance } from '@/sdk/v4/hex'

let game = null

export const useGalaxyStore = defineStore('Galaxy', {
  state: () => ({
    /** 'idle' | 'connecting' | 'ready' | 'no-deployment' | 'error' */
    status: 'idle',
    error: null,
    account: null,
    universe: null,
    /** null until loaded; false if the wallet has no pilot yet */
    pilot: null,
    /** cell number → cell (see sdk/v4/game.js), raw: replaced whole on each load */
    cells: markRaw(new Map()),
    /** bumped when `cells` changes, for views to follow */
    cellsVersion: 0,
    /** centers already read (each covers REGION_RADIUS around it) */
    loadedCenters: [],
    names: {},
    selected: null,
    /** a move in progress: 'register' | 'jump' | 'traverse' | 'rename' */
    busy: null
  }),
  getters: {
    shipCell: (state) => (state.pilot ? state.pilot.ship.cell : null),
    cellAt: (state) => (n) => state.cells.get(n) ?? null,
    /** Can the ship jump to `n` now? */
    canJumpTo: (state) => (n) => {
      if (!state.pilot) return false
      const c = state.cells.get(n)
      if (!c || (c.state !== STATE.STAR && c.state !== STATE.BLACK_HOLE)) return false
      const steps = distance(state.pilot.ship.cell, n)
      return steps > 0 && steps <= state.pilot.ship.range
    }
  },
  actions: {
    async connect() {
      this.status = 'connecting'
      try {
        const where = await deployment()
        if (!where) {
          this.status = 'no-deployment'
          return
        }
        const wallets = await discoverWallets()
        const wallet = preferredWallet(wallets) ?? wallets[0]
        if (!wallet) throw new Error('No wallet found')
        const session = await connectWallet(wallet)
        game = markRaw(createGame(session.signer, where.contracts))
        this.account = session.account.toLowerCase()
        this.universe = await game.universe()
        await this.refreshPilot()
        await this.loadAround(this.pilot ? this.pilot.ship.cell : 0, true)
        this.status = 'ready'
      } catch (error) {
        console.error('Connecting to Demo 4 failed:', error)
        this.error = error.shortMessage ?? error.message
        this.status = 'error'
      }
    },
    async refreshPilot() {
      this.pilot = (await game.pilot(getSession().account)) ?? false
    },
    /** Reads the region around `center` unless a loaded region already covers it (or `force`). */
    async loadAround(center, force = false) {
      const covered = this.loadedCenters.some((c) => distance(c, center) <= REGION_RADIUS / 2)
      if (covered && !force) return
      const cells = await game.region(center)
      const next = new Map(this.cells)
      for (const c of cells) next.set(c.cell, c)
      this.cells = markRaw(next)
      this.cellsVersion++
      if (!covered) this.loadedCenters.push(center)
      for (const c of cells) if (c.named && !(c.cell in this.names)) this.loadName(c.cell)
    },
    async loadName(cell) {
      this.names[cell] = await game.nameOf(cell)
    },
    /** Re-reads every loaded region (after a move). */
    async reload() {
      const centers = [...this.loadedCenters]
      for (const c of centers) await this.loadAround(c, true)
    },
    select(cell) {
      this.selected = cell
    },
    /** Pending scans around the loaded area whose rounds are out, to send with the next move. */
    async proofs() {
      return game.proofsFor([...this.cells.values()])
    },
    async previewScan(cell) {
      const c = this.cells.get(cell)
      if (!c || !c.visited || c.scanned) return null
      return game.previewScan(cell, c.scanRound)
    },
    async move(kind, send) {
      this.busy = kind
      this.error = null
      try {
        await send(await this.proofs())
        await this.refreshPilot()
        await this.loadAround(this.pilot.ship.cell)
        await this.reload()
        return true
      } catch (error) {
        console.error(`${kind} failed:`, error)
        this.error = error.shortMessage ?? error.reason ?? error.message
        return false
      } finally {
        this.busy = null
      }
    },
    register(callsign, shipName) {
      return this.move('register', () => game.register(callsign, shipName))
    },
    jump(to) {
      return this.move('jump', (proofs) => game.jump(to, proofs))
    },
    traverse() {
      return this.move('traverse', (proofs) => game.traverse(proofs))
    },
    async renameStar(cell, name) {
      const ok = await this.move('rename', (proofs) => game.renameStar(cell, name, proofs))
      if (ok) await this.loadName(cell)
      return ok
    },
    /** Writes published scans now, without moving (e.g. the player wants their neighborhood on record). */
    resolveScans() {
      return this.move('resolve', async (proofs) => {
        if (proofs.length) await game.resolveScans(proofs)
      })
    }
  }
})

export { STATE }
