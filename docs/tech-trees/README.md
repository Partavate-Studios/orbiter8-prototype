# Tech trees (2026-11-07)

Three reference pictures of Orbiter 8's progression, in the style of strategy-game tech trees. They are
drawn from the game's own art and the contracts' starting numbers by `orbiter-client/dev/tech-trees/build.mjs`.
After a change to the numbers or the art, run `node dev/tech-trees/build.mjs` from `orbiter-client/` to redraw them.

| Picture | What it shows |
|---|---|
| [upgrades.png](upgrades.png) | Planet buildings (Claim → Citadel → Colony → Station → Port → Yards → Armory, and the Autofactory); where a siege's hits land on a planet (platforms, moon guns, shield, armor, weapons, hull); the Orbiter 8's upgrades and parts |
| [crafting.png](crafting.png) | Raw goods → manufactured goods → the Autofactory's parts by tier → where parts are fitted (ship, planet, moons) |
| [planet-classes.png](planet-classes.png) | The ten planet classes: what each mines and sells, what its ports buy, people per unit of size |

Each picture marks every item with one of three borders:

- **Solid card edge:** in the game now, with the contracts' numbers.
- **Dashed:** planned, decided but not built (fleets, Relays and the Relay beacon, D26's "consider next").
- **Dotted:** an idea proposed in these pictures. Each one is a call for Koda.

## The ideas, for Koda to weigh

- **Upgrades:**
  - **Deep Scanner** building: charts stars two jumps out.
  - **Exchange** building: standing buy and sell orders at your own port.
- **Crafting:**
  - Recipes for **Equipment** (2 metals + 1 silicon) and **Electronics** (2 silicon + 1 rare element).
  - New intermediates:
    - **Alloy** (3 metals + 1 rare element), for a better tier of plating;
    - **Fuel cells** (2 helium-3 + 1 water ice), to charge the BFG faster or the jump drive (see the story's solar charging).
  - New parts:
    - **Scanner array**, for the Deep Scanner;
    - **Cargo pod**: +10 holds without a shipyard;
    - **Colony pod**: claim a planet and land 100 people in one move.
- **Planet classes:**
  - One extra raw good each class could also yield (an Ice world's helium-3, a gas giant's ring ice…).
  - Moons mined for water ice and metals once a planet has a Station.
