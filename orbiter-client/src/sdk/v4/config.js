// Where the Demo 4 contracts live. For now, the local chain started by `npm run local4`
// (dev/local-deployment-v4.json); testnets and the launch network join in milestone 6.
const localLoaders = import.meta.env.DEV ? import.meta.glob('/dev/local-deployment-v4*.json', { import: 'default' }) : {}
const localLoad = localLoaders[`/dev/local-deployment-v4${import.meta.env.VITE_LOCAL4_FILE ?? ''}.json`]

/** @returns {Promise<{ chainId: number, rpc: string, contracts: { galaxy: string, pilots: string } } | null>} */
export async function deployment() {
  return localLoad ? localLoad() : null
}
