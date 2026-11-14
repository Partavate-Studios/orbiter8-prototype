// Dev builds only: a minimal EIP-1193 wallet, so you can play without MetaMask. Two networks:
// - the local chain (`npm run local`): its unlocked test accounts sign;
// - Polkadot Hub TestNet: a throwaway key per player, made and kept in this browser, topped up with PAS
//   by the dev server (dev/testnet-faucet.js).
// Pick a player with ?account=N (default 1; on the local chain account 0 deployed the contracts). Switch
// networks from the title's Network panel (the game asks the wallet, which remembers the choice and
// reloads the page, as a real wallet does), or with ?network=testnet / ?network=local.
// Both go through the dev server's own origin (vite.config.js), so they also work inside Polkadot
// Desktop, whose sandbox blocks any other address.
const TESTNET = 420420417
const params = new URLSearchParams(location.search)
const accountIndex = Number(params.get('account') ?? 1)
const NETWORK_KEY = 'o8.devwallet.network'

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch {
      // storage blocked: the choice lasts until the page reloads
    }
  }
}

if (params.get('network')) storage.set(NETWORK_KEY, params.get('network') === 'testnet' ? 'testnet' : 'local')
const onTestnet = storage.get(NETWORK_KEY) === 'testnet'
const RPC = location.origin + (onTestnet ? '/__paseo' : '/__chain')

let nextId = 0
async function rpc(method, params = []) {
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

let account
/** On the testnet: an ethers wallet for this player's throwaway key. */
let signer = null
if (onTestnet) {
  const { Wallet, JsonRpcProvider } = await import('ethers')
  const keyName = `o8.devwallet.testnet.${accountIndex}`
  let key = storage.get(keyName)
  if (!key) {
    key = Wallet.createRandom().privateKey
    storage.set(keyName, key)
  }
  signer = new Wallet(key, new JsonRpcProvider(RPC, TESTNET, { staticNetwork: true, pollingInterval: 1000 }))
  account = signer.address
  // A new or spent key gets PAS from the dev server (it skips keys that still have enough).
  try {
    const res = await fetch(location.origin + '/__faucet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address: account })
    })
    const answer = await res.json()
    if (answer.error) console.warn('Dev wallet: no PAS from the dev server:', answer.error)
    else if (answer.hash) console.log('Dev wallet: topped up with PAS', answer.hash)
  } catch (error) {
    console.warn('Dev wallet: the dev server has no faucet', error.message)
  }
} else {
  account = (await rpc('eth_accounts'))[accountIndex]
}

const listeners = {}
/** The network just switched to, answered until the page reloads onto it. */
let switchedTo = null
const emit = (event, value) => (listeners[event] ?? []).forEach((listener) => listener(value))

/** The game asks to switch: remember the network and say so; the game reloads (sdk/chain/wallet.js). */
async function switchTo(chainIdHex) {
  const testnet = Number(chainIdHex) === TESTNET
  const local = !testnet && Number(chainIdHex) === Number(await localChainId())
  if (!testnet && !local) {
    const err = new Error('The dev wallet knows only the local chain and Polkadot Hub TestNet')
    err.code = 4902
    throw err
  }
  if (testnet === onTestnet) return null
  storage.set(NETWORK_KEY, testnet ? 'testnet' : 'local')
  switchedTo = chainIdHex
  setTimeout(() => emit('chainChanged', chainIdHex))
  return null
}

async function localChainId() {
  const res = await fetch(location.origin + '/__chain', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'eth_chainId', params: [] })
  })
  return (await res.json()).result
}

async function request({ method, params }) {
  switch (method) {
    case 'eth_requestAccounts':
    case 'eth_accounts':
      return [account]
    case 'eth_chainId':
      return switchedTo ?? rpc(method, params)
    case 'wallet_switchEthereumChain':
      return switchTo(params[0].chainId)
    case 'wallet_addEthereumChain':
    case 'wallet_watchAsset':
      return null
    case 'eth_sendTransaction':
      if (signer) {
        const [tx] = params
        const sent = await signer.sendTransaction({
          to: tx.to,
          data: tx.data,
          value: tx.value ?? 0n,
          gasLimit: tx.gas ?? tx.gasLimit
        })
        return sent.hash
      }
      return rpc(method, params)
    default:
      return rpc(method, params)
  }
}

const provider = {
  isDevWallet: true,
  selectedAddress: account,
  request,
  on(event, listener) {
    ;(listeners[event] ??= []).push(listener)
  },
  removeListener(event, listener) {
    listeners[event] = (listeners[event] ?? []).filter((l) => l !== listener)
  }
}

// The old way wallets were found. A wallet extension (MetaMask, Rabby…) may already own it as a
// read-only property, so setting it can throw: then it stays theirs. The game finds wallets by EIP-6963
// first (below), and sdk/chain/wallet.js prefers this one whatever else is installed.
try {
  window.ethereum = provider
} catch {
  console.info('Dev wallet: window.ethereum belongs to an extension; found through EIP-6963 instead')
}

// EIP-6963 discovery, so wallet pickers list it too.
const info = {
  uuid: 'b1d1e7a0-0000-4000-8000-0000000d3a11',
  name: 'Orbiter 8 Dev Wallet',
  icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E',
  rdns: 'com.orbiter8.devwallet'
}
const announce = () =>
  window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info, provider }) }))
window.addEventListener('eip6963:requestProvider', announce)
announce()

console.log(`Dev wallet: account #${accountIndex} ${account} on ${onTestnet ? 'Polkadot Hub TestNet' : 'the local chain'}`)
