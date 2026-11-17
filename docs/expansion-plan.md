# Expansion plan: asteroid belts, drones, ship bays, a fully built Sol, and a contract refactor

Koda's decisions of 2026-11-16, and the plan to build them. Written so a session without the history
of the one that wrote it can carry it out: read this whole file, then the documents it points to.
**Status: agreed with Koda (2026-11-16): decisions 1–34 below. Nothing built yet.**

## Progress log (update after every step; newest last)

A session picking this up: read this log, then `git log --oneline -20`, then carry on from the first
unticked box under "Phases". Each step is committed on its own; an uncommitted change in the tree is
work in progress from a session that ran out (check `git status` and `git diff` first).

- 2026-11-16: Phase 0 done. HUD imported (`57d63da`; analysis now `docs/hud-redesign.md`, mockups
  `docs/mockups/hud/`), `client-rnd/hud/` removed, docking bug fixed in the SDK (`tradesSinceArrival`
  in `sdk/src/game/docking.js`), decisions recorded as D67–D100 in `demo4-plan.md` (Milestone 8).
  Seen at phone size: the zoom rail's "−" looks clipped beside the minimap (not fixed yet).
- 2026-11-16: Phase 1, treasury and "Sol fully built" done (`e59dd5b`). Calls X1–X6 in `docs/review.md` §9.
- 2026-11-16: body ids with kinds done: `cell << 16 | kind << 8 | index` (planet 0, asteroid 1); Sol's
  planets stay ids 0–8. Planet-only moves reject other kinds (`Planets._derive`). Play-tested at Sol and
  star 1. The clean-room client's two id lines were updated too.
- 2026-11-16: Planets split: **Claims** (`contracts/src/planets/Claims.sol`: owners, claims, deeds, the
  discoverer's window, body names, star naming, `transfer` for sieges) and Planets (people, production,
  storage, buildings; asks Claims for owners; keeps `ownerOf` and `moonCount` for Battle, Armory, Factory).
  Planets 23.3 → 19.1 KB; Claims 10.7 KB. The star-name fee is Claims' own tuning (`starNameFee`, 50,000
  as a Station cost). SDK binds `addresses.claims`. Play-tested a claim with a name at star 1.
  **The testnet (Paseo) runs the old contracts: it needs a fresh deploy before this client plays it.**
- 2026-11-16: Battle split: **Repairs** (`contracts/src/battle/Repairs.sol`: each ship's condition, a
  siege's losses kept, shipyard repairs, a ship's battle side; the home for the built-in drones' repairs
  in Phase 2). Battle keeps sieges, rounds and planet defenses. Battle 23.9 → 21.8 KB; Repairs 7.4 KB.
  If asteroid sieges need more room, `Combat` (internal, Battle's bulk) can become a linked library;
  check PolkaVM (`resolc`) links libraries first. Play-tested a yard repair.
- 2026-11-16: **Phase 1 done.** End-of-phase checks: 102 forge tests, 138 client tests, lint, production
  build. Played a whole siege on a fresh chain across two pilots (Ada claims Haven at star 1; Bodo buys
  railguns at Earth, attacks, files a claim; 24 h skipped with `cast rpc evm_increaseTime`; Haven is
  Bodo's, deed and all), plus a yard repair and claims with names.
- 2026-11-16: Phase 2, bay types done: `Ship.droneBays` beside `bays` (now cargo bays); every drone
  lives in drone bays (`Pilots.dronesPerBay`, admin-tunable, 1); cargo + drone bays ≤ 250;
  `Market.buyDroneBays`; the shipyard menu's Cargo Holds / Drone Bays toggle; the loadout shows drones
  of drone room. Play-tested at desktop and phone. Calls X10–X12 in `review.md`.
- 2026-11-16 (session resumed after a shutdown; nothing was lost): the 4 built-in drones done, in
  `Repairs` (`assignDrones`, `dronesOf`, lazy repairs, `damageOf`); loadout row to assign them.
  Mining by them waits for Phase 3. Calls X13–X14.
- 2026-11-16: mining drones done (Factory part 9, `Loadout.miningDrones`, shares drone bays, never
  fights); the client shows them in the armory, loadout and a planet's store. **Phase 2 done.**
- 2026-11-16: Phase 3, generation done: `contracts/src/planets/BeltGen.sol` (hasBelt, outsidePlanet,
  section, yields), mirrored by `sdk/src/belt-gen.js` (plus Sol's asteroid names), pinned by
  `test/vectors/BeltVectors.t.sol` (vectors and odds). Call X16.
- **Next: Phase 3, claims, names and deeds for asteroids.** `Claims._check` accepts only planets: let it
  accept an asteroid id when the star has a belt and the section holds an asteroid (`BeltGen.section`),
  never in Sol (the Federation's, decision 7). `mayNameStar` already counts only planets. Names: an
  asteroid has one name part (and its station). Then the building line (decision 22) in Planets
  (Platform → Mine → Port → Armory for asteroids; one line, allowed steps per kind).

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
   on the big asteroid; nothing is built in empty space. (The line: decision 22.)
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

## Koda's answers to the open questions (2026-11-16)

22. **The asteroid's building line:** Platform (people may land) → Mine (drones work; output to the
    asteroid's store) → Port (trades from the store) → optionally Armory (defense mounts). No yards, no
    autofactory. One line for every kind of body, with each kind's allowed steps.
23. **Ports and production:** a player's port (planet or asteroid) is supplied only by its body's
    production. **Sol's Federation ports keep restocking themselves, at the top speed the game world
    allows**: as fast as a station with the most mining drones possible would refill it, and no faster.
24. **Drones on bodies:** one pool per body (bought or built and landed there, like colonists); the owner
    sets how many are on defense and the rest mine. Defense drones fight in sieges and can be destroyed;
    mining drones never are. Changing the split takes effect at once outside a siege, and is frozen during one.
25. **Bay types:** **cargo bays** (cargo and colonists) and **drone bays**, bought separately at shipyards;
    the ship's total space stays capped at 250. **One drone per drone bay for now** (Koda expects more
    drones per bay later: keep the ratio a tunable). Armor, shields and repair bots keep using cargo bays.
26. **The 4 built-in drones:** they take no bays and can't be bought, sold, traded or lost. Each does one
    job at a time, **mining or repairing**; the pilot assigns them (e.g. 2 mining, 2 repairing). Repair
    restores a ship slowly without a yard (rates tunable).
27. **Ships mining empty sections:** `startMining` at a free slot (6 per empty section); **the pilot's next
    action stops it** (any move, a jump included). Output accrues per mining drone into the holds, up to a
    full ship. **A full ship no longer counts toward the 6** (it's just drifting in that part of the belt),
    so another ship can take the slot. **Empty sections never run out.** Ships mine only in empty
    sections, never at an asteroid.
28. **Federation profits:** a player's port pays its fee to its owner today (`Market`, the fee on each
    trade); Sol's ports belong to the Federation, so **their fee goes to the Federation's treasury**: an
    address the admin sets, defaulting to the deployer. The game's creators use that income as they wish.
    (The Federation still mints what it pays and burns what it's paid.)
29. **Asteroid defense:** a moon's 6 weapon mounts, plus a small shield, plus its defense drones; no
    orbital platforms. Tunable.
30. **Names and NFTs:** asteroids are named like planets (by the owner; derived otherwise) and get a deed
    in the Deeds contract. The discoverer's first-claim window applies as it does to planets.
31. **Clients:** the SDK and the main client. The HUD redesign (`client-rnd/hud/`) is first **imported into
    the main client** and then removed as an experimental client; the clean-room client
    (`client-rnd/fresh/`) is updated later.
32. **The contract refactor** below is agreed, and lands first.
33. **Battle drones move into drone bays too**: every drone (mining or battle) lives in drone bays, so how
    much of a ship is drones is one number the pilot chooses.
34. **What stops mining:** any move that changes the ship (a jump, a trade, a purchase, fitting parts…);
    sending a chat message doesn't.

## Notes for later

- **The HUD's planet picker** (the strip of the system's bodies on top of the selection card, from
  `client-rnd/hud/`): Koda likes the other HUD changes but not this one yet. Keep it as is when the HUD is
  imported; revisit later to add much more to it.
- **A bug to fix** before or with the HUD import: after jumping into a system, a ship is drawn docked at
  the station of its last trade there, even if that trade was on an earlier visit (seen jumping back to
  Sol: orbiting Earth instead of the star). A trade should dock a ship only if it came after the pilot's
  latest move into the system. The SDK reads trades (`sdk/src/client.js` `dockedAt`, `sdk/src/game/
  docking.js`); it also needs the pilots' `Jumped` and `Traversed` events (Pilots.sol) to compare blocks.
  Every new arrival orbits the star.

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

**Phase 0: import the HUD.** *(Done 2026-11-16.)* Bring `client-rnd/hud/` into `orbiter-client/` (decision 31), with the
docking bug fixed (see "Notes for later"); then remove `client-rnd/hud/`. Record decisions 1–34 as D67
onward in `docs/demo4-plan.md`, with this plan's milestones.

**Phase 1: contract refactor** (no new features). *(Done 2026-11-16.)*
- [x] Body ids with kinds (`BodyId.sol`, `sdk/src/body-id.js`). *(The `Bodies` derivation of every kind comes with the belts in Phase 3; planets derive as before.)*
- [x] Split Planets (Claims, Settlements) and Battle as agreed; all existing tests pass; sizes recorded. *(Claims and Repairs split out 2026-11-16; Planets keeps its name until asteroids make it generic.)*
- [x] Treasury address for Federation fees (decisions 19 and 28).
- [x] Sol fully built: every Sol station has port, yard and armory (decision 18); client shows them.
- [x] SDK: contracts.js and client.js on the new modules; the existing client plays end to end.

**Phase 2: ships.** *(Done 2026-11-16.)*
- [x] Bay types (decisions 17 and 25): Pilots, Market's shipyard, Armory's fitting rules.
- [x] The 4 built-in multipurpose drones (decisions 13 and 26): assigned to mining or repair.
- [x] Mining drones as a part (decision 9); never lost in battle (decision 14).
- [x] Client: the shipyard sells both bay types; the loadout shows drones and bays by type.

**Phase 3: belts.**
- [x] Generation: which stars have a belt, its 8 sections, each section's asteroid (size, composition)
  or empty; Sol's belt fixed and the Federation's. Contract library + SDK mirror + vectors.
- [ ] Claims, names and deeds for asteroids (not counting toward the star, decision 6).
- [ ] The asteroid building line (decision 22); drone pools and the mining/defense split (decision 24).
- [ ] Ports supplied by production, for asteroids and player planets; Federation ports at the top rate (decision 23).
- [ ] Ships mining empty sections: slots of 6, accrual, the next action stops it, full ships leave the count (decisions 12 and 27).
- [ ] Sieges on asteroids: a moon's mounts, a small shield, defense drones (decisions 6 and 29).

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
