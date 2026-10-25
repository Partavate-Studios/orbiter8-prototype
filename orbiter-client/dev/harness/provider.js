// Injected before page scripts: a minimal EIP-1193 wallet backed by the local hardhat chain.
;(() => {
  const RPC = window.__TEST_RPC || 'http://127.0.0.1:8545'
  const ACCOUNT = window.__TEST_ACCOUNT || '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
  let id = 0
  const rpc = async (method, params = []) => {
    const res = await fetch(RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params })
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
  const request = async ({ method, params }) => {
    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return [ACCOUNT]
      case 'wallet_switchEthereumChain':
      case 'wallet_addEthereumChain':
      case 'wallet_watchAsset':
        return null
      default:
        return rpc(method, params)
    }
  }
  const provider = {
    isMetaMask: true,
    selectedAddress: ACCOUNT,
    request,
    send(payload, cb) {
      if (typeof payload === 'string') return request({ method: payload, params: cb })
      return this.sendAsync(payload, cb)
    },
    sendAsync(payload, cb) {
      request(payload).then(
        (result) => cb(null, { jsonrpc: '2.0', id: payload.id, result }),
        (error) =>
          cb(error, {
            jsonrpc: '2.0',
            id: payload.id,
            error: { code: error.code, message: error.message, data: error.data }
          })
      )
    },
    on() {},
    removeListener() {},
    enable() {
      return request({ method: 'eth_requestAccounts' })
    }
  }
  window.ethereum = provider
  window.__testProvider = provider
  // EIP-6963 announcement, so a modern client can discover this wallet too.
  const announce = () =>
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: Object.freeze({
          info: {
            uuid: '00000000-0000-4000-8000-000000000000',
            name: 'Test Wallet',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
            rdns: 'dev.orbiter8.testwallet'
          },
          provider
        })
      })
    )
  window.addEventListener('eip6963:requestProvider', announce)
  announce()
})()
