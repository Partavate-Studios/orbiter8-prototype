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

### Step 3, first look: Polkadot Desktop's sandbox (2026-11-13, in progress)

Koda installed Polkadot Desktop 0.9.3 and the phone App, and opened the local game (`localhost:8092`)
with Desktop's "Skip (Dev only)" button. The page was **blank**: Desktop's log showed
`Unexpected token 'D', "Direct net"... is not valid JSON`.

What Desktop's code does (read from its `app.asar`): a Product's page may fetch **only its own
localhost port**. Any other http, https, ws or wss address answers **403 "Direct network access is
blocked"**, unless the Product has a product id and the player grants it a *remote permission*. So the
dev wallet's calls to the local chain (another port) and the drand relays (`api.drand.sh`) both failed.

For development, the Vite dev server now proxies both through the game's own origin: `/__chain` → the
local chain, `/__drand` → `api.drand.sh` (`orbiter-client/vite.config.js`; the dev wallet, the local
network's RPC and drand's relay list use them first). Checked in the harness with a preload that blocks
every other origin the way Desktop does: register, jump to Wolf 359, and its scan all work, with nothing
blocked.

What it means for the real Product:

- **Chain access goes through the host**, not to an RPC URL of our own: the Product SDK (PAPI) for
  Substrate calls; how a Product calls an EVM contract (eth-rpc through the host, or `Revive.call`
  extrinsics built with PAPI) is still to find out. That is the main client change of the migration.
- **drand needs a remote permission** for `api.drand.sh` (declared by the Product, granted by the
  player), or the relays move behind something the host already allows.
- Desktop's own Dashboard widget (`browse.paseo`) showed "Widget is currently unavailable" and its Home
  button misbehaved for Koda: Desktop's, not the game's; noted in case it matters later.

**Koda's verdict (2026-11-14): it runs about the same in Desktop as in Chrome.** Still to try: the phone
App and `dot.li`.

### Playing the testnet from the dev client (2026-11-14)

The local dev client now plays Polkadot Hub TestNet too, and switches between it and the local chain
from the title's **Network** panel ("Switch"), or with `?network=testnet` / `?network=local`. The page
reloads itself on a switch, as it does when a real wallet changes network: every store starts clean.
- The dev wallet makes a throwaway key per `?account=N` on the testnet, kept in the browser, and the dev
  server tops it up to 25 PAS from the spike's key (`orbiter-client/dev/testnet-faucet.js`; the key stays
  in `~/.config/orbiter8/`, never in the browser or the repo).
- The testnet's RPC goes through the dev server (`/__paseo`) like the local chain, so it works inside
  Desktop's sandbox too.
- Checked in the harness with the sandbox's blocking: register, jump to Lalande 21185, and its scan
  (two new stars after the 30-second wait). First load of a new pilot is about 15 s (the top-up waits
  for its block); returning players skip that.

**It uses the EVM-bytecode deployment, not the PolkaVM one,** because of what follows.

**PolkaVM: reads that return long lists fail.** On the PolkaVM deployment, `Market.portsAt(0)` (Sol's
nine ports), `Planets.system(0)` (Sol's planets), `Planets.system(17)` (eight planets) and
`Galaxy.region(center, 10)` revert with no data, at any gas. Short ones work (`portView` of one port,
three planets, `region` up to radius 9). On the EVM deployment all of them work. The likely cause is
memory: Solidity never frees memory within a call, and resolc gives each contract a small, fixed heap
for it (`settings.polkavm.memoryConfig`).
- Tried (`contracts/polkavm/memprobe.mjs`, `upgrade-module.mjs`): with a 64 KiB heap and 32 KiB stack
  Market traps on any call; 128 KiB heap and 64 KiB stack runs, but Sol's ports still fail; a 256 KiB
  heap wouldn't run. So more memory alone isn't the fix (the PolkaVM deployment's Market now runs the
  128/64 build).
- **To do before moving the game to PolkaVM:** find resolc's defaults and the chain's limit, measure
  each big read's memory, and reshape the reads that need it (fewer temporary copies: count, then fill;
  or smaller reads the client combines). Or stay on EVM bytecode (REVM) for these modules: Polkadot Hub
  runs both.

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

### 3. The game runs on PolkaVM too (2026-11-13), after one fix

Deployed the PolkaVM build (`resolc`) to Polkadot Hub TestNet with `contracts/polkavm/deploy-polkavm.mjs`:
the four external libraries first, then the game compiled again with their addresses (PolkaVM links
libraries at compile time, not deploy time), then each module and its OpenZeppelin ERC1967 proxy, then
the same roles as `Deploy.s.sol`. All 46 transactions succeeded.

**The one problem: the drand check ran out of gas on PolkaVM,** even with a billion gas (the whole scan
costs 6,169 on the EVM build). The cause: randa-mu's BLS library computes the field's square root and
inverse with hand-written chains of about 300 `mulmod`s each, run several times per check. On the EVM
`mulmod` is native and cheap; PolkaVM is a 64-bit RISC-V machine, where each 256-bit `mulmod` is a
software routine. **The fix** (`contracts/src/randomness/BLSPrecompiled.sol`, a copy of the library):
both are now one call each to the `modexp` precompile, which runs natively. The check then costs
**4,039 gas** on PolkaVM. On the EVM all 99 contract tests still pass (the drand tests check real
signatures), and the EVM Drand library shrank from 18.9 KB to 3.5 KB.

With the fix:

| | PolkaVM | EVM (REVM), for comparison |
|---|---|---|
| Deploy, all modules | **25.3 PAS** | 17.7 PAS |
| Register | 0.037 PAS, 4 s | 0.035 PAS |
| Jump to an unvisited star | 0.014 PAS, 8 s | 0.010 PAS |
| Record the scan (drand check) | 0.011 PAS, 9 s; 3 cells charted | 0.006 PAS |
| UUPS upgrade (Credits) | works, state kept | works, state kept |

So **every question the research left open about the contracts is answered:** they compile and run on
PolkaVM, the proxies upgrade, the drand check works, and moves cost about a hundredth of a PAS. Moves
cost a little more on PolkaVM than on the EVM engine, and the deploy about half again as much (bigger
code, bigger deposits, mostly refundable).

Tools in `contracts/polkavm/`: `compile.cjs`, `deploy-polkavm.mjs`, `play-paseo.mjs`, `upgrade-polkavm.mjs`,
`probe-drand.mjs` and `probe-scan.mjs` (the gas probes that found the problem).

Addresses (testnet, throwaway): armory `0x1522EE84B805000c62F578f6D85802Bdce1d19a1`, battle `0x0b13c0b2583dbc385e476E5adEE65Faad483CeAd`, credits `0xe54c7c9888ECAaFD6cAaBf839d0D8DC851a82949`, deeds `0x935fC5Fd9D675e0Dc8c773390C18b13f66c3ceCF`, factory `0x7aac150Da2c444660F9d3d8dd318F26299fA5077`, galaxy `0xD228187BAC2876B126a7D0292dA54CC2Fd542203`, market `0x5CadfD29700E3DBD36F82859D294c45515C48799`, pilots `0x34041855992c787DF895e82B497B6ACFc6Ee8008`, planets `0x2AD97462E731c1a4a4472250a78781B0E0b67634`, ships `0x80294d1937bD75B32aEb86748111FD12c35dD684`.

**Next:** the Polkadot App steps (3–6), with Polkadot Desktop paired with Koda's phone.

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
| Drand (library) | 80,855 (49,692 after the precompile fix, section 3) | |
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

### Testnet: a per-call memory limit on EVM bytecode too (2026-11-17)

After the expansion's deploy, `Planets.system(0, 8)` (Sol's nine planets, eight goods each) reverted on
Polkadot Hub TestNet with no revert data, at any gas, though it needs only 426,000 gas locally; with up to
seven goods it works, and each planet alone works. The new `planetView` calls Claims for each planet's
owner, and the extra memory took it past the node's per-call limit (the same kind of limit as PolkaVM's,
"reads that return long lists fail", now met on the EVM engine too). The SDK now falls back to one
`planetView` per body when a batch read fails with no revert data (`sdk/src/contracts.js` batchOrEach, for
`system` and `belt`); a planet's view grows as it's built up, so other systems could reach the limit later.
To do: keep batch reads small by design (count, then fill; fewer external calls per item), and measure
memory per read. *(Done 2026-11-18: below.)*

### Testnet: a fixed budget per read, and the reads reshaped to fit (2026-11-18)

**What the limit is.** Probed on Polkadot Hub TestNet with two throwaway contracts (deployed from the
spike key; not part of the game):
- **A compute budget per eth_call of about 39,000 of the testnet's gas units**, whatever gas the call
  sends (a loop of calls passed at 38,569 units and failed by 39,4xx; `--gas-limit` up to 10^15 changes
  nothing). Over it, the outer call fails with `Module(... OutOfGas)`; when an inner call runs out first,
  the outer one reverts with no data, which is what `system(0, 8)` showed.
- **1 MiB of memory per call frame** (a frame allocating 1,048,000 bytes works, 1,048,400 doesn't; three
  nested frames of 900 KB each work, so it's per frame, not per call). Memory costs no gas units here.
  None of the game's reads come near it: the largest frame of any read is 57 KB (`portViews` of all 15
  of Sol's ports). So the 2026-11-17 entry's "memory" was really the compute budget.
- **What costs what** (testnet units): a read starts at about 1,116; each **storage read 92**, warm or
  cold (no EVM-style warm discount); each call frame about 80–140; a trivial call into one of the game's
  proxies about 470 (proxy, delegatecall, the implementation slot); other work about one unit per 120
  EVM gas. Storage reads and calls between modules dominate, not computation.

`orbiter-client/dev/harness/read-costs.mjs` models these units from a local chain's traces (within about
6% of the testnet's own estimates) and reports each read's peak frame memory;
`dev/harness/build-out.mjs` builds a fully built system locally (every planet and asteroid at star 1
claimed and built to the top, people and drones landed) to measure the worst case.

**What changed** (the reads' shapes, nothing in the game's rules):
- **Planets:** `planetView`, `system` and the new `views(ids, goods)` read the seed once (Planets keeps
  the universe's seed itself since its initialize, instead of asking Galaxy on every read), the star's
  state once per star (and not at all for an owned body), every owner in one call (`Claims.ownersOf`), a
  class's mix once per call, and **no storage for an unowned body** (it has none). `belt()` is gone: the
  SDK derives which sections hold an asteroid and reads them with `views` (it saved 1.1 KB of Planets).
- **Market:** count, then fill. `portIds(cell)` lists a star's ports; `portViews(ids)` reads them with
  what they share read once (capacity, goods, the refill time), each port's mix once (not twice a good),
  and a player's port's storage in one call (`Planets.suppliesOf`, given the mix). `portsAt` is gone; the
  SDK reads five ports a call, in parallel.
- **Galaxy:** count, then fill. `statesOf(ids)` gives the states of cells the client lists itself (a
  storage read per 128 cells in a row, and none of `region`'s index math); `cellsOf(ids)` gives the
  charted ones' views, 30 a call. `region` stays for the bots' small radii.
- **SDK** (`sdk/src/contracts.js`): `chunked` reads a list a few at a time and **splits a chunk in two when
  it hits the cap**, down to one id; `batchOrEach` (system) and the belt use it as their safety net.
  `overLimit` also recognises the top-level `OutOfGas` error.

**Read costs, modeled testnet units (budget about 39,000):**

| Read | Before (2026-11-17 contracts) | After |
|---|---|---|
| Sol's planets, `system(0, 8)` | 37,900 (fails on the testnet) | 5,387 |
| Sol's belt, six asteroids | 20,000 (`belt`) | 4,079 (`views`) |
| Sol's ports, now 15 | 54,100 in one `portsAt` (9 ports measured 36,983) | `portIds` 1,849 + 3 × `portViews(5)` ≤ 7,740 (all 15 in one: 15,103) |
| Region, radius 10 | 46,000 (fails) | `statesOf` 3,071 + `cellsOf(30)` about 16,000 each |
| Star 1 fully built: 5 planets | 13,836 | 11,888 |
| Star 1 fully built: 8 asteroids | 23,968 (`belt`) | 17,925 (`views`) |
| Star 1 fully built: 13 ports | 75,336 in one call; 32,292 for five | 45,351 in one call; ≤ 20,815 for five |
| One owned planet's view | 5,637 | 4,030 |

The heaviest read the client now makes is about 21,000 units, half the budget, for five fully built
player ports; anything bigger is split by `chunked`. A body's view still grows with goods (one storage
read each, 8 now): adding goods or per-body data should be checked with `read-costs.mjs`.

