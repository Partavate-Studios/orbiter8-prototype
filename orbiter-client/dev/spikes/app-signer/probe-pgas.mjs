// What Polkadot Hub TestNet says about PGAS, the gas allowance a person claims (pallet-pgas) and
// that pays fees for product accounts (pallet-pgas-allowance). Usage: node probe-pgas.mjs [ws url]
import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws'

const client = createClient(getWsProvider(process.argv[2] ?? 'wss://asset-hub-paseo-rpc.n.dwellir.com'))
const api = client.getUnsafeApi()
const show = (label, v) => console.log(label, JSON.stringify(v, (k, x) => (typeof x === 'bigint' ? x.toString() : x?.asText ? x.asText() : x)))

const PGAS = await api.constants.Pgas.PgasAssetId()
console.log('PGAS asset id', PGAS)
for (const c of ['PgasClaimAmount', 'MaxClaimsPerPeriodPerPerson', 'MaxClaimsPerPeriodPerLitePerson']) show(c, await api.constants.Pgas[c]())
show('PGAS asset', await api.query.Assets.Asset.getValue(PGAS))
show('PGAS metadata', await api.query.Assets.Metadata.getValue(PGAS))
for (const key of ['PgasClaimAmount', 'AliasFee']) {
  try {
    const entries = await api.query.Parameters.Parameters.getEntries()
    const hit = entries.find((e) => JSON.stringify(e.keyArgs, (k, x) => (typeof x === 'bigint' ? x.toString() : x)).includes(key))
    show(key, hit?.value ?? 'default (not overridden)')
  } catch (e) {
    console.log(key, 'unreadable:', e.message)
    break
  }
}
const holders = await api.query.Assets.Account.getEntries(PGAS)
console.log('PGAS holders', holders.length)
client.destroy()
process.exit(0)
