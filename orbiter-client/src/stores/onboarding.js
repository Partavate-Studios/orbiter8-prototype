// The title screen, its connect panel and the intro: which step the player is on (libs/onboarding.js, from
// the chain and game stores), whether the connect panel or a side panel is open, and the registration in
// progress (the intro's two transactions: the name at the ID scanner, the ship with the job).
import { defineStore } from 'pinia'
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { onboardingStep, titleAction, wizardStepOf } from '@/libs/onboarding'
import { walletErrorKind } from '@orbiter8/sdk/chain/wallet'
import { game } from '@orbiter8/sdk/client'
import { networks } from '@orbiter8/sdk/chain/networks'
import { loadNetworkStats } from '@orbiter8/sdk/network-stats'

/**
 * @typedef {object} Registration  the callsign or ship registration on screen
 * @property {'callsign' | 'ship'} kind
 * @property {string} name
 * @property {'confirm' | 'sent' | 'done' | 'failed'} status  confirm: waiting for the wallet; sent: waiting to be mined
 * @property {string | null} hash
 * @property {string | null} reason  why it failed
 * @property {'rejected' | 'pending' | 'other' | null} failure
 */

export const useOnboardingStore = defineStore('Onboarding', {
  state: () => ({
    wizardOpen: false,
    /** 'network' | 'settings' | null: the title's side panels */
    panel: null,
    /** @type {Registration | null} */
    registration: null,
    /** Callsigns in use, lowercased; null until read, or when there are too many to read. */
    callsigns: null,
    /** The corporations' names (id = index + 1), and the one the new pilot joins (Koda, 2026-11-19) */
    corporationNames: [],
    corporation: 1,
    /** chainId → { pilots, starSystems }, null (no RPC answered) or 'loading' (sdk/network-stats.js) */
    networkStats: {}
  }),
  getters: {
    input() {
      const chain = useChainStore()
      const gameState = useGameStateStore()
      // A registration waiting to be mined (resumeRegistration covers one sent before a reload).
      const pending = this.registration?.status === 'sent' ? this.registration : null
      return {
        walletStatus: chain.walletStatus,
        supportedNetwork: chain.isSupportedNetwork,
        contractsLoaded: chain.contractsLoaded,
        contractsFailed: chain.contractsFailed,
        gameDataLoaded: gameState.gameDataLoaded,
        haveAvatar: gameState.haveAvatar,
        haveShip: gameState.haveShip,
        balance: Number(chain.balance),
        pending: pending ? { kind: pending.kind } : null
      }
    },
    step() {
      return onboardingStep(this.input)
    },
    wizardStep() {
      return wizardStepOf(this.step)
    },
    titleAction() {
      return titleAction(this.step, this.input)
    }
  },
  actions: {
    openWizard() {
      this.panel = null
      this.wizardOpen = true
    },
    closeWizard() {
      this.wizardOpen = false
      // A finished or failed registration is done with; one still in flight keeps showing.
      if (this.registration && this.registration.status !== 'sent') this.registration = null
    },
    /** Reads how busy every network is, for choosing where to play. Each fills in as it answers. */
    loadNetworkStats() {
      for (const network of networks) {
        if (this.networkStats[network.chainId] === 'loading') continue
        this.networkStats = { ...this.networkStats, [network.chainId]: 'loading' }
        loadNetworkStats(network).then((stats) => {
          this.networkStats = { ...this.networkStats, [network.chainId]: stats }
        })
      }
    },
    /** The corporations a new pilot may join (Pilots.corporations). */
    async loadCorporations() {
      try {
        this.corporationNames = (await game.corporations()).names
      } catch (error) {
        console.error('Reading the corporations failed:', error.shortMessage ?? error.message)
      }
    },
    /** Reads every callsign once, for the "taken" hint. Failing just leaves the hint off. */
    async loadCallsigns() {
      try {
        this.callsigns = await game.listCallsigns()
      } catch (error) {
        console.error('Reading callsigns failed:', error.shortMessage ?? error.message)
      }
    },
    /**
     * Sends a callsign or ship registration and follows it on screen. Never throws: a failure is shown
     * with its reason, and the typed name is kept for another try.
     * @param {'callsign' | 'ship'} kind
     * @param {string} name  already cleaned
     */
    async register(kind, name) {
      this.registration = { kind, name, status: 'confirm', hash: null, reason: null, failure: null }
      const onSent = (hash) => {
        this.registration = { ...this.registration, status: 'sent', hash }
      }
      try {
        if (kind === 'callsign') await game.actions.createAvatar(name, { onSent })
        else await game.actions.launchShip(name, { onSent, corporation: this.corporation })
        await game.refreshPlayer()
        this.registration = { ...this.registration, status: 'done' }
        if (kind === 'callsign') this.callsigns?.add(name.toLowerCase())
      } catch (error) {
        console.error('Registration failed:', error)
        this.registration = {
          ...this.registration,
          status: 'failed',
          reason: error.reason ?? error.shortMessage ?? error.message,
          failure: walletErrorKind(error)
        }
      }
    },
    /** After a reload: picks up a registration that was still waiting to be mined (the intro shows it). */
    async resumeRegistration() {
      const pending = game.pendingRegistration()
      if (!pending) return
      this.registration = { ...pending, status: 'sent', reason: null, failure: null }
      try {
        await game.resumeRegistration()
        this.registration = { ...this.registration, status: 'done' }
      } catch (error) {
        this.registration = { ...this.registration, status: 'failed', reason: error.message, failure: 'other' }
      }
    },
    /** Back to the form after a failure, keeping the name. */
    clearRegistration() {
      this.registration = null
    }
  }
})
