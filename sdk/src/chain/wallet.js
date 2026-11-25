// Wallet discovery (EIP-6963) and the connected session.
import { AbstractSigner, BrowserProvider, JsonRpcProvider, TransactionResponse } from 'ethers'
import { networkFor } from './networks'
import { timedRequest } from './timed-request'

const PREFERRED_WALLET_KEY = 'o8.wallet'

/**
 * @typedef {{ uuid: string, name: string, icon: string, rdns: string }} WalletInfo
 * @typedef {{ info: WalletInfo, provider: import('ethers').Eip1193Provider & { on?: Function } }} Wallet
 */

/**
 * Asks installed wallets to announce themselves (EIP-6963). Wallets that predate the
 * standard only inject window.ethereum, so that is used when nothing announces.
 * @returns {Promise<Wallet[]>}
 */
export function discoverWallets(waitMs = 300) {
  return new Promise((resolve) => {
    const found = new Map()
    const onAnnounce = (event) => found.set(event.detail.info.uuid, event.detail)
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))
    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce)
      const wallets = [...found.values()]
      if (!wallets.length && window.ethereum) {
        wallets.push({
          info: { uuid: 'injected', name: 'Browser Wallet', icon: '', rdns: 'injected' },
          provider: window.ethereum
        })
      }
      resolve(wallets)
    }, waitMs)
  })
}

/** The dev build's own wallet over the local chain's test accounts (src/dev/dev-wallet.js). */
export const DEV_WALLET_RDNS = 'com.orbiter8.devwallet'

/**
 * The wallet to use without asking: under `npm run local`, the dev wallet (whatever else is
 * installed); otherwise the one picked last time, or the only one installed.
 */
export function preferredWallet(wallets) {
  const dev = wallets.find((wallet) => wallet.info.rdns === DEV_WALLET_RDNS)
  if (dev) return dev
  let remembered = null
  try {
    remembered = localStorage.getItem(PREFERRED_WALLET_KEY)
  } catch {
    // storage blocked (private mode etc.): just ask again
  }
  return wallets.find((wallet) => wallet.info.rdns === remembered) ?? (wallets.length === 1 ? wallets[0] : null)
}

/**
 * Whether the wallet already lets this site see an account, asked without a popup (`eth_accounts`).
 * A returning player's wallet says yes, so the game can connect without asking.
 */
export async function isAuthorized(wallet) {
  try {
    const accounts = await wallet.provider.request({ method: 'eth_accounts' })
    return Array.isArray(accounts) && accounts.length > 0
  } catch {
    return false
  }
}

/**
 * What went wrong with the wallet, in terms the player can act on:
 * 'rejected' (they closed or declined the request), 'pending' (a request is already open in the
 * wallet), 'unauthorized' (the wallet won't let this site use the account: locked, or access taken
 * away; EIP-1193's 4100), or 'other'. Ethers wraps a code it doesn't know ("could not coalesce error"),
 * so the wallet's own code is looked for inside too.
 */
export function walletErrorKind(error) {
  const codes = [error?.code, error?.info?.error?.code, error?.error?.code, error?.cause?.code]
  if (codes.some((code) => code === 4001 || code === 'ACTION_REJECTED')) return 'rejected'
  if (codes.includes(-32002)) return 'pending'
  if (codes.includes(4100)) return 'unauthorized'
  return 'other'
}

/** On a phone without a wallet extension: a link that opens this page inside MetaMask's own browser. */
export function walletAppLink() {
  const isPhone = navigator.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  if (!isPhone) return null
  return 'https://metamask.app.link/dapp/' + location.host + location.pathname + location.hash
}

/** Remembers the chosen wallet so the next visit connects to it without asking. */
export function rememberWallet(wallet) {
  try {
    localStorage.setItem(PREFERRED_WALLET_KEY, wallet.info.rdns)
  } catch {
    // not fatal
  }
}

/**
 * The wallet's signer, with reads and receipt waits sent straight to the network's own RPC instead of
 * through the wallet. A wallet relays every read to whatever RPC the player gave it for the network
 * (maybe a lagging or different one) with no time limit, and queues them behind its own work: on the
 * testnet a read stuck there left moves "waiting for the network" long after they had landed, and the
 * map showed planets already claimed as free. The wallet still signs and sends.
 */
class WalletSigner extends AbstractSigner {
  constructor(wallet, reader) {
    super(reader)
    this.wallet = wallet
    this.address = wallet.address
  }
  connect() {
    throw new Error('The wallet signer is bound to its own network')
  }
  getAddress() {
    return this.wallet.getAddress()
  }
  signTransaction(tx) {
    return this.wallet.signTransaction(tx)
  }
  signMessage(message) {
    return this.wallet.signMessage(message)
  }
  signTypedData(domain, types, value) {
    return this.wallet.signTypedData(domain, types, value)
  }
  async sendTransaction(tx) {
    // The gas limit from our own estimate (with the SDK's margin, chain/gas.js), not the wallet's.
    if (tx.gasLimit == null) tx = { ...tx, gasLimit: await this.estimateGas({ ...tx, from: this.address }) }
    let sent
    try {
      sent = await this.wallet.sendTransaction(tx)
    } catch (error) {
      if (walletErrorKind(error) !== 'unauthorized') throw error
      // The wallet no longer lets this site use the account: MetaMask answers 4100 once it has locked
      // itself, or when the site's access was taken away while the page stayed open (Koda, 2026-11-24:
      // a registration failed with "could not coalesce error"). Asking for access again opens its unlock
      // or connect window; with the same account back, the move goes once more.
      const accounts = await this.wallet.provider.send('eth_requestAccounts', []).catch(() => [])
      const same = accounts.some((a) => a.toLowerCase() === this.address.toLowerCase())
      if (!same) throw unauthorized(this.address, error)
      sent = await this.wallet.sendTransaction(tx).catch((again) => {
        throw walletErrorKind(again) === 'unauthorized' ? unauthorized(this.address, again) : again
      })
    }
    return new TransactionResponse(sent, this.provider)
  }
}

/** The wallet won't sign for `address` on this site: an error that says what to do about it. */
function unauthorized(address, cause) {
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`
  const message = `your wallet isn't letting this site use ${short}. Unlock it, connect that account to this site, and try again`
  const error = new Error(message, { cause })
  error.code = 4100
  error.reason = message
  error.shortMessage = message
  return error
}

/** A direct provider for a network the game knows, or null (an unknown network stays with the wallet). */
function readerFor(chainId) {
  const url = networkFor(chainId)?.rpc?.[0]
  if (!url) return null
  return new JsonRpcProvider(timedRequest(url), chainId, { staticNetwork: true, pollingInterval: 2000, batchMaxCount: 20 })
}

/**
 * The connected wallet. Module state rather than store state: ethers objects must not be
 * wrapped in Vue reactivity.
 * `provider` reads (the network's RPC when the game knows the network, else the wallet); `walletProvider`
 * is the wallet's own.
 * @type {{ wallet: Wallet, provider: import('ethers').Provider, walletProvider: BrowserProvider, signer: import('ethers').Signer, account: string, chainId: number } | null}
 */
let session = null

export function getSession() {
  if (!session) throw new Error('Wallet not connected')
  return session
}

/** Providers whose account and network changes are already watched (one set of listeners each). */
const watched = new WeakSet()

/**
 * Requests account access and opens a session. Reloads the page if the wallet switches account or
 * network, so every store starts over on the new one. A wallet's 'disconnect' (it lost its own
 * connection to the chain) is not a reason to reload: the block watcher reports lost contact and
 * recovers by itself.
 */
export async function connectWallet(wallet) {
  const eip1193 = wallet.provider
  const accounts = await eip1193.request({ method: 'eth_requestAccounts' })
  // Some wallets answer a declined request with an empty list instead of an error.
  if (!Array.isArray(accounts) || !accounts.length) {
    const declined = new Error('No account was shared.')
    declined.code = 4001
    throw declined
  }
  const provider = new BrowserProvider(eip1193)
  const signer = await provider.getSigner(accounts[0])
  const { chainId } = await provider.getNetwork()

  if (!watched.has(eip1193)) {
    watched.add(eip1193)
    for (const event of ['accountsChanged', 'chainChanged']) {
      eip1193.on?.(event, () => location.reload())
    }
    eip1193.on?.('disconnect', (error) => console.warn('The wallet lost its connection to the chain:', error?.message ?? error))
  }

  const reader = readerFor(Number(chainId))
  session = {
    wallet,
    provider: reader ?? provider,
    walletProvider: provider,
    signer: reader ? new WalletSigner(signer, reader) : signer,
    account: signer.address,
    chainId: Number(chainId)
  }
  return session
}

/** Raw wallet request (network switching, token import). */
export function walletRequest(method, params) {
  return getSession().wallet.provider.request({ method, params })
}
