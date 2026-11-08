# Color direction (2026-11-07)

Notes on the two color mockups and Koda's verdicts. Neither mockup is in the game.

- [color-study.svg](color-study.svg): a dense scene of the game's existing art, recolored. Purple stays the base; every other kind of thing gets its own family.
- [planet-card-colors.svg](planet-card-colors.svg): the game's screen with a planet selected and its card up, then the card for every kind of selection.

## Koda's verdicts

| Element | Verdict |
|---|---|
| **Planets** in their class colors (gradient sphere, colored surface marks, the light-and-shadow overlay) | Likes them a lot. |
| **Solid orbit lines**, faintly tinted by the planet on each | "Nicer than I expected." |
| **Tilted planet rings** in the class's colors | Likes them. |
| **Color on the buttons** (the HUD buttons tinted by function) | "Pretty darn good." |
| **The pink frame around a planet under siege** | Loves it. |
| **Star color and glow** | Preferred over the nebulae. Probably only the star's color, which costs no more than the glow the game draws now. |
| **Nebulae** (large translucent glows) | Not needed. The star's color does more. |
| **Cards in the selection's colors** (frame gradient from the selection's color into purple) | Doesn't like them: the purple in each feels awkward, probably the gradient. The cards need another approach. |

## Built (2026-11-07, commit e09181d)

Koda: "lets color the stars", with purple as the game's color and deep space's, a yellow Sol, the
star's color reaching its system "to a degree… just the glow", some gray in UI components, and costly
detail on high graphics only. Built:

- **Stars by spectral class** (`sdk/traits.js`, colors in `libs/palette.js` `STAR_CLASSES`): in the
  system view, on cards, the galaxy map, the minimap and the star button. The glow takes the class's
  color, and the system's dim glow is warmed or cooled toward it (only 22%, so space stays purple).
- **Planets by class** (`PLANET_COLORS`), surfaces in the class's colors, **tilted rings**, **solid
  orbit lines** in the planet's color.
- **HUD buttons tinted by function** (`HUD_TINT`); **purple-gray card insides** (`CARD_GRAY`); the
  **pink frame** around a besieged planet's card.
- **Not built:** nebulae; cards recolored per selection.

| Graphics | What it draws |
|---|---|
| Low | class colors as flat fills, the star's core, solid orbits, tilted rings |
| Normal | + the lit sphere and colored surface marks, the star's glow, the tinted system glow |
| High | + light and shadow on planets, fine ring lines, the star's close light, a wider glow |

**Measured** at Sol, CPU slowed 4×, harness idle traces and pan/zoom, before and after (two runs after):

| Graphics | Pan/zoom frame rate | Paint + raster per 5 s, whole system in view |
|---|---|---|
| Low | 42.8 → 49.8, 50.5 fps | 339 → 350, 338 ms |
| Normal | 30.0 → 29.5, 30.9 fps | 428 → 416, 437 ms |
| High | 25.1 → 24.4, 24.2 fps | 369 → 429, 427 ms |

No cost on low and normal; on high about 60 ms more paint and raster per 5 s, with the same frame
rate. (Script time varies by a second between runs from block reloads, so it isn't comparable.)

## To do, later

- **Star colors by class:** done (above). Still open: tie a star's class to play. Real stars run from blue (hottest, heaviest) through white, yellow and orange to red (coolest, lightest).
  - Most are red dwarfs; the game may soften that.
  - Sol's neighbors already have classes:
    - Alpha Centauri: G, K and M;
    - Sirius: A and a white dwarf;
    - Barnard's Star, Wolf 359, Lalande 21185 and Ross 154: red dwarfs.
  - Idea: tie a star's class to how fast it charges the jump drive (see the story).
- **Asteroid fields** (Koda): minable, ownership open; perhaps mining drones that slowly collect
  resources and bring them to the ship while it's parked there.
- **Binary stars** (Koda): some systems have two stars orbiting each other at the center. Selecting either selects the pair as **one object**; you can't select one star alone. Alpha Centauri and Sirius are real binaries near Sol.
