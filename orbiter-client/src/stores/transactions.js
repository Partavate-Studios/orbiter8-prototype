// The player's transactions, for the tray (components/transaction-tray.vue). Each goes from waiting for
// the wallet, to sent (waiting to be mined), to done, or to declined (in the wallet) or failed (with
// the reason). Done and declined ones clear themselves after a few seconds; failed ones stay a while
// longer so the reason can be read.
import { defineStore } from 'pinia'
import { walletErrorKind } from '@/sdk/chain/wallet'
import { gameAudio } from '@/libs/08audio'

export const SHOWN_MS = { done: 4000, declined: 4000, failed: 15000 }

let nextId = 1

/** A contract's revert message without the wrapping: 'execution reverted: "Must be unclaimed planet."' → 'Must be unclaimed planet.' */
export function plainReason(reason) {
  const match = /^execution reverted:\s*"?(.*?)"?$/s.exec(reason ?? '')
  return match ? match[1] : reason
}

/**
 * @typedef {object} Transaction
 * @property {number} id
 * @property {string} doing   e.g. 'Claiming Mars'
 * @property {string} done    e.g. 'Mars is yours'
 * @property {string} failed  e.g. "Couldn't claim Mars"
 * @property {'wallet' | 'sent' | 'done' | 'declined' | 'failed'} status
 * @property {string | null} reason  why it failed
 */

export const useTransactionsStore = defineStore('Transactions', {
  state: () => ({
    /** @type {Transaction[]} oldest first */
    items: []
  }),
  actions: {
    /**
     * Runs a transaction and shows its progress. `send(options)` starts it: pass `options` on to the SDK
     * action, so the tray hears when the wallet has sent it. Resolves true if it went through.
     * @param {{ doing: string, done: string, failed: string }} words
     * @param {(options: { onSent: () => void }) => Promise<unknown>} send
     */
    async track(words, send) {
      const id = nextId++
      this.items.push({ id, ...words, status: 'wallet', reason: null })
      const update = (changes) => Object.assign(this.items.find((item) => item.id === id) ?? {}, changes)
      try {
        await send({ onSent: () => update({ status: 'sent' }) })
        update({ status: 'done' })
        this.dismissLater(id, SHOWN_MS.done)
        return true
      } catch (error) {
        const reason = error.shortMessage ?? error.message
        console.error(words.failed + ':', reason)
        const declined = walletErrorKind(error) === 'rejected'
        update(declined ? { status: 'declined' } : { status: 'failed', reason: plainReason(reason) })
        // Declining was the player's own choice; a failure needs their attention.
        if (!declined) gameAudio().speak('failed')
        this.dismissLater(id, declined ? SHOWN_MS.declined : SHOWN_MS.failed)
        return false
      }
    },
    dismiss(id) {
      this.items = this.items.filter((item) => item.id !== id)
    },
    dismissLater(id, ms) {
      setTimeout(() => this.dismiss(id), ms)
    }
  }
})
