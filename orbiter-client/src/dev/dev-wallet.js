// Dev builds only: a minimal EIP-1193 wallet backed by the local chain's unlocked test accounts.
// Lets you play locally without MetaMask. Pick a player with ?account=N (default 1; account 0 deployed the contracts).
const RPC = import.meta.env.VITE_LOCAL_RPC || 'http://127.0.0.1:8545'
const accountIndex = Number(new URLSearchParams(location.search).get('account') ?? 1)

let nextId = 0
async function rpc (method, params = []) {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++nextId, method, params })
  })
  const json = await res.json()
  if (json.error) {
    const err = new Error(json.error.message)
    err.code = json.error.code
    err.data = json.error.data
    throw err
  }
  return json.result
}

const accounts = await rpc('eth_accounts')
const account = accounts[accountIndex]

async function request ({ method, params }) {
  switch (method) {
    case 'eth_requestAccounts':
    case 'eth_accounts':
      return [account]
    case 'wallet_switchEthereumChain':
    case 'wallet_addEthereumChain':
    case 'wallet_watchAsset':
      return null
    default:
      return rpc(method, params)
  }
}

const provider = {
  isDevWallet: true,
  selectedAddress: account,
  request,
  on () {},
  removeListener () {}
}

window.ethereum = provider

// EIP-6963 discovery, so wallet pickers list it too.
const info = { uuid: 'b1d1e7a0-0000-4000-8000-0000000d3a11', name: 'Orbiter 8 Dev Wallet', icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E', rdns: 'com.orbiter8.devwallet' }
const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info, provider }) }))
window.addEventListener('eip6963:requestProvider', announce)
announce()

console.log(`Dev wallet: account #${accountIndex} ${account}`)
