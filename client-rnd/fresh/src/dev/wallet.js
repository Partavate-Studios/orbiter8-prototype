// The dev wallet: an EIP-1193 provider over the local chain's unlocked accounts, announced through
// EIP-6963 under the rdns the SDK's wallet discovery prefers. No prompts: the chain signs for the
// account itself. `?account=N` picks the pilot (1 is the first account). Requests go to this page's
// own origin (/__chain, proxied by the dev server), which is all a sandboxed Product may reach.
import { DEV_WALLET_RDNS } from '@orbiter8/sdk/chain/wallet'

export function installDevWallet(deployment) {
  const index = Math.max(1, Number(new URLSearchParams(location.search).get('account')) || 1) - 1
  const url = location.origin + '/__chain'
  let id = 0
  let accounts = null
  async function rpc(method, params = []) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params })
    })
    const body = await res.json()
    if (body.error) {
      const error = new Error(body.error.message)
      Object.assign(error, { code: body.error.code, data: body.error.data })
      throw error
    }
    return body.result
  }
  const account = async () => {
    accounts ??= await rpc('eth_accounts')
    return [accounts[index % accounts.length]]
  }
  const provider = {
    isDevWallet: true,
    async request({ method, params }) {
      switch (method) {
        case 'eth_requestAccounts':
        case 'eth_accounts':
          return account()
        case 'eth_chainId':
          return '0x' + deployment.chainId.toString(16)
        case 'wallet_switchEthereumChain':
        case 'wallet_addEthereumChain':
          return null
        default:
          return rpc(method, params)
      }
    },
    on() {},
    removeListener() {}
  }
  const detail = Object.freeze({
    info: { uuid: 'o8-fresh-dev-wallet', name: 'Dev wallet', icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>', rdns: DEV_WALLET_RDNS },
    provider
  })
  const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }))
  window.addEventListener('eip6963:requestProvider', announce)
  announce()
  return provider
}
