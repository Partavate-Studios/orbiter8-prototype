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
 * @property {Record<string, string>} contracts  addresses by module: galaxy, pilots, market, credits, ships, planets, claims, deeds, factory, battle, repairs, armory
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
    // Polkadot Hub's testnet (Paseo Asset Hub): the spike's deployment of 2026-11-13 as EVM bytecode
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
      credits: '0x6C7c8cD5c1cd85052170f0Cd3576E54eEe29971C',
      ships: '0x604367E54eD1ffd6fcA0F0D409b44D3CC405aFeE',
      galaxy: '0x3c2041e71235eB455717BDA0CbB39D5Ee8EdA262',
      pilots: '0xC257BED2601b02cab9864aDEEec867022Cb91b48',
      market: '0x23D7060da9c017960f57D78BC946374092E5Ae00',
      deeds: '0x82Fe5957866A76424959DD5402Eaf36E1bF0B6eC',
      planets: '0x81221ABe12217Aa5E0F7c15d55c38E5A943B3b6E',
      factory: '0x9A50F9610d01b299D30add73278339A0eAFd1fdF',
      battle: '0xA755158746f968786E8c425BC2DA6F3296b907bF',
      armory: '0xd199576247ecDc1F0AC23A96fA6e357c94e95c0c'
    },
    startBlock: 15_722_500, // a little before the deployment (Credits' proxy is at 15,722,601)
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
