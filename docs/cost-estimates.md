# What Orbiter 8 costs to play

Measured 2026-11-01 in a real play session on the local chain (Hardhat), with the Demo 3 contracts as
deployed. A fresh pilot played through the game's own client and wallet (the harness's play bot,
`orbiter-client/dev/harness/play-bot.js`) with two goals from Koda: **max out the cargo holds** and
**build a station**. Both were reached.

**How to use these numbers.** Gas is what a move costs in work; it's the same on any EVM network
running these contracts. What a player pays is gas × the network's gas price × its coin's price, and
both prices move all the time. The tables below give quiet, typical and busy cases, with prices as
of 2026-11-01. Re-run the arithmetic with today's prices when deciding on a network.

## Gas per move

| Move | Gas | Notes |
|---|---:|---|
| Register a call sign | 96,306 | once |
| Launch a ship | 383,606 | once; comes with 5 holds and 100 credits |
| Trade at a port | 108,000–133,000 (117,726 average) | buying and selling in one move |
| Buy cargo holds | 82,500–82,900 | any number in one move |
| Jump to a charted star | 74,700–87,100 | |
| Jump to an unexplored star | **2,494,254** | the jump generates the new system on chain |
| Claim a planet | 177,354 | free in credits |
| Build a station | 171,875 | plus 10,000 credits; needs a planet you own |
| Rename | 34,272 | |
| Broadcast (chat) | 25,145 | |

## The two goals

| Goal | Moves | Gas |
|---|---|---:|
| Sign up, then reach 250 holds | 2 to sign up, 47 trades and 25 hold purchases | 8,082,833 |
| Then build a station | a jump to an unexplored star, a claim, a build | 2,843,483 |

Starting with 5 holds and 100 credits, each trade earned about 60 credits per unit carried. Every hold
costs 250 credits, so holds pay for themselves within about five trades and the fleet grows by
roughly a fifth per trade. The first trade could afford a single unit. 250 holds took 61,250 credits
in holds; the pilot ended with 143,032 credits, so a station was easily affordable.

## In money (prices of 2026-11-01)

Assumptions: ETH $2,300, BNB $700, POL $0.09. Gas prices, quiet / typical / busy: Ethereum 0.4 / 2 /
30 gwei; Base, Arbitrum and Optimism 0.005 / 0.02 / 0.2 gwei; BNB Chain 0.05 / 0.1 / 1 gwei; Polygon
PoS 30 / 100 / 500 gwei. Typical first, then the quiet to busy range.

| | Ethereum | Base / Arbitrum / Optimism | BNB Chain | Polygon PoS |
|---|---|---|---|---|
| Sign-up | $2.21 ($0.44–$33) | $0.022 ($0.006–$0.22) | $0.034 ($0.017–$0.34) | $0.004 ($0.001–$0.02) |
| One trade | $0.54 ($0.11–$8.12) | $0.005 ($0.001–$0.05) | $0.008 ($0.004–$0.08) | $0.001 (under $0.01) |
| Buy holds | $0.38 ($0.08–$5.71) | $0.004 ($0.001–$0.04) | $0.006 ($0.003–$0.06) | under $0.001 |
| Jump, charted | $0.37 ($0.07–$5.58) | $0.004 ($0.001–$0.04) | $0.006 ($0.003–$0.06) | under $0.001 |
| Jump, unexplored | $11.47 ($2.29–$172) | $0.12 ($0.03–$1.15) | $0.18 ($0.09–$1.75) | $0.02 ($0.007–$0.11) |
| Claim / build | about $0.80 each ($0.16–$12) | about $0.008 each | about $0.012 each | about $0.0015 each |
| **Sign-up to 250 holds** | **$37 ($7–$558)** | **$0.37 ($0.09–$3.72)** | **$0.57 ($0.28–$5.66)** | **$0.07 ($0.02–$0.36)** |
| **Then a station** | **$13 ($2.62–$196)** | **$0.13 ($0.03–$1.31)** | **$0.20 ($0.10–$1.99)** | **$0.03 ($0.008–$0.13)** |

**Caveats:**
- Rollups (Base, Arbitrum, Optimism) also charge for posting the transaction's data to Ethereum. Since blobs (2024) that's usually a fraction of a cent for transactions this size, but it rises when Ethereum is busy.
- Arbitrum counts gas differently from other EVM chains, so its gas per move can differ a little from these figures.
- Moonriver and Moonbeam, where the game has run, aren't priced here.
- On Ethereum mainnet, the grind alone (about 72 moves) costs tens of dollars on a typical day and hundreds on a busy one. On any of the cheaper networks, a whole progression costs well under a dollar.

## Base, Arbitrum One and Polkadot Hub (added 2026-11-01)

Base and Arbitrum One are the busiest rollups; Polkadot Hub is Polkadot's own smart-contract chain
(Revive, live since January 2026), which runs EVM bytecode unmodified.

Assumptions: ETH $2,300 and DOT $0.955.
- **Base:** 0.005 / 0.008 / 0.1 gwei. 0.005 gwei is the minimum base fee. Base charges the Ethereum data fee separately, which adds about $0.0001–$0.0003 a move on a normal day.
- **Arbitrum One:** 0.01 / 0.02 / 0.1 gwei. 0.02 gwei is the floor since January 2026, and governance can move it between 0.01 and 0.10. Arbitrum's gas already includes the Ethereum data fee.
- **Polkadot Hub:** no published fees for contract calls yet. Its docs estimate a plain transfer at 0.00147 DOT, which is scaled here by gas (a plain transfer is 21,000 gas), at half / one / five times that for quiet / typical / busy. **This is the roughest estimate here:** Polkadot Hub prices by weight and transaction length, not EVM gas, and holds a refundable deposit for new storage. That deposit could add noticeably to moves that create storage, such as a ship launch or a jump into an unexplored star (which writes a whole new system).

| | Base | Arbitrum One | Polkadot Hub |
|---|---|---|---|
| Sign-up | $0.009 ($0.006–$0.11) | $0.022 ($0.011–$0.11) | $0.032 ($0.016–$0.16) |
| One trade | $0.002 ($0.001–$0.027) | $0.005 ($0.003–$0.027) | $0.008 ($0.004–$0.039) |
| Buy holds | $0.0015 ($0.001–$0.019) | $0.004 ($0.002–$0.019) | $0.006 ($0.003–$0.028) |
| Jump, charted | $0.0015 ($0.001–$0.019) | $0.004 ($0.002–$0.019) | $0.005 ($0.003–$0.027) |
| Jump, unexplored | $0.046 ($0.029–$0.57) | $0.12 ($0.057–$0.57) | $0.17 ($0.083–$0.83) |
| Claim / build | about $0.003 each | about $0.008 each | about $0.012 each |
| **Sign-up to 250 holds** | **$0.15 ($0.09–$1.86)** | **$0.37 ($0.19–$1.86)** | **$0.54 ($0.27–$2.70)** |
| **Then a station** | **$0.05 ($0.03–$0.65)** | **$0.13 ($0.07–$0.65)** | **$0.19 ($0.10–$0.95)** |

**To firm up Polkadot Hub,** deploy a copy of the contracts to Polkadot Hub's testnet and run the play bot there: it would give the real fees, deposits included.

**Moonbeam, Moonriver and Moonbase Alpha have shut down** (maintenance mode from 2026-08-01; transactions are rejected). The client still lists Moonriver and Moonbase Alpha.

## Demo 4, measured locally (added 2026-11-07)

Gas from Demo 4's contracts on Foundry's local chain: the exploring and trading bots
(`orbiter-client/dev/harness/explore-bot4.mjs`, `trade-bot4.mjs`) and Foundry's gas reports. Polkadot
Hub's storage deposits aren't in these: they wait for the local Polkadot node (`docs/demo4-plan.md`, B3).
Typical prices, as above (Base 0.008 gwei, Arbitrum One 0.02 gwei, Polkadot Hub scaled from a transfer).

| Move | Demo 4 gas | Demo 3 gas | Base | Arbitrum One | Polkadot Hub |
|---|---:|---:|---|---|---|
| Sign-up (call sign and ship) | 290,000 | 480,000 | $0.005 | $0.013 | $0.019 |
| Start a session (once per 4 hours) | 114,000 | none | $0.002 | $0.005 | $0.008 |
| One trade (sell and buy) | 180,000 | 118,000 | $0.003 | $0.008 | $0.012 |
| Buy bays | 96,000 | 83,000 | $0.002 | $0.004 | $0.006 |
| Jump, charted | 96,000 | 81,000 | $0.002 | $0.004 | $0.006 |
| **Jump to a new star, with its scan** | **508,000** | **2,494,000** | $0.009 | $0.023 | $0.034 |
| Claim a planet | 202,000 | 177,000 | $0.004 | $0.009 | $0.014 |
| Start a building | 108,000 | 172,000 | $0.002 | $0.005 | $0.007 |
| Lay siege | 280,000 | none | $0.005 | $0.013 | $0.019 |

**An hour of play costs about $0.80 on Base, $2 on Arbitrum One and $3 on Polkadot Hub,** at the tuning's pace of a
trade every 15 seconds (`docs/demo4-tuning.md`), about 240 moves. With a session key, the key pays these from the gas
money the wallet sent it. Two ways to bring it down, if wanted: fewer, bigger moves (the tuning could assume a slower
pace), or cheaper trades (Market holding cargo itself would save the calls between modules, `docs/demo4-plan.md` B24).

## Load on the network's nodes (RPC)

Reads are free in gas, but they count against the node provider's limits (Infura, Alchemy, a public
endpoint), and with MetaMask they go through the wallet's provider.

- **Every reload of the game reads about 125–140 times from the chain** (mostly `eth_call`: the player, the system, each planet, station and moon, each ship, and owner names), plus a few `eth_getLogs` for recent events.
- **The client reloads** after each of the player's moves, whenever a new block changes the game, and every 2 minutes regardless.
- **So an idle player makes about 3,900 reads an hour,** plus about 130 per move. A thousand idle players would be about 4 million reads an hour.
- **Ideas for later:** batching the reads through Multicall3, already used for the leaderboard; reloading only what changed; and the contract wish list's events for every move.
- **A client-only detail:** with the local test wallet, ethers asked the node for the chain ID before nearly every call (1,340 `eth_chainId` calls for 1,450 `eth_call`s). MetaMask answers that itself, so real players aren't affected. Passing the network to ethers would remove these calls entirely.

## What playing showed (for the design)

- **Every good has the same margin,** about 60 credits a unit, so route choice hardly matters. Any port that sells something, then any port that buys it.
- **Ports restock very slowly:** one unit every 2 minutes, about 30 an hour. One pilot with 250 holds drained Sol's ports in about 70 trades: margins fell from 60 to 39, then 16, 6 and 0, and the bot ran out of profitable trades. With many players, Sol's ports would be empty most of the time.
- **Starting is slow:** 100 credits buys a single unit on the first trade.
- **A station earns its owner 1%** of every trade at its port by other pilots.
- **The contracts don't check that the ship is at the port** for `tradeAtPort` or `addHoldsToShip`. A player could trade at any port in the galaxy without going there; only the client stops it. That's for the contract wish list.
- **Holds are capped at 250** (`maxHolds`), stored as a uint8.
- **A purchase must leave a balance:** it's refused unless its cost is strictly less than the balance.

## Releasing the contracts on Polkadot Hub (added 2026-11-07)

Measured by deploying `contracts/script/Deploy.s.sol` to a local chain: **45 transactions, 45.9M gas,
24 contracts (10 modules behind proxies, their implementations and 4 linked libraries) holding 175 KB
of code, and 218 new storage slots.**

Polkadot Hub charges two things:
- **Fees,** scaled from gas as above (DOT $0.955; a plain transfer at 0.00147 DOT for 21,000 gas): **about 3.2 DOT**, 1.6 to 16 DOT from quiet to busy. Rough: Polkadot Hub prices by weight and length, and uploading code may not follow gas.
- **Storage deposits,** held (not spent) while the data exists, from Asset Hub's runtime (`pallet_revive`'s settings; system chains charge 1/100 of the relay chain's rate): 0.2 DOT per item, 0.00001 DOT per byte, and 0.002 DOT per contract storage slot.
  - code: 175 KB and 24 code items, about 6.5 DOT
  - the 24 contracts' records, about 4.8 DOT
  - each contract also locks 30% of its code's deposit, about 2 DOT
  - the 218 slots, about 0.6 DOT
  - **about 14 DOT** in all

**So a release costs about 17 DOT, about $16: 3 DOT spent and 14 held.** The deposits come back only
if the contracts' code and storage are removed, which upgradeable contracts never do, so treat them as
spent. An upgrade uploads one module's new code: a fraction of this.

Player moves pay deposits too, at 0.002 DOT a storage slot: a first arrival at a new star writes a
handful of slots, so about 0.01 to 0.02 DOT more. That's far less than feared above.

Testnet first: Polkadot Hub's testnet would give the real numbers for both (milestone 6).
