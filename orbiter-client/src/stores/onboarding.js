// The title screen and its onboarding wizard: which step the player is on (libs/onboarding.js, from the
// chain and game stores), whether the wizard or a panel is open, and the registration in progress.
import { defineStore } from 'pinia'
import { useChainStore } from '@/stores/chain'
import { useGameStateStore } from '@/stores/gamestate'
import { onboardingStep, titleAction, wizardStepOf } from '@/libs/onboarding'
import { walletErrorKind } from '@/sdk/chain/wallet'
import { game } from '@/sdk/client'

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
    callsigns: null
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
        else await game.actions.launchShip(name, { onSent })
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
    /** After a reload: picks up a registration that was still waiting to be mined. */
    async resumeRegistration() {
      const pending = game.pendingRegistration()
      if (!pending) return
      this.registration = { ...pending, status: 'sent', reason: null, failure: null }
      // Back where the player left off: watching the registration go through.
      this.openWizard()
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
