// Networks the game is deployed on, with the contract addresses on each (dev/local.js writes the
// local chain's; testnets and the launch network join with milestone 6, docs/demo4-plan.md).
// `rpc` is only what we suggest to a wallet when it doesn't know the network yet; game traffic goes through the wallet.

/**
 * @typedef {object} Network
 * @property {number} chainId
 * @property {string} name
 * @property {string} shortName
 * @property {{ name: string, symbol: string, decimals: number }} currency
 * @property {string[]} rpc
 * @property {string[]} explorer   Block explorer base URLs, without a trailing slash.
 * @property {Record<string, string>} contracts  addresses by module: galaxy, pilots, market, credits, ships, planets, deeds, factory, battle, armory
 * @property {string} [sessionFunds]  native currency (decimal string) sent with a session key for gas
 * @property {{ text: string, url?: string }[]} [funding]  How to get gas money: shown on the funds step and the Network panel.
 * @property {{ name: string, tokenUrl: string }} [nftMarket]  Where the game's NFTs can be viewed and traded;
 *   `tokenUrl` has {contract} and {id} placeholders. Networks without one show no market link.
 */

/** Deployed networks. None yet: testnets come with milestone 6. */
const deployed = []

// Dev builds (and `npm run build:local`) only: the chain started by `npm run local`, with addresses
// from dev/local-deployment.json (or -<port>.json for a second copy, dev/local.js CHAIN_PORT). Lazy
// (not eager) so production builds drop the import along with this branch.
const includeLocal = import.meta.env.DEV || import.meta.env.VITE_LOCAL_NETWORK === '1'
const localLoaders = includeLocal ? import.meta.glob('/dev/local-deployment*.json', { import: 'default' }) : {}
const localLoad = localLoaders[`/dev/local-deployment${import.meta.env.VITE_LOCAL_FILE ?? ''}.json`]
const localDeployment = await localLoad?.()

/** @type {Network[]} */
export const networks = [
  ...deployed,
  ...(localDeployment
    ? [
        {
          chainId: localDeployment.chainId,
          name: 'Local Dev Chain',
          shortName: 'Local',
          currency: { name: 'Dev Ether', symbol: 'ETH', decimals: 18 },
          rpc: [localDeployment.rpc],
          explorer: [],
          contracts: localDeployment.contracts,
          funding: [{ text: 'Test accounts on the local chain start with 10,000 ETH.' }]
        }
      ]
    : [])
]

/** @returns {Network | undefined} */
export function networkFor(chainId) {
  return networks.find((network) => network.chainId === Number(chainId))
}

// Names for common networks the game isn't on, so "wrong network" messages can say which one.
const otherNetworkNames = {
  1: 'Ethereum Mainnet',
  10: 'OP Mainnet',
  56: 'BNB Smart Chain',
  137: 'Polygon',
  8453: 'Base',
  17000: 'Holesky',
  42161: 'Arbitrum One',
  59144: 'Linea'
}

/** A display name for any chain id. */
export function chainName(chainId) {
  return networkFor(chainId)?.name ?? otherNetworkNames[Number(chainId)] ?? 'chain ' + chainId
}

/**
 * The NFT market's page for one token on this network, or null if the network has no market.
 * @param {number} chainId
 * @param {string} contract  the token contract's address
 * @param {number | string} id  the token id
 */
export function marketTokenUrl(chainId, contract, id) {
  const market = networkFor(chainId)?.nftMarket
  if (!market || !contract) return null
  return market.tokenUrl.replace('{contract}', contract).replace('{id}', String(id))
}
