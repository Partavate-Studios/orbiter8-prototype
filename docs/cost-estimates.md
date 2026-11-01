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
