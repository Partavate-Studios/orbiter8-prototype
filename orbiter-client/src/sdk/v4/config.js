// Where the Demo 4 contracts live. For now, the local chain started by `npm run local4`
// (dev/local-deployment-v4.json); testnets and the launch network join in milestone 6.
const localLoaders = import.meta.env.DEV ? import.meta.glob('/dev/local-deployment-v4.json', { import: 'default' }) : {}

/** @returns {Promise<{ chainId: number, rpc: string, contracts: { galaxy: string, pilots: string } } | null>} */
export async function deployment() {
  const load = Object.values(localLoaders)[0]
  return load ? load() : null
}
