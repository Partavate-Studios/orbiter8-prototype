# ![Orbiter 8](https://partavate.com/orbiter-8-splash.png)

[Orbiter 8](https://orbiter8.com) is a decentralized space game designed for the Ethereum Virtual Machine.

**Features**

- EVM Blockchain native gameplay, fully on-chain
- Lightweight browser-based game client
- Dynamically generated galaxy
- _Massively_ multiplayer
- Ownable ship and planet assets as ERC721 NFTs
- In game current as ERC20 tokens
- Intergalactic tading system
- Temporal chat, uses "broadcasts"

**Awards**

- March 2022: Polygon Studios Grant Winner
- April 2022: Moonriver Grants Hackathon Winner
- Arugust 2022: Bobabeam Hackathon Winner

**Version 0.3.0**

This version of Orbiter 8 is the final manifestration of the original prototype. Work in this demo realizes the final alpha demo on the roadmap to a beta. There will be few (or no) updates to this repository as we focus on beta production using a refresh stack including Vue 3, EhtersJS, and Solidity 8.

**Test Network Deployments**
- [Sepolia](https://sepolia.dev/) (Ethereum)
- [Binance](https://www.bnbchain.org/)
- [Mumbai](https://polygon.technology/) (Polygon)
- [Arbitrum](https://arbitrum.io/)
- [Moonriver](https://moonbeam.network/networks/moonriver/)
- [Moonbase](https://moonbeam.network/networks/moonbeam/)
- [Bobabase](https://boba.network/)
- [Godwoken](http://www.godwoken.com/)
- [Metis](https://www.metis.io/)
- [Metal](https://metalblockchain.org/)

**More Information**

The official Orbiter 8 website: 
https://orbiter8.com

Source for a fully built version of the Demo 3 client: 
https://github.com/Partavate-Studios/orbiter8-demo3-client

A Github hosted instance of the Demo 3 client: 
https://partavate-studios.github.io/orbiter8-demo3-client/ 

Gameplay tutorial video:
https://www.youtube.com/watch?v=cL30sFMYi6A

## Technologies Used:

 - Solidity 0.8 contracts, built and tested with Foundry: https://getfoundry.sh/
 - OpenZeppelin's upgradeable contracts (UUPS proxies)
 - drand's public randomness beacon, for scans: https://drand.love/
 - Vue 3, Pinia and Vite for the client, with ethers 6
 - Any EVM wallet (MetaMask and the like); locally, a built-in dev wallet


## Project Setup

1. Clone the git repository
  > git clone git@gitlab.com:partavate/prototype.git
2. The contracts, from `contracts/` (needs Foundry; installs the libraries)
  > ./setup.sh
3. The client, from `orbiter-client/` (Node 24, see `.nvmrc`)
  > npm install

### Play locally (no wallet extension or testnet needed)

From `orbiter-client/`:

``` bash
npm run local
```

This starts a fresh local chain, deploys the contracts to it, and opens the dev server at http://localhost:8080 with a built-in dev wallet. Add `?account=2`, `?account=3` … to the URL to play as other pilots (account 0 deployed the contracts). Stopping it resets the chain.

Other client scripts: `npm run dev` (dev server, uses your browser wallet), `npm run build`, `npm run preview`, `npm run lint`, `npm test`, and `npm run abi` (copies the contracts' ABIs into the client after an interface change).


## Design Goals

On-chain turn-based gameplay with all game logic handled via Ethereum smart contracts.

Web based game client with no external depdencies other than access to Ethereum.

Dynamically generated game board (galaxy) democratizing the cost of recording the map data to the chain.


## Common Commands While Developing:

From `contracts/` (see its README):

``` bash
forge build --sizes   # build, and check each contract fits the 24 KB limit
forge test            # the contract tests
```

From `orbiter-client/`:

``` bash
npm run local   # local chain, contracts and the game
npm test        # the client tests
npm run lint
```


## Accelerated Learning

The Crypto Zombies tutorial is a fun way to understand the basics of Solidity
https://cryptozombies.io/


## This is a dapp, you need a wallet

Running smart contracts requires some kind of Ethereum wallet. This project assumes you use the metamask wallet available as a plugin for both Firefox and Chrome Web browsers.

Locally, `npm run local` gives the client a built-in dev wallet over the local chain's test accounts, so no extension is needed.

--

Lovingly crafted by [Partavate Studios](https://partavate.com)

Shared under the [GNU Affero General Public License](LICENSE)

#LibertaGalactica
