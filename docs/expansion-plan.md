# Expansion plan: asteroid belts, drones, ship bays, a fully built Sol, and a contract refactor

Koda's decisions of 2026-11-16, and the plan to build them. Written so a session without the history
of the one that wrote it can carry it out: read this whole file, then the documents it points to.
**Status: design agreed in principle; the questions in "Still open" go to Koda before building.**

## Read first

1. `CLAUDE.md` (commands, Koda's standing rules), `docs/handoff.md` (how to work without Koda).
2. `docs/demo4-plan.md`: decisions D1–D66 (the game as built), "Consider next".
3. `docs/demo4-tuning.md` (economy and battle numbers), `docs/polkadot-direction.md` (the platform:
   Polkadot Hub, launching in the Polkadot App; testnet deploys are fine with throwaway keys).
4. `docs/ui-guide.md`, `docs/color-guide.md` (how the client is built and colored).
5. `sdk/README.md` (the shared game SDK), `contracts/src/` (the modules named below).

## Where the game stands (facts this plan builds on)

- **Contracts** (`contracts/src/`, each a UUPS proxy, ERC-7201 storage; sizes from `forge build --sizes`,
  limit 24,576 bytes): Pilots 16.2 KB (pilots, ships, cargo, colonists, loadout), Galaxy 15.5 KB (cells,
  scans, names), Market 18.5 KB (goods, ports, trade, shipyard), Planets **23.2 KB** (claims, people,
  production, the building line), Factory 10.2 KB (the Autofactory, parts), Armory 12.6 KB (parts,
  fitting, repairs), Battle **23.9 KB** (sieges), Credits, Ships (ship NFTs), Deeds (planet NFTs); libraries
  Combat, Pricing, SystemGen, HexMath, Spiral, ScanRules, Drand. Planets and Battle are nearly full.
- **Bodies.** A star's planets are derived from the universe seed (`SystemGen`), never stored; a planet's
  id is `cell << 8 | body` (body under 16). Moons are derived too and give six weapon mounts each (D61).
  Sol's nine planets are fixed (Mars is Ferrous since 2026-11-14) and belong to the Federation.
- **The building line on a planet**: Citadel → Colony → Station → Port → Yards → Armory, plus an
  Autofactory, in order (`Planets.build`). People grow; a planet produces goods into its own storage
  (`Planets._settle`, `stock[planet][good]`), which the owner collects. A planet's **port** stock is
  separate: like every port it restocks itself over time (`Market._stock`, `Pricing.restock`), whatever
  the planet produces.
- **Federation ports** (Sol's nine): the Federation mints what it pays, burns what it's paid, and burns
  its fee; a player's port pays its fee to its owner. Only some Sol stations have a yard (`SOL_YARD`), and
  only Earth's has an armory.
- **A ship's space** is one pool of bays (`Pilots._freeBays`): cargo (1 bay a unit), colonists (100 a
  bay), and fitted parts: battle drones 2 bays, repair bots 5, armor 10, shields 20; 6 weapon mounts.
  Ships start with 5 bays (B16), up to 250. Battle drones fight and can be destroyed.
- **A ship is "at a star"**: there's no on-chain position inside a system (docking is drawn by the client
  from recent trades).
- **Three clients**: `orbiter-client/` (the main one), and experiments in `client-rnd/hud/` and
  `client-rnd/fresh/`. All use the SDK in `sdk/`.

## Koda's decisions (2026-11-16)

### Asteroid belts
1. **Which systems:** Sol (between Mars and Jupiter) and some others, about **1 in 4**; at most **one belt
   per system** for now.
2. **Sections:** a belt is a ring cut into **8 sections**.
3. **What's in a section:** usually one large asteroid (the section's primary object); about **1 in 6**
   sections is empty.
4. **Composition and size:** carbonaceous (water ice, organics), silicate (silicon, metals) and metallic
   (metals, rare elements), mirroring real asteroids. Size sets capacity (people, drones, output).
5. **Motion:** the belt turns slowly, visually only, with stations riding on their asteroids; **two layers
   turning at different speeds** for a parallax sense of depth, if it's cheap.
6. **Ownership:** an asteroid is claimed and owned like a planet (a deed). Asteroids do **not** count
   toward naming or owning the star. They can be besieged and defended, with **about a moon's firepower,
   a little more high-tech**.
7. **Sol's belt** belongs to the Federation, like Sol's planets. Players build belts in other systems:
   no land grabs in Sol.
8. **Building on an asteroid:** platform, then people, then drones, then the port: all one infrastructure
   on the big asteroid; nothing is built in empty space. (Open: see "Still open" 1.)
9. **Mining drones are their own part**, separate from battle drones.
10. **Production:** the existing goods, by composition. Rates sensible and **tunable** (contract tuning).
11. **The port is supplied by mining**: an asteroid port's goods come from its drones' mining, the way a
    space station's should come from its planet. **The station has its own drones; how many work sets how
    fast the port replenishes.** Each station's drones are split between **mining and defense** (the
    owner's choice). **Planets should work the same way, on a bigger scale.**
12. **Empty sections** can be mined by ships: a ship parks there and deploys its miners. **Up to 6 ships**
    mine an empty section at once (on chain, only the count matters; the client places them in six hex
    slots by its own simple rule). **When the ship's holds are full, it has to leave.**
13. **Every Orbiter 8 comes with 4 multipurpose drones**, built into the ship: they mine and repair the
    ship over time. They can't be bought, sold, traded or lost in battle. They give every player a floor:
    a pilot who spent down to nothing can go mine. Specialized drones are added on top.
14. **Mining drones are never lost in battle.**
15. **Drawing (level of detail):** far out, a thick translucent band; mid, the band plus a dot for each
    section's asteroid and its station; close, a scatter of small rocks drawn once and reused, plus the
    asteroid's art and station. The graphics setting caps the rock count.
16. **Selection:** every specific object is selectable (each asteroid, each station). An empty section's
    six mining slots are selectable spots, drawn as hexagons (client-side).

### Ships
17. **Bay types:** "cargo bays" and "drone bays", where drone bays set how many drones a ship carries.
    More generally, a ship is customized by how its space is divided between uses.

### Sol and the Federation
18. **Sol is fully built:** every Sol station has everything: port, yard, armory (and whatever later
    buildings add).
19. **Federation port profits** go to the deployment's owner account, or to a configured accounting
    (treasury) account. ("That's how ports should be working now.")

### Contracts
20. **A refactor so the game can keep growing**, done with the fresh deploy these changes need anyway.

### Later
21. **Dwarf planets** (to do; noted in `demo4-plan.md`).

## Still open (ask Koda before building; the suggestion is in brackets)

1. **The asteroid's building line, compared with a planet's.** A planet goes Citadel → Colony → Station →
   Port → Yards → Armory (+ Autofactory). [Suggestion: a shorter line on the asteroid, mirroring it:
   **Platform** (the claim's first building: people may land) → **Mine** (drones work; output to the
   asteroid's store) → **Port** (trades from the store) → optionally **Armory** (defense mounts). No yards,
   no autofactory. One line for both kinds of body, with each kind's allowed steps, would keep the code
   one shape.]
2. **Planets supplying their ports.** Today every port restocks itself over time. Decision 11 makes a
   player's port supplied only by its body's production. [Suggestion: player ports (planets and asteroids)
   are supplied by production; **Sol's Federation ports keep restocking themselves**, so the economy's
   center never runs dry. A port's sell side comes from its store; its buy side still takes goods up to
   its capacity.]
3. **Drones on stations: the mining/defense split.** [Suggestion: a body has one pool of drones (bought or
   built and landed there, like colonists); the owner sets how many are on defense; the rest mine. Defense
   drones fight in sieges and can be destroyed; mining drones never are (decision 14). Changing the split
   takes effect at once outside a siege, and is frozen during one.]
4. **Bay types.** [Suggestion: two kinds bought separately at a shipyard: **cargo bays** (cargo and
   colonists, as now) and **drone bays** (one drone each: mining or battle). Armor, shields and repair bots
   keep using cargo bays for now. The ship's total space stays capped at 250. Existing ships: none, the
   deploy is fresh.] Should battle drones move to drone bays too?
5. **The 4 built-in drones.** [Suggestion: they need no bays; mining rate per drone as for mining drones;
   repair: one hold or one point of range back every N hours (tunable), so a damaged ship heals slowly
   without a yard.] Do they mine and repair at the same time, or one job at a time?
6. **Ships mining an empty section.** [Suggestion: an action `startMining(section)` at the ship's star
   (needs a free slot of 6); output accrues per drone over time into the holds, computed when read; the
   ship stops when full (no more accrual) or when the pilot calls `stopMining` or jumps (jumping ends
   it). While mining, the ship is "at" the section.] Do empty sections deplete over time? [Suggestion: no,
   for now.] Can a ship mine at a section with an asteroid, the owner's or another's? [Suggestion: no.]
7. **Federation profits to an account.** Federation ports mint what they pay and burn what they're paid.
   [Suggestion: keep that, and send the fee (now burned) to a `treasury` address set by the admin,
   defaulting to the deployer.] Or should the treasury also receive the margin?
8. **Asteroid defense in numbers.** [Suggestion: 6 mounts like a moon, plus a small shield (a moon has
   none); defense drones from decision 11; no orbital platforms.]
9. **Names and NFTs.** [Suggestion: asteroids get names like planets (owner-named, derived otherwise) and
   a deed in the existing Deeds contract.]
10. **Which client first.** [Suggestion: the SDK and `orbiter-client/`; the experimental clients follow.]
11. **The contract refactor's scope** (see the proposal below): agree on it before any belt work.

## The contract refactor (proposal, to agree with Koda)

The game is growing new kinds of bodies (asteroids now, dwarf planets next) and new ship systems (bay
types, drones, mining). Planets and Battle are within 1.4 KB and 0.7 KB of the size limit. Goals: room
to grow, one shape for every kind of body, nothing lost.

1. **Bodies, one registry for every kind.** A `Bodies` library (or module) that knows every body at a star:
   planets, moons, asteroids (by belt section), later dwarf planets, derived from the seed. A body id that
   encodes its kind: e.g. `cell << 16 | kind << 8 | index` (kind 0 planet, 1 asteroid, 2 dwarf planet…),
   replacing `cell << 8 | body`. Moons stay part of their planet.
2. **Holdings, generic ownership and infrastructure.** Split today's Planets into: **Claims** (ownership,
   deeds, the discoverer's window, names), **Settlements** (people, production, storage, the building
   line with per-kind allowed steps), and keep the star-naming rule in one place (planets only).
3. **Drones and mining** in their own module: drone pools on bodies (mining/defense split), ship drones
   (built-in four, mining and battle drones), empty-section mining slots, output accrual.
4. **Ships**: bay types in Pilots' ship record (or a Ships-side module if Pilots grows past its budget).
5. **Market**: ports supplied by a body's store (player ports) or restocking (Federation); a `treasury`.
6. **Battle**: split along its seams (sieges and their rounds; the combat math is already a library) so it
   has room for asteroid and drone rules.
7. **Keep**: UUPS proxies, ERC-7201 storage, the GAME_MODULE role between modules, events for every state
   change, the SDK's pure mirrors (SystemGen ↔ system-gen.js) with cross-check tests.

The refactor lands first, with the game behaving as now (all forge tests pass, the client plays), then
the features land on it.

## Phases

Each phase ends with: `forge test` and `forge build --sizes` (all under the limit), `npm test` and
`npm run lint` in `orbiter-client/` (covers `sdk/`), a production build, and a play-test like a player
(desktop and phone). Commit per step; never push. Log guesses in `docs/review.md`.

**Phase 0: agree.** Koda answers "Still open"; record the answers as decisions (D67 onward) in
`docs/demo4-plan.md`, and add this plan's milestones there.

**Phase 1: contract refactor** (no new features).
- [ ] Body ids with kinds; `Bodies` derivation (planets as now); SDK mirror and cross-check vectors.
- [ ] Split Planets (Claims, Settlements) and Battle as agreed; all existing tests pass; sizes recorded.
- [ ] Treasury address for Federation fees (decision 19, "Still open" 7).
- [ ] Sol fully built: every Sol station has port, yard and armory (decision 18); client shows them.
- [ ] SDK: contracts.js and client.js on the new modules; the existing client plays end to end.

**Phase 2: ships.**
- [ ] Bay types (decision 17, "Still open" 4): Pilots, Market's shipyard, Armory's fitting rules.
- [ ] The 4 built-in multipurpose drones (decision 13): repair over time.
- [ ] Mining drones as a part (decision 9); never lost in battle (decision 14).
- [ ] Client: the shipyard sells both bay types; the loadout shows drones and bays by type.

**Phase 3: belts.**
- [ ] Generation: which stars have a belt, its 8 sections, each section's asteroid (size, composition)
  or empty; Sol's belt fixed and the Federation's. Contract library + SDK mirror + vectors.
- [ ] Claims, names and deeds for asteroids (not counting toward the star, decision 6).
- [ ] The asteroid building line ("Still open" 1); drone pools and the mining/defense split.
- [ ] Ports supplied by production ("Still open" 2), for asteroids and player planets.
- [ ] Ships mining empty sections: slots of 6, accrual, leaving when full (decision 12).
- [ ] Sieges on asteroids: a moon's firepower plus (decision 6, "Still open" 8).

**Phase 4: drawing the belt** (orbiter-client; see "Graphics").
- [ ] The three levels of detail (decision 15), two parallax layers (decision 5), selection (decision 16).
- [ ] The asteroid's card, menus (claim, build, drones, port, mining) and the ship's mining flow.
- [ ] Performance measured at Sol, CPU slowed 4× (`CPU_THROTTLE=4` in the harness), before and after.

**Phase 5: tuning.** Mining rates, drone prices, port supply against the economy simulator
(`orbiter-client/dev/sim/economy.mjs`); record numbers in `docs/demo4-tuning.md`.

## Graphics

- **Look:** one Fable request for a single SVG of the three zoom levels (Koda: keep Fable use limited to
  short direct requests or deliverables, no testing or evaluation). Save the art as reusable SVG files in
  `orbiter-client/src/assets/art/`.
- **Far:** the belt as a translucent band (a stroked circle with a gradient), tinted by the sections'
  compositions. **Mid:** band + one dot per asteroid and station. **Close:** a rock field drawn once into
  an offscreen canvas or SVG pattern and rotated as a whole (two layers at different speeds for parallax),
  so its cost is a couple of draws per frame, not one per rock; the section's asteroid and station drawn
  as objects. Low graphics: band and objects only.
- **Colors:** the color guide's rules (world colors for rocks; yellow marks for yours; pink for sieges).
- **Selection:** an asteroid and its station like a planet and its station; an empty section's six
  mining slots as small hexagons along the band.

## Risks

- **Economy:** ports supplied only by production changes trading everywhere outside Sol; simulate first.
- **Size limits:** the refactor's purpose; measure after every step.
- **The PolkaVM memory limit** (`docs/polkadot-direction.md`): reads returning long lists fail there;
  a star's bodies now include eight sections. Keep per-call lists short, or stay on EVM bytecode.
- **Performance** on phones: the rock field must be a few draws, not hundreds.
