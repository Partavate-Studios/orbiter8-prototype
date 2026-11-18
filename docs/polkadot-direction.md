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

**Guiding principle (Koda, 2026-11-18): fully embrace the Polkadot App's ecosystem, and let that guide
decisions:** its accounts and signer, personhood, names, NFTs and hosting over our own substitutes.

| | Decision |
|---|---|
| D62 | **Polkadot only.** Give up other EVM networks. Explore the frontier of Polkadot and use what it uniquely offers. Focus on **Polkadot Hub**; our own chain comes only if the game succeeds. |
| D63 | **Launch strictly in the Polkadot App**, as a Product, and aim to release alongside the App's own launch. Non-App play (a browser wallet) can be considered later. (A someday dream: the Polkadot App on consoles or SteamOS.) |
| D64 | **No clunky wallets.** Players use the App's per-Product account, its signer and its allowances; no MetaMask, no network step, no session keys if AutoSigning does the job. |
| D65 | **Things become tradable:** ships (pilots will have several, so a ship is a collectible), planets, and possibly the goods traded at ports. Turns B15 and B30 (bound ships and deeds) into "for now". |
| D66 | **The UI may be rethought for the App,** choosing the best-performing approach for a good UI there. Explored later, after the spike measures how the current client runs inside the App. |
| D101 | **The Product is named `orbiter8`** (`orbiter8.paseo` on the testnet, `orbiter8.dot` on mainnet): pursue it although it's in dotNS's restricted 6–8 band (a verified person and the short-name switch on the testnet; a governance grant or a Product path on mainnet). (Koda, 2026-11-18) |
| D102 | **Personhood: one pilot per person**, keyed by the person's alias in our context (`PersonhoodGate`, step 5). Nothing else gated for now. (Koda, 2026-11-18) |
| D103 | **Signing: both.** AutoSigning when the App grants it; otherwise our session keys (D41), sent through the host. Outside the App, today's wallet and session keys. (Koda, 2026-11-18) |
| D104 | **Players without PAS sign each move** (a phone approval per move, paid with PGAS) until they hold PAS; then session keys. The game doesn't sponsor session gas. (Koda, 2026-11-18) |
| D105 | **Ships become native Scarcity NFTs** in the App. Ownership is redesigned around a pilot record the ships' keys are tied to (fits fleets, D26); our ERC-721 stays until mainnet has Scarcity. (Koda, 2026-11-18) |
| D106 | **A testnet build is published beside Demo 3**, at a subpath of the `orbiter8-demo3-client` Pages site (e.g. `/testnet/`); Demo 3 stays where it is. Prepared locally; Koda pushes. (Koda, 2026-11-18) |
| D107 | **Every NFT draws itself as an SVG, on chain** (Koda, 2026-11-18): ships already do (`Ships.tokenURI`, `ShipArt.svg`); deeds (planets, moons, asteroids) get theirs, in the card's art; every future NFT too. To find out for Scarcity (D105): its metadata is stored key/value data, so a picture that changes with the ship either is rewritten into it on change (storage deposits) or reaches the Pocket another way (the product's renderer, or a `tokenURI` from our contract): check in the App. |

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
  the App ties our date to theirs, which is the plan (D63). *(2026-11-18: Polkadot Hub's runtime has the
  individuality pallets now, and the personhood precompile answers on mainnet; pallet-scarcity, the
  App's NFTs, isn't there yet.)*
- **The docs disagree on auto-signing.** The Allowances page describes AutoSigning; the older Sign In
  page and the glossary say every transaction needs its own approval "by design". To test.
  *(2026-11-18: both are right. AutoSigning is in the protocol, but the phone wallets return
  `NotAvailable` for it today; see step 4.)*
- **Performance inside the App is unknown.** Our client is a heavy animated SVG scene; Products run in
  a sandboxed web view on phones. The first thing to measure.
- **PolkaVM is young:** upgradeable proxies (UUPS) are unproven there, and Parity's `cdm` deploy tool
  treats contracts as immutable, versioned entries. Our drand check needs the BN254 pairing precompile.
- **Personhood's Full tier isn't available yet;** Lite (an attested device and a username) is weak.
- **How collectibles reach the Pocket is undocumented** (the SDK has an `nfts` module; likely Asset
  Hub's native NFT system). *(2026-11-18: the NFTs are `pallet-scarcity`, mintable from Solidity; the
  Pocket itself is still to see. Step 6.)*
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

### Step 4: AutoSigning, sponsored calls, and our session keys (2026-11-18)

Researched from the Product SDK's own source (npm `@parity/product-sdk*` 0.45, `@parity/truapi` 0.31,
read 2026-11-18), the developer docs (`developers.polkadot.com`, where docs.polkadot.com and the PCF's
docs now redirect), Parity's runtimes, and tried on Polkadot Hub TestNet.

**How a Product signs.** The App gives each Product its own accounts: sr25519 keys at
`//product//{productId}/{index}`, held by the App on the phone. The Product gets a PAPI "transaction
creator" for one (`getProductAccountSigner()`, or `SignerManager` → `account.getSigner()`), and every
transaction it signs **goes to the phone for approval**; on Desktop that's a modal while the phone is
asked, with no push notification. The docs: "Signing is asynchronous because the Polkadot App runs on a
separate device." The account's H160 (`keccak256(publicKey)[12:]`) is what contracts see as
`msg.sender`, after a one-time `Revive.map_account`.

**AutoSigning exists, but not on phones.** A Product asks for allowances once per connection
(`requestResourceAllocation([{ tag: 'AutoSigning' }, { tag: 'SmartContractAllowance', value: { tag:
'Index', value: 0 } }])` in `SignerManager`'s `onConnect`); each comes back `Allocated`, `Rejected` or
`NotAvailable`. AutoSigning hands the Product a signing subtree, so it signs with no prompt (it isn't
scoped to contract calls). **The docs say plainly that both the Android and iOS wallets return
`NotAvailable` for it today: "Keep per-transaction signing as the real path."** No lifetime, limit or
revoke is documented; signing out clears grants; an expired one surfaces as `AllowanceExpiredError`
("re-pair the wallet"). (The older docs' "every transaction needs its own approval by design" and the
newer AutoSigning page are both right: one is today, the other is planned.)

**Who pays: PGAS, not the player, and not us.** `SmartContractAllowance` doesn't sponsor fees from the
Product; it **pre-claims PGAS into the product account**. PGAS (asset 2,000,000,000 on the testnet,
49,999,999 on Polkadot Hub) is a non-transferable gas allowance that only a **proven person** may claim,
periodically (`pallet-pgas`: 50,000,000,000 units a claim, up to 100 claims a period for a person, 40 for
a Lite one, on the testnet; 5,789 accounts hold some). `pallet-pgas-allowance` lets PGAS pay fees (on
Polkadot Hub, for every call since runtime 2.5.0; on the testnet, for Revive calls), and contract
storage deposits are PGAS-denominated, "so a person can use contracts without holding DOT." So the
"free to play" story holds for people with personhood, and ties sponsorship to step 5. (Paseo's
issue tracker is renaming the allowance to a fee allowance for that reason.)

**How a Product calls our contracts: as Substrate extrinsics, through the host.** No eth-rpc, no
EIP-1193, no secp256k1. `@parity/product-sdk-contracts` (viem for ABI coding) dry-runs
`ReviveApi.call` to size the call, then submits `Revive.call(dest, value, weight, depositLimit, data)`
signed by the product account; `createContractFromClient(client, descriptor, address, abi)` works for
contracts it didn't deploy (no `cdm.json` needed). The `devnet` descriptors target our testnet (Paseo
Asset Hub 1000); `paseo` means Paseo Next. **The SDK also ships `SessionKeyManager`**
(`@parity/product-sdk-keys`): a local sr25519 key from a mnemonic kept in the Product's storage, Parity's
own answer to prompt-free signing until AutoSigning lands.

**Prototype, run on the testnet** (`orbiter-client/dev/spikes/app-signer/`, outside the game build):
- `eip1193-adapter.js`: the product-account signer as an **EIP-1193 provider**, so ethers 6 and our SDK
  (which takes an EIP-1193 provider in `wallet.js`) work unchanged. `eth_call`/`eth_estimateGas` →
  `ReviveApi.call` dry runs at the best block (reverts come back with their data, so ethers decodes
  custom errors); `eth_sendTransaction` → `Revive.call` signed by the creator and watched; receipts
  and transactions for its own sends built from the extrinsic's block and `Revive.ContractEmitted`
  events; `map_account` on first use; anything else (block numbers, logs) to a fallback provider.
- `run-testnet.mjs`, with a throwaway sr25519 key standing in for the product account (the same
  creator type `getProductAccountSigner()` returns), a public WebSocket node standing in for the host's
  client, and **the game's real testnet contracts** (`Pilots` at `0xacaa…E176`), via plain ethers:

  | Move | Result | Time | Fee |
  |---|---|---|---|
  | `map_account`, then `Pilots.register("AppSpike1aa0", …)` | ok, pilot registered | (first run, not timed) | about 0.001 PAS each |
  | `Pilots.broadcast(…)` from the product account | ok; event's pilot = the account's H160 | 3.8 s | about 0.001 PAS |
  | `Pilots.register` again (static call) | reverts, ethers decodes `AlreadyRegistered` | instant | none |
  | `Pilots.startSession(key, 1 h)` with 2 PAS gas money (D41) | ok | 3.2–3.6 s | about 0.001 PAS |
  | the session key's `broadcast`, an Ethereum-signed tx sent as **`Revive.eth_transact` over the Substrate client** | ok; eth-rpc indexes it normally; event's pilot = the product account | 1.9 s | from the key's gas money |

  The product stand-in was funded from the spike key by a local XCM transfer through the XCM precompile
  (`0x…000a0000`, `WithdrawAsset` + `DepositAsset` to an AccountId32): moving PAS from an EVM account
  to a Substrate account works from Solidity-land.

**What the adapter can't know yet (needs the App):** whether the host lets a Product submit a bare
`Revive.eth_transact` extrinsic (there's a `ChainSubmit` remote permission), how the phone prompt reads
for a `Revive.call` (it shows a Substrate call, not our function names), and how long a phone approval
takes in practice.

**Answer to Koda's question: keep session keys (D41), and use AutoSigning when the App offers it: both.**
- **In the App, AutoSigning allocated:** moves go straight from the product account (`Revive.call`), no
  session, no gas money; fees in PGAS for players with personhood. This is D64's goal.
- **In the App, AutoSigning `NotAvailable` (every phone today):** one approval starts a D41 session
  (already in our contracts: the key can only make game moves); the session key signs its moves as
  Ethereum transactions and sends them as `Revive.eth_transact` through the host's client. Shown above:
  no eth-rpc URL, no MetaMask, our existing key code. Its gas money still has to come from somewhere:
  PGAS can't be sent to it (non-transferable), so the approval forwards PAS as today; a player with no
  PAS can't start a session. That's the real gap (see open questions).
- **Outside the App** (a browser, later: D63): today's EIP-1193 wallet and session keys, unchanged.
- The contracts need nothing new: `actorOf` already maps a session key to its pilot.

**Migration steps** (proposed; nothing built in the game):
1. Get a product id (our `.dot` name); it fixes product accounts and the personhood context.
2. SDK: a `ProductAccountProvider` (this adapter, hardened) beside `discoverWallets()`, chosen when the
   page runs inside a host (`@parity/product-sdk-host` says so); `onConnect` requests
   `SmartContractAllowance` and `AutoSigning`.
3. Onboarding: `map_account` (and the personhood binding, step 5) folded into the first approval;
   batch them with `Utility.batch_all` (`.prepare()` in the contracts SDK) so it's one prompt.
4. Moves: if AutoSigning is `Allocated`, send directly; otherwise start a session and send the key's
   moves via `Revive.eth_transact` through the host's client.
5. Reads: move from eth-rpc to `ReviveApi.call` dry runs over the host's client (already how the
   adapter does `eth_call`); logs and the event feed need a remote permission for eth-rpc, or an
   indexer, or Statement Store (to decide).
6. Measure on Koda's phone: prompt wording, approval time, and whether AutoSigning becomes available.

### Step 5: the personhood precompile from our contracts (2026-11-18)

**It works from Solidity, on the testnet and on mainnet.** The precompile answers at
`0x000000000000000000000000000000000a010000` on Polkadot Hub TestNet (420420417) and on Polkadot Hub
itself (420420419; read-only call, nothing deployed there).

```solidity
interface IPersonhood {
    struct PersonhoodInfo { uint8 status; bytes32 contextAlias; } // 0 None, 1 Lite, 2 Full
    function personhoodStatus(address account, bytes32 context) external view returns (PersonhoodInfo memory);
}
```

What it proves, read from Parity's source (`paritytech/individuality-community`, `precompiles/personhood`
and `pallets/alias-accounts`, Apache-2.0; `paritytech/dotns`'s `PopRules.sol` calls it the same way):
- An account says "I am a person" by binding itself, with a ring-VRF proof made on the player's phone,
  to an **alias in one context** (`AliasAccounts.set_paid_alias_account`, a small fee in PGAS). The
  precompile reads that binding: the status is the ring the person is in (People = Full, People Lite =
  Lite), and `contextAlias` is the person's pseudonym in that context: the same for every account they
  bind there, unlinkable to their other apps. Nobody learns who they are.
- **An account holds one binding, in one context.** Ask about any other context and the answer is 0.
  A person who binds a second account in the same context moves the alias there (the first loses it).
  So "one ship per person" has to be keyed by the **alias**, not by the account.
- For a Product the context is fixed by the host: `blake2b-256("product/" ++ productId ++ "/" ++
  suffix)`, where the product id is our `.dot` name with the network's TLD (`productContext()` in
  `@parity/product-sdk-individuality`). For "orbiter8.paseo", index 0, that is `0x29ab4713…825b`;
  the real value waits on our product id. A newer call, `personhoodInfoByProof`, verifies a proof
  passed in by the caller instead (no binding needed); the testnet's copy of the interface has it,
  `dotns`'s doesn't yet.
- The tiers: **Lite** is a device attestation plus a username, which is easy to farm; **Full** (a
  proven person) isn't widely available yet.

Prototype (`contracts/spikes/`, its own Foundry project): `PersonhoodGate.sol` registers at most one pilot
per alias, refuses status 0, fails closed on unknown tiers, and has a minimum tier. Forge tests run it
against a mock etched at the precompile's address (`forge test` in `contracts/spikes`, 5 tests).

On the testnet (throwaway, `0x02D44a6Fd0448fF4F5B01c07561Cef320BD0eC60`): the testnet has exactly one
account bound to an alias (`orbiter-client/dev/spikes/app-signer/probe-aliases.mjs`): a Lite person,
`5FgZHX…8Rpm`, H160 `0x8b39…d9f8`. Deployed with that account's context, the gate's `statusOf` returns
**status 1 and its alias** through the precompile; a simulated `register()` from that account succeeds
and from our spike key reverts `NotAPerson(0)`. The precompile read costs about 1,200 gas.

**Where the game could use it (for Koda; nothing decided, see `review.md` P3):**
1. **One pilot per person at registration** (D63's "one human, one pilot"): `Pilots.register` asks
   the gate. Keeps call signs and the leaderboard human.
2. **The free claim and other give-aways** (starter credits, a free planet, a first ship) once per
   person, so bots can't farm them by making accounts.
3. **Fleet caps**: pilots will own several ships (D65), but a per-person cap on anything scarce (free
   planet claims per day) is enforceable.
4. **Anti-bot for sieges and chat**: Lite or better to broadcast or attack.
5. **Tiers as a dial:** Lite to play at all, Full for anything with real value (rewards, dotUSD
   prizes). Lite is weak against farms; Full isn't widely issued yet.

The catch: the player must bind their product account first (one phone approval and a little PGAS,
done by the App's individuality flow), and the contract has to know our product context.

### Step 6: ships in the App's NFT system (2026-11-18)

**Yes: an EVM contract on Polkadot Hub can mint into the App's own NFT system, and it worked on the
testnet.** The App's collectibles aren't `pallet-nfts`; they are **`pallet-scarcity`** (Parity's
individuality stack, in polkadot-sdk since stable2609): collections → immutable item definitions →
minted instances, with three layers of key/value metadata, and a "coinage" ownership model where
each NFT sits at its own **purse key** (one NFT per key; contracts may hold several on newer runtimes).
Product SDK reads are in `@parity/product-sdk-nfts`; the host manages purses (`NftPurseClient`:
create purse, create item keys, cheques to send items, `NftPurseRead` to read another owner's).

Contracts reach it through two precompiles (interfaces in `individuality-community/precompiles/scarcity`):
- **`IScarcityFactory` at `0x…05210000`**: `createCollection()`, the caller owns it and pays its deposit.
- **`IScarcityCollection` at `address(uint160(id) << 128 | 0x05200000)`**, one per collection: a real
  ERC-721 (`ownerOf`, `balanceOf`, `transferFrom`, `tokenURI`, ERC-5192 `locked`, ERC-2981 royalties)
  plus the owner's admin surface (`defineItem`, `mint`, `forceTransfer`, `forceBurn`, metadata at three
  scopes). No approvals (so no marketplace contracts moving tokens for you, yet).

Which networks have it (checked 2026-11-18): **Polkadot Hub TestNet (420420417): yes**; Paseo Next and
Previewnet (the SDK's `paseo` and `previewnet` environments): yes, with other products' collections
("Living World", "Coffee and Tea"); **Polkadot Hub mainnet: not yet** (the factory has no code there).

Prototype (`contracts/spikes/src/ShipCollection.sol`, forge tests against mocks, 3 tests) deployed on the
testnet at `0x6E3F58Fc999ec628cc67e82FD9b096ceA422F9E7` with 5 PAS for deposits:
- `setup()` created **collection 0** (the testnet's first), owned by our contract, named "Orbiter 8
  Ships (spike)" / "O8SHIP", with one transferable item "ship": 5,394 gas, about 1 PAS of deposit.
- `mintShip(spikeKey, 1, "Lantern")` minted token 0 with instance metadata `name=Lantern`,
  `shipId=1`: `ownerOf`, `balanceOf`, `tokenOfOwnerByIndex` and `instanceMetadata` all read back right.
  About 0.3 PAS of deposit per mint (refundable on burn), paid by the contract.
- A second mint to the same key reverts "destination purse already holds an instance" (one NFT per
  purse key), and so does a mint to a contract on this runtime (holding many arrives with a newer one).
- `transferFrom` by the holder (a plain EOA) to a fresh key worked: ships would be tradable from day one.

**What the Pocket shows: not seen yet.** That needs the App (step 3 on the phone). From the SDK:
the Pocket is a host tab of cards; a product can list and remove *its* cards but not add one (the host
decides, from the product's manifest), and drawn faces come from the product's renderer. NFTs reach a
player through purses the host derives keys for; whether the Pocket lists Scarcity NFTs held by a
product's purse, by the player's root purse, or by any key the player controls is undocumented. So the
open question is narrow: **mint to a purse key the host made** (`NftPurseClient.createItems`) and look.

What it means for ships (D65), for Koda (`review.md` P4):
- Ships can be real Scarcity NFTs, minted by the game's own contract, so they'd appear in the player's
  App with no bridge or mirror. Our `Ships` contract can own the collection and mint when a ship is
  bought; the game keeps its own ship state (bays, damage, loadout) keyed by token id.
- The purse model clashes with how the game tracks ownership today (a pilot's address owns its ship): a
  ship would sit at a purse key, not the pilot's account, so the contract maps token → pilot itself,
  or holds the NFT while the ship is "in play" and hands it out to a purse when traded.
- Not on mainnet yet, so ERC-721 in our own contract stays the fallback, and is what the game has.

### After the spike: names, purses, personhood, and becoming a Product (2026-11-18, with Koda)

**Becoming a real Product** (what it takes beyond the dev setup in "Step 3" below, where Desktop's
"Skip (Dev only)" opens `localhost` and the dev server relays the chain and drand):
1. A product id and a published bundle the App and `dot.li` can load (publishing waits on Koda's branch
   strategy).
2. Chain access through the host (reads as `ReviveApi.call` dry runs, moves as `Revive` extrinsics): the
   SDK's chain layer is the one place this lands (step 4's migration steps).
3. The App's per-Product account and signer in place of the dev wallet and MetaMask (step 4's adapter).
4. drand: a remote permission for `api.drand.sh`, declared by the Product and granted by the player,
   or the relays behind an address the host already allows.
5. The layout inside the App on a phone (D66).

**The product id is a dotNS name, with the network's ending:** `orbiter8.paseo` on the testnet,
`orbiter8.dot` on mainnet. It fixes the product accounts and the personhood context, so pick it once.
dotNS ([paritytech/dotns](https://github.com/paritytech/dotns), Polkadot Hub's name contracts) sells
names by length, for one refundable deposit (10 DOT at launch; PAS on the testnet):

| Base length | Who may register on the public path |
|---|---|
| 9 or more | anyone |
| 6 to 8 | a verified person, and only while governance's "short-name switch" is on (meant for testnets; mainnet keeps it off) |
| 5 or fewer | nobody; governance grants them |

**`orbiter8` is 8 characters:** on the testnet it needs a verified person and the switch on; on mainnet
the public path won't sell it, leaving a governance grant (or a Product-specific path, if there is one).
The personhood gateway's names are personal and soulbound, so not for a game. A name of 9 or more
(`orbiter8game`, `orbitereight`) is open to anyone on both networks. **For Koda:** which name. To check
before choosing (reads only): the testnet's short-name switch, whether the candidates are free, and
whether Products get names some other way.

**The purse model, plainly:** a player can own any number of Scarcity NFTs; what's limited is **one NFT
per key**. The App keeps a purse of keys for the player, makes a key per item, and moves items with
"cheques", so there's a layer of addresses between the player and what they own. On chain, `ownerOf`
names the item's key, not the player. Unknown: whether the chain links a purse to its player at all,
or only the App knows (likely deliberate, for privacy, as with personhood aliases); the Pocket check on
Koda's phone should show it. For the game: every "is this your ship?" (`msg.sender` against the
owner) would see the key, not the pilot. Two ways: keep our ERC-721 as the game's truth and mirror
ships into Scarcity for display, or make the pilot an on-chain record that the ship keys are tied to
(fits fleets, but a redesign). For the migration plan.

**Who is a verified person:** the App's verification (Koda did it once) puts a person in a ring:
**Lite** (the phone and a username; most people who finished sign-up) or **Full** (a proven unique
person; not widely available yet). Once is enough for every Product. The App's profile is the quickest
place to see it. On chain it shows **per context**: a person binds an account to a Product's context,
and the precompile answers only there, so a reliable on-chain answer for our game needs our product id
(and a player opening our Product). Also readable: gateway-issued dotNS names (a device name like
`name.01`, or a reserved personal name) held by the player's account.

**The public build** at `https://partavate-studios.github.io/orbiter8-demo3-client/`
(`Partavate-Studios/orbiter8-demo3-client`, last pushed 2026-10-28) is the **Demo 3 client**, on the
old EVM networks (Base, Moonriver, Moonbase, BSC testnet, Sepolia), not Polkadot Hub. Putting the
current game there takes a production build pointed at the testnet with a real wallet (the dev
wallet, its top-ups and the dev server's relays are dev-only, so the build must reach the testnet's
RPC and drand directly; their CORS is unchecked), committed for Koda to push. It would replace Demo 3
at that address (Koda's call). A hosted page still can't run inside Desktop's sandbox without a
product id: it's for browsers.

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
- Added 2026-11-18 (steps 4–6): [Sign and Submit](https://developers.polkadot.com/apps/build/sign-and-submit/),
  [Signer](https://developers.polkadot.com/apps/product-sdk/signer/),
  [Contracts](https://developers.polkadot.com/apps/product-sdk/contracts/),
  [XCM precompile](https://developers.polkadot.com/smart-contracts/precompiles/xcm/);
  the npm packages `@parity/product-sdk` 0.45.0 (signer 0.17.10, contracts 0.11.10, nfts 0.4.1, keys,
  tx, individuality 0.11.7) and `@parity/truapi` 0.31.0;
  [paritytech/individuality-community](https://github.com/paritytech/individuality-community)
  (`precompiles/personhood`, `precompiles/scarcity`, `pallets/alias-accounts`, `runtimes/next-asset-hub-paseo`);
  [polkadot-fellows/runtimes v2.5.0 `individuality.rs`](https://github.com/polkadot-fellows/runtimes/blob/v2.5.0/system-parachains/asset-hubs/asset-hub-polkadot/src/individuality.rs);
  [trinity-user-agents#1218](https://github.com/paritytech/trinity-user-agents/issues/1218) (PGAS pays every fee).
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
memory per read.

