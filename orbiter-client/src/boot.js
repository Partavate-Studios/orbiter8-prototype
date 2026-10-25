// Dev builds: install the dev wallet before the app starts looking for wallets.
if (import.meta.env.DEV && import.meta.env.VITE_DEV_WALLET) {
  await import('./dev/dev-wallet.js')
}
await import('./main.js')
