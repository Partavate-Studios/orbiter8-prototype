# Demo 4 tuning: trade, holds and range (milestone 2)

**For Koda's approval** (D29). These are the numbers the contracts start with. They come from
the simulator, `orbiter-client/dev/sim/economy.mjs`, which plays pilots against the contracts' own
price rules. The admin can change any of them later (`Market.setTuning`). "Find the fun" with real
players comes after this run.

## The targets (D29) and what the simulator gets

The simulator's pilots play **2 hours a day**, so a day of play is 2 hours and a week is 14. They make one move
every 15 seconds while playing, using a session key, so there are no wallet popups. A move is one trade at one port
(selling what that port buys, then buying something to sell at another port) or one purchase at the
yard. They buy in the order of the targets: range 2 first, then bays; from 100 bays they save for
range 3, and once their holds are full, for range 4.

Hours of play to each goal, median pilot:

| Pilots | Range 2 (target ~1 h) | Range 3 (~2 h) | 250 bays (~6 h) | Range 4 (~14 h) |
|---|---|---|---|---|
| 1 | 0.3 | 4.0 | 8.1 | 20.1 |
| 5 | 0.3 | 2.1 | 5.9 | 15.6 |
| 15 | 0.6 | 1.7 | 6.0 | 15.3 |
| 40 | 1.0 | 1.7 | 3.9 | 10.7 |

## The numbers

| Setting | Value | Was (Demo 3) |
|---|---|---|
| Starting credits and bays | 1,000 credits, 5 bays (since 2026-11-19: no credits, 45 of debt and a hold of 3 Helium-3 and 2 Electronics, about 800 credits of goods; below) | 100 credits, 5 holds |
| A port's stock (each good) | 220 units per registered pilot, at least 300 | 2,000 or less, by class |
| Restocking | empty to full in 2 hours | 1 unit every 2 minutes |
| Federation fee on trades | 2%, burned (since 2026-11-16: to the Federation's treasury, D94) | none (owners got 1%, newly minted) |
| Bays | 200 credits, plus 8 for each bay already fitted (bay 6: 240; bay 250: 2,192; all 245: about 298,000) | 250 each |
| Range 2 / 3 / 4 | 15,000 / 150,000 / 600,000 | none |
| Goods (base, spread) | water ice 40, 30 · metals 70, 45 · rare elements 160, 90 · helium-3 120, 70 · organics 60, 40 · silicon 50, 35 · equipment 200, 100 · electronics 260, 130 | 3 goods, about 60 margin each |

**Since these numbers:** a new pilot starts in debt with a hold of goods instead of 1,000 credits
(Koda, 2026-11-19; `Pilots.setStarterKit`, set in `contracts/script/Deploy.s.sol` `wireJoining`; the
debt is in `Credits.debtOf` and paid off first from what the game pays), and the Federation's fee goes
to its treasury (D94). **To change (D111, 2026-11-22):** the debt becomes the advance's value (about 800, not
45), repaid from 50% of each sale's margin rather than from every payment in full; the 50% is Koda's
starting number, to tune. The simulator's runs above assume the old start (`economy.mjs` still gives pilots 1,000 credits).

A unit's margin, from a full selling port to a needy buying port, is 1.2 × its spread: 36 credits for water ice and
156 for electronics. Every unit moves the price, so a big load pays less per unit than a small one.

## What the simulator showed

- **Sol's ports limit everyone's income.** In Demo 3's play session one pilot drained them. Here, with stock fixed,
  one pilot reached range 4 in under an hour, and with 40 pilots half never reached it in two weeks.
  **So the Federation ports grow with the population**: each holds 220 units of each good per registered pilot. That
  keeps the goals within about a factor of two from 5 to 40 pilots. Registered pilots who stop playing still count,
  so a big, quiet population over-supplies Sol; "active pilots" could replace it later.
- **Range 4 is cheap in credits but slow in time,** because once holds are full, income stops growing: Sol's restocking is the
  limit. That's D11's "time to earn" rising steeply (under an hour for range 2, about 13 hours from range 3 to 4 at 15 pilots).
  Claimed planets' ports (milestone 3) add supply, and with it more income.
- **Playing at quiet hours pays far more.** At day 14, the median pilot of 15 had 745,000 credits and the luckiest
  21 million: they played when no one else did, so the ports were full. That's a real dynamic of the design,
  worth watching once people play.
- **A bug found and fixed:** restocking rounded down at every trade and restarted the clock, so a port
  traded more often than once a minute would never restock. The clock now moves on only by the time the regrown
  units took.

## To decide

- Approve these numbers, or name the targets to change.
- Is "2 hours of play a day" the right reading of D29's "a day" and "a week"?

# Battle (milestone 4)

**For Koda's approval** (D30, D53). Played with the contracts' own rounds:
`forge test --match-contract Scenarios -vv` in `contracts/`
([`test/battle/Scenarios.t.sol`](../contracts/test/battle/Scenarios.t.sol)).

## The numbers

| Setting | Value |
|---|---|
| A round | 30 minutes; both sides fire with what they have at its start |
| Damage per round | railgun 12, missile rack 12, drone 2, BFG 300 (once every 6 hours) |
| Point defense | stops 15 missile damage a round each; drones aren't stopped and destroy it first |
| Counters (D53) | railguns ×2 against armor, ×¼ against shields; missiles ×2 against shields and platforms; drones ×2 against weapon systems, ×½ against armor, ×¼ against platforms |
| Hit points | platform 150, shield level 60 (regains 10% of its full strength a round), armor plate or level 50, weapon 30, drone 10, repair bot 20, BFG 200; a planet's hull is 60 per tech level |
| Repair bots | 5 armor a round each on a planet, 2 on a ship |
| A ship | 6 mounts (point defense 1, railgun 2, missile rack 2); up to 5 armor levels and 3 shield levels |
| A planet | 12 mounts plus 4 per orbital platform (up to 3); up to 60 drones, 20 repair bots, 20 armor plates, 5 shield levels, 1 BFG |
| Moons (D61) | 6 mounts each for weapons, can't be destroyed; their weapons are hit after platforms, before the shield |
| Parts at Sol's I.S.S. | twice their Autofactory cost; a player's Armory sells at 1.5 times, to its owner |
| Repairs | 3,000 credits at any shipyard, then 3 hours in the yard |
| A claim | filed once the planet is worn down; completes 24 hours later unless its defenses are back or the attacker is gone |

## What the scenarios show

| Siege | Result |
|---|---|
| Starter (2 railguns, a missile rack) vs an undefended Citadel | worn down in **1 hour** (target: about an hour) |
| Starter vs a Station with a few defenses | the starter is driven off in 30 minutes |
| Raider (3 railguns, 5 armor, 3 shields, 60 drones) vs that Station | worn down in **5 hours** |
| Raider, or a missile brawler, vs a fully built and defended Armory | **the planet holds**; the attacker is driven off within 1.5 hours |

## To decide

- **D30's "about three days" against a fully built and defended planet needs several attackers.** This run's siege has
  one attacker (with up to four ships joining the defense). Against the caps above, no single Orbiter 8 can win.
  Options: let ships join the attack (their fire and hit points pooled, losses shared at the end), or keep one attacker
  and treat a fully defended planet as a fortress until fleets come (D26). Built as a fortress for now.
- Approve the numbers, or name what should change.

## The belt (expansion plan, Phase 5; 2026-11-16)

Starting numbers (contracts): a mining drone makes **1.875 units an hour** of each good it yields
(`Drones.milliPerHour`, chosen so the largest asteroid full of drones, 80, refills 150 an hour: what a
Sol port restocks at capacity 300 over 2 hours); a body holds **10 drones a unit of size**; the mining
drone part costs **800** (1,600 at Sol); every ship has **4 built-in drones**; built-in drones repair
**10 hp an hour** each; the asteroid line costs Platform 3,000, Mine 15,000, Port 60,000, Armory 200,000.

`node orbiter-client/dev/sim/belt.mjs` works out what these make, at a half-full port's prices after
the fee, against trading (`economy.mjs`: an early trader reaches 15,000 credits in 1.3 hours of play,
about 12,000 an hour):

| Who | Makes | Pays back |
|---|---|---|
| New pilot, 4 built-in drones, on carbonaceous / silicate / metallic dust | 471 / 558 / 1,005 credits an hour (5 bays full in 40 min) | a claim (2,000) in 2–4 h |
| One more mining drone aboard (Sol's price, 1,600) | +56 / +68 / +94 an hour | 29 / 24 / 17 h |
| Size 1 asteroid, 10 drones | 1,298 / 1,530 / 2,814 an hour | 74 / 63 / 34 h |
| Size 4 asteroid, 40 drones | 5,048 / 5,944 / 11,052 an hour | 29 / 24 / 13 h |
| Size 8 asteroid, 80 drones | 9,801 / 11,547 / 21,596 an hour | 21 / 18 / 10 h |

Payback counts the claim, Platform, Mine, Port and the drones at Sol's price. An asteroid's income is
an upper bound: it's paid only as other pilots buy from its port, and its store fills (5,000 a good) in
about 33 hours at the top rate.

**Applied 2026-11-17 (Koda: "whatever suggestions you made, implement"):** the mining drone part
800 → **400** (800 at Sol: a drone aboard now pays back in about 9–15 h of mining), and planets'
`producePerHour` 20 → **80** (a full planet beside a mid-size asteroid). Factory gained `setPart`, so
part prices can be retuned on a live deployment. The metallic asteroid's strength is left as it is
until it's been played. Deployed to Polkadot Hub TestNet the same day. The table above is at the old
numbers; `node orbiter-client/dev/sim/belt.mjs` gives the new ones.

Reading (for Koda; the second and fourth, the drone part's price and planets' output, applied above):
- **The floor works** (decision 13): a pilot with nothing can mine Sol's dust and afford a claim in a
  few hours, far slower than trading, as a floor should be.
- **Mining drones aboard a ship pay back slowly** (17–29 h of mining). If ship mining should be a real
  path, halve the part (800 → 400) or double the drone rate for ships only; as it stands, mining drones
  are mostly for landing on asteroids.
- **A large metallic asteroid is the best passive asset in the game** (about as much an hour as an early
  trader, around the clock). Composition matters about 2× (metallic's rare elements); sizes matter
  linearly. If that's too strong, lower `milliPerHour`: but it also sets the Federation's top rate (X19).
- **Planets' people make at most 20 an hour** of each good, a small asteroid's worth: planets look weak
  next to asteroids as producers. Raising `Planets.producePerHour` (to about 60–150) would put a full
  planet beside a mid-size asteroid.
- The simulator plays only Sol's ports; extending it with miners and asteroid owners is the next step
  if these numbers are to be tuned for real.
