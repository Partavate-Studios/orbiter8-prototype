import { describe, expect, it } from 'vitest'
import { walletErrorKind } from './wallet'

describe('walletErrorKind', () => {
  it('finds a declined request, directly or wrapped by ethers', () => {
    expect(walletErrorKind({ code: 4001 })).toBe('rejected')
    expect(walletErrorKind({ code: 'ACTION_REJECTED' })).toBe('rejected')
    expect(walletErrorKind({ code: 'UNKNOWN_ERROR', error: { code: 4001 } })).toBe('rejected')
  })

  it("finds a wallet that won't let the site use the account (MetaMask locked: 4100)", () => {
    // As it came back on 2026-11-24: ethers' "could not coalesce error" around MetaMask's answer.
    const coalesced = {
      code: 'UNKNOWN_ERROR',
      shortMessage: 'could not coalesce error',
      error: { code: 4100, message: 'The requested account and/or method has not been authorized by the user.' }
    }
    expect(walletErrorKind(coalesced)).toBe('unauthorized')
    expect(walletErrorKind({ code: 4100 })).toBe('unauthorized')
  })

  it('finds a request already open in the wallet, and leaves anything else as other', () => {
    expect(walletErrorKind({ info: { error: { code: -32002 } } })).toBe('pending')
    expect(walletErrorKind(new Error('execution reverted'))).toBe('other')
    expect(walletErrorKind(null)).toBe('other')
  })
})
