# Orbiter 8 color guide

How color is used in Orbiter 8, why, and how to choose a color for something new. A working document:
open questions are at the end, and decisions are added as Koda makes them. The visual design guide
beside it, [`ui-guide.md`](ui-guide.md), covers layout, interaction and art.

- **Values live in code:** `orbiter-client/src/libs/palette.js` (the accents, stars, planets, HUD tints,
  the galaxy map's colors) and `libs/card-theme.js` (cards and menus). `App.vue` repeats the accents as
  CSS variables (`--o8-pink`, `--o8-yellow`…). This guide is the reasoning behind them; it names roles,
  and the code holds the hex values.
- **Sources:** Koda's rules (`CLAUDE.md`), his verdicts on the color mockups
  ([`mockups/color-direction.md`](mockups/color-direction.md)), and a color-system proposal Koda worked up
  with Claude and ChatGPT on 2026-11-14 (`COLOR_SYSTEM.md` v1.1, folded in here; the original is in git
  history, commit 6dcd95e). Where the proposal assumed values the game doesn't have, the
  game's values won and the change is noted.

## 1. The idea

> **Purple is the universe. Color is everything that lives in it, and an accent color always means
> something.**

The interface is a quiet, dark purple instrument panel. The things *in* the game (stars, planets,
goods, ships) carry the color. The two loud accents are kept for meaning: **yellow is yours, pink needs
you.**

### Principles

1. **Accents carry meaning.** A saturated yellow or pink in the interface is a message to the player,
   never decoration.
2. **One meaning, one color, everywhere.** If a color means something in one place, it means the same
   thing everywhere.
3. **The interface is quiet, the world is loud.** Panels, frames and backgrounds use purples, lavenders
   and purple-grays. Strong color goes to the world and to the two accents.
4. **Layers step by lightness, not hue.** Space, then card, then readouts inside the card: each a step
   lighter.
5. **Never color alone.** Every color-coded meaning also has an icon, a sign (+/−, ↑/↓), a shape or a word.
6. **Grounded, not overdone.** Stars by real spectral class, planets by their class. Koda on stars:
   "don't overdo it."
7. **Cheap color.** Glows are gradients, never SVG filters; costly detail is for high graphics only
   (`ui-guide.md`, performance).

## 2. Domains: who owns which colors

| Domain | What's in it | Color |
|---|---|---|
| **Space** | backgrounds, the starfield, orbit lines, the hex grid | deep indigo and violet, dim stars, low saturation |
| **Interface** | cards, menus, buttons, text, focus | purples, lavenders, purple-grays |
| **Meaning** | yours (yellow), needs you (pink) | the only loud accents in the interface |
| **Identity** | a card's frame and title (the selected thing), a HUD button's tint (its menu) | one color per kind of thing; mid saturation |
| **Goods** *(not built)* | goods icons, cargo, trade sliders, recipes | muted material tones |
| **World** | stars, planets, moons, ships, stations, effects | illustrative, from physics and the game's art |

**Why domains:** a clash matters only when two colors play the same role. A pink-banded gas giant is a
painting; a pink frame is a message. Uniqueness is required inside Meaning, and between colors that sit
side by side in the same role; the World may reuse any hue *as illustration*.

*Changed from the proposal:* it had no Identity domain. The game has one: Koda approved tinted HUD
buttons ("pretty darn good") and cards whose frame and title take the selection's color. Identity
colors always come with an icon or a picture of the thing, so they don't need to be unique hues.

## 3. The two accents

| | Yellow: **yours, and what's good for you** | Pink: **needs you** |
|---|---|---|
| Values | `YELLOW` `#ccff00`, `YELLOW_LIGHT` `#ebff99` (a lime yellow, from the Multiverse Portals demo) | `PINK` `#e1177c`, `PINK_LIGHT` `#ff6fb0` |
| Means | your ship and things, stars you discovered or named, planets you own, where you are and can go, gains (credits you'll get, a port buying what you carry) | waiting on the wallet, a failed move, sieges, damage and danger, a name that won't fit, can't afford |
| Never | on anything that isn't yours or good for you | on a profitable or positive button |

- **Pink by weight:** an outline or text means *waiting or careful* (a signature pending, can't
  afford); a fill or frame means *failure or danger* (a failed move, an active siege, damage).
- **Costs are neutral:** −242¢ is ordinary text. Spending isn't alarming; it turns pink only when you
  can't afford it. Gains are yellow.
- **Text in pink uses `PINK_LIGHT`:** `PINK` on the card gray is only 3.5:1, under the 4.5:1 small text
  needs. `PINK` is for frames, fills and large marks.
- **Pink is never a button's body.** A button that deals with a problem (retry, open the wallet) keeps a
  purple body and may use pink on its text or border.
- **Yours is a mark, a star is a glow.** "Yours" yellow is always flat and crisp: a hex outline, a dot,
  a badge, text. A star's yellow is a soft, glowing body. The lime "yours" and the warm star yellows
  (G stars at about 45°) are also apart in hue, so the old worry about Sol reading as "yours" is mostly
  answered by the palette.

## 4. Interface

### Surfaces

| Layer | Today's color | Use |
|---|---|---|
| Space | `SPACE` `#130e24` → `SPACE_DEEP` `#0b0916`; the backdrop art deepened toward them | the universe |
| Card and menu insides | `SURFACE_1` `#1b1531` (`CARD_GRAY`) | the same on every card and menu |
| Readout tiles | `SURFACE_2` `#251d40` | cargo tiles; readouts that are only text have no box (C1) |
| Hover, selected rows | `SURFACE_3` `#302651` | |

### Cards and menus (built, `libs/card-theme.js`)

- **Background:** the same purple-gray on every card. No per-selection tint or gradient (Koda disliked
  the gradient cards).
- **Frame and title:** the selected thing's identity color, in shades of one color: planets by class,
  stars by spectral class, moons gray, stations steel blue, black holes amber. **The Orbiter 8 ship keeps
  Koda's purple.**
- **Menu buttons in the right-hand card:** one purple on every card.
- **Menus** take the color of what opened them: a menu about the selection takes its card's; a HUD
  button's menu takes the button's tint; the ship's loadout keeps the purple.
- **Status:** a **pink frame** when the thing is under siege or needs you (Koda loves it). Being yours is
  a **yellow mark** (badge, dot, outline), never the frame, so a planet can be yours and under siege at once.

### Buttons

- Buttons are purple and lavender; gray for quiet ones. Never pink-bodied, never in a goods color.
- **The main action stands out** (Make Trade, Take Off, Jump): one per menu, the strongest purple.
  Readouts (balance, gain, final total) must not outshine it.
  *Partly built; check each menu when it's next touched.*
- **Focus** (keyboard and gamepad): a clear lavender ring on whatever has focus.
- **HUD buttons** are tinted by what they open (`HUD_TINT`: help sky blue, sieges coral, leaderboard
  gold, chat teal, settings gray, planets blue, ships pale lavender, you yellow), with white icons. A
  running siege rings the sieges button in pink.

### Text

- Small text needs at least 4.5:1 against its background; large text and icons 3:1.
- Numbers the player decides with use the main text color (yellow for gains).
- **No gray text on saturated purple.** It's where most readability problems come from (the proposal
  named the station's inventory table, "↓ sells ↑ buys", the Buy/Sell labels and the galaxy map's hint).
  Small labels sit on the quiet gray, in a light lavender.

## 5. World

### Stars (built: `STAR_CLASSES`, three graphics levels)

By real spectral class, in pale blackbody tints (E3): blue O and B, white A, yellow-white F, pale yellow G (Sol), orange K, red M. Each
class has a core, a body (also its dot on the galaxy map) and a glow; the glow reaches its system a
little (22%), so space stays purple. Black holes are drawn with Koda's portal art. Science would call
Sol white; the game draws it yellow, as people know it.

### Planets (built: `PLANET_COLORS`)

Ten classes, in `sdk/game/planet-types.js` order: Terrestrial, Rocky, Oceanic, Desert, Ice, Volcanic,
Gaseous, Ferrous, Lava, Swamp. Each has a light, mid and dark for the sphere, a color for its surface
marks, and its card's color. Purple stays in the shadows. Volcanic is dark with bright vents, Lava is
bright: lightness keeps them apart. Planets may have pink or yellow in their painting (Gaseous bands,
Desert sand): that's illustration, not a mark. Koda likes these; change them only with him.

Sol's Mars is a Ferrous world, so it's rust red, as people know it (Koda, 2026-11-14; it was Rocky
and gray). Its station, Tiangong, trades as a Ferrous port.

*Changed from the proposal:* it suggested new planet hex values from the old contracts'
`PlanetLibrary.sol`; the game's own (liked) palette stays.

### Ships, stations, effects

- The **white silhouette** is the brand and stays. Your ship's *marker* on maps is yellow; the art
  stays white.
- Engine glow is warm and fades out; it's illustration, so it doesn't break the yellow rule.
- Damage is pink (it needs you).
- *Idea:* mirror the ship's colors in `ShipArt.sol`'s on-chain SVG so the NFT and the game match.
- *Idea, later:* corporation liveries as a hull stripe and badge, never yellow or pink. Pirates fly
  unmarked hulls.

## 6. Goods (built in the trade menu)

Each of the eight goods gets one muted material color and its icon (`assets/art/good-*.svg` exist),
used everywhere a good appears: port lists, cargo, sliders, production, recipes, the tech trees. **The
icon identifies the good; the color is a quick second cue.** Color never shows buy or sell, or profit:
those are arrows, signs and yellow.

| Good | Proposed color | Hue | Why |
|---|---|---|---|
| Water ice | `#7FDDF0` | 190° | cold cyan |
| Helium-3 | `#6F8CFF` | 228° | fusion fuel blue |
| Organics | `#74CF84` | 131° | life is green |
| Electronics | `#3CC7A8` | 167° | circuit-board teal |
| Equipment | `#E08A4F` | 24° | industrial copper |
| Metals | `#A9B3C1` | 215° | steel |
| Silicon | `#7A90A6` | 210° | dark slate |
| Rare elements | `#D9E1EC` | 215° | platinum |

- Muted on purpose, so the accents stay loudest; never yellow, pink or purple.
- Shown as an icon, chip, thin bar or slider fill; never a large fill.
- **Before building:** check them against the HUD tints, which sit close by (help 200° vs water ice
  190°, chat 173° vs electronics 167°, planets 216° vs Helium-3 228°, sieges 17° vs equipment 24°).
  They rarely appear side by side, but see the open questions. The three neutrals (metals, silicon,
  rare) are told apart only by lightness and their icons.

## 7. Choosing a color for something new

1. **Does it need color?** Most interface needs none: surface, frame and text colors do the structure.
2. **Is it yours, or good for the player?** Yellow, as a mark. **Does it need the player?** Pink. Is it
   positive? Then never pink.
3. **Which domain** (section 2)? Interface stays purple; identity takes the thing's color; the world
   follows physics and the game's art.
4. **Does a color already mean this?** Use it. Same meaning, same color, everywhere.
5. **A new meaning that must be recognized by color?** It needs a new hue: about 30° from every color in
   the same role (or clearly different in lightness), outside yellow, pink and purple, at least 3:1 as an
   icon and 4.5:1 as text, with a non-color cue too. Add it to `palette.js` and to this guide, with a
   line on why.

**Never:** pink on a positive action; yellow on what isn't yours or good for you; card backgrounds
tinted per selection; a goods color as decoration; color as the only cue; a new hex value written into
a component (new colors go in `palette.js`; older ones move there as their screens are touched).

## 8. Koda's choices (2026-11-14)

From [`mockups/color-choices.svg`](mockups/color-choices.svg), and "use the proposed colors as much as
possible". Built unless noted.

| Row | Choice |
|---|---|
| Space | The proposal's deep space: `SPACE` `#130e24`, `SPACE_DEEP` `#0b0916`; the backdrop art's purples deepened toward it (`deepSpace`), its shapes kept. The title and story darken with it. |
| A1 | Pink text in `PINK_LIGHT`; `PINK` kept for frames, fills and other uses ("I like the richness"). |
| A2 | The leaderboard button soft gold `#e6cf8f`, full gold `#ffc94d` on hover. |
| B1 · 2 | The proposal's purple surfaces: `SURFACE_1/2/3` `#1b1531` / `#251d40` / `#302651` (card insides, readout tiles, hover). |
| B2 · 1 | Small labels on purple in lavender (`#c3b3da`, headings `#e6dcf5`). |
| C1 · 2 | Readouts as plain text, no boxes, so buttons stand out; gains yellow, costs plain, can't-afford light pink with an outline; the main action (Make Trade) in `BRAND_500`, with a `BRAND_300` border. |
| D1 · 1 | The proposal's goods colors (`GOODS_COLORS`), on goods' names and codes in the trade menu ("hard to know until I see it in context"). |
| D2 · 1 | HUD tints kept. |
| E1 | Today's planets kept. |
| E2 · 1 | Sol's Mars Ferrous (contracts too). |
| E3 · 1 | The proposal's pale star tints (`STAR_CLASSES`). |
| F1 | Neither option; new ones in [`mockups/color-choices-2.svg`](mockups/color-choices-2.svg), row H1. |
| F2 · 1 | A yellow badge on the corner of a card for something you own. |
| G1 · 1 | Galaxy map: the chosen star's hex glows purple with a pointer; yours stays the yellow outline; under siege, a pink frame inside the hex. |
| G2 · 1 | Focus: a 2.5 px `BRAND_300` ring, 3 px out. |

## 9. To do

**Under review:** [`mockups/color-choices.svg`](mockups/color-choices.svg) shows each choice below as the
game is now and its options, labeled by row (A1…G2) for Koda's answers; redraw it with
`npx vite-node dev/mockups/color-choices.mjs` from `orbiter-client/`.

In rough order; each visible change goes past Koda first (a mockup in `docs/mockups/` when it restyles
a screen).

- [ ] Settle the readout and hover surface steps, and the main-action style; then the trade menu as the
      first screen to use them (Make Trade the strongest button, readouts quieter, gains yellow, costs
      neutral, small labels readable).
- [ ] Audit every yellow and pink in the client: each must mean "yours" or "needs you".
- [ ] Pink text uses `PINK_LIGHT` everywhere.
- [ ] A keyboard and gamepad focus ring on everything focusable.
- [ ] Goods colors and icons (section 6), after the open question on HUD tints.
- [ ] Measure contrast of today's text colors on their backgrounds; fix what's under 4.5:1.
- [ ] A lint check for hex colors outside `palette.js` (once most have moved).

## 10. Open questions

- [ ] **HUD tints vs goods colors:** keep both as proposed (different roles, rarely side by side), or
      move the goods hues away from the HUD's? (Or the reverse, but Koda likes the HUD as it is.)
- [ ] **Leaderboard gold** (42°) is a warm yellow in the interface. With "yours" lime, it reads as a gold
      trophy, but it's the one yellow-ish interface color that isn't "yours". Keep?
- [ ] **Do players misread a G star's card (yellow frame) as "yours"?** Probably not, with yours lime; check
      in play. Fallback: a neutral frame with a star-color swatch.
- [ ] **Title screen:** Koda found it very purple. It's the brand's moment for purple, but the planet
      and star palettes could bring more color (the Earth by the port is a good start).
- [ ] **Gray in the interface:** how far to take it (Koda raised it; card insides are gray now).
- [ ] **Star class in play:** should a star's class set how fast it charges the jump drive? Color would
      then hint at gameplay.
- [ ] **Corporation liveries:** a fixed set, or player-chosen within limits (no yellow or pink)?
- [ ] **Tech-tree branches:** colors would compete with the goods; icons and shapes instead?
- [ ] **The Polkadot App:** does the App impose a theme, light mode, or colors of its own around a
      Product? (Check with the spike.)
