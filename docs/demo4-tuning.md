# Demo 4 tuning: trade, holds and range (milestone 2)

**For Koda's approval** (D29). These are the numbers the contracts start with. They come from
the simulator, `orbiter-client/dev/sim4/economy.mjs`, which plays pilots against the contracts' own
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
| Starting credits and bays | 1,000 credits, 5 bays | 100 credits, 5 holds |
| A port's stock (each good) | 220 units per registered pilot, at least 300 | 2,000 or less, by class |
| Restocking | empty to full in 2 hours | 1 unit every 2 minutes |
| Federation fee on trades | 2%, burned | none (owners got 1%, newly minted) |
| Bays | 200 credits, plus 8 for each bay already fitted (bay 6: 240; bay 250: 2,192; all 245: about 298,000) | 250 each |
| Range 2 / 3 / 4 | 15,000 / 150,000 / 600,000 | none |
| Goods (base, spread) | water ice 40, 30 · metals 70, 45 · rare elements 160, 90 · helium-3 120, 70 · organics 60, 40 · silicon 50, 35 · equipment 200, 100 · electronics 260, 130 | 3 goods, about 60 margin each |

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
