// Native balance of a Substrate account on Polkadot Hub TestNet, at the best block, and whether its
// H160 is mapped for pallet-revive. Usage: node balance.mjs <ss58 address>
import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws'
import { h160Of } from './h160.mjs'

const client = createClient(getWsProvider(process.env.WS ?? 'wss://asset-hub-paseo-rpc.n.dwellir.com'))
const api = client.getUnsafeApi()
const account = await api.query.System.Account.getValue(process.argv[2], { at: 'best' })
const h160 = h160Of(process.argv[2])
const original = await api.query.Revive.OriginalAccount.getValue(h160.toLowerCase(), { at: 'best' })
console.log(process.argv[2], 'free', Number(account.data.free) / 1e10, 'PAS', 'reserved', Number(account.data.reserved) / 1e10,
  'nonce', account.nonce, 'H160', h160, 'mapped', original !== undefined)
client.destroy()
process.exit(0)
