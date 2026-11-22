# Expansion plan: asteroid belts, drones, ship bays, a fully built Sol, and a contract refactor

Koda's decisions of 2026-11-16, and the plan to build them. Written so a session without the history
of the one that wrote it can carry it out: read this whole file, then the documents it points to.
**Status: agreed with Koda (2026-11-16): decisions 1–34 below (D67–D100 in `demo4-plan.md`). Built
2026-11-16, phases 0–5, and Sol's asteroids on 2026-11-18 (see the progress log). Everything in this
plan is built;** what it left open is listed in `demo4-plan.md`, "Consider next: what's left", and in
"Left for Koda" at the end of the log.

## Progress log (newest last)

Every phase is through. The log is kept for the record: each step's commit, and the calls (X1–X34) in
`docs/review.md` section 9, hold the details.

- 2026-11-16: Phase 0 done. HUD imported (`57d63da`; analysis now `docs/hud-redesign.md`, mockups
  `docs/mockups/hud/`), `client-rnd/hud/` removed, docking bug fixed in the SDK (`tradesSinceArrival`
  in `sdk/src/game/docking.js`), decisions recorded as D67–D100 in `demo4-plan.md` (Milestone 8).
  Seen at phone size: the zoom rail's "−" looks clipped beside the minimap (not fixed then; the
  minimap and zoom now fold out under the system's name, ec77f53, 2026-11-21: recheck on a phone).
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
  *(Redeployed 2026-11-17, below.)*
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
- 2026-11-16: asteroid claims done: `Claims._check` accepts an asteroid id where the star's belt has
  one (never Sol's); names (no moons), deeds and the first-claim window as for planets; they don't count
  toward the star. The leaderboard counts planets only. Test fixtures can override the universe seed
  (`GameFixture._universe`); `AsteroidClaimsTest` uses one whose genesis ring has a belt (cell 3).
  Not played in the browser yet: asteroids are drawn in Phase 4.
- 2026-11-16: the asteroid line done in Planets (`_derive` for both kinds, `_nextStep`, asteroid costs at
  step + 8, `_cap`, `belt(cell)` view, no moons), Market mixes for classes 10–12, SDK `belt()` and
  `rules.asteroidBuildings`. Planets 20.9 KB. Call X17.
- 2026-11-16: drone pools done: `contracts/src/planets/Drones.sol` (land, board, setDefense, poolOf,
  outputOf); Planets mines by `drones.outputOf` on asteroids past the Mine (`_rate`); SDK bindings
  (dronePool, landDrones, boardDrones, setDefenseDrones). Planets 21.1 KB, Drones 8.7 KB. Call X18.
- 2026-11-16: ports supplied by production done (Market `IPortSupply`, Planets `supplyOf`/`useStock`;
  the buyer pays the owner; Sol unchanged; drone rate 1.875 so the top asteroid matches Sol's restock;
  `portsAt` lists asteroid ports). Call X19.
- 2026-11-16: ships mining empty sections done (Drones `startMining`/`stopMining`/`miningOf`/`slotsOf`,
  Pilots `_change` stops mining on every ship change, `BeltGen.dust`; SDK bindings and dust mirror).
  Played in the browser: a new pilot mined Sol's empty section and sold the metal. Call X20.
- 2026-11-16: asteroid sieges done (Battle reads the pool's defense drones, `Drones.loseDefense`, Armory
  asteroid limits, `Planets.seize` steps down an asteroid's own line). **Phase 3 done** (contracts and
  SDK; nothing of it is drawn yet). Battle 22.7 KB (1.9 KB left), Planets 21.3, Market 20.3. Call X21.
- 2026-11-16: Phase 4 drawing done (`5737c8b`): SDK belt objects (`asteroid`, `section`, stations
  `onAsteroid`), band on `guides-canvas.vue`, rocks on `belt-canvas.vue` (per visible slice), sprites
  with Fable's art (`assets/art/asteroid-*.svg`), mining-slot hexagons; selectable. Mockup
  `docs/mockups/belt-levels.svg`.
- 2026-11-16: Phase 4 cards and menus done (`b682ea3`, `5b27b50`): asteroid and empty-space cards, actions
  (claim, Asteroid Works, attack, Mine Here / Stop Mining), the Asteroid Works menu (line, people,
  drones, store), mining ships drawn at their slot. Played in the browser: claim through the card's
  dialog at star 1, land drones, mine at Sol's empty section.
- 2026-11-16: performance at 4× CPU throttle (5 s idle traces, Ada at star 1's belt): script 1.10 s with
  the rock field (normal graphics), 1.42 s without (low), 1.81 s at a planet: the belt adds no measurable
  cost. The rock canvas redraws about 4 times a second (only for a zoom, a real move, or every 250 ms).
  Layer compositing is about 3.4 s of 5 s everywhere at 4× (not the belt's). **Phase 4 done.**
- 2026-11-16: Phase 5 analysis done: `orbiter-client/dev/sim/belt.mjs` and a "The belt" section in
  `docs/demo4-tuning.md` (what mining, drones and asteroids earn against trading, with a reading for Koda).
  No numbers changed: tuning for feel is Koda's call. **The plan's phases are all through.**
- 2026-11-17: Koda approved X21; asked for asteroids to roam their sections (done: `asteroidRoam` in
  `sdk/src/game/orbits.js`); the tuning suggestions applied (mining drone 400, planets 80 an hour,
  `Factory.setPart`); **deployed to Polkadot Hub TestNet** (addresses in `sdk/src/chain/networks.js`,
  `contracts/deployments/420420417.json`; about 19 PAS); a GitHub Pages workflow
  (`.github/workflows/pages.yml`) publishes the client at https://partavate-studios.github.io/orbiter8-prototype/
  on every push to `polkadot` (Settings → Pages → Source: GitHub Actions). Next release: a debug cheat code
  (`demo4-plan.md`, Consider next). *(Done 2026-11-18, 6ec309b.)*
- 2026-11-18: Sol's asteroids fully built (the section below): `contracts/src/planets/Sol.sol` says which
  bodies are Sol's Federation stations (its nine planets and its six asteroids) and their port classes;
  Market (ports, yards) and Armory (parts at the Federation's price) ask it. Sol now has 15 ports. Calls X30–X31.
- 2026-11-18: reads reshaped for the testnet's per-read budget (`polkadot-direction.md`), then
  **redeployed to Polkadot Hub TestNet** (60 transactions, 17.96 PAS; addresses in `sdk/src/chain/networks.js`).
  The client plays it and reads Sol whole. Calls X32–X34.
- 2026-11-19: redeployed to the testnet with everything since 11-17 (3b98d38, tag `testnet-2026-11-19`).
- **Left for Koda / a later session** (checked 2026-11-22; all also in `demo4-plan.md`, "Consider next:
  what's left"): (1) review calls X1–X22 in `docs/review.md`, and the mockup
  `docs/mockups/belt-levels.svg`; (3) tuning choices in `demo4-tuning.md` "The belt" (two applied
  2026-11-17; the rest open); (4) extending the economy simulator with miners and asteroid owners (not
  done); (5) dwarf planets (decision 21; not done); (6) the clean-room client (`client-rnd/fresh/`)
  learns the belt (decision 31; not done); (7) Battle has 1.9 KB left: `Combat` as a linked library if
  it needs more. Sizes then: Planets 21.3 KB, Battle 22.7, Market 20.3, Pilots 17.5, Drones 13.9, Armory
  13.2, Claims 11.3, Repairs 10.4. Sizes on 2026-11-22: Pilots 22.9 KB, Battle 22.7, Planets 22.3,
  Market 20.6, Ships 17.8, Deeds 14.7, Drones 13.9, Armory 13.5, Claims 12.5, Repairs 10.4.

## Read first

1. `CLAUDE.md` (commands, Koda's standing rules), `docs/handoff.md` (how to work without Koda).
2. `docs/demo4-plan.md`: decisions (D1–D66 then; D1–D110 now), "Consider next".
3. `docs/demo4-tuning.md` (economy and battle numbers), `docs/polkadot-direction.md` (the platform:
   Polkadot Hub, launching in the Polkadot App; testnet deploys are fine with throwaway keys).
4. `docs/ui-guide.md`, `docs/color-guide.md` (how the client is built and colored).
5. `sdk/README.md` (the shared game SDK), `contracts/src/` (the modules named below).

## Where the game stood (facts this plan built on, 2026-11-16)

A snapshot from before the plan was built; the refactor and the phases changed several of these (body
ids, the module split, sizes, bays).

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

## Missed in the first pass: Sol's asteroids fully built (Koda, 2026-11-18)

Koda's answer to question 7 (2026-11-16) was that Sol's belt belongs to the Federation **and** that
"everything in Sol should be fully built, meaning every space station should have all the things, an
armory, a port, etc." Decisions 7 and 18 recorded the ownership and the nine planet stations, but not
that **Sol's asteroids are built up too**, so Phase 3 left them bare (protected from claims, no stations).

- [x] Every non-empty asteroid in Sol's belt has a Federation station, fully built: everything the asteroid
  line allows (Platform, Mine, Port, Armory; decision 22), plus a yard (Koda, 2026-11-18: Sol is fully
  built; the yard is the Federation's addition, outside the asteroid line: X30).
- [x] Their ports trade by the asteroid's composition (Market classes 10–12), owned by the Federation:
  restocking at the top rate like Sol's other ports (decision 23), fees to the treasury (decision 28).
- [x] Their armories and yards work like Sol's planet stations'; their defenses are the Federation's
  (unattackable, as Sol's planets).
- [x] SDK: `portsAt(0)` lists them; the client draws a station on each and counts them on the galaxy map.
- [x] Sol's empty section stays open to mining.

## Notes for later (one fixed, one moved)

- **The HUD's planet picker** *(moved to `demo4-plan.md`, "Consider next: what's left")* (the strip of the system's bodies on top of the selection card, from
  `client-rnd/hud/`): Koda likes the other HUD changes but not this one yet. Keep it as is when the HUD is
  imported; revisit later to add much more to it.
- **A bug to fix** before or with the HUD import: after jumping into a system, a ship is drawn docked at
  the station of its last trade there, even if that trade was on an earlier visit (seen jumping back to
  Sol: orbiting Earth instead of the star). A trade should dock a ship only if it came after the pilot's
  latest move into the system. The SDK reads trades (`sdk/src/client.js` `dockedAt`, `sdk/src/game/
  docking.js`); it also needs the pilots' `Jumped` and `Traversed` events (Pilots.sol) to compare blocks.
  Every new arrival orbits the star. *(Fixed in Phase 0: `tradesSinceArrival` in
  `sdk/src/game/docking.js`.)*

## The contract refactor (agreed, D98; built in Phase 1)

*As built:* body ids with kinds (`BodyId.sol`); Claims split out of Planets and Repairs out of Battle;
Planets kept its name rather than becoming Settlements; drones and mining went into their own module
(`Drones.sol`); belts are derived by `BeltGen.sol`; the treasury is in Market. The proposal as agreed:

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

**Phase 3: belts.** *(Contracts and SDK done 2026-11-16.)*
- [x] Generation: which stars have a belt, its 8 sections, each section's asteroid (size, composition)
  or empty; Sol's belt fixed and the Federation's. Contract library + SDK mirror + vectors.
- [x] Claims, names and deeds for asteroids (not counting toward the star, decision 6).
- [x] The asteroid building line (decision 22); drone pools and the mining/defense split (decision 24).
- [x] Ports supplied by production, for asteroids and player planets; Federation ports at the top rate (decision 23).
- [x] Ships mining empty sections: slots of 6, accrual, the next action stops it, full ships leave the count (decisions 12 and 27).
- [x] Sieges on asteroids: a moon's mounts, a small shield, defense drones (decisions 6 and 29).

**Phase 4: drawing the belt** (orbiter-client; see "Graphics"). *(Done 2026-11-16.)*
- [x] The three levels of detail (decision 15), two parallax layers (decision 5), selection (decision 16).
- [x] The asteroid's card, menus (claim, build, drones, port, mining) and the ship's mining flow.
- [x] Performance measured at Sol, CPU slowed 4× (`CPU_THROTTLE=4` in the harness), before and after.

**Phase 5: tuning.** *(Analysis done 2026-11-16; numbers left to Koda.)* Mining rates, drone prices, port supply against the economy simulator
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
