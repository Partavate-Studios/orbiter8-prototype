import { describe, expect, it } from 'vitest'
import { onboardingStep, titleAction, wizardStepOf, nameProblem, cleanName } from './onboarding'

const ready = {
  walletStatus: 'connected',
  supportedNetwork: true,
  contractsLoaded: true,
  contractsFailed: false,
  gameDataLoaded: true,
  haveAvatar: true,
  haveShip: true,
  balance: 0.5,
  pending: null
}
const step = (changes) => onboardingStep({ ...ready, ...changes })

describe('onboarding step', () => {
  it('starts with the wallet, whatever state it is in', () => {
    expect(step({ walletStatus: 'searching' })).toBe('searching')
    for (const walletStatus of ['none', 'idle', 'connecting', 'error']) {
      expect(step({ walletStatus, supportedNetwork: false })).toBe('wallet')
    }
  })

  it('asks for a supported network before reading the game', () => {
    expect(step({ supportedNetwork: false, contractsLoaded: false })).toBe('network')
    expect(step({ contractsLoaded: false })).toBe('loading')
    expect(step({ gameDataLoaded: false })).toBe('loading')
  })

  it('registers a callsign, then a ship, then is ready', () => {
    expect(step({ haveAvatar: false, haveShip: false })).toBe('callsign')
    expect(step({ haveShip: false })).toBe('ship')
    expect(step({})).toBe('ready')
  })

  it('stops for funds before a registration, but not once the player has a ship', () => {
    expect(step({ haveAvatar: false, haveShip: false, balance: 0 })).toBe('funds')
    expect(step({ haveShip: false, balance: 0 })).toBe('funds')
    expect(step({ balance: 0 })).toBe('ready')
  })

  it('stays on a registration that was sent until the chain shows it', () => {
    expect(step({ haveAvatar: false, haveShip: false, balance: 0, pending: { kind: 'callsign' } })).toBe('callsign')
    expect(step({ haveShip: false, pending: { kind: 'callsign' } })).toBe('ship')
    expect(step({ haveShip: false, balance: 0, pending: { kind: 'ship' } })).toBe('ship')
  })

  it('maps steps onto the wizard dots', () => {
    expect(
      ['searching', 'wallet', 'network', 'loading', 'funds', 'callsign', 'ship', 'ready'].map(wizardStepOf)
    ).toEqual(['wallet', 'wallet', 'network', 'network', 'network', 'callsign', 'ship', 'command'])
  })

  it('labels the title button by progress', () => {
    const label = (changes) => {
      const input = { ...ready, ...changes }
      return titleAction(onboardingStep(input), input).label
    }
    expect(label({ walletStatus: 'idle' })).toBe('Connect')
    expect(label({ haveAvatar: false, haveShip: false })).toBe('Begin')
    expect(label({ haveAvatar: false, haveShip: false, balance: 0 })).toBe('Begin')
    expect(label({ haveShip: false })).toBe('Launch')
    expect(label({})).toBe('Continue')
    expect(titleAction('loading', ready).enabled).toBe(false)
    expect(titleAction('loading', { ...ready, contractsFailed: true }).enabled).toBe(true)
  })
})

describe('names', () => {
  it('trims and collapses spaces', () => {
    expect(cleanName('  Vega   Star ')).toBe('Vega Star')
  })

  it('needs 1 to 24 characters, and flags known callsigns whatever the case', () => {
    expect(nameProblem('   ')).toBe('empty')
    expect(nameProblem('x'.repeat(25))).toBe('too long')
    expect(nameProblem(' Vega ', { taken: new Set(['vega']) })).toBe('taken')
    expect(nameProblem('Vega', { taken: null })).toBe(null)
    // call signs and ship names need 3 characters (Pilots.MIN_NAME); planet names may be shorter
    expect(nameProblem('Bo', { minLength: 3 })).toBe('too short')
    expect(nameProblem('Bo')).toBe(null)
  })
})
