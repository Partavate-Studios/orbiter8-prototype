// Registrations (callsign, ship) that were sent but not yet mined, remembered across reloads, so a
// player who reloads mid-wait sees "Transmitting…" instead of the form (resubmitting would revert).

const KEY = 'o8.pending'

/**
 * @typedef {{ kind: 'callsign' | 'ship', hash: string, name: string, sentAt: number }} PendingRegistration
 */

const keyFor = (chainId, account) => `${KEY}.${chainId}.${String(account).toLowerCase()}`

/** @returns {PendingRegistration | null} */
export function pendingRegistration(chainId, account) {
  try {
    return JSON.parse(localStorage.getItem(keyFor(chainId, account)) ?? 'null')
  } catch {
    return null
  }
}

/** @param {PendingRegistration} registration */
export function rememberPending(chainId, account, registration) {
  try {
    localStorage.setItem(keyFor(chainId, account), JSON.stringify(registration))
  } catch {
    // storage blocked: a reload just shows the form again
  }
}

export function forgetPending(chainId, account) {
  try {
    localStorage.removeItem(keyFor(chainId, account))
  } catch {
    // nothing to forget
  }
}
