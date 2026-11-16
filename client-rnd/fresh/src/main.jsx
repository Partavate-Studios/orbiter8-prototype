// Boot: register the local chain (if this is a dev run with one), bring up the dev wallet, connect,
// bind the contracts, and hand over to the interface.
import { render } from 'preact'
import { addLocalNetwork } from '@orbiter8/sdk/chain/networks'
import { discoverWallets, preferredWallet, isAuthorized, rememberWallet, walletErrorKind } from '@orbiter8/sdk/chain/wallet'
import { game, ui, set } from './store'
import { installDevWallet } from './dev/wallet'
import { createStage } from './stage/stage'
import { App } from './ui/App'
import './style.css'

// The launcher (dev/local.js) writes this file; a build without it simply has no local network.
const found = import.meta.glob('../dev/local-deployment.json', { eager: true, import: 'default' })
const deployment = Object.values(found)[0] ?? null
if (deployment) addLocalNetwork(deployment)
if (import.meta.env.DEV && deployment && new URLSearchParams(location.search).get('wallet') !== 'browser') {
  installDevWallet(deployment)
  ui.devWallet = true
}

const stage = createStage(document.getElementById('stage'))
stage.onPickStar = (cell) => set({ gsel: cell, open: cell !== null, course: null })

let polling = null
async function enter(wallet) {
  set({ phase: 'boot', error: null })
  try {
    await game.connect(wallet)
    rememberWallet(wallet)
    if (!(await game.bindContracts())) return set({ phase: 'wrongNetwork' })
    await game.refresh()
    set({ phase: 'play' })
    if (game.pendingRegistration()) game.resumeRegistration().catch(() => {})
    polling ??= setInterval(() => game.checkForNewBlock().catch(() => {}), 1500)
  } catch (error) {
    console.warn(error)
    const kind = walletErrorKind(error)
    set({ phase: 'connect', error: kind === 'rejected' ? 'The wallet declined. Try again when you are ready.' : kind === 'pending' ? 'A request is already open in your wallet.' : 'Could not reach the chain. Is it running?' })
  }
}

render(<App stage={stage} enter={enter} />, document.getElementById('app'))

const wallets = await discoverWallets()
ui.wallets = wallets
const preferred = preferredWallet(wallets)
if (preferred && (ui.devWallet || (await isAuthorized(preferred)))) enter(preferred)
else set({ phase: 'connect' })

if (import.meta.env.DEV) Object.assign(window, { __game: game, __ui: ui, __set: set })
