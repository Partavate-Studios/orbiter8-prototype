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
    // Polkadot Hub's testnet (Paseo Asset Hub): the deployment of 2026-11-18 as EVM bytecode (Sol's
    // asteroids built; reads sized for the testnet's per-read budget; contracts/deployments/420420417.json).
    // Not the PolkaVM one, which predates both (docs/polkadot-direction.md).
    // Throwaway: redeployed at will.
    chainId: 420420417,
    name: 'Polkadot Hub TestNet',
    shortName: 'Hub TestNet',
    currency: { name: 'Paseo', symbol: 'PAS', decimals: 18 },
    rpc: [...devProxy('/__paseo'), 'https://eth-rpc-testnet.polkadot.io/'],
    explorer: ['https://blockscout-testnet.polkadot.io'],
    contracts: {
      credits: '0xfa8906DD349132Ea39CBA2e2a6aBFE9bF1E8a992',
      ships: '0x550Cd9FFb24fa80008Dd46FA73A220Ccd42fAf1c',
      galaxy: '0xf092869BDD44173B0D4Cc983AFD2630E84f2DCd7',
      pilots: '0xc81f848beCa994180bD775e0A64c2aDF09AD5294',
      market: '0xC7C606B80780C8F0F762268Dc646DA08EF9a1eB0',
      deeds: '0x0A5f513579430214dd5561636b676f989A399A38',
      claims: '0x760AF6410a7ce5183BBbF41C82a547d3556F8dD4',
      planets: '0x565eb79F07Be64FbBCc7c5C1E9cF5758418940A9',
      factory: '0xeA9Bf8B92aA02eb035667C718d093cB08ca7DdbE',
      repairs: '0x5404fF7184f16DF54FF5999A0560c5CEBe4fEF55',
      battle: '0x64b9A0b132C8fa8a0948751eDce922B5b641D9dA',
      armory: '0x1E0a9dd9839ebd34Be03F578b70fDd55eF35d789',
      drones: '0x25e9e6CcFeD933f5772583B82aF001EA95605005'
    },
    startBlock: 15_926_240, // a little before the deployment (its first transaction is in block 15,926,253)
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
