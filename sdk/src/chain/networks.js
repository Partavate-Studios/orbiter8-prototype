// Networks the game is deployed on, with the contract addresses on each (dev/local.js writes the
// local chain's; testnets and the launch network join with milestone 6, docs/demo4-plan.md).
// `rpc[0]` is where the game reads (sdk/chain/wallet.js: straight to the network, not through the wallet,
// which only signs and sends), and what we suggest to a wallet that doesn't know the network yet.

/**
 * @typedef {object} Network
 * @property {number} chainId
 * @property {string} name
 * @property {string} shortName
 * @property {{ name: string, symbol: string, decimals: number }} currency
 * @property {string[]} rpc
 * @property {string[]} explorer   Block explorer base URLs, without a trailing slash.
 * @property {Record<string, string>} contracts  addresses by module: galaxy, pilots, market, credits, ships, planets, claims, deeds, factory, battle, repairs, armory, drones
 * @property {number} [startBlock]  the block the contracts were deployed at: no game events before it, so
 *   event reads start there (0 when not given; set it for every public network, or the first read walks the chain)
 * @property {string} [sessionFunds]  native currency (decimal string) sent with a session key for gas
 * @property {{ text: string, url?: string }[]} [funding]  How to get gas money: shown on the funds step and the Network panel.
 * @property {{ name: string, tokenUrl: string }} [nftMarket]  Where the game's NFTs can be viewed and traded;
 *   `tokenUrl` has {contract} and {id} placeholders. Networks without one show no market link.
 */

/** On the dev server, an RPC proxied through the game's own origin (vite.config.js): a Polkadot Desktop
 * Product may only reach its own localhost port. Listed first, before the public address. */
const devProxy = (route) => (import.meta.env?.DEV && typeof location !== 'undefined' ? [location.origin + route] : [])

/** Deployed networks. */
const deployed = [
  {
    // Polkadot Hub's testnet (Paseo Asset Hub): the expansion's deployment of 2026-11-17 as EVM bytecode
    // (contracts/deployments/420420417.json). Not the PolkaVM one: there, reads that return long lists
    // (Sol's ports and planets, the galaxy map) fail on resolc's default memory (docs/polkadot-direction.md).
    // Throwaway: redeployed at will.
    chainId: 420420417,
    name: 'Polkadot Hub TestNet',
    shortName: 'Hub TestNet',
    currency: { name: 'Paseo', symbol: 'PAS', decimals: 18 },
    rpc: [...devProxy('/__paseo'), 'https://eth-rpc-testnet.polkadot.io/'],
    explorer: ['https://blockscout-testnet.polkadot.io'],
    contracts: {
      credits: '0xAfAB2AB6C936818a607959df82B04d810824d12E',
      ships: '0x31181bc0111Fd42dd97c62731955954b62D53561',
      galaxy: '0xCae9699f87e7EbaA5C2848E6f0645d7B9C91ea54',
      pilots: '0xacaaA65F0C81A8F1ADDe5375725832268667E176',
      market: '0x829667186B72b714cBD87C2BCC71Ae8b5964b9BB',
      deeds: '0x0d87E6D29E4c58af689e131903f1577139774edD',
      claims: '0x3C05bF51756FeD11f23EBfCdE3bF4Bcb6D067b4E',
      planets: '0xA978319251D6e6D3E27f1Fc6CB01dE4e2A4C636a',
      factory: '0xCBD715D2836524a3bf41A9653C332aee6B50B71b',
      repairs: '0xe1839052a951E995F6f776a187dC06aBA059dd06',
      battle: '0xa2Cd562aE9308F9386f38525a51e2eEe7C987693',
      armory: '0xB50793211f47a8F73e9aed78E40f0beb070C6793',
      drones: '0x1A1a7A4c94Aa180D2b174cFb9689D22c60B5d65e'
    },
    startBlock: 15_888_350, // a little before the deployment (its first transaction is after 15,888,360)
    sessionFunds: '2', // a move costs about 0.01–0.04 PAS
    funding: [{ text: 'Polkadot faucet (choose Polkadot Hub TestNet)', url: 'https://faucet.polkadot.io/' }]
  }
]

/** @type {Network[]} Every network the game knows: the deployed ones, plus a local chain a client registers. */
export const networks = [...deployed]

/**
 * A client's local chain (`npm run local` writes its deployment file: { chainId, rpc, contracts }).
 * Clients register it at startup, before anything reads the networks (orbiter-client's
 * src/dev/local-network.js), so the SDK doesn't depend on any one client's files or bundler.
 */
export function addLocalNetwork(deployment) {
  if (!deployment || networks.some((n) => n.chainId === deployment.chainId)) return
  networks.push({
    chainId: deployment.chainId,
    name: 'Local Dev Chain',
    shortName: 'Local',
    currency: { name: 'Dev Ether', symbol: 'ETH', decimals: 18 },
    rpc: [...devProxy('/__chain'), deployment.rpc],
    explorer: [],
    contracts: deployment.contracts,
    funding: [{ text: 'Test accounts on the local chain start with 10,000 ETH.' }]
  })
}

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
