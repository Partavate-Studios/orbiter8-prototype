# Orbiter 8, as read from its rules and its API

Written before any design, from `contracts/src`, `sdk/`, `docs/design.md`, `docs/backstory.md`,
`docs/demo4-tuning.md`, `docs/tech-trees/` and `docs/polkadot-direction.md`. The existing client was not read.

## What the player is

A pilot registered with Minerva (the neutral ledger every corporation shares), flying one Orbiter 8
out of Sol in 2140. One pilot per account, one ship per pilot, a unique call sign. The ship is an
NFT; so is every planet deed. Credits are a token the Federation mints when it buys from you and
burns when you pay it.

## The loop, and the arcs above it

1. **Trade at Sol** to turn 1,000 credits and 5 bays into a real ship. Nine Federation stations sell
   some goods and buy others; buy where a port is full, sell where a port is needy.
2. **Spend at the shipyard** (Earth's I.S.S.): more bays (each dearer than the last, up to 250), then
   engine range 2, 3, 4 (15,000 / 150,000 / 600,000).
3. **Explore**: jump to charted stars within range. Being first at a star makes you its discoverer and
   starts its long-range scan, which decides the six cells around it. The galaxy only exists where
   pilots have been.
4. **Claim and build**: claim a planet (2,000), haul colonists from Earth and goods from ports, build
   Citadel → Colony → Station → Port → Yards → Armory, plus an Autofactory. A Port earns its owner the
   2% fee; an Armory sells parts for the owner at 1.5×.
5. **Fight**: arm the ship, lay siege to another pilot's planet, wear it down over 30-minute rounds,
   file a claim, hold for 24 hours, take the planet a tech level down. Or defend your own.

Hours-long arcs (from the tuning doc, at ~2 h of play a day): range 2 in under an hour, range 3 in
~2 h, 250 bays ~6 h, range 4 ~14 h; a Citadel is minutes, an Armory is 6 h of build time behind
half a million credits of buildings; a siege of a defended station is hours, a claim is a day.

## The one rule that shapes everything: **the star is the place**

No action asks where in a system the ship is. Trading, claiming, landing people, fitting, attacking
all require only *the ship at the planet's star*. All nine of Sol's ports are reachable at once; a
buy at Earth and a sell at Mars are two transactions with no travel between them. Jumps move
between stars; inside a system there is no movement at all. (The API derives a "docked at" planet
from your last trade, purely for drawing.)

And a second: **several things work from anywhere** — starting a building, ordering from the
Autofactory, fitting a planet's or its moons' defenses, renaming, completing a claim, advancing a
siege. Only moving matter (cargo, people, parts to or from the ship), claiming, buying and attacking
need the ship there.

## Every action the API offers (`game.actions`)

Costs are the contracts' starting values; the admin can retune them, so the client reads them
(`state.economy.tuning`, `state.rules`) rather than hard-coding.

| Action | Rule | Cost / timer | Where |
|---|---|---|---|
| `createAvatar(name)` + `launchShip(name)` | Holds the call sign, then one `register` transaction. Names 3–24 chars: letters, digits, space, `- _ .`. Wallet only (not a session key). | Free. Grants 1,000 credits, 5 bays, range 1, at Sol. | anywhere |
| `moveTo(cell)` | Jump to a star or black hole within range (hex steps; range − engine damage, min 1). First arrival = discovery: names a drand round `scanDelay` away. | gas only | — |
| `traverse()` | At a black hole: go through to its partner (8–24 steps away, deep in the void). | gas only | at a black hole |
| `resolveScans()` | Writes any pending scans whose drand round is out. Anyone may. The SDK also attaches up to 3 proofs to *every* move, so scans usually ride along free. | gas | anywhere |
| `trade(port, lines)` | `[{good, units}]`, + buys, − sells; SDK sorts sales first and sets a 2% price limit per line. Price moves with every unit; 2% fee (burned at Federation ports, paid to a player port's owner). Port must have stock/room; ship must have bays. | credits | at the port's star |
| `buyHolds(port, n)` | Bay *i* costs 200 + 8·i. Max 250. | credits | at a port with a yard |
| `buyRange(port)` | Next range level. | 15k / 150k / 600k | at a yard |
| `recruit(n)` | Colonists onto the ship, 100 to a bay. | 10 each | at Sol |
| `claimPlanet(id, name?)` | Unowned, not Sol. For 10 min after discovery only the discoverer may (unless they've left). Then optionally names it. | 2,000 | at the star |
| `land / board(planet, n)` | People between ship and your planet. | — | at the star, owner |
| `deliver / collect(planet, good, n)` | Goods between ship and your planet's storage (cap 5,000 a good). | — | at the star, owner |
| `buildStation(planet, building)` | Next building in the line (1–6) or the Autofactory (7, after Colony). One at a time. Credits burned, goods taken from the planet's storage, people needed (Citadel: 100 landed; Colony: 90% of the cap). Counts when its time is up, no second transaction. | 5k–250k; 10 min–6 h | **anywhere** |
| `order(planet, part, n)` | Autofactory queue, up to 5 orders, built one after another; pays credits + goods from storage now. | per part; 5 min–8 h each | **anywhere** |
| `fitPlanet / fitMoons(planet, part, n)` | From the planet's parts store onto its defenses. Planet: 12 mounts +4 per platform (max 3), 60 drones, 20 bots, 20 armor, 5 shields, 1 BFG. Moons: 6 mounts each, weapons only. Works mid-siege. | — | **anywhere** |
| `fitShip / unloadShip(planet, part, n)` | Between your planet's store and the ship. Ship: 6 mounts (PD 1, railgun 2, missile 2), armor ≤5 (10 bays each), shields ≤3 (20 bays), drones 2 bays, bots 5 bays. Not while attacking. | — | at the star, owner |
| `buyParts(port, part, n)` | Buys and fits at once. I.S.S.: 2× cost, ship parts only. A player's Armory: 1.5×, from its store, paid to its owner (the SDK doesn't load another pilot's store: `createGame(...).factoryAt`). | credits | at the star |
| `repair(port)` | Everything restored; then 3 h "in the yard" (can't attack). | 3,000 | at a yard, not attacking |
| `attack(planet)` | Claimed, not yours, not Sol, not already besieged; your ship armed, not retreated, not already attacking. | gas | at the star |
| `joinDefense(planet)` | Up to 4 allies; the owner's ship defends automatically if present. The contracts don't stop a pilot joining twice (the client does, from the feed). | gas | at the star |
| `advanceSiege(planet)` | Plays due rounds (anyone). Any move at the star does this too. | gas | anywhere |
| `fileClaim(planet)` | Attacker, once the planet is worn down. | 24 h wait | anywhere |
| `completeClaim(planet)` | After the wait; succeeds if still worn down and the attacker still there. Planet changes hands one level down. Plays at most 64 due rounds and is refused (`Behind`) if more remain: `advanceSiege` first. | gas | anywhere |
| `withdraw(planet)` | Attacker ends the siege. Jumping away also ends it. | — | anywhere |
| `rename({type,…})` | Star (who may: `mayName`; costs a Station's credits, 50,000), planet / station / moon (owner, free), ship (500). | varies | star: any; ship: any |
| `changeCallsign(name)` | Wallet only. | 2,000 | anywhere |
| `sendChat(msg)` | Galaxy-wide broadcast, ≤280 chars, an event only. | gas | anywhere |
| `startSession() / endSession()` | A browser-made key may make game moves for 4 h, funded with a little gas. No wallet prompts meanwhile. | gas money, swept back | anywhere |

Reads beside `game.state`: `getLeaderboard()`, `loadAround(cell)` (galaxy regions, radius 10),
`planetsOf(cell)` (derived planets of any star), `previewScan(cell)`, `missingFor(planet, building)`,
`lineValue / baysQuote / rangeQuote / partPrice`, `starName`, `traitsOf`, `callsignOf`.

## The economy in one breath

Eight goods (water ice 40±30 … electronics 260±130). A port's class fixes what it sells and buys.
Stock is a *shortfall from full* that heals to zero in 2 h; capacity is 220 units per registered
pilot (min 300). Selling port: `base − spread/10 + spread·shortfall/capacity` per unit; buying port:
`base + spread/10 + spread·(capacity − shortfall)/capacity`. So a full seller and a needy buyer are
1.2 × spread apart, and every unit you move closes the gap. Big loads pay less per unit; quiet
hours pay more.

## Battle in one breath

No dice. Every 30 min both sides fire with what they had at the round's start. Hits land in layers:
planet = platforms → moon weapons → shield → armor → weapon systems → hull (60 per tech level);
ship = shield → armor, then it *retreats* and the spill disables weapons, engine range and bays.
Railguns ×2 vs armor, ×¼ vs shields; missiles ×2 vs shields and platforms, stopped by point defense;
drones ×2 vs systems and kill point defense first. Shields regain 10% a round; repair bots mend
armor. A starter loadout wears down a bare Citadel in an hour and is driven off by a lightly
defended Station in one round.

## On chain, derived, and client-only

- **Stored on chain:** cell states (undecided / empty / star / black hole), who discovered what and
  when, pending scan rounds, black-hole pairs, given names; pilots, ships (cell, range, bays, cargo,
  colonists, loadout, damage), session keys; port shortfalls; planets (owner, level, building in
  progress, people, storage); factory queues and stores; defenses, ship conditions, sieges.
- **Derived from the universe's seed, never stored:** a star's spectral class, size and offset; how
  many planets it has and each one's class and size (so population cap); moons; default names.
- **Worked out lazily from time:** restocking, population growth, production, a finished building,
  factory deliveries, siege rounds. The views return "as of now" without a transaction.
- **Client-only:** which planet a ship "is at" (last trade), orbits and looks, the agenda of timers.

## What is slow, costly or uncertain

- **Every action is a transaction**: seconds on a local chain, a block or more on Polkadot Hub, and a
  wallet approval each unless a session key (or the App's AutoSigning) is live. Thinking is free;
  committing is not. A client should let the player decide fully, then commit once.
- **Scans wait for drand**: 4 s locally, ~30 s on the Hub. The result is unknowable at jump time.
- **Long timers** nobody has to click through: buildings (10 min–6 h), factory orders, siege rounds
  (30 min), the claim (24 h), repairs (3 h), the session (4 h), first-claim (10 min), restock (2 h).
  The game is as much *checking back* as it is *playing*.
- **Prices move under you**: other pilots trade the same ports; a line can be refused (`PriceLimit`,
  `PortFull`) and must be re-quoted.
- **The state is partial**: the SDK loads the system the ship is in, a galaxy region around it, and
  the pilot. A pilot's planets elsewhere, other planets' defenses, and prices at other stars need
  extra reads (see DESIGN.md, "What the client adds").
