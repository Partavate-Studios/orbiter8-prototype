# @orbiter8/sdk

Orbiter 8's game SDK: reading the game from the chain, keeping its state current, every player
action, and the game's rules as plain functions. It has no UI: every client (`orbiter-client/`, and
experiments in `client-rnd/`) draws from it.

Plain JavaScript modules (ES modules), with `ethers` 6 as the only dependency, provided by the client.
Most modules also run in Node (the play bots and the economy simulator use `hex`, `market`, `drand`).

## Using it from a client

The SDK has no `node_modules` of its own. A Vite client points an alias at it and resolves `ethers`
from its own install (see `orbiter-client/vite.config.js`):

```js
resolve: {
  alias: { '@orbiter8/sdk': fileURLToPath(new URL('../sdk/src', import.meta.url)) },
  dedupe: ['ethers']
},
server: { fs: { allow: ['..'] } }
```

Then `import { game } from '@orbiter8/sdk/client'`. A client with a local chain (`npm run local` writes
`dev/local-deployment.json`) registers it before anything reads the networks:
`addLocalNetwork(deployment)` from `@orbiter8/sdk/chain/networks` (`orbiter-client/src/dev/local-network.js`).

## The modules

**The game client**
- `client.js`: `game`, the game client. It connects a wallet, keeps a plain copy of the game state as
  blocks arrive (`game.state`; `game.subscribe(listener)` reports changes), and offers every player
  action (`game.actions`). Framework-free: a client mirrors what it reports into its own state (orbiter-client's
  `stores/game-bindings.js` does this for Pinia).
- `system.js`: turns a loaded star system into plain game objects (stars, planets, moons, stations,
  ships), keyed by a stable identity, with their relationships and orbits. No drawing data.
- `sync.js`: notices when the game changed on chain.

**The chain**
- `contracts.js`: the game's contracts through ethers (reads and moves), with their results in plain shapes.
- `chain/wallet.js`: wallet discovery (EIP-6963) and the connected session.
- `chain/rpc.js`: blocks, balances, waiting for a transaction.
- `chain/networks.js`: the networks the game runs on and their contract addresses; `addLocalNetwork`.
- `session-key.js`: session keys, so moves go without a wallet popup (D41).
- `event-log.js`: event reads in chunks, then only what's new.
- `network-stats.js`: how busy each network is, without a wallet.
- `pending.js`: registrations sent but not mined yet, across reloads.
- `reverts.js`: why a move was refused, in the player's words.
- `abi/`: the contracts' ABIs (`npm run abi` in orbiter-client refreshes them after a contract change).

**The game's rules** (pure functions, mirroring the contracts; cross-checked by the tests)
- `hex.js`: the hex grid, cell indices counted outward from Sol.
- `traits.js`: a star's spectral class, size and offset, from the universe's seed.
- `system-gen.js`: a star's planets (count, class, size), derived, never stored.
- `market.js`: goods, ports and prices.
- `game/trade.js`: cargo, trades and cargo holds.
- `game/planet-types.js`: planet classes.
- `parts.js`: the parts an Orbiter 8 carries.
- `drand.js`: drand's beacon, for scans (D35).
- `leaderboard.js`: ranking pilots.

**Drawing helpers that any client may use**
- `game/orbits.js`: orbit sizes, speeds and positions over game time.
- `game/docking.js`: which ships are docked at a station.
- `game/bearing.js`: which way, and how prominently, to point at things.
- `ship-art.js`, `ship-designs.js`: the Orbiter 8 drawn as its NFT is (mirroring `ShipArt.sol`), and the ship designs.

## Checks

From `orbiter-client/`: `npm test` runs this SDK's tests with the client's, and `npm run lint` lints it.
