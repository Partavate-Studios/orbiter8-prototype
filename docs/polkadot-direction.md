# Polkadot direction (Koda, 2026-11-08)

Orbiter 8 goes all-in on Polkadot: **Polkadot Hub only, launched as a Polkadot App mini-app (a
"Polkadot Product"), timed to release alongside the Polkadot App.** Other EVM networks are given up.
This file records the decision, why, what changes, what's unknown, and the spike that tests it before
anything is rebuilt. Decisions D62–D66 in [`demo4-plan.md`](demo4-plan.md) point here.

## Branches

| Branch | What it holds |
|---|---|
| `evm-archive` | The EVM version as it stood on 2026-11-08 (commit 9255abc): contracts for any EVM chain, MetaMask-style wallets, session keys, eth-rpc reads. Kept in case the Polkadot path goes badly. Don't develop on it. |
| `demo4` | The same commit; the last release line before the switch. |
| `polkadot` | Where work goes from now on: the spike, then the migration. |

## The decisions

| | Decision |
|---|---|
| D62 | **Polkadot only.** Give up other EVM networks. Explore the frontier of Polkadot and use what it uniquely offers. Focus on **Polkadot Hub**; our own chain comes only if the game succeeds. |
| D63 | **Launch strictly in the Polkadot App**, as a Product, and aim to release alongside the App's own launch. Non-App play (a browser wallet) can be considered later. (A someday dream: the Polkadot App on consoles or SteamOS.) |
| D64 | **No clunky wallets.** Players use the App's per-Product account, its signer and its allowances; no MetaMask, no network step, no session keys if AutoSigning does the job. |
| D65 | **Things become tradable:** ships (pilots will have several, so a ship is a collectible), planets, and possibly the goods traded at ports. Turns B15 and B30 (bound ships and deeds) into "for now". |
| D66 | **The UI may be rethought for the App,** choosing the best-performing approach for a good UI there. Explored later, after the spike measures how the current client runs inside the App. |

## Why

What the Polkadot App and Polkadot Hub offer that the EVM version can't (researched 2026-11-08; sources below):

- **No wallets.** A Product gets a per-user account derived from the player's `.dot` identity, with no
  sign-up; approvals happen on the player's phone.
- **No popups, no gas money.** An **AutoSigning** allowance lets a Product sign without a prompt each
  time; a **SmartContractAllowance** sponsors fees for a Product's contract calls. Together they would
  replace our session keys (D41), their gas money and its sweeping.
- **Humans only.** Polkadot's proof of personhood: a contract reads
  `personhoodStatus(account, context)` from a precompile and gets a tier (None, Lite, Full) and a
  per-game alias, unlinkable across apps. One human, one pilot, without knowing who anyone is.
- **No RPC worries.** Chain access goes through the host (the web host uses a light client), which
  retires the research's biggest risk (the throttled eth-rpc, no commercial providers).
- **No servers.** A Product is a static bundle on decentralized storage, named by `.dot`.
- **Phones first,** with Polkadot Desktop and `dot.li` (the web host) running the same bundle.
- **Platform services:** Statement Store pub/sub (chat without on-chain events), decentralized storage,
  private payments (Coinage), identity and usernames, collectibles in the player's Pocket.

## What changes, and what survives

**Survives:** the contracts' game logic, drand randomness, the hex galaxy, every screen, card and
menu (until the UI is rethought), the art, the tech trees, the story.

**Becomes unnecessary** (kept on `evm-archive`):
- the MetaMask/EIP-6963 wallet connect flow and the wizard's network step;
- session keys and their gas money (if AutoSigning and sponsored calls work as documented);
- the eth-rpc read path and the worries about it (D43's plan becomes "read through the host");
- anvil as the local chain (Polkadot's own contract engine is needed locally: `revive-dev-node`, B3).

**Probably changes:** the contracts move from EVM bytecode to **PolkaVM** (Solidity compiled with
Parity's `resolc`), because Product tooling assumes it. That raises the code size limit from 24 KB to
1 MB (Battle is 654 bytes under today's limit). Still Solidity: no rewrite.

## Unknowns and risks

- **Not on mainnet yet.** The Product SDK throws for Polkadot and Kusama because "their Bulletin and
  Individuality chains are not live yet"; Products run on the Products devnet and Paseo. Launching with
  the App ties our date to theirs, which is the plan (D63).
- **The docs disagree on auto-signing.** The Allowances page describes AutoSigning; the older Sign In
  page and the glossary say every transaction needs its own approval "by design". To test.
- **Performance inside the App is unknown.** Our client is a heavy animated SVG scene; Products run in
  a sandboxed web view on phones. The first thing to measure.
- **PolkaVM is young:** upgradeable proxies (UUPS) are unproven there, and Parity's `cdm` deploy tool
  treats contracts as immutable, versioned entries. Our drand check needs the BN254 pairing precompile.
- **Personhood's Full tier isn't available yet;** Lite (an attested device and a username) is weak.
- **How collectibles reach the Pocket is undocumented** (the SDK has an `nfts` module; likely Asset
  Hub's native NFT system).
- **The runtime changes often** (the research's finding): contract-visible behavior shifts with
  runtime upgrades every few weeks.

## The spike (milestone 7)

Run on the `polkadot` branch. Throwaway test keys only, never committed.

| Step | Proves | Who |
|---|---|---|
| 1. Compile the contracts with `resolc` (PolkaVM) | They compile; sizes; linked libraries; what breaks | Claude |
| 2. Deploy to Paseo Asset Hub | Proxy upgrades, the drand check, gas and deposits on PolkaVM | Claude, with test tokens from a faucet (needs a human) |
| 3. Load the client as a Product in Polkadot Desktop and on `dot.li` | It runs, and how fast, in the sandbox | Koda pairs Desktop with his phone's Polkadot App; Claude measures |
| 4. AutoSigning and sponsored contract calls | Play without popups or player fees | Claude, once 3 works |
| 5. The personhood precompile from our contracts | One human, one pilot | Claude |
| 6. Mint a ship into Asset Hub's NFT system | Whether it shows in the Pocket | Claude, once 3 works |

The spike's results go in this file; then the migration is planned with Koda.

## Results

### 1. The contracts compile for PolkaVM (2026-11-08)

Compiled with Parity's `resolc` 1.5.0 (LLVM 23.1.3), size-optimized, from forge's own compiler input
(55 source files, solc 0.8.38). To rerun: `contracts/polkavm/compile.cjs`.

**All 19 contracts compile, with no errors and no source changes.** Two warnings, both from solc: `at`
will become a reserved word (an event field and an error argument in Battle). Rename them some time.

| Contract | PolkaVM bytes | EVM bytes (forge, 2026-11-08) |
|---|---|---|
| Battle | 514,200 | 23,922 |
| Galaxy | 379,488 | 15,513 |
| Planets | 204,126 | 23,233 |
| Market | 160,337 | |
| Pilots | 122,252 | |
| Ships | 113,120 | |
| Armory | 99,619 | 12,599 |
| Factory | 83,563 | 10,166 |
| Drand (library) | 80,855 | |
| Spiral (library) | 59,695 | |
| Combat (library) | 54,835 | 5,364 |
| Deeds | 49,284 | |
| Credits | 44,146 | |
| ScanRules (library) | 22,924 | |
| ShipArt, HexMath, Pricing, Fixed, SystemGen | 872 each (internal libraries, inlined into their callers) | |

What it means:
- **Everything fits.** PolkaVM code is about 15 to 30 times larger than EVM code, but the limit is
  1 MiB (1,048,576 bytes): the largest, Battle, is at 49% of it. The 24 KB squeeze is over, and the
  linked libraries (Drand, Spiral, Combat, ScanRules) could be folded back into their contracts.
- **Code deposits grow with size.** At the research's 0.00001 DOT per byte, the code alone is about
  2.0 MB, so roughly 20 DOT locked (refundable) for a full release, up from about 2 DOT for the EVM
  code (`cost-estimates.md` has the rest of a release's deposits). Worth measuring on Paseo.
- **Not yet known:** whether it runs as it should. Still to test on Paseo: the upgradeable proxies
  (UUPS) on PolkaVM, linking the external libraries at deploy time, the drand signature check through
  the BN254 pairing precompile, and gas.

## Sources (researched 2026-11-08)

- [Polkadot docs: Apps (Polkadot Products)](https://docs.polkadot.com/apps/)
- [Polkadot docs: Allowances and Permissions](https://docs.polkadot.com/apps/concepts/allowances/)
- [Polkadot docs: Add a Smart Contract to Your Product](https://docs.polkadot.com/apps/build/deploy-a-smart-contract/)
- [Polkadot docs: Individuality package](https://docs.polkadot.com/apps/product-sdk/individuality/)
- [Polkadot docs: Proof of Personhood in the Polkadot App](https://docs.polkadot.com/reference/apps/hosts/polkadot-app/pop/)
- [Polkadot App docs: Identity and personhood](https://docs.polkadotcommunity.foundation/architecture/identity/)
- [Polkadot App docs: Platform services from the SDK](https://docs.polkadotcommunity.foundation/guides/platform-services-sdk/)
- [paritytech/dotns](https://github.com/paritytech/dotns) (a contract using the personhood precompile)
- [Polkadot App on Google Play](https://play.google.com/store/apps/details?id=io.pcf.polkadotapp&hl=en_US)
- The earlier research: [`research/polkadot-hub-2026-11.md`](research/polkadot-hub-2026-11.md)
