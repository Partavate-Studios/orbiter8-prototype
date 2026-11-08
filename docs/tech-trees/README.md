# Tech trees

Reference pictures of Orbiter 8's progression, in the style of strategy-game tech trees.

**The Markdown files are the source of truth; the pictures are drawn from them.** To change a tech
tree, edit its Markdown file, then redraw the pictures from time to time:

```bash
cd orbiter-client && node dev/tech-trees/build.mjs     # writes the .svg and .png files here (needs Chrome)
```

| Source | Picture | What it holds |
|---|---|---|
| [upgrades.md](upgrades.md) | [upgrades.png](upgrades.png) | Planet buildings (Claim → Citadel → Colony → Station → Port → Yards → Armory, and branches such as the Autofactory); where a siege's hits land on a planet; the Orbiter 8's upgrades and parts |
| [crafting.md](crafting.md) | [crafting.png](crafting.png) | The goods; manufactured goods and proposed recipes; the Autofactory's parts by tier, and its two planned kinds (ground and orbital); where parts are fitted |
| [planet-classes.md](planet-classes.md) | [planet-classes.png](planet-classes.png) | The ten planet classes: what each mines and sells, what its ports buy, people per unit of size. Also where each good comes from in the crafting picture |

## How the pictures are made

- **Text, numbers and order:** from the Markdown tables. Each file starts with how its tables are
  read. Only the layout lives in `orbiter-client/dev/tech-trees/build.mjs`.
- **The game's own art:** read live from the game's components. That covers the planet surfaces by
  class, Koda's station, ship and moon, and the ship NFT's drawn parts (`sdk/ship-art.js`). A
  Markdown cell names it as `planet:<class>`, `ship:<part>=<count>`, `station` or `moon`.
- **Invented art:** saved as standalone SVG drawings in
  [`orbiter-client/src/assets/art/`](../../orbiter-client/src/assets/art/). There are drawings for
  the goods, the buildings, platforms, the BFG, the pods, and drones as a swarm. A Markdown cell names
  one by its file name.
  - Each drawing is 120 units square and centered, so the game can use the same files.
  - A new drawing goes in that folder first, then gets named in the Markdown. That way it's kept for
    the next redraw and for the game.
- **Numbers** are the contracts' starting values. When a file and the contracts disagree, the
  contracts win, so fix the file to match.

Each item is marked with one of three borders:

- **Solid card edge:** in the game now.
- **Dashed:** planned, decided but not built (fleets and Relays, the two kinds of Autofactory).
- **Dotted:** an idea proposed in these files. Each one is a call for Koda.

## The ideas, for Koda to weigh

- **Upgrades:**
  - **Deep Scanner** building: charts stars two jumps out.
  - **Exchange** building: standing buy and sell orders at your own port.
- **Crafting:**
  - Recipes for Equipment and Electronics.
  - Intermediates:
    - **Alloy**, a better tier of plating;
    - **Fuel cells**, for the BFG or the jump drive's banks.
  - Parts:
    - **Scanner array**;
    - **Cargo pod**: holds without a shipyard;
    - **Colony pod**: claim a planet and land people in one move.
  - What ground and orbital Autofactories each build: first guesses only.
- **Planet classes:**
  - One extra raw good each class could also yield.
  - Moons mined for water ice and metals.
