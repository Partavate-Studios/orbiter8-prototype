# Tech tree: upgrades

What players build on their planets, what defends a planet in a siege, and what an Orbiter 8 can
carry. **This file is the source of truth for [upgrades.png](upgrades.png).** Edit it here, then
redraw the picture (see [README.md](README.md)). The game's numbers come from the contracts' starting
values; when the two disagree, the contracts win, so fix this file to match.

How the tables are read (the drawing script depends on it):

- **Status:**
  - `now`: in the game;
  - `planned`: decided, not built;
  - `idea`: proposed, for Koda.
- **Art:**
  - `planet:<class>` for a planet of that class;
  - `ship:<part>=<count>,…` for the Orbiter 8 drawn with those parts;
  - `station`;
  - or the name of a drawing in `orbiter-client/src/assets/art/` (without `.svg`).
- **Details:**
  - lines separated by `<br>`;
  - `**…**` marks a requirement (drawn yellow);
  - `_…_` marks a side note (drawn dim).

## Planet buildings

Each needs the one before. Credits are spent when it starts; goods come from the planet's storage.

| Building | Status | Art | Details |
|---|---|---|---|
| Claim | now | claim | 2,000¢, your ship at its star<br>The planet's deed is an NFT<br>_The discoverer has the first 10 minutes_ |
| Citadel | now | citadel | 5,000¢ · 40 equip · 40 organics · 10 min<br>**Needs 100 people landed**<br>People grow; the planet makes its class's goods |
| Colony | now | colony | 20,000¢ · 80 equip · 40 electr · 30 min<br>**Needs the planet 90% full**<br>Opens the Station and the Autofactory |
| Station | now | station | 50,000¢ · 150 metals · 80 electr · 1 h<br>Opens the Port |
| Port | now | port | 80,000¢ · 100 equip · 100 electr · 2 h<br>A market at your planet, trading by its class. You take the fee |
| Yards | now | yards | 150,000¢ · 200 metals · 100 equip · 4 h<br>Sells holds and engine range to visiting pilots |
| Armory | now | armory | 250,000¢ · 150 rares · 100 electr · 6 h<br>Sells weapons and armor; you take a cut |

## Branches

Buildings off the main line. **Under** names the building each one hangs from.

| Building | Status | Under | Art | Details |
|---|---|---|---|---|
| Deep Scanner | idea | Citadel | deep-scanner | Charts stars two jumps out, not only neighbors<br>_Builds on the drand scans_ |
| Autofactory | now | Colony | autofactory | 60,000¢ · 100 equip · 100 electr · 50 silicon · 2 h<br>Builds parts, five orders at a time<br>_Ground and orbital kinds planned_ |
| Relay | planned | Station | relay | Carries orders to ships far away, with signal lag<br>_For fleets (D26, "next")_ |
| Exchange | idea | Port | exchange | Standing buy and sell orders at your port, filled while you're away |
| Shipwright | planned | Yards | fleet | A second Orbiter 8: fleets, flown through Relays<br>_Ships are NFTs already_ |

## Planet defenses

Where a siege's hits land, in order. Rounds every 30 minutes; both sides fire with what they have at
the start of a round. Allies at the star fire with the planet.

| Layer | Color | Rules |
|---|---|---|
| Orbital platforms | #b9a6d6 | Up to 3, from the Autofactory (40,000¢). 150 hit points each; each adds 4 weapon mounts. Missiles do double against them. Destroyed in battle. |
| Weapons on moons | #ffd65c | Each moon gives 6 free mounts for railguns, missile racks and point defense. Moons can't be destroyed; the weapons on them can. Outside the shield, so they're hit early. |
| Shield | #7fd4ff | Up to 5 levels, 60 each. Regains 10% of its strength every round. Railguns do a quarter against it; missiles double. |
| Armor | #c3b3da | Up to 20 plates, 50 each. Repair bots mend 5 a round each. Railguns do double. |
| The planet's weapons | #5cffc8 | 12 mounts plus the platforms'. Up to 60 drones, 20 repair bots and one BFG (a 300-damage shot every 6 hours). Drones do double here. |
| Hull | #e5cfff | 60 per tech level, the defense grid its buildings support. With all six layers gone the planet is worn down, and the attacker can file a claim (a day). |

## Your Orbiter 8

The first row is the ship itself; the rest are its upgrades.

| Upgrade | Status | Art | Details |
|---|---|---|---|
| Orbiter 8 | now | ship: | 5 holds · range 1 · 6 weapon mounts<br>Registered with your call sign; an NFT whose picture shows what it carries |
| Holds | now | holds | At a shipyard (the I.S.S. or a Yards). Each costs more than the last; up to 250<br>Pods show on the ship from 50 |
| Engine range | now | engine-range | Range 2: 15,000¢<br>Range 3: 150,000¢<br>Range 4: 600,000¢ |
| Repairs | now | repairs | 3,000¢ at any shipyard: everything restored<br>Then 3 hours in the yard before attacking again |
| Fleet | planned | fleet | More ships, flown remotely through Relays, with signal lag<br>_D26: "consider next"_ |

## Ship parts

Fitted at an armory (Sol's I.S.S. sells ship parts at twice their cost) or from your planet's
Autofactory.

| Part | Art | Details |
|---|---|---|
| Railguns | ship:railguns=3 | 2 mounts · 12 damage<br>Double against armor, a quarter against shields |
| Missile racks | ship:missiles=3 | 2 mounts · 12 damage<br>Double against shields and platforms; point defense stops them |
| Point defense | ship:pointDefense=6 | 1 mount<br>Stops 15 missile damage a round |
| Drones | ship:drones=60 | 2 holds each · 2 damage<br>Double against weapons; not stopped<br>_In battle: a swarm of triangles and dots_ |
| Armor | ship:armor=5 | 10 holds a level, up to 5<br>50 each; takes hits after the shield |
| Shield | ship:shields=3 | 20 holds a level, up to 3<br>60 each; regains 10% a round |
| Repair bots | ship:repairBots=6 | 5 holds each<br>Mend 2 armor a round each |

## Notes

| Title | Text |
|---|---|
| How space is shared | Mounts (6): railgun 2, missile rack 2, point defense 1.<br>Holds: drones 2 each, repair bots 5, armor 10 a level (up to 5), shields 20 a level (up to 3). Cargo uses the rest; colonists go 100 to a hold. |
