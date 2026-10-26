// Where a player is in getting started, worked out from the wallet and game state alone, so the title
// screen and the onboarding wizard always agree and a reload lands on the right step.
import { normalizeName } from '@/sdk/callsigns'

/**
 * The wizard's steps, in order. Funds and loading are shown as part of the network step.
 * @type {readonly ['wallet', 'network', 'callsign', 'ship', 'command']}
 */
export const WIZARD_STEPS = ['wallet', 'network', 'callsign', 'ship', 'command']

/**
 * @typedef {object} OnboardingInput
 * @property {'searching' | 'none' | 'idle' | 'connecting' | 'connected' | 'error'} walletStatus
 * @property {boolean} supportedNetwork  the game is deployed on the wallet's network
 * @property {boolean} contractsLoaded
 * @property {boolean} contractsFailed  binding the contracts failed (node unreachable)
 * @property {boolean} gameDataLoaded  the player's avatar and ship have been read
 * @property {boolean} haveAvatar
 * @property {boolean} haveShip
 * @property {number} balance  native currency, for gas
 * @property {{ kind: 'callsign' | 'ship' } | null} pending  a registration sent and not yet mined
 */

/**
 * The step the player is on:
 * - 'searching': looking for wallets (a moment after load);
 * - 'wallet': no wallet connected (none installed, waiting to connect, connecting, or failed);
 * - 'network': connected to a network the game isn't on;
 * - 'loading': reading the game (or failed to: see contractsFailed);
 * - 'funds': nothing to pay gas with, before a registration;
 * - 'callsign' / 'ship': registering (or a registration in flight);
 * - 'ready': has a ship, can take command.
 * @param {OnboardingInput} input
 */
export function onboardingStep(input) {
  if (input.walletStatus === 'searching') return 'searching'
  if (input.walletStatus !== 'connected') return 'wallet'
  if (!input.supportedNetwork) return 'network'
  if (!input.contractsLoaded || !input.gameDataLoaded) return 'loading'
  if (input.pending && !(input.pending.kind === 'callsign' ? input.haveAvatar : input.haveShip)) {
    return input.pending.kind
  }
  if (input.haveAvatar && input.haveShip) return 'ready'
  if (!(input.balance > 0)) return 'funds'
  return input.haveAvatar ? 'ship' : 'callsign'
}

/** Which wizard dot a step belongs to. */
export function wizardStepOf(step) {
  if (step === 'searching' || step === 'wallet') return 'wallet'
  if (step === 'network' || step === 'loading' || step === 'funds') return 'network'
  if (step === 'ready') return 'command'
  return step
}

/**
 * The title's main button for a step: what it says, and whether it can be pressed yet.
 * @param {string} step  see onboardingStep
 * @param {OnboardingInput} input
 */
export function titleAction(step, input) {
  switch (step) {
    case 'searching':
      return { label: 'Loading…', enabled: false }
    case 'wallet':
    case 'network':
      return { label: 'Connect', enabled: true }
    case 'loading':
      return input.contractsFailed ? { label: 'Connect', enabled: true } : { label: 'Loading…', enabled: false }
    case 'ready':
      return { label: 'Continue', enabled: true }
    default:
      // funds, callsign, ship: Begin until there's a callsign, then Launch
      return { label: input.haveAvatar ? 'Launch' : 'Begin', enabled: true }
  }
}

/** Callsigns and ship names: trimmed, inner runs of spaces collapsed. */
export const cleanName = normalizeName

export const NAME_MAX_LENGTH = 24

/**
 * Why a name can't be used yet, or null if it can. The contracts accept any string, so these rules
 * are the client's own.
 * @param {string} name  as typed
 * @param {{ taken?: Set<string> | null }} [options]  known callsigns, lowercased (null: unknown)
 */
export function nameProblem(name, { taken = null } = {}) {
  const clean = cleanName(name)
  if (clean.length === 0) return 'empty'
  if (clean.length > NAME_MAX_LENGTH) return 'too long'
  if (taken?.has(clean.toLowerCase())) return 'taken'
  return null
}
