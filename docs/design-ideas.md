# Orbiter 8 — Design Ideas & Additions (Working Doc)

Nov 1, 2026 · @Koda

## About this doc

This is the running record of design ideas, decisions and discussion that build on the **Post-Demo 3 design doc** (the "O8 Design - Post D3" doc, now [`design.md`](design.md)). Measured costs of play are in [`cost-estimates.md`](cost-estimates.md). It doesn't repeat that doc. It records what we've added, changed or questioned, so the thinking survives if a chat is lost. It's a working doc and is expected to grow over many sessions.

Each idea is tagged with how settled it is:

- **Leaning:** Koda likes it and it's the current direction, but it isn't locked in.
- **Exploring:** raised and discussed, still open.
- **Parked:** deliberately set aside for later.
- **Suggestion:** proposed by Claude, not yet weighed in on by Koda.

Scope is deliberately open right now. Demo 4 scope will be cut after more exploration.

## Guiding principles

Four rules shape every decision below.

1. **Grounded sci-fi, not fantasy.** Like the Bobiverse books, use standard, well-known sci-fi ideas (von Neumann probes, autofactories, 3D printing, mind uploading) and play them straight and consistently so the future feels plausible. Every game limit should have an in-world reason, not an arbitrary timer.
2. **Fully decentralized.** No required servers or centralized services. A local copy of the client plus the chain should be enough to play. Peer-to-peer is acceptable. This rules out oracles like Chainlink VRF and makes Ethereum bundler networks questionable.
3. **Battle is Demo 4's headline feature.** Conflict is where players interact most and what turns a trading sim into a social game. The goal is to make takeovers fair, not soft.
4. **Explore first, cut later.** The current phase is open exploration. Scope gets cut when Demo 4 work begins.

A related constraint: playing shouldn't feel more expensive than a regular MMO (see Platform).

## Setting and lore additions

The published backstory (2140, Mars colonies, the Great Regrettion, Orbiters in the 2090s, the Orbiter 8 interstellar test, "Liberta Galactica!") stands, with one change (below). These are the unwritten pieces Koda filled in. [`backstory.md`](backstory.md) now tells them all as one story (2026-11-07).

**Stars charge the jump drive (Koda, 2026-11-07, Leaning).** The Orbiter 8 doesn't slingshot from star to star; that doesn't fit real physics. Like Stargate Universe's ship, it charges from a star: a capacitor bank fills in a close orbit and is spent in one faster-than-light jump to a neighboring star, where it has to recharge. That's why travel goes star to star. The 2090s Orbiters stay gravity-assist ships, but only between planets. The game's UI needn't tell this. Suggestions in `backstory.md`: the long-range scan runs while the banks charge, engine range is the size of the bank, and black holes need no charge.

**Corporatocracy (Koda).** All governments failed, but nothing collapsed, because corporations had long since privatized every service. People felt uneasy without government, so corporations built government-like systems: people are *citizens of a corporation*, get a vote, and receive services and protections. This expands the doc's "Idea: No Governments" note.

**Minerva (Koda).** The Minerva Galactic Network predates the corporate takeover. It is the single shared point of collaboration between corporations, and inter-corporate law runs through it. It is also a special kind of AI.

- For gameplay, Minerva is **neutral** (Leaning).
- A hidden-agenda twist is worth considering later (Parked).
- Minerva maps neatly onto the blockchain itself: neutral, owned by no one, enforcing agreed rules. *The smart contracts are Minerva.* The name fits too, since Minerva is the Roman goddess of wisdom.

**Pirates as cypherpunks (Koda).** Pirates aren't just raiders. They're people who refuse to join any corporation, a counterculture mirroring open source vs. software corporations or Bitcoin vs. banks. See Corporations, law and pirates.

**Digital pilots (Exploring).** The cube and fleet ideas (next section) need a lore beat, since the backstory leans on genetic engineering, not uploading minds. Suggestion: make it the Orbiter 8 breakthrough itself. Interstellar distances are too much for human bodies, so pilots went digital.

**Why 2140:** it's roughly when the last bitcoin is mined.

## Pilots, cubes and fleets

The player is a consciousness, the "cube." Ships are bodies the cube takes turns inhabiting. This idea, inspired by the Bobiverse, ties several problems together.

### One mind, many ships (Leaning)

- Originally one ship per player. Tradeable ship NFTs break that: selling leaves you shipless, buying two leaves you unsure which you're flying.
- New model: your consciousness runs a fleet but actively controls **one ship at a time**, and can easily switch focus, like a Bob being in one Manny or VR at a time.
- Selling a ship just shrinks the fleet; buying grows it.
- It also explains the doc's "one avatar per account" rule: the avatar is the mind.
- Open: the doc says you can only board a ship in the same system. Under this model switching could be anywhere, limited by signal lag (below).
- Unattended ships need sensible default behavior, such as basic AMI autopilot for defense.

### Invite-only cubes (Exploring)

- Like Bobiverse replication, the only way to join is for an existing player to **build a cube** and give it to the new account. Still one player = one account = one address.
- Benefits: bots and fake accounts get expensive, players become recruiters, there's a family tree of who brought in whom, and joining is an in-world event.
- Risks: bootstrapping (founding cubes needed), newcomers without friends in-game (corporations could act as recruiting offices), and cube farming (cubes should bind permanently to the account they're given to and cost real time or resources).
- Use von Neumann probes straight. The concept is von Neumann's from the 1940s, not Taylor's. What's distinctly Bobiverse is every probe being a copy of Bob, so avoid that: each cube is a **new** person. Optional flavor: Minerva licenses each new consciousness.

### The cube is what survives (Leaning)

- Instead of ships being undestroyable, the **cube** is. When a ship is destroyed, an escape pod carries the cube back to Earth (or the registered home, which fits the alien expat idea).
- Open: can ships now be truly destroyed? Burning a paid NFT is harsh. One option is a wreck left behind that can be salvaged or towed.
- The pod's trip home is a natural penalty: you're out of that fight. With a fleet you can switch to another ship meanwhile.

### Why ride along: signal lag (Exploring)

Koda's point: if there's no downside to staying home, nobody would put their cube aboard, and hunting a cube is a fun game. So being on board must be worth the risk.

- A cube on board acts instantly at full ability. Remote control from far away lags, growing with distance.
- Koda's mechanic: lag makes actions take longer, e.g. a trade takes 3 blocks instead of 1.
- Suggestion: big actions (leading a siege, claiming a planet, managing weapon heat) require being present.
- Implementation suggestion: two-step orders (submit, then the action completes after the delay), with delays measured in **seconds, not blocks**, so they feel the same on every network.

### Subspace relays (Leaning)

- Koda's idea: build paired relays. Near one relay, actions at the other happen fast. Lag starts only when you're far from your relays.
- Relays become strategic infrastructure: built (possibly by roamers), defended, sabotaged. Cutting an enemy's relay before a siege is a classic opening move. Corporations could run relay networks for members.

### Hunting cubes (Exploring)

- If it's hidden which ship carries a cube, decoys become a tactic. That's possibly the one place worth using zero-knowledge proofs.
- Rewards for taking out a cube:
  - **Tactical:** the player's pod heads home and their fleet drops to laggy autopilot. During a siege, defense collapses.
  - **Bounties:** corporations or players post them, pirates collect.
  - **Experience:** transfer some of the loser's XP penalty.
  - **Ransom:** capture the pod instead (needs a max hold time).
- Suggestion: tactical plus bounties is the cleanest combination.

## Battle and sieges

Sieges stay slow and public, and get fair limits with in-world reasons.

### The problem with the current siege design

As written, an attacker can wear a planet down, file a claim, force the owner to pay a dispute fee, then simply re-siege, over and over. **The richer player always wins eventually**, and a new player can lose months of building to deeper pockets.

### Comparison: TradeWars 2002

- Taking a planet was a straight military fight against its fighters, shields and the citadel's Quasar Cannon. Win and you land and take it, with no dispute and no reduction to nothing.
- What kept it fair: daily turn limits, defense cheap relative to attack, and games that reset on a fixed schedule.
- The Orbiter 8 version (slow wear-down plus a legal-style claim through Minerva) is more interesting and on-theme, but it lacks those brakes.
- Blockchain block times used to throttle turns naturally (12 s mainnet blocks), but L2s (\~2 s) and Polkadot (\~6 s) differ. **Measure durations and cooldowns in timestamps, not blocks.** An energy pool that refills over time is an optional, deliberate version of daily turns.

### Slow, public, castle-style sieges (Leaning)

- Koda wants sieges slow so players who are away don't lose everything fast, and public so everyone knows one is underway: an old-school castle siege with horses and catapults.
- Sieges become events: allies rally, others watch, opportunists jump in.
- Suggestion: a galaxy-wide feed of active sieges, emitted as contract events (cheap, since they come from game actions anyway).

### Grounded limits (instead of arbitrary timers)

- **Repairs after a siege (Koda likes this):** the ship must return to a shipyard before attacking again. This is the cooldown.
- **Logistics (Suggestion):** sieges burn fuel and ammo, and staying far from your own ports costs more, which favors defenders near home.
- **Minerva rules / corporate law (Koda: enforcement through corporations):** claims have waiting periods, and repeat claims against the same planet could be treated as harassment with rising fees. See corporate law below.
- **Warning time:** slow sieges give the owner's allies time to arrive.

### Open information vs. secrets (Exploring)

- Koda: hidden info may not be necessary. Chess has full information and is still deep.
- Risk: an attacker sees your defenses and brings the perfect counter.
- Slow sieges answer that: once a siege starts the defender can see the attacker's loadout too, and has time to swap defenses, call allies with counters, or set traps. That back-and-forth is the depth.
- Keep one hidden element for surprise, e.g. booby traps.
- Hiding techniques, if wanted later: commit-reveal (simple; the defender must be online or have a bot to reveal), zero-knowledge proofs (Dark Forest-style), or encrypted computation (Zama fhEVM; Phala on Polkadot uses secure enclaves).

### Ship-to-ship battle (Exploring)

The doc marks it "uncertain, perhaps not even useful." It matters more now that cubes can be hunted and supply routes can be raided. It's still undefined.

## Weapons and damage

Weapons should reward choices, not spending.

### Overheating: push your luck (Koda, Leaning)

- Firing at a planet heats the weapons. Past a threshold, an explosion risk starts low and climbs the longer you keep firing. You can push as far as you dare, but go too far and you might blow up your own ship.
- Grounded: shedding heat in a vacuum is a real problem, since space only carries heat away slowly by radiation. **Heat sinks and radiators** become ship upgrades.
- To settle: what "blowing up" means (wrecked weapons? forced repair?), and fair on-chain randomness for the roll (see Platform).

### Booby traps (Koda, Exploring)

- A hidden self-destruct on a planet that the original owner triggers after a takeover, e.g. once the attacker starts building their citadel.
- TradeWars precedent: sector mines, and the Atomic Detonator that destroyed a planet.
- It adds doubt for conquerors and a reason to sweep for traps (a scanning upgrade).
- Caution: don't make it a pure spite button. If it destroys the planet outright, defenders would always use it. Suggestion: it wrecks the attacker's new buildings or ship and leaves the planet intact.

### Counters, StarCraft-style (Koda, Leaning)

The idea is a weapons tech tree where you must bring the *right* weapons, not just more of them. Suggested grounded counters:

| Weapon | Strong against | Weak against |
| --- | --- | --- |
| Railguns | Armor | Small, fast targets |
| Missiles | Hard targets, big hits | Point defense |
| Drone swarms | Point defense | Flak |
| Point defense / lasers | Missiles, asteroids | Swarms (overwhelmed) |

The doc's asteroid attack and "level of engagement" ideas already work this way.

### Damage instead of reset (Koda, Leaning)

- Replace the doc's "ship is reduced to original form" with **damage to specific systems** that limits abilities until repaired at a port. Examples: damaged engines mean shorter jumps, a hit cargo bay loses holds, overheated guns go offline.
- Losing hurts and costs time and money but doesn't erase what you built, which matches the slow-siege philosophy.
- Damage can show visually (scorch marks, missing pods).

## Corporations, law and pirates

Corporations are the governments, and their laws set the rules of engagement.

### Corporate law (Koda, Leaning)

- There's a shared system of law (through Minerva), and **each corporation also has its own laws** that allow or punish different battle activities.
- Key open question: *whose* law applies in a fight? The attacker's corporation, the defender's, or whoever controls the star system? If it's the system controller, territory matters a lot, which ties into the doc's Star System Weapons idea.

### Protection and protected zones (Koda, Exploring)

- Corporations could aid members in battle, e.g. by sending a corporate ship.
- TradeWars precedent: FedSpace (sectors 1-10 around Sol), where the Federation hunted down attackers.
- Suggestion: large corporations run NPC patrols in their home systems. This gives new players a safe start, and joining a corporation trades obedience to its rules for protection.
- The frontier between territories becomes lawless, which is where pirates live.

### Pirates (Koda, Leaning)

- Pirates are people who reject corporations, like open source vs. software companies or Bitcoin vs. banks. To become one you denounce any corporate alliance (per the doc).
- Suggestion: mechanics about **freedom**, not just theft. Bands share tech openly, pool resources without corporate taxes, and self-govern by consensus. The trade-off is that no corporation protects them, so they defend each other.
- Raiding (supply routes, bounties on cubes) can still be part of it, just not the whole identity.

## Planets, tech tree and resources

Planets specialize, and building requires moving resources between them.

### Branching tech tree (Suggestion, Koda agreed with the direction)

- Keep the doc's spine (Basic Planet → Citadel → Colony) and branch after Colony, where planet type starts to matter:
  - **Industrial:** mines, autofactories, equipment, roamers.
  - **Military:** armory, planetary defenses, relays. A fortress.
  - **Commerce:** port and yards. Earns from visiting traders.
  - **Terraforming:** the slow SimEarth-style path from dead world to rich one.
- A planet can fully develop only one or two branches, so every planet has a specialty and players need a *network* of planets. Attackers must choose targets: taking out someone's only military world opens up their territory.
- Planet type makes some branches easier, e.g. mineral-rich rock suits Industrial.
- Note: the live contract has Station / Port / Yard / Hub flags already (see Contract review).

### Supply chains and automated routes (Koda, Leaning)

- Each planet produces its own mix of resources. Building requires resources from elsewhere, so goods are shipped in and out.
- Koda's idea: automated recurring shipments between two planets.
- Idle fleet ships could run these routes on autopilot.
- No-server implementation: **lazy updates**. A route has a flow rate, and the contract computes what has been delivered whenever anyone touches either planet. This is the same pattern the live port inventory already uses.
- Battle tie-in: raiding or blockading routes starves a planet before a siege. That's good work for pirates.

### Expanded goods (Suggestion)

The current three goods (equipment, fuel, organics) mirror TradeWars. The doc targets 5-12. A grounded list:

| Good | Tier | Main uses | Typical sources |
| --- | --- | --- | --- |
| Water ice | Raw | Life support; split into H₂/O₂ rocket fuel | Icy moons, comets |
| Metals (iron, nickel) | Raw | Hulls, structures | Asteroids, rocky worlds |
| Rare elements (rare earths, platinum group) | Raw | Electronics, advanced tech | Asteroids, rocky worlds |
| Helium-3 | Raw | Fusion fuel | Gas giants, moons |
| Organics | Raw | Food, biomaterials | Living or terraformed worlds |
| Silicon | Raw | Solar panels, computing | Rocky worlds |
| Equipment | Manufactured | Construction, upgrades | Industrial planets |
| Electronics | Manufactured | Advanced tech | Industrial planets |

That's eight goods. The manufactured tier is the doc's optional crafting layer.

## Crafting

Koda sees Orbiter 8 partly as a crafting game: mine raw materials, build at autofactories, and combine things into bigger things (Exploring). Crafting suits a blockchain well because it's turn-based by nature and needs no real-time play, the same reason TradeWars' turn structure worked. Reference games: EVE Online industry, Factorio, Satisfactory.

### Three tiers (Suggestion)

| Tier | Examples | Made at | Used for |
| --- | --- | --- | --- |
| Raw | Water ice, metals, rare elements, helium-3, organics, silicon | Mined or produced on planets | Primitives |
| Primitives | Plates, wire, circuits, hull panels, reactor cores | Autofactory | Modules |
| Modules | Cargo pods, railguns, radiators, relays, armor | Autofactory / yards | Ships, stations, planet defenses |

### Ties to the rest of the design

- **Planet specialties:** different worlds are good at different primitives, which drives trade and supply routes.
- **Visuals:** modules are the attachments drawn on the ship's on-chain SVG, so what you built is what you see.
- **Damage and salvage:** battle knocks out modules, and wrecks yield primitives, so combat feeds the economy.
- **Lore:** corporations hold **recipe patents** and license them to citizens, while pirates share recipes openly. The open source vs. corporations theme becomes a mechanic.
- **Credit sinks:** factory time, recipe licenses, and repairs.

### Technical notes

- Crafting jobs: start in one tx, collect later, with completion checked lazily by timestamp (same pattern as port inventory).
- Items as **ERC-1155** (one contract, many item types). This is cheaper than an ERC-20 per good and answers the doc's "tokenized goods?" question if wanted.
- Recipes stored as on-chain data, so new ones can be added without redeploying and the client simply reads them.
- Keep it small: about 3 tiers and roughly a dozen primitives. Each item type and step costs storage and gas.

## Economy

Credits are created and destroyed mainly at ports. In a persistent world the supply will creep upward, so steady credit sinks are essential.

### How it works today (from Koda and the contracts)

- Selling goods to a port **mints** credits to the player. Buying from a port **burns** them.
- The port owner earns 1% of every trade at their port. In the contract that 1% is **newly minted** on both buys and sells, not transferred from the trader. Port ownership is therefore an extra faucet, not just passive income.
- Prices follow inventory vs. supply cap, with a small spread (`playerBias`). Inventory regrows over time.
- Station building burns 10,000 credits. Adding cargo holds burns the port's hold price.
- `launchShip` awards 100 starter credits (marked as a temporary todo).
- Ports both mint and burn, but skilled traders always net positive, and owner cuts add more. So the supply grows.

### The game is persistent like an MMO (Koda)

There's no reset like TradeWars games had, so inflation and entrenchment compound over years.

### Credit sinks to balance it (Suggestion)

- Minerva fees: planet claims, dispute fees, pilot name changes, building cubes.
- Repairs and refits after sieges (a steady drain once battle is common).
- Tech-tree buildings and upgrades: pods, radiators, relays, planet branches.
- Corporate taxes (in the doc).
- Vanity upgrades: expensive on purpose.

Open: are fees **burned** (simplest against inflation) or paid into something like a Minerva treasury that could fund sponsored gas? Should the owner's cut become a transfer from the trader's proceeds instead of new mint?

## Galaxy generation

The galaxy grows at its edges. Explorers pay to write new space to the chain and are rewarded with the first chance to claim what they find.

### Design (Koda, built in Demo 3)

- Moving to an unexplored star spawns that star's new neighbors. This spreads the cost of writing the universe across players.
- The explorer gets first opportunity to claim planets (the contract records `discoveredBy` and lets the discoverer rename the star).
- Over time the world keeps expanding around the edges.

### Live contract version

- A graph of sequentially numbered systems, each with up to 12 neighbor slots and 14 planet slots.
- On first visit, `populateStarSystem` links back to known systems, randomly connects or spawns new neighbors, and spawns planets and moons.
- Sol is a preset system (`PresetLibrary`). There's an "Otherverse" (system 0) spawn point linked into Sol.

### Hex prototype (replacement candidate)

Repo: [hexagon-galaxy-prototype](https://github.com/Zaskoda/hexagon-galaxy-prototype). Built together earlier as an easier primitive to display.

- Hex lattice with a single integer index per cell, counted outward from Sol ring by ring.
- Arriving somewhere new surveys its six neighbors. The new-star count leans toward about 4, biased by how crowded the origin was and by proximity to two spiral arms (full neighborhoods common on an arm, empty ones common in the void). Decided cells are locked.
- Black holes about 2%. Names, colors and sizes come from hashing the cell index. Jump range is separate from charting: range lets you cross known space but never reveals new stars.
- **Switching is a data-model change:** the live contract uses sequential IDs plus neighbor arrays, while the prototype uses position-based indices.

### Notes from review (Suggestion)

- **Randomness:** existence must mix chain randomness at jump time (the live contract already does). Otherwise anyone can precompute the whole galaxy. Also see the revert exploit under Contract review.
- **Spiral per universe:** the prototype rolls the spiral with `Math.random()`. On-chain it would be a fixed seed, so each network/universe could get its own galaxy shape, a cheap way to make portals feel different.
- **Frontier helps the endgame:** there's always unclaimed land at the edge for new players. Combined with relays and lag, the frontier is cheap but slow and lawless, and the core is developed and protected.
- **Claim fee vs. explorer reward:** the doc's proposed claim fee works against the first-claim reward. Keep the first-claim window worth the jump.

## Ships and visuals

The Orbiter 8 silhouette is the brand. Upgrades add on to it rather than replace it.

### Evolving look (Koda, Leaning)

- The base shape stays consistent. Upgrades appear as attachments: cargo pods, radiator fins, weapon mounts, relay antennas. Like a modded car, still clearly the same model.
- Damage shows too (scorch marks, a missing pod), which gives repairs a visual payoff.

### On-chain SVG (Koda, wants it soon)

- Ship NFT images generated as SVG by the contracts. Not implemented yet (current `tokenURI` points at orbiter8.com).
- Benefits: no server (fits the decentralization rule), images stay correct on marketplaces, and it grows with upgrades.
- Tips: build the SVG from small reusable pieces because contract size and storage get tight. Rendering happens in a `view` call, so detail costs players no gas.
- A good early, visible, self-contained win.

### Grounded replacements for fantasy tech (Exploring)

- **Cargo multiplier ("compressing space"):** Koda's reasoning is that a finite hull needs some way to hold more. Science check: compressing *matter* needs stellar gravity and isn't viable. Compressing *space* (bigger-inside geometries, Alcubierre-style warping) is allowed by general relativity but needs exotic negative energy. That makes it speculative, not fantasy, about the same level as the FTL drive the Orbiter 8 already needs. A simpler grounded alternative is external cargo pods hitched to the hull, which fits the tractor-beam "train" idea.
- **Energy shields:** swap for armor plating and point defense.

### Ship branding vs. game name

The "Orbiter 8" name refers to the ship, which makes per-network branded ships awkward. See Portals.

## Platform: chains, gas and decentralization

The platform is undecided between Ethereum (L2s) and Polkadot. Gas is the Achilles heel, and everything must work with no servers.

### Ethereum vs. Polkadot (Exploring)

|  | Ethereum + L2s | Polkadot |
| --- | --- | --- |
| Fit for "parallel universes" | Strong: each L2 has its own users, gas and culture | Weaker: parachains share security and talk via XCM, so it's more one connected economy |
| Cross-chain | Bridges, harder | Easier (XCM) |
| Smart contracts | Native EVM | Polkadot Hub contracts live since Jan 2026: REVM (full EVM) and PolkaVM (RISC-V, fast compute) |
| Block time | \~12 s mainnet, \~2 s L2s | \~6 s |
| On-chain randomness | RANDAO (+ commit-reveal) | Built-in randomness |
| Sponsored gas without servers | Usually needs bundlers | Fee rules can live in the chain |
| Reading the chain without a provider | Light clients (Helios) verify answers but still fetch data from an RPC provider | **The smoldot light client runs in the browser and talks straight to the network's nodes: no provider.** Officially through Polkadot tooling (PAPI); a community layer (Pine-RPC) offers Ethereum-style RPC on top. Each read asks peers for proofs, so batching reads matters for speed. |

Note: Polkadot has reportedly been shifting toward a central Hub, so the parachain scene may be shrinking. Check the current state before betting on it. One data point: Moonbeam, Moonriver and Moonbase Alpha, where earlier demos ran, shut down on 2026-08-01, and their tokens moved to Base.

Measured cost of play (from [`cost-estimates.md`](cost-estimates.md)): signing up and growing to 250 holds is about 8 million gas over 74 moves; a station after that, about 2.8 million more, mostly the jump into an unexplored star (2.5 million, since it writes the new system). At 2026-11-01 prices that whole path is about $0.20 on Base, $0.50 on Arbitrum One, $0.73 on Polkadot Hub (rough), and $50 on Ethereum mainnet on a typical day.

### Keeping play cheap (Suggestions)

- Cheap chains: an action costs a fraction of a cent on most L2s and on Polkadot Hub.
- **Session keys:** sign once per session. The client generates a temporary key locally and the contract checks it. No server, no popups.
- Sponsored gas: possible, but on Ethereum it relies on bundlers (a public bundler network might be acceptable). Polkadot can do it at the chain level.
- Keep non-state actions local in the client: route planning, browsing ports.
- Apply the doc's "no XP on trades to save gas" instinct everywhere.
- Two-step lagged orders double transactions, so watch the cost.

### No servers: what changes (Koda's principle)

- Randomness: drop Chainlink VRF (an outside oracle). Use chain randomness plus commit-reveal.
- Chat: the current contract emits chat as events (`ChatLog`). Koda: no need to rebuild chat, since players can use Discord or Telegram. Note: events aren't truly ephemeral. They stay in block history and archive nodes can read old chat.
- Events remain useful for game announcements like the siege feed.

### Zero-knowledge proofs (Exploring)

- Koda is interested in borrowing Dark Forest-style ZK techniques. Generate proofs in the client (e.g. Circom) and verify on-chain. That works on both Ethereum and Polkadot Hub (check REVM elliptic-curve precompiles; PolkaVM suits heavy verification).
- May not be needed if information stays open (see Battle). Its best use may be hiding which ship carries a cube.

## Portals and parallel universes (Parked)

Koda is about 80/20 in favor of keeping portals, but they have to feel right. Cross-network friction is "a challenge for another day."

- **Origin:** the many Ethereum L2s, each with its own flavor, became parallel universes.
- **Consortium pitch (Koda):** launching on multiple networks lets the game partner with each network's community and ecosystem fund. Small communities on each chain get a reason to explore the others, so every network's users become users across all networks. The game *sends* networks users rather than only taking them.
- **Branding:** the doc's per-network ships make the "Orbiter 8" name ambiguous. Options: name the game after something above the ships (e.g. the Minerva Galactic Network, with Orbiter 8 as the first ship), or keep Orbiter 8 as the hero ship everywhere. With the consortium angle, per-network ships become a feature, a friendly rivalry between communities.
- **Reasons to cross:** price differences between universes (in the doc), plus goods or tech unique to one universe, plus a distinct galaxy shape per universe.
- **The catch:** friction. New wallet setup, bridge fees and waiting will stop most players. Crossing must feel nearly seamless.
- **Polkadot angle:** portals are easier to build there, but worlds feel less distinct, so flavor would have to be designed in (different rules or economies per universe).
- **Suggestion:** launch on one network first, and expand when players ask for other worlds.

## Contract review findings

These findings come from reading [orbiter8-prototype](https://github.com/Partavate-Studios/orbiter8-prototype) (Solidity 0.5, "Alpha 3.4" tokens) on 2026-11-01. Fix the security items before any public Demo 4 deploy.

| Area | Finding | Where | Severity |
| --- | --- | --- | --- |
| Access control | `setPlanetTokenizer`, `setShipTokenizer`, `setCreditTokenizer`, `setAvatarControls`, `genesis`, `makeSolarSystem` are `public` with no owner check. Anyone could point the game at their own token contracts. | `Orbiter8.sol` | High |
| Randomness | `blockhash(n-1)` is known before the tx runs. A contract can jump, inspect the new system, and revert if it's bad, keeping only good rolls. Fix with commit-reveal or a future block's hash. | `HelperLibrary.getRandom` | Medium |
| Randomness | `getRandom` takes `Helper memory`, so the nonce increment is never saved. | `HelperLibrary` | Low |
| Randomness | One random value drives star size, neighbors, planets and moons via `(rando + i) % k`, so they're correlated. | `populateStarSystem`, `spawnPlanets` | Low |
| Economy | Port owner's 1% cut is newly minted on both buys and sells (an extra faucet). | `tradeAtPort` | Design |
| Trade | No slippage limit. Trades use the current price, which is the doc's late-transaction problem. | `tradeAtPort` | Design |
| Bug | `expense < balance` should be `<=`, so you can't spend your exact balance. | `tradeAtPort`, `addHoldsToShip` | Low |
| Bug | `addHoldsToShip` adds holds before checking the balance (reverts anyway, but the order is off). | `StarSystemLibrary` | Low |
| NFTs | Ship and planet `tokenURI` point at orbiter8.com. Not yet on-chain SVG. | `ShipTokens`, `PlanetTokens` | Design |
| Model | Galaxy is a sequential-ID graph (12 neighbors), not position-based like the hex prototype. | `StarSystemLibrary` | Design |
| Trade | `tradeAtPort` and `addHoldsToShip` don't check that the ship is at that port, or even in its system. Anyone can trade at any port in the galaxy; only the client stops it. (Found in the play session, 2026-11-01.) | `StarSystemLibrary` | Medium |
| Economy | Ports restock 1 unit per 2 minutes, and every good has the same margin (about 60 credits a unit). One pilot drained Sol's ports in about 70 trades. (Play session, 2026-11-01.) | `PlanetLibrary` | Design |

Already a good fit with the new ideas:

- Port inventory regrows lazily by timestamp, the same pattern needed for supply routes.
- `discoveredBy` plus discoverer star renaming is the explorer reward.
- Station building burns 10,000 credits, a model for other sinks.
- `ShipLibrary` already has `boardShip` (multi-ship groundwork).

## Open questions and known gaps

The biggest gaps are endgame, economy balance, and the new-player path.

### Known gaps

- [ ] **Endgame:** a persistent world with no reset lets veterans entrench. Needs a long-term goal or a way for power to decay over time. The expanding frontier partly helps.
- [ ] **Economy balance:** enough sinks to offset port minting and owner cuts (see Economy).
- [ ] **New player's first hour:** with invite-only cubes, a land rush and established corporations, what does a newcomer actually do?
- [ ] **Ship-to-ship combat:** still undefined, and more important now.

### Open decisions

- [ ] Whose law applies in a fight: attacker's, defender's, or system controller's?
- [ ] Can ships be truly destroyed, or only wrecked and salvageable?
- [ ] What does an overheat explosion do?
- [ ] Booby trap effect: wreck attacker assets vs. destroy the planet?
- [ ] Can you switch ships anywhere, or only near relays or in the same system?
- [ ] Hidden info: fully open, or hide only cube location and traps?
- [ ] Are fees burned or sent to a Minerva treasury?
- [ ] Lore beat for how pilots became digital.
- [ ] Ethereum vs. Polkadot (check Polkadot Hub's current state).
- [ ] Portals: keep, and if so, the game name vs. ship name.
- [ ] Final goods list and count.
- [ ] Adopt the hex galaxy model in contracts?

### Parked for later

- Minerva hidden-agenda twist.
- Cross-network friction for portals.
- Demo 4 scope cut.

## Session log

| Date | Session | Covered |
| --- | --- | --- |
| 2026-11-01 | Play session (Claude, local chain) | A fresh pilot reached 250 holds (47 trades, 25 hold purchases) and built a station; gas per move and costs per network in `cost-estimates.md`; two contract findings added to the review table. |
| 2026-10-31 / 11-01 | Voice + text chat with Claude | First review of the Post-D3 doc (influences: TradeWars 2002, Elite/EVE, SimEarth/Civ, the Bobiverse build system); grounded-realism goal; Ethereum vs. Polkadot; portals and the consortium pitch; siege fairness; overheating, booby traps, counters, system damage; corporate law and FedSpace-style protection; cubes, fleets, escape pods, lag and relays; gas and the no-servers principle; Minerva and corporatocracy lore; pirates as cypherpunks; branching planet tree, supply routes, goods list; evolving ship visuals and on-chain SVG; economy faucets and sinks; galaxy generation and hex prototype; contract review. |
