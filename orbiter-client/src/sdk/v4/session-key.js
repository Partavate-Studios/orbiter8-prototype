// Session keys (docs/demo4-plan.md, D41): the browser makes a throwaway key, the wallet approves it
// once for a few hours of game moves and sends it a little gas money, and from then on moves are
// signed here with no wallet popups. The key can only make game moves (the contracts check), never
// spend credits from the wallet, and it's kept in this browser alone.
import { Wallet, JsonRpcProvider } from 'ethers'

/** How long a session lasts (the contracts allow up to 12 hours). */
export const SESSION_HOURS = 4

const storageKey = (chainId, pilot) => `o8.v4.session.${chainId}.${pilot.toLowerCase()}`

/** The stored key for a pilot on a chain: { privateKey, address, expiry } or null. */
export function loadKey(chainId, pilot) {
  try {
    const raw = localStorage.getItem(storageKey(chainId, pilot))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveKey(chainId, pilot, key) {
  try {
    localStorage.setItem(storageKey(chainId, pilot), JSON.stringify(key))
  } catch {
    // Private windows may refuse storage; the session then lasts until the page closes.
  }
}

export function forgetKey(chainId, pilot) {
  try {
    localStorage.removeItem(storageKey(chainId, pilot))
  } catch {
    // nothing stored
  }
}

/** A fresh key: { privateKey, address }. */
export function newKey() {
  const wallet = Wallet.createRandom()
  return { privateKey: wallet.privateKey, address: wallet.address.toLowerCase() }
}

/** A signer for the key, sending through the network's RPC (D43: smoldot replaces this on Polkadot). */
export function keySigner(privateKey, rpc) {
  return new Wallet(privateKey, new JsonRpcProvider(rpc, undefined, { pollingInterval: 1000 }))
}

/** Sends whatever gas money the key has left back to the pilot's wallet. */
export async function sweep(signer, to) {
  const provider = signer.provider
  const [balance, fees] = await Promise.all([provider.getBalance(signer.address), provider.getFeeData()])
  const price = fees.maxFeePerGas ?? fees.gasPrice
  const cost = 21_000n * price * 2n
  if (balance <= cost) return null
  const tx = await signer.sendTransaction({ to, value: balance - cost, gasLimit: 21_000n, maxFeePerGas: price * 2n })
  return tx.wait()
}
