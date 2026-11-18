// Lists who is bound to a personhood alias on an Asset Hub (pallet alias-accounts), by context.
// Milestone 7 spike (docs/polkadot-direction.md). Usage:
//   node probe-aliases.mjs wss://asset-hub-paseo-rpc.n.dwellir.com
import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws'

const url = process.argv[2] ?? 'wss://asset-hub-paseo-rpc.n.dwellir.com'
const client = createClient(getWsProvider(url))
const api = client.getUnsafeApi()
const hex = (v) => (v?.asHex ? v.asHex() : typeof v === 'bigint' ? v.toString() : v)

const entries = await api.query.AliasAccounts.AccountToAlias.getEntries()
console.log(`${entries.length} accounts bound to an alias`)
const byContext = new Map()
for (const { keyArgs, value } of entries) {
  const context = hex(value.ca.context)
  const list = byContext.get(context) ?? []
  list.push({ account: keyArgs[0], collection: hex(value.collection), ring: value.ring, revision: value.revision })
  byContext.set(context, list)
}
for (const [context, list] of [...byContext].sort((a, b) => b[1].length - a[1].length).slice(0, 10)) {
  console.log(context, list.length, JSON.stringify(list[0]))
}
client.destroy()
process.exit(0)
