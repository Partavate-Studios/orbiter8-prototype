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

This version of Orbiter 8 is the final manifestration of the original prototype. Work in this demo realizes the third of four demos on the roadmap to a beta. Features include an ever-expanding procedurally generated world full of stars, planets, moons, ships, and other players. Gamers can navigate the stars, trade at space ports, claim planets, and build space stations. 

There will be no (or few) updates to this repository as production for Demo 4 has since been refactored to use Vue 3, EhtersJS, and Solidity 8.

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

 - Truffle Stack 5: https://github.com/trufflesuite/truffle
 - Eth-Vue Truffle Box: https://truffleframework.com/boxes/eth-vue
 - Vue.js 2: https://vuejs.org/
 - Solidity 5
 - Node.js v8 (will not compile with newer versions)
 - Metamask browser plugin: https://metamask.io/


## Project Setup

1. Clone the git repository
  > git clone git@gitlab.com:partavate/prototype.git
2. To setup the truffle stack stuff, from /prototype
  > npm install
3. To setup the client stuff, from /prototype/orbter-client
  > npm install


## Design Goals

On-chain turn-based gameplay with all game logic handled via Ethereum smart contracts.

Web based game client with no external depdencies other than access to Ethereum.

Dynamically generated game board (galaxy) democratizing the cost of recording the map data to the chain.


## Common Commands While Developing:

### Truffle

``` bash
# Check Contract Size
truffle run contract-size

# Start Truffle Dev Environment
truffle develop

# Optionally monitor RPC activity while the dev environment is running:
truffle develop --log

# Redeploy contracts
migrate --reset

# Get a contracts address
AvatarControls.address

# Getting the Galaxy Up and Running
AvatarControls.deployed().then(function(instance){return instance.createAvatar('The Federation');})
Orbiter8.deployed().then(function(instance){return instance.genesis();})
Orbiter8.deployed().then(function(instance){return instance.makeSolarSystem();})

# Run smart contract tests
test

# Verify contracts
truffle run verify Orbiter8 AvatarControls AvatarLibrary PresetLibrary StarSystemLibrary PlanetLibrary ShipTokens PlanetTokens Credits --network arbitrumTest

```

### Node Client

From the orbiter-client diretory:

``` bash
Inpm install

# Serve with hot reload at localhost:8080 (donno the difference)
npm run serve

# Build for production with minification
npm run build

# Build for production and view the bundle analyzer report
npm run build --report

# There are no client tests
```


## Accelerated Learning

The Crypto Zombies tutorial is a fun way to understand the basics of Solidity
https://cryptozombies.io/


## This is a dapp, you need a wallet

Running smart contracts requires some kind of Ethereum wallet. This project assumes you use the metamask wallet available as a plugin for both Firefox and Chrome Web browsers.

Note: You will also need to configure Metamask to work with your local development
environment. Truffle provides 10 private keys to accounts with 100 Ethereum to use for development and testing.

--

Lovingly crafted by [Partavate Studios](https://partavate.com)

Shared under the [GNU Affero General Public License](LICENSE)

#LibertaGalactica
