# Industry: autofactories, drones and moving goods within a system

**Status: design, not built.** Koda's direction of 2026-11-21, written up with Claude's suggestions
and the questions it leaves. Nothing here is a numbered decision yet: once Koda answers the open
questions, the answers go into `demo4-plan.md` as decisions (from D112; D101–D111 are taken), and the
ones that replace earlier decisions say so. This is a large contract change, for a release after the
current testnet.

## Koda's direction (2026-11-21)

**Three sizes of autofactory.**
- **Small, on the ship.** Every Orbiter 8 has one. It builds drones from raw goods carried in the hold,
  if you have the right ones.
- **Mid, on a planet.** (Today's Autofactory building.)
- **Large, in orbit.** The only one big enough to build ships. A ship takes a lot of goods.

**Ships.**
- New ships are built at orbital autofactories.
- If you rise high enough in a corporation **and** have an advanced enough orbital autofactory, you can
  build that corporation's specialized ship (the ships on the corporation database's "Our ship" pages:
  `docs/archive/briefs/corp-database.md`).
- Ships and planets are bought and sold on a **neutral NFT exchange** if Polkadot has a clean one to
  integrate with. If not, the game gets a basic market of its own.

**Drones.**
- An Orbiter 8 starts with an autofactory, **4 drone bays**, **2 worker drones and 2 defense drones**.
- A destroyed drone can be replaced with one of **either type**.
- "Mining drones" become general **labor drones**, because building needs them too. Both kinds need
  better names (below).

**Drones build.** Build times are fixed today. Instead:
- Starting a build **commits drones** to it. They're busy until it's done, then free again.
- **More drones build faster**, up to a cap per job (say **4**).
- So to found a Citadel you must **leave at least one drone behind**. Once the Citadel has the goods,
  it can build drones of its own.
- Worker drones will matter for much more later. For now, this documents the builder side.

**Moving goods within a system.**
- An autofactory can use the goods of any planet you own in the same system, but **not automatically**:
  you move the goods to it.
- Moving goods between your planets, ports and autofactories needs **cargo ships**. **How many cargo
  ships you have in the system sets the most that one transfer can carry.**
- Shipping between planets unlocks at a certain planet level, **perhaps a spaceport upgrade**.
- **You can always ferry goods yourself** in your Orbiter 8.
- **One screen shows everything you own in the system**: every planet's, asteroid's, port's and
  autofactory's goods, drones and cargo ships.

## The drones' names (Claude's suggestions)

Two short names that read as a pair, work as button labels on a phone, and say what the drone does
without the word "mining".

| Pair | Labor | Defense | For it | Against it |
|---|---|---|---|---|
| **Wrights and Wardens** (recommended) | Wright | Warden | Old words for a maker and a guard, as in shipwright; alliterative; plain enough for a menu ("2 Wrights, 2 Wardens") | "Wright" can read as "write" or "right" when spoken, which matters for Minerva's voice lines |
| Bees and Wasps | Bee | Wasp | Workers and stingers, a pairing everyone gets at once; fits the swarm art (`drone-swarm.svg`) | Cute; may undercut the drones' menace in battle |
| Hands and Pickets | Hand | Picket | "Hands" as in farmhands and deckhands; a picket is a guard post | "Picket" also means a strike line |
| Tenders and Sentries | Tender | Sentry | Literal, readable | Generic |

Whatever the pair, the menus can say the plain role beside it the first few times ("Wright · labor").

## How each piece could work (Claude's suggestions)

### The three autofactories

| | Ship (small) | Planet (mid) | Orbital (large) |
|---|---|---|---|
| Where | Every Orbiter 8, built in | A planet's building line (today's Autofactory) | In orbit around a planet you own (a new building, after the planet's Autofactory and Station) |
| Builds | Drones | Drones, weapons, defenses, repair bots, platforms (as today, D58) | Ships (Orbiter 8s, cargo ships), and the corporations' ships at higher levels; anything the mid one builds |
| Draws on | The ship's hold | The planet's storage | Its own storage, filled by transfers |
| Who works it | The ship's free workers | The planet's free workers | The workers stationed there |

This replaces the "ground and orbital autofactories" note (Koda, 2026-11-07; `tech-trees/crafting.md`,
"Autofactory kinds"): the ground one is the mid size and the orbital one the large.

"An advanced enough orbital autofactory" suggests the orbital one has **levels** (upgrades that cost
goods and time, as buildings do today). A first guess: level 1 builds cargo ships, level 2 the
Orbiter 8, level 3 the corporations' ships.

### Drones as builders

- **Time with drones:** a build's listed time is its time **with the cap's worth of drones (4)**. With
  fewer it takes longer: time = listed time × 4 ÷ drones. One drone takes four times as long. (A
  softer curve is possible; this one is easy to explain: "each Wright does a quarter of the work".)
- **On chain this stays lazy:** a build records how many drones it took and when it's ready, as
  `readyAt` does now. The drones count as busy until then, and are free again whenever anyone next
  touches the planet after `readyAt`. Nothing runs on a timer.
- **Where the drones are:** a planet's builds use the planet's drones; to found a Citadel you drop
  workers from your ship onto the planet (moving drones between ship and planet exists today, D55).
  The first Citadel is slow with one drone, faster with more: a real trade-off against keeping them
  aboard for mining.
- **The Autofactory's queue (D58)** takes drones the same way: each order runs with the drones given
  to it.
- **Drones build drones:** once a Citadel stands and its storage holds the goods, it can build workers,
  so a lone drone left behind isn't a dead end.

### Cargo ships and transfers

- **What a cargo ship is:** an in-system hauler, built at an orbital autofactory. It needs no pilot:
  only the interstellar jump needs a human mind (corp database, "How it works"), so an AMI flies
  between planets of the same star. That makes them cheap to run and keeps the Orbiter 8 the only ship
  that leaves the system.
- **The cap:** a transfer moves at most (cargo ships in the system × each one's capacity), in one go.
  Whether a transfer takes time (longer between distant orbits), and whether the ships are busy
  during it as drones are, is open.
- **The unlock:** a planet sends and receives only once it has the shipping upgrade. Suggestion: a
  **Spaceport** step after the Port (Port: trade with visitors; Spaceport: ship between your own
  bodies). Asteroids could get it too, so belt mining feeds a planet's factories.
- **Ferrying yourself** stays as now: load at one body, unload at another (`load` and `unload` in
  `Planets.sol`), limited by your holds.

### The system screen

One menu, opened from the star's card or a HUD icon, listing for the current star: each body you own,
its goods, its drones (free and busy, with when they're free), its cargo ships and builds in progress,
and a **Transfer** action between any two of them. The menus' look as now (big buttons, sliders as in
trade).

### Corporation levels

There are no ranks in a corporation today: you choose a sponsor and accept its job, and that's all it
records. "Rise to a high enough level" needs a corporation standing system: what earns it (paying off
the starting debt, trade at the corporation's ports, jobs, taxes paid), what it unlocks, and whether it
survives switching corporations. That's a design of its own, and it ties into the corporations'
stories in `backstory.md`.

### Buying and selling ships and planets

Ships, deeds and planets are already ERC-721 NFTs on Polkadot Hub (EVM contracts), with the locks in
`design.md` (no trading a piloted, towed or besieged ship; no trading a planet under siege). Whether a
neutral marketplace lists ERC-721s on Hub, and how cleanly, needs research before choosing. Polkadot's
NFT marketplaces have mostly served the Asset Hub's native NFTs rather than EVM contracts. If there's
none, a basic in-game market (list at a price, buy, cancel; the existing locks respected) is a small
contract.

## What this changes

| Today | Becomes |
|---|---|
| D79, D92, expansion decision 13: 4 built-in multipurpose drones that take no bays and can never be lost | 4 drone bays, 2 workers and 2 defenders; drones can be destroyed and replaced |
| D75, expansion decision 9: mining drones are their own part | Worker (labor) drones: mining, building and more |
| D80, expansion decision 14: mining drones are never lost in battle | Open (below) |
| D58: the Autofactory is a planet building | The mid of three sizes; the ship and orbit get one too |
| Build times fixed per building (`Planets.sol` costs) | Times scale with the drones committed, up to 4 |
| Goods move between bodies only in your own holds | Also by transfers, with cargo ships and a shipping upgrade |
| `design.md`: ships traded on open marketplaces such as OpenSea | A neutral exchange on Polkadot, or a basic in-game market |

## Open questions for Koda

1. **The floor.** Today's built-in drones guarantee that a pilot who's spent everything can still go
   mine (expansion decision 13). If drones can be destroyed and rebuilt only from goods, a pilot can
   lose both workers and have no way back. Keep a floor? For example: workers aboard the Orbiter 8 are
   never lost in battle (only defenders are); or the ship's autofactory can always rebuild one worker
   from nothing, slowly.
2. **Do the 4 starting drone bays count** toward the 250 bays a ship can have, and can a pilot buy more?
3. **Which drones are lost in battle:** defenders only (as D90 has it for bodies today), or workers too?
4. **The cap of 4 drones per job:** the same for every build, or larger for large builds (ships)?
5. **Do transfers take time,** and are cargo ships busy while they haul?
6. **Is the shipping upgrade a new Spaceport step**, or part of the Port?
7. **Who builds cargo ships:** the orbital autofactory only, or the planet's too?
8. **Can a pilot fly a second Orbiter 8** built at their autofactory? It touches "one mind, one ship at
   a time" (corp database; `design-ideas.md`, "One mind, many ships").
9. **The drones' names** (above).
10. **Corporation levels:** what earns them, as a separate design.

## Next steps

- Koda answers the questions; the answers become decisions in `demo4-plan.md`.
- Research the NFT exchange on Polkadot Hub.
- Then a plan in phases, like `expansion-plan.md`: contracts (drones per build, the three
  autofactories, cargo ships and transfers), the SDK, the system screen, and the numbers in
  `demo4-tuning.md`.
