import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { SHOWN_MS, useTransactionsStore } from './transactions'

const WORDS = { doing: 'Claiming Mars', done: 'Mars is yours', failed: "Couldn't claim Mars" }

describe('the transaction tray', () => {
  let tray

  beforeEach(() => {
    setActivePinia(createPinia())
    tray = useTransactionsStore()
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('follows a transaction from the wallet to done, then clears it', async () => {
    let sent, mined
    const result = tray.track(WORDS, ({ onSent }) => {
      sent = onSent
      return new Promise((resolve) => (mined = resolve))
    })
    expect(tray.items[0].status).toBe('wallet')
    sent()
    expect(tray.items[0].status).toBe('sent')
    mined()
    expect(await result).toBe(true)
    expect(tray.items[0].status).toBe('done')
    vi.advanceTimersByTime(SHOWN_MS.done)
    expect(tray.items).toEqual([])
  })

  it('says why a transaction failed', async () => {
    const result = tray.track(WORDS, () => Promise.reject({ shortMessage: 'execution reverted: "Already owned"' }))
    expect(await result).toBe(false)
    expect(tray.items[0]).toMatchObject({ status: 'failed', reason: 'Already owned' })
  })

  it('tells a decline in the wallet apart from a failure', async () => {
    await tray.track(WORDS, () => Promise.reject({ code: 'ACTION_REJECTED', shortMessage: 'user rejected action' }))
    expect(tray.items[0]).toMatchObject({ status: 'declined', reason: null })
  })
})
