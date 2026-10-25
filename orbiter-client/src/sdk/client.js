// The game client: connects to a wallet, keeps a plain copy of the game state up to date as blocks
// arrive, and offers every player action. Framework-free; a UI subscribes and draws from the state.
import { connectWallet } from '@/sdk/chain/wallet'
import { initContracts, contractAddresses, galaxy, getNativeBalance } from '@/sdk/chain/contracts'
import { loadPlayer, loadRecentEvents, loadSystem } from '@/sdk/load'
import { createBlockWatcher } from '@/sdk/sync'
import * as actions from '@/sdk/actions'

/**
 * @typedef {object} GameState
 * @property {number} chainId
 * @property {string | null} account
 * @property {string} balance  native currency, as a decimal string
 * @property {{ game: string, avatars: string, planetToken: string, shipToken: string, creditToken: string } | null} contracts
 * @property {number} blockNumber  the latest block seen
 * @property {object | null} player  see sdk/load.js loadPlayer
 * @property {object | null} events  see sdk/load.js loadRecentEvents
 * @property {object | null} system  the player's current star system, see sdk/load.js loadSystem
 *   (sdk/system.js buildSystem turns it into game objects)
 * @property {number} systemProgress  0–100 while the system loads
 * @property {{ player: boolean, system: boolean }} loading  reloads in flight
 */

/**
 * What changed, passed to subscribers:
 * 'connected' | 'contracts' | 'block' | 'player' | 'events' | 'system' | 'systemProgress' | 'loading', or
 * { error, what } when a refresh failed (the state keeps its previous value).
 * @typedef {string | { error: Error, what: string }} Change
 */

export function createGameClient() {
  /** @type {GameState} */
  const state = {
    chainId: 0,
    account: null,
    balance: '0',
    contracts: null,
    blockNumber: 0,
    player: null,
    events: null,
    system: null,
    systemProgress: 0,
    loading: { player: false, system: false }
  }
  const listeners = new Set()
  const notify = (change) => listeners.forEach((listener) => listener(change, state))
  const setLoading = (what, isLoading) => {
    state.loading[what] = isLoading
    notify('loading')
  }

  const watcher = createBlockWatcher({
    watchedAddresses: () => (state.contracts ? Object.values(state.contracts) : []),
    onBlock: (blockNumber, gameChanged) => {
      state.blockNumber = blockNumber
      notify('block')
      if (gameChanged) {
        console.debug('Game changed by block ' + blockNumber + '; reloading')
        client.refresh()
      }
    }
  })

  /** Runs a refresh; a failure is reported to subscribers instead of thrown. */
  const attempt = async (what, refresh) => {
    try {
      await refresh()
    } catch (error) {
      notify({ error, what })
    }
  }

  const client = {
    state,
    actions,

    /** Calls `listener(change, state)` after every change. Returns a function that unsubscribes. */
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    /** Connects to an EIP-6963 wallet (sdk/chain/wallet.js discoverWallets). Rejects if the player declines. */
    async connect(wallet) {
      const session = await connectWallet(wallet)
      state.chainId = session.chainId
      state.account = session.account
      notify('connected')
      state.balance = await getNativeBalance()
      notify('connected')
    },

    /** Binds the game's contracts on the connected network. Resolves false if the game isn't deployed there. */
    async bindContracts() {
      if (!(await initContracts())) return false
      const { game, avatars } = contractAddresses()
      const [planetToken, shipToken, creditToken] = await Promise.all([
        galaxy.getPlanetToken(),
        galaxy.getShipToken(),
        galaxy.getCreditToken()
      ])
      state.contracts = { game, avatars, planetToken, shipToken, creditToken }
      notify('contracts')
      return true
    },

    /** Looks for a new block; if it changed the game, reloads everything. Rejects if the node fails. */
    checkForNewBlock() {
      return watcher.check()
    },

    /** Reloads the player, recent events and the current system. */
    refresh() {
      return Promise.all([client.refreshPlayer(), client.refreshEvents(), client.refreshSystem()])
    },

    refreshPlayer() {
      setLoading('player', true)
      return attempt('player', async () => {
        state.player = await loadPlayer()
        notify('player')
      }).finally(() => setLoading('player', false))
    },

    refreshEvents() {
      return attempt('events', async () => {
        state.events = await loadRecentEvents(state.blockNumber)
        notify('events')
      })
    },

    /** Reloads the current system. A reload already in flight makes this a no-op. */
    refreshSystem() {
      if (state.loading.system) return Promise.resolve()
      setLoading('system', true)
      state.systemProgress = 1
      notify('systemProgress')
      return attempt('system', async () => {
        state.system = await loadSystem((percent) => {
          state.systemProgress = percent
          notify('systemProgress')
        })
        notify('system')
      }).finally(() => setLoading('system', false))
    }
  }
  return client
}

/** The app's one game client. */
export const game = createGameClient()
