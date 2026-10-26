// The game client: connects to a wallet, keeps a plain copy of the game state up to date as blocks
// arrive, and offers every player action. Framework-free; a UI subscribes and draws from the state.
import { connectWallet } from '@/sdk/chain/wallet'
import { initContracts, contractAddresses, galaxy, getNativeBalance, waitForTransaction } from '@/sdk/chain/contracts'
import { loadPlayer, loadRecentEvents, loadSystem } from '@/sdk/load'
import { createBlockWatcher } from '@/sdk/sync'
import * as actions from '@/sdk/actions'
import { loadLeaderboard } from '@/sdk/leaderboard'
import { createExploredMap } from '@/sdk/explored'
import { loadCallsigns } from '@/sdk/callsigns'
import { pendingRegistration, rememberPending, forgetPending } from '@/sdk/pending'

// Registrations are remembered while in flight (sdk/pending.js), so a reload can pick up the wait.
const REGISTRATIONS = { createAvatar: 'callsign', launchShip: 'ship' }

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
 * 'connected' | 'balance' | 'contracts' | 'block' | 'player' | 'events' | 'system' | 'systemProgress' | 'loading', or
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
  // The leaderboard reads every player's holdings, so it's cached for a minute.
  const LEADERBOARD_MAX_AGE_MS = 60 * 1000
  let leaderboard = null
  let exploredMap = null
  const setLoading = (what, isLoading) => {
    state.loading[what] = isLoading
    notify('loading')
  }

  // Some changes leave no trace the block check can see (a smart-account player jumping or renaming
  // emits no event and sends nothing to the game directly), so reload at least this often anyway.
  const MAX_TIME_BETWEEN_RELOADS_MS = 2 * 60 * 1000
  let lastReload = 0

  const watcher = createBlockWatcher({
    watchedAddresses: () => (state.contracts ? Object.values(state.contracts) : []),
    onBlock: (blockNumber, gameChanged) => {
      state.blockNumber = blockNumber
      notify('block')
      if (gameChanged || Date.now() - lastReload > MAX_TIME_BETWEEN_RELOADS_MS) {
        console.debug('Reloading the game at block ' + blockNumber + (gameChanged ? ' (it changed)' : ' (periodic)'))
        client.refresh()
      }
    }
  })

  /**
   * The player's actions, each followed by a reload once its transaction is mined, so the player sees
   * the result right away (whatever kind of wallet sent it). Rejections pass through unchanged.
   */
  const actionsThenReload = Object.fromEntries(
    Object.entries(actions).map(([name, action]) => [
      name,
      async (...args) => {
        const receipt = REGISTRATIONS[name]
          ? await register(REGISTRATIONS[name], action, ...args)
          : await action(...args)
        client.refresh()
        return receipt
      }
    ])
  )

  /** Sends a registration (callsign or ship), remembering it until it's mined or fails. */
  async function register(kind, action, name, options = {}) {
    const { chainId, account } = state
    try {
      return await action(name, {
        ...options,
        onSent: (hash) => {
          rememberPending(chainId, account, { kind, hash, name, sentAt: Date.now() })
          options.onSent?.(hash)
        }
      })
    } finally {
      forgetPending(chainId, account)
    }
  }

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
    actions: actionsThenReload,

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

    /**
     * The systems this player has visited on this deployment, with their neighbor lists
     * (sdk/explored.js), or null before the contracts are bound.
     */
    explored() {
      if (!state.contracts) return null
      if (!exploredMap || exploredMap.chainId !== state.chainId) {
        exploredMap = {
          chainId: state.chainId,
          map: createExploredMap({ chainId: state.chainId, game: state.contracts.game })
        }
      }
      return exploredMap.map
    },

    /**
     * Every player's planets, ports and credits (see sdk/leaderboard.js), at most a minute old.
     * Rejects if the contracts aren't bound or the node fails.
     */
    async getLeaderboard({ refresh = false } = {}) {
      if (!state.contracts) throw new Error('Not connected to the game')
      const isFresh = leaderboard && Date.now() - leaderboard.loadedAt < LEADERBOARD_MAX_AGE_MS
      if (!isFresh || refresh) {
        leaderboard = { players: await loadLeaderboard(state.contracts), loadedAt: Date.now() }
      }
      return leaderboard
    },

    /** The callsign or ship registration this player sent and is still waiting on, if any (after a reload). */
    pendingRegistration() {
      return state.account ? pendingRegistration(state.chainId, state.account) : null
    },

    /**
     * Waits for a registration sent before a reload, then reloads the player. Rejects if it failed on
     * chain; either way it's no longer pending.
     */
    async resumeRegistration() {
      const pending = client.pendingRegistration()
      if (!pending) return
      try {
        await waitForTransaction(pending.hash)
      } finally {
        forgetPending(state.chainId, state.account)
        await client.refreshPlayer()
      }
    },

    /** Every callsign in use, lowercased, or null if there are too many to read (sdk/callsigns.js). */
    async listCallsigns() {
      if (!state.contracts) return null
      return loadCallsigns(state.contracts.avatars)
    },

    /** Re-reads the player's native balance (for gas). */
    async refreshBalance() {
      state.balance = await getNativeBalance()
      notify('balance')
    },

    /** Reloads the player, recent events and the current system. */
    refresh() {
      lastReload = Date.now()
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
        client.explored()?.record(
          state.system.id,
          Object.values(state.system.neighbors).map((neighbor) => neighbor.id)
        )
        notify('system')
      }).finally(() => setLoading('system', false))
    }
  }
  return client
}

/** The app's one game client. */
export const game = createGameClient()
