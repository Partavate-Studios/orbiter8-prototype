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
