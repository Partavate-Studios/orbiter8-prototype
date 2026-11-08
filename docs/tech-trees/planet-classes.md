# Planet classes: what they offer

What each class mines and makes, what its ports buy, and how many people it holds. **This file is
the source of truth for [planet-classes.png](planet-classes.png)**, and for where each good comes
from in [crafting.png](crafting.png). Edit it here, then redraw the pictures (see
[README.md](README.md)). Goods are named as in [crafting.md](crafting.md).

The numbers are the contracts' starting values:
- **Mines and sells, and Ports buy:** `Market._setMix`.
- **People per size:** `SystemGen.habitability`.

When this file and the contracts disagree, the contracts win, so fix this file to match. **Could also
yield** is an idea, for Koda. **Art** is `planet:<class number>`, with moons to draw.

| Class | Art | People per size | Mines and sells | Ports buy | Could also yield | Note |
|---|---|---|---|---|---|---|
| Terrestrial | planet:0,moons=1 | 1000 | organics, equipment, electronics | metals, rare elements, helium-3, silicon | water ice | The most livable: the industry worlds |
| Rocky | planet:1 | 300 | metals, silicon | water ice, helium-3, organics | rare elements | Thin crust, rich veins |
| Oceanic | planet:2 | 800 | water ice, organics | metals, equipment, electronics | silicon | Sea farms; sand on the sea floor |
| Desert | planet:3,moons=1 | 300 | rare elements, silicon | water ice, organics, equipment | metals | Dune fields over old ore beds |
| Ice | planet:4 | 200 | water ice | rare elements, organics, electronics | helium-3 | Helium-3 trapped in the ice |
| Volcanic | planet:5 | 100 | metals, rare elements | water ice, silicon, electronics | silicon | Glass fields around the vents |
| Gaseous | planet:6,moons=3,rings | 100 | helium-3 | metals, organics, equipment | water ice | Floating cities; ice in the rings. Sizes 16–63 |
| Ferrous | planet:7 | 200 | metals, equipment | water ice, helium-3, organics | rare elements | Iron worlds with foundries |
| Lava | planet:8 | 100 | rare elements, silicon | water ice, equipment, electronics | metals | Molten metal near the surface |
| Swamp | planet:9,moons=1 | 600 | organics | metals, equipment, electronics | water ice | Thick air, thicker water |

## Notes

| Title | Text |
|---|---|
| Production | A settled planet makes the goods its class sells, faster with more people, into its storage (none while besieged). Ports trade by the planet's class: every good is sold and bought somewhere at Sol. |
| People and moons | People per unit of size, times the planet's size (1–16; gas giants 16–63), is its population cap. Moons give 6 weapon mounts each. Idea: moons mined for water ice and metals once a planet has a Station. |
