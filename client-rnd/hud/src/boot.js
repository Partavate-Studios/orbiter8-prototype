// Dev builds: install the dev wallet before the app starts looking for wallets. `?wallet=browser`
// leaves it out, so the real connect flow (an extension pointed at the local chain) can be tried.
const browserWallet = new URLSearchParams(location.search).get('wallet') === 'browser'
if (import.meta.env.DEV && import.meta.env.VITE_DEV_WALLET && !browserWallet) {
  await import('./dev/dev-wallet.js')
}
// The local chain, if this build knows one, joins the SDK's networks before anything reads them.
await import('./dev/local-network.js')
await import('./main.js')
