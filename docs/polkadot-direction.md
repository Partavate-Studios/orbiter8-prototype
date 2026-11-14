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

## Polkadot's own direction (2026-11-11)

Polkadot's governance approved a new strategy (the "DOTDAO mandate", proposed by the Polkadot Community
Foundation) with 97% of votes on 2026-11-11, as announced by Polkadot (pasted by Koda, 2026-11-13; not
checked against the referendum itself). What it means for us:

- **The bet lines up.** Polkadot now puts everything behind a **product platform** with the Polkadot
  App as its flagship (private messaging, digital cash), measured by **how many people use it**, not by
  developer counts. The PCF commits to marketing the App worldwide. A game that brings players into the
  App is exactly what they want, which supports D63 (launch inside the App, alongside it).
- **Players expect free, mobile-first and simple usernames.** Products "should feel as easy as the apps
  people already use. Free, with simple usernames and built mobile-first." That backs D64 (sponsored
  fees, no wallets), the phone-first UI rethink (D66), and suggests using the App's usernames in place
  of, or alongside, our call signs. Privacy is a stated priority: per-game aliases fit.
- **dotUSD, a stable currency** backed by DOT and watched over by the Technical Fellowship, starting the
  "dotStables" family. Possible uses, for Koda to weigh: prices for anything sold for real money (ships
  as collectibles, cosmetics), or a stable anchor for credits. Our in-game credits stay their own token
  for now.
- **A funding path.** Shared funds move "away from generic marketing retainers and towards incentive
  campaigns that tie funding directly to measurable user engagement." A game that brings engaged users
  could apply for those campaigns once it's live.

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

### 2. The game runs on Polkadot Hub TestNet (2026-11-13), as EVM bytecode

Deployed the game as it is today (EVM bytecode, run by Polkadot Hub's REVM engine) to **Polkadot Hub
TestNet** (Paseo Asset Hub, chain 420420417, `https://eth-rpc-testnet.polkadot.io/`) with
`forge script script/Deploy.s.sol` and a throwaway key kept outside the repo
(`~/.config/orbiter8/paseo-spike.json`, address `0x66160964b40175D882372c203b51bFD2607EF280`, funded with
5,000 PAS from the faucet).

- **The deploy:** 45 transactions, all successful, standard Foundry with no Polkadot-specific changes:
  linked libraries, UUPS proxies, roles and wiring. It cost **17.7 PAS**, gas and storage deposits
  together (the earlier estimate for mainnet was about 17 DOT).
- **Real moves** (`contracts/polkavm/play-paseo.mjs`):

  | Move | Result | Cost | Time |
  |---|---|---|---|
  | Register a pilot | ok | 0.035 PAS | 3.8 s |
  | Jump to an unvisited star (Sol to Wolf 359) | ok | 0.010 PAS | 8.4 s |
  | Record the scan with drand's signature (the BN254 pairing check) | ok; 3 new cells charted | 0.006 PAS | 9.1 s |

  The drand check, the research's biggest worry, works on the live chain. (Polkadot reports gas in its
  own units, so compare the PAS, not the gas numbers.)
- **A UUPS upgrade works:** a new Credits implementation deployed, `upgradeToAndCall` through the proxy
  succeeded, the ERC-1967 slot changed and the state stayed (total supply unchanged). The research had
  found no plain OpenZeppelin UUPS upgrade on mainnet; now there's one on the testnet.
- Addresses (testnet, throwaway): armory `0xd199576247ecDc1F0AC23A96fA6e357c94e95c0c`, battle `0xA755158746f968786E8c425BC2DA6F3296b907bF`, credits `0x6C7c8cD5c1cd85052170f0Cd3576E54eEe29971C`, deeds `0x82Fe5957866A76424959DD5402Eaf36E1bF0B6eC`, factory `0x9A50F9610d01b299D30add73278339A0eAFd1fdF`, galaxy `0x3c2041e71235eB455717BDA0CbB39D5Ee8EdA262`, market `0x23D7060da9c017960f57D78BC946374092E5Ae00`, pilots `0xC257BED2601b02cab9864aDEEec867022Cb91b48`, planets `0x81221ABe12217Aa5E0F7c15d55c38E5A943B3b6E`, ships `0x604367E54eD1ffd6fcA0F0D409b44D3CC405aFeE`.

What's left: the same on **PolkaVM** (deploying `resolc`'s bytecode, linking its libraries, proxies
there), then the App steps (3–6), which need Polkadot Desktop paired with Koda's phone.

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
