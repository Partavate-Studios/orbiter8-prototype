// Networks the game is deployed on, with the contract addresses on each.
// Addresses come from the Truffle artifacts' `networks` entries (see UPGRADE_NOTES.md, Phase 3).
// `rpc` is only what we suggest to a wallet when it doesn't know the network yet; game traffic goes through the wallet.

/**
 * @typedef {object} Network
 * @property {number} chainId
 * @property {string} name
 * @property {string} shortName
 * @property {{ name: string, symbol: string, decimals: number }} currency
 * @property {string[]} rpc
 * @property {string[]} explorer   Block explorer base URLs, without a trailing slash.
 * @property {{ Orbiter8: string, AvatarControls: string }} contracts
 * @property {{ text: string, url?: string }[]} [funding]  How to get gas money, shown on the preflight screen.
 * @property {{ name: string, tokenUrl: string }} [nftMarket]  Where the game's NFTs can be viewed and traded;
 *   `tokenUrl` has {contract} and {id} placeholders. Networks without one show no market link.
 */

/** @type {Network[]} */
const deployed = [
  {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    shortName: 'Sepolia',
    currency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpc: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://sepolia.drpc.org'],
    explorer: ['https://sepolia.etherscan.io'],
    contracts: {
      Orbiter8: '0xdd86445C07e140f284eE10A4c39dF7C568d88865',
      AvatarControls: '0x1bde28Bf4e0224A72EbC309992B0A5b32262b47A'
    },
    funding: [{ text: 'Get test ETH from Sepolia Faucet ↗', url: 'https://sepolia-faucet.com/' }],
    // OpenSea closed its testnets in 2025; Rarible's testnet indexes Sepolia.
    nftMarket: { name: 'Rarible', tokenUrl: 'https://testnet.rarible.com/token/{contract}:{id}' }
  },
  {
    chainId: 97,
    name: 'Binance Smartchain Testnet',
    shortName: 'Binance',
    currency: { name: 'Binance Coin', symbol: 'BNB', decimals: 18 },
    rpc: ['https://data-seed-prebsc-1-s1.bnbchain.org:8545'],
    explorer: ['https://testnet.bscscan.com'],
    contracts: {
      Orbiter8: '0x7224299E42180251C90621038bDCC8658589f685',
      AvatarControls: '0xc48E08D9367CbC7ebFA363A9467b3c9da286C99D'
    },
    funding: [{ text: "Get test BNB from a Binance's Faucet ↗", url: 'https://testnet.binance.org/faucet-smart/' }]
  },
  {
    chainId: 1285,
    // A production network (real MOVR), despite the "Alpha" label; kept as-is for now (see UPGRADE_NOTES.md).
    name: 'Moonriver Alpha',
    shortName: 'Moonriver',
    currency: { name: 'MOVR', symbol: 'MOVR', decimals: 18 },
    rpc: ['https://rpc.api.moonriver.moonbeam.network', 'https://moonriver.unitedbloc.com'],
    explorer: ['https://moonriver.moonscan.io'],
    contracts: {
      Orbiter8: '0xC761B452726680704Fc7079B12e3e690665B91Ca',
      AvatarControls: '0x2460ED133589F70254f18277F42EDF539221C747'
    },
    funding: [
      { text: 'Trade for MOVR tokens with the ' },
      { text: 'Moonbeam App ↗', url: 'https://moonbeam.network/networks/moonriver/' }
    ]
  },
  {
    chainId: 1287,
    name: 'Moonbase Alpha',
    shortName: 'Moonbase',
    currency: { name: 'DEV MOVR', symbol: 'DEV', decimals: 18 },
    rpc: ['https://rpc.api.moonbase.moonbeam.network', 'https://moonbase-alpha.drpc.org'],
    explorer: ['https://moonbase.moonscan.io'],
    contracts: {
      Orbiter8: '0x97A5be2aeA8397d7d3A82eC542d302852C1C1D28',
      AvatarControls: '0x9ede095a708438E1063776d02a2dc730D029976b'
    },
    funding: [
      { text: 'Get DEV tokens by ' },
      {
        text: 'following this documentation ↗',
        url: 'https://docs.moonbeam.network/builders/get-started/networks/moonbase/'
      }
    ]
  }
]

// Dev builds only: the chain started by `npm run local`, with addresses from dev/local-deployment.json.
// Lazy (not eager) so production builds drop the import along with this branch.
const localLoaders = import.meta.env.DEV ? import.meta.glob('/dev/local-deployment.json', { import: 'default' }) : {}
const localDeployment = await Object.values(localLoaders)[0]?.()

/** @type {Network[]} */
export const networks = localDeployment
  ? [
      ...deployed,
      {
        chainId: localDeployment.chainId,
        name: 'Local Dev Chain',
        shortName: 'Local',
        currency: { name: 'Dev Ether', symbol: 'ETH', decimals: 18 },
        rpc: ['http://127.0.0.1:8545'],
        explorer: [],
        contracts: {
          Orbiter8: localDeployment.contracts.Orbiter8,
          AvatarControls: localDeployment.contracts.AvatarControls
        },
        funding: [{ text: 'Test accounts on the local chain start with 10,000 ETH.' }]
      }
    ]
  : deployed

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
