# Orbiter 8

Orbiter 8 is a decentralized space game designed for the Ethereum Virtual Machine..

This version of Orbiter 8 is the final manifestration of the original prototype. Work in this demo realizes the third of four demos on the roadmap to a beta. Features include an ever-expanding procedurally generated world full of stars, planets, moons, ships, and other players. Gamers can navigate the stars, trade at space ports, claim planets, and build space stations. 

There will be no (or few) updates to this repository as production for Demo 4 has since been refactored to use Vue 3, EhtersJS, and Solidity 8.

## This project uses the following:

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
