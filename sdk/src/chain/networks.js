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
    // Polkadot Hub's testnet (Paseo Asset Hub): the deployment of 2026-11-19 as EVM bytecode (joining in
    // two moves with corporations, deeds drawn on chain, free discovery claims, the cheat; tagged
    // testnet-2026-11-19; contracts/deployments/420420417.json).
    // Not the PolkaVM one, which predates both (docs/polkadot-direction.md).
    // Throwaway: redeployed at will.
    chainId: 420420417,
    name: 'Polkadot Hub TestNet',
    shortName: 'Hub TestNet',
    currency: { name: 'Paseo', symbol: 'PAS', decimals: 18 },
    rpc: [...devProxy('/__paseo'), 'https://eth-rpc-testnet.polkadot.io/'],
    explorer: ['https://blockscout-testnet.polkadot.io'],
    contracts: {
      credits: '0xa1d46Bf09604865149a12Ddebf4D4e523Ed0Cc46',
      ships: '0x2A4B7f3E3af68058f24Cec5fB627aCF066aa6d40',
      galaxy: '0x9e604b71c607791E35eAdb0566d00152AEb843Ee',
      pilots: '0x05665e804bc1798EE1Fe4691b9df50B33c6db4fB',
      market: '0xc9B0cc64aa549Cf5cE68f80136D760D4390Ec084',
      deeds: '0x2391f64bD65ea187217605c0E5DaE4067301896a',
      claims: '0x8d691EDee9B894964bF6A05A8BbD2D36905806F3',
      planets: '0xF9fB68E3450cd92b77FCFDAd8e3F9a122EfB0387',
      factory: '0xA5485778bEB9829551E0Ce162f3793fdDc6faA33',
      repairs: '0x544284796873c221617627217dA73c3Eb1a1D208',
      battle: '0x0505C504db0297ea35be1A2763E2eEfC7daAE331',
      armory: '0x5A757b12092554D934E7bC253a2D3518Bd8189D9',
      drones: '0x7967e3E8444324A072821C52CE0468f97D2151d3'
    },
    startBlock: 15_977_160, // a little before the deployment (its first transaction is in block 15,977,178)
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
