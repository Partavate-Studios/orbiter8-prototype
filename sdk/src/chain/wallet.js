// Wallet discovery (EIP-6963) and the connected session.
import { BrowserProvider } from 'ethers'

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
 * What went wrong connecting, in terms the player can act on:
 * 'rejected' (they closed or declined the request), 'pending' (a request is already open in the
 * wallet), or 'other'.
 */
export function walletErrorKind(error) {
  const code = error?.code ?? error?.info?.error?.code ?? error?.error?.code
  if (code === 4001 || code === 'ACTION_REJECTED') return 'rejected'
  if (code === -32002) return 'pending'
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
 * The connected wallet. Module state rather than store state: ethers objects must not be
 * wrapped in Vue reactivity.
 * @type {{ wallet: Wallet, provider: BrowserProvider, signer: import('ethers').JsonRpcSigner, account: string, chainId: number } | null}
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

  session = { wallet, provider, signer, account: signer.address, chainId: Number(chainId) }
  return session
}

/** Raw wallet request (network switching, token import). */
export function walletRequest(method, params) {
  return getSession().wallet.provider.request({ method, params })
}
