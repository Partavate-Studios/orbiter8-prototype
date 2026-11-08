# Tech tree: crafting

From what planets mine, to what the Autofactory builds, to where it's fitted. **This file is the
source of truth for [crafting.png](crafting.png).** Edit it here, then redraw the picture (see
[README.md](README.md)). The tables are read the same way as in [upgrades.md](upgrades.md) (Status,
Art, and Details with `<br>`, `**…**` and `_…_`). Where planet classes get their goods is in
[planet-classes.md](planet-classes.md).

## Goods

The eight goods (Market's starting list), and two intermediates proposed for crafting. **Kind**:
`raw` (mined), `manufactured` (made by planets today), or `intermediate` (an idea).

| Good | Short | Kind | Art |
|---|---|---|---|
| Water ice | Water | raw | good-water |
| Metals | Metals | raw | good-metals |
| Rare elements | Rares | raw | good-rare |
| Helium-3 | He-3 | raw | good-he3 |
| Organics | Organics | raw | good-organics |
| Silicon | Silicon | raw | good-silicon |
| Equipment | Equip. | manufactured | good-equipment |
| Electronics | Electr. | manufactured | good-electronics |
| Alloy | Alloy | intermediate | good-alloy |
| Fuel cells | Fuel | intermediate | good-fuel |

## Manufactured goods

Today every good comes from planets of some class and is traded at ports; nothing is refined yet.
**From** is a proposed recipe (D58: "crafting adds recipes later"), drawn as dotted lines.

| Good | Status | From | Details |
|---|---|---|---|
| Equipment | now | 2 metals, 1 silicon | Made by Terrestrial and Ferrous worlds today<br>_Idea: refine it at an Autofactory from 2 metals + 1 silicon_ |
| Electronics | now | 2 silicon, 1 rare elements | Made by Terrestrial worlds today<br>_Idea: from 2 silicon + 1 rare element_ |
| Alloy | idea | 3 metals, 1 rare elements | 3 metals + 1 rare element<br>Lighter armor and platforms: a better tier of plating |
| Fuel cells | idea | 2 helium-3, 1 water ice | 2 helium-3 + 1 water ice<br>Charges the BFG faster, or tops up the jump drive's banks for a longer jump (see the story) |

## Autofactory parts

The Autofactory's parts (Factory's starting list), by tier, and parts proposed for later. **Fits**:
where a finished part can go.

| Part | Tier | Status | Art | Price | Time | Recipe | Fits | Note |
|---|---|---|---|---|---|---|---|---|
| Drone | I · basics | now | drone-swarm | 500¢ | 5 min | 5 metals, 3 electronics | ship, planet | In battle: a swarm |
| Repair bot | I · basics | now | ship:repairBots=6 | 2,000¢ | 15 min | 10 equipment, 10 electronics | ship, planet | |
| Armor plating | I · basics | now | ship:armor=5 | 2,500¢ | 20 min | 50 metals | ship, planet | |
| Point defense | I · basics | now | ship:pointDefense=6 | 3,000¢ | 20 min | 20 metals, 10 electronics | ship, planet, moons | |
| Railgun | II · weapons | now | ship:railguns=3 | 6,000¢ | 40 min | 40 metals, 20 equipment | ship, planet, moons | |
| Missile rack | II · weapons | now | ship:missiles=3 | 6,000¢ | 40 min | 30 helium-3, 20 electronics | ship, planet, moons | |
| Shield generator | II · weapons | now | ship:shields=3 | 8,000¢ | 1 h | 20 rare elements, 30 electronics | ship, planet | |
| Orbital platform | III · planets | now | orbital-platform | 40,000¢ | 3 h | 200 metals, 100 equipment | planet | |
| Relay beacon | III · planets | planned | relay-beacon | | | 40 electronics, 20 rare elements | planet | For fleets |
| Scanner array | III · planets | idea | scanner-array | | | 60 silicon, 30 electronics | planet | For a Deep Scanner |
| BFG | IV · the big one | now | bfg | 150,000¢ | 8 h | 150 rare elements, 150 electronics | planet | |
| Cargo pod | IV · the big one | idea | cargo-pod | | | 30 metals, 10 alloy | ship | +10 holds without a shipyard |
| Colony pod | IV · the big one | idea | colony-pod | | | 60 organics, 40 equipment | ship | Claim and land 100 people in one move |

## Where parts go

| Target | Art | Details |
|---|---|---|
| Your Orbiter 8 | ship:railguns=2,missiles=1,pointDefense=2,armor=2,bays=50 | 6 mounts, plus holds for drones, bots, armor and shields. Fitted at your planet, or bought at an armory. |
| Your planet | planet:0 | 12 mounts plus 4 a platform; up to 60 drones, 20 bots, 20 plates, 5 shield levels, 1 BFG. Fitted from anywhere, even mid-siege. |
| Its moons | moon-guns | 6 mounts a moon for railguns, missile racks and point defense. Free, can't be destroyed; their weapons sit outside the shield. |

## Autofactory kinds (planned, to design)

Koda, 2026-11-07: there should be **ground (terrestrial) autofactories and orbital autofactories**,
building slightly different things with a lot of overlap. The details wait for a design pass. The
first guesses below are only a starting point:

| Kind | Status | Art | Details |
|---|---|---|---|
| Ground Autofactory | planned | autofactory | On the surface: heavy and bulky things, made from the planet's own goods<br>_Guess: armor plating, BFG, colony pods, repair bots_ |
| Orbital Autofactory | planned | orbital-platform | In orbit, at the Station: things that live or launch in space<br>_Guess: orbital platforms, drones, relay beacons, cargo pods_ |

**Both kinds (the overlap):** railguns, missile racks, point defense and shield generators.

## Notes

| Title | Text |
|---|---|
| Today | Every good is made by planets of some class (see Planet Classes) and traded at ports. Nothing is refined yet: the dotted lines are the crafting milestone's recipes (D58: "crafting adds recipes later"). |
| Moving parts | Ship parts go both ways between your ship and your planet. Platforms and the BFG stay on planets. Weapons come off moons only in peace. |
