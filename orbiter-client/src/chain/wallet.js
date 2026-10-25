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
export function discoverWallets (waitMs = 300) {
  return new Promise(resolve => {
    const found = new Map()
    const onAnnounce = event => found.set(event.detail.info.uuid, event.detail)
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))
    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce)
      const wallets = [...found.values()]
      if (!wallets.length && window.ethereum) {
        wallets.push({ info: { uuid: 'injected', name: 'Browser Wallet', icon: '', rdns: 'injected' }, provider: window.ethereum })
      }
      resolve(wallets)
    }, waitMs)
  })
}

/** The wallet to use without asking: the one picked last time, or the only one installed. */
export function preferredWallet (wallets) {
  let remembered = null
  try {
    remembered = localStorage.getItem(PREFERRED_WALLET_KEY)
  } catch {
    // storage blocked (private mode etc.): just ask again
  }
  return wallets.find(wallet => wallet.info.rdns === remembered) ?? (wallets.length === 1 ? wallets[0] : null)
}

/** Remembers the chosen wallet so the next visit connects to it without asking. */
export function rememberWallet (wallet) {
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

export function getSession () {
  if (!session) throw new Error('Wallet not connected')
  return session
}

/** Requests account access and opens a session. Reloads the page if the wallet switches account or network. */
export async function connectWallet (wallet) {
  const eip1193 = wallet.provider
  const accounts = await eip1193.request({ method: 'eth_requestAccounts' })
  const provider = new BrowserProvider(eip1193)
  const signer = await provider.getSigner(accounts[0])
  const { chainId } = await provider.getNetwork()

  for (const event of ['accountsChanged', 'chainChanged', 'disconnect']) {
    eip1193.on?.(event, () => location.reload())
  }

  session = { wallet, provider, signer, account: signer.address, chainId: Number(chainId) }
  return session
}

/** Raw wallet request (network switching, token import). */
export function walletRequest (method, params) {
  return getSession().wallet.provider.request({ method, params })
}
