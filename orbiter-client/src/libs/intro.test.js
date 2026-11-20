import { describe, expect, it } from 'vitest'
import { corporation, introStart, loadSubscription, saveSubscription } from './intro'

// The intro is the way into the game: a reload must land where the chain says the player is, and the
// corporation chosen before the job is accepted must survive it.

describe('introStart', () => {
  const start = (changes) => introStart({ haveAvatar: false, haveShip: false, pending: null, ...changes })

  it('starts in the dark with no name on file', () => {
    expect(start({})).toBe('dark')
  })
  it('waits on a name that was sent before a reload', () => {
    expect(start({ pending: 'callsign' })).toBe('filing')
  })
  it('opens the lit room once the name is on file', () => {
    expect(start({ haveAvatar: true })).toBe('lit')
    // a name sent twice (the first already mined) is just on file
    expect(start({ haveAvatar: true, pending: 'callsign' })).toBe('lit')
  })
  it('waits for the escort while the ship is being mined', () => {
    expect(start({ haveAvatar: true, pending: 'ship' })).toBe('escort')
  })
  it('is over once there is a ship', () => {
    expect(start({ haveAvatar: true, haveShip: true })).toBe('done')
    expect(start({ haveAvatar: true, haveShip: true, pending: 'ship' })).toBe('done')
  })
})

describe('the subscription before the job', () => {
  const memory = () => {
    const items = new Map()
    return { getItem: (k) => items.get(k) ?? null, setItem: (k, v) => items.set(k, v) }
  }

  it('is kept per network and account', () => {
    const storage = memory()
    saveSubscription(31337, '0xABC', 2, storage)
    expect(loadSubscription(31337, '0xabc', storage)).toBe(2)
    expect(loadSubscription(31337, '0xdef', storage)).toBe(null)
    expect(loadSubscription(420420417, '0xabc', storage)).toBe(null)
  })
  it('is null when storage refuses', () => {
    const refusing = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      }
    }
    expect(() => saveSubscription(1, '0x1', 3, refusing)).not.toThrow()
    expect(loadSubscription(1, '0x1', refusing)).toBe(null)
  })
})

describe('corporation', () => {
  it('takes its name from the chain and its look by id', () => {
    expect(corporation(2, ['Alpha', 'Beta', 'Gamma'])).toMatchObject({ id: 2, key: 'Y', name: 'Beta' })
    expect(corporation(3)).toMatchObject({ key: 'Z', name: 'Corp Z' })
  })
})
