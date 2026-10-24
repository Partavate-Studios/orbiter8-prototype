// The dev wallet has to exist before web3 loads, because web3 captures window.ethereum at import time.
if (import.meta.env.DEV && import.meta.env.VITE_DEV_WALLET) {
  await import('./dev/dev-wallet.js')
}
await import('./main.js')
