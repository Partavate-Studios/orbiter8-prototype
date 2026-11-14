# Orbiter 8 Color System

**Status:** v1.1 (2026-11-14). This version merges three sources:

- the existing rules in `CLAUDE.md` and `orbiter-client/src/libs/palette.js`
- Koda's feedback from the earlier color study and mockups
- a fresh review of the Demo 4 client screenshots by Claude and ChatGPT

**For Claude Code:**

- This file is the written theory behind `palette.js`.
- Section 2 reviews the earlier rules on their merits. They're kept because they hold up, not because they came first. Where this doc and existing code disagree, this doc wins; raise anything unclear with Koda before changing code.
- Tokens live in `palette.js` (plus a CSS custom-property export for styles). Extend it rather than creating a parallel token file.
- Use the decision procedure in section 13 whenever new UI needs a color.
- Never add a raw hex value outside the palette.

---

## 1. The idea in one line

> **Purple is the universe. Color is everything that lives in it, and accent color always means something.**

The interface is a quiet, dark, purple instrument panel. Things *in* the game (stars, planets, resources, ships) carry the color. The two loud accents, yellow and pink, are reserved for meaning: *yours* and *needs attention*.

### Principles

1. **Accents carry meaning.** A saturated accent on screen is a message to the player. It's never decoration.
2. **One hue, one job.** Inside the interface, each hue has exactly one meaning. If yellow means "yours," nothing else in the interface may be yellow.
3. **The interface is quiet, the world is loud.** Panels, frames, and backgrounds use low-saturation tokens (purples, lavenders, grays). Saturated color goes to world objects and to the meaning accents.
4. **Hierarchy comes from lightness, not hue.** Layers (space → panel → raised panel) are separated by stepping lightness.
5. **Never rely on color alone.** Every color-coded meaning also has a second cue: an icon, a glyph, a +/− sign, an arrow, a shape, or a label.
6. **One bright action per screen.** Only the main action gets the filled brand-purple treatment.
7. **Grounded, and not overdone.** World colors follow real physics (stars by spectral class, planets by composition), with restraint. Koda's standing note on stars is "don't overdo it."

---

## 2. Earlier rules, reviewed

These rules predate this document and come from `CLAUDE.md`, `palette.js`, and Koda's feedback. Being earlier doesn't make them binding. Each was judged on whether it's sensible and well developed:

| Earlier rule | Verdict | Why |
| --- | --- | --- |
| Yellow = you / good for you | **Keep** | A clear, learnable meaning that players use constantly. Its one cost is the clash with yellow stars, handled by form in section 3. |
| Pink = needs attention; never on positive buttons | **Keep, refined** | Sound. Refined so severity shows by weight (outline = waiting/caution, filled = failure/danger), since "waiting on wallet" and "you're being sieged" aren't equally urgent. |
| Buttons in purples/lavenders | **Keep** | Holds the brand and leaves the accents free for meaning. |
| Purple baseline, more color on top | **Keep** | Matches "the interface is quiet, the world is loud." |
| Card border + heading = object color; constant backgrounds | **Keep** | The strongest-developed rule: it carries identity without the muddiness of tinted backgrounds. |
| One consistent color for card menu buttons | **Keep** | Consistent with the button states in section 7. |
| Stars by real spectral class, restrained, three quality levels | **Keep** | Grounded, and already built. |
| Yellow ownership marks on the galaxy map | **Keep** | A direct use of the yellow rule. |
| Gray for UI components | **Adopt** | Fits the quiet interface. Grays used here are slightly violet so they still feel on-brand. |
| Liked / disliked list | **Keep as guidance** | Koda's direct reactions to mockups. |

Nothing earlier was dropped. If a later review finds a rule that isn't pulling its weight, change it here and note why.

### Meaning accents

| Accent | Means | Examples | Never |
| --- | --- | --- | --- |
| **Yellow** | **You, and what's good for you** | Your ship and assets, stars you discovered or named, planets you own, credits you gain | On anything that isn't yours or isn't good for you |
| **Pink** | **Needs your attention** | Waiting on the wallet, failed transactions, sieges, danger, damage, can't afford | On a profitable or positive button |

### Interface

- Buttons stay in the game's purples and lavenders.
- Gray is acceptable for UI components (Koda raised it as an option).
- Purple is the baseline, with more color layered on top. This was chosen after the color study (ChatGPT colorized screenshots, then a one-SVG study of the game's assets).

### Cards

- A card's **border and heading** take a color that represents the selected object (a planet's class color, a star's spectral color, etc.).
- Card **backgrounds stay the same on every card**. Koda disliked backgrounds tinted with a gradient per selection.
- Menu buttons inside the action card (the right-hand card) use one consistent color.
- The Orbiter 8 ship's card keeps the purple.

### Stars

- Colored by real spectral class, with Sol yellow. Not overdone.
- Rendered at three quality levels.
- Unbuilt idea: star class sets how fast the jump drive charges.

### Galaxy map

- Yellow hexes around stars you discovered or named.
- Small, subtle yellow dots over stars where you own planets.

### Koda liked (keep these)

Planets, solid orbit lines, tilted rings, the button colors, the **pink frame around a siege**, and the star glow.

### Koda disliked (avoid)

Card backgrounds tinted with a gradient per selection.

---

## 3. Domains: who owns which colors

| Domain | What's in it | Saturation | Hue rules |
| --- | --- | --- | --- |
| **Space** | Backgrounds, starfield, nebulae, orbit lines | Low | Deep indigo/violet, dim white stars |
| **Interface** | Panels, borders, text, buttons, focus | Low (chrome), higher for the primary action | Purples, lavenders, grays only |
| **Meaning** | Yours (yellow), attention (pink) | High | The only loud accents in the interface |
| **Resources** | Goods icons, cargo tiles, slider fills, recipe chips | Medium (muted "material" tones) | Each resource owns a slot; must avoid the yellow, pink, and purple families |
| **World** | Stars, planets, moons, ships, stations, effects | Varies | Illustrative and physics-driven. May reuse hues inside illustrations, never as interface chips or marks |

**Why domains:** collisions matter only when two colors appear in the same role. A pink-banded gas giant is a painting; a pink frame is a message. The domains say where uniqueness is required (Interface, Meaning, Resources) and where it isn't (World).

### The yellow problem (Sol vs. "yours")

Sol and other G-type stars are yellow, and yellow also means *yours*. The two are kept apart by **form**:

- **"Yours" yellow is always a mark:** a hex outline, a dot, a badge, a text color, a thin frame. It's flat and crisp.
- **Star yellow is always an illustration:** a glowing, soft-edged body.
- A card for a yellow star uses the star's tint (`--world-star-G`, paler and less saturated than `--you`) on its border and heading. A yellow **badge** is added only if the star is yours.
- Open question: confirm in playtesting that players don't misread a G-star card as "yours." If they do, star-card borders fall back to a neutral border with a star-color swatch.

### Interface hue map (must stay collision-free)

| Hue (approx.) | Owner | Token |
| --- | --- | --- |
| 24° copper | Equipment | `--res-equipment` |
| 46° yellow | **You / good for you** | `--you` |
| 131° green | Organics | `--res-organics` |
| 167° teal | Electronics | `--res-electronics` |
| 190° pale cyan | Water ice | `--res-ice` |
| 210–215° neutrals (by lightness) | Silicon (dark slate), Metals (steel), Rare elements (platinum) | `--res-silicon`, `--res-metals`, `--res-rare` |
| 228° blue | Helium-3 | `--res-he3` |
| 255–265° purple/lavender | Brand: buttons, selection, focus | `--brand-*` |
| 335° pink | **Attention** | `--attention` |

The resources are the most crowded part of the system. Eight goods have to fit around three reserved families (yellow, pink, purple). The three neutrals rely on lightness plus their icon, which is weaker than separating them by hue. Revisit when the goods list is final.

---

## 4. Tokens

Tokens live in `orbiter-client/src/libs/palette.js` (with a CSS custom-property export). Read the existing values first. Where `palette.js` already has a color for one of these roles (especially yellow, pink, and the button purples), **keep the existing value** and map the role name to it. The hex values below are proposals for roles that don't exist yet.

```css
:root {
  /* ── Space ───────────────────────────────────────── */
  --space-deep:      #0B0916;
  --space:           #130E24;
  --space-nebula:    #2A1A4A;  /* low opacity only */
  --space-orbit:     #4A3F75;  /* solid orbit lines, hex grid */
  --space-star-dim:  #CFC8E8;

  /* ── Interface surfaces (step by lightness) ─────── */
  --surface-1:       #1B1531;  /* every card/panel background, the same everywhere */
  --surface-2:       #251D40;  /* readouts, inputs */
  --surface-3:       #302651;  /* hover, selected rows */
  --border:          #3F3566;
  --border-strong:   #5A4C8C;

  /* ── Text ────────────────────────────────────────── */
  --text:            #F1EEFA;
  --text-2:          #BDB5D4;
  --text-3:          #9088AA;  /* hints only; never on --surface-3 */

  /* ── Brand (buttons stay purple/lavender) ────────── */
  --brand-500:       #7B4FE6;  /* primary fill, white text 5.1:1 */
  --brand-400:       #8B5CF6;  /* hover, selection outline */
  --brand-300:       #B9A0FF;  /* focus ring, links, lavender accents */
  --brand-ghost:     rgba(139, 92, 246, 0.14);

  /* ── Meaning accents (existing rule; keep palette.js values) ── */
  --you:             #FFD447;  /* yours / good for you */
  --attention:       #FF5FA2;  /* needs attention: wallet, failure, siege, danger */

  /* ── Resources (muted material tones) ────────────── */
  --res-ice:         #7FDDF0;
  --res-metals:      #A9B3C1;
  --res-silicon:     #7A90A6;
  --res-rare:        #D9E1EC;
  --res-he3:         #6F8CFF;
  --res-organics:    #74CF84;
  --res-electronics: #3CC7A8;
  --res-equipment:   #E08A4F;
}
```

World tokens (stars, planets, ships) are in sections 10–12 under a `--world-*` prefix.

---

## 5. Surfaces and cards

| Layer | Token | Use |
| --- | --- | --- |
| 0 | `--space-deep` / `--space` | The universe |
| 1 | `--surface-1` + `--border` | Every card and panel, with an identical background on all of them |
| 2 | `--surface-2` | Readouts and inputs inside a card (Bal / Gain / Fin, cargo tiles, port table) |
| 3 | `--surface-3` | Hover and selected states |

**Card anatomy** (from the existing rules):

- **Background:** always `--surface-1`. No per-selection tint or gradient. Koda disliked this.
- **Border + heading:** the selected object's identity color (planet class, star spectral color, resource color, or brand purple for the Orbiter 8 ship's card).
- **Action buttons inside the card:** one consistent color (secondary style, section 7), whatever the object.
- **Status overlays:** a **pink frame** when the object is under siege or needs attention (Koda liked this). A **yellow badge** when the object is yours.
- Order of precedence on the frame: attention (pink) overrides identity color. "Yours" never replaces the frame; it's always a badge, so a planet can be both yours and under siege.

**Why:** a constant card background makes cards read as one family, and the border carries the "what is this" information. Fixed slots for "yours" (badge) and "attention" (frame) mean they never fight the identity color.

---

## 6. Text and contrast

Measured contrast ratios (WCAG 2.x):

| Token | on `--space` | on `--surface-1` | on `--surface-2` | on `--surface-3` |
| --- | --- | --- | --- | --- |
| `--text` | 16.4 | 15.3 | 13.8 | 12.1 |
| `--text-2` | 9.6 | 8.9 | 8.1 | 7.0 |
| `--text-3` | 5.6 | 5.2 | 4.7 | 4.1 ⚠ |
| `--brand-300` | 8.5 | 8.0 | 7.2 | 6.3 |
| `--you` | 13.2 | 12.3 | 11.1 | 9.7 |
| `--attention` | 6.6 | 6.2 | 5.6 | 4.9 |

- Small text (< 18px) needs ≥ 4.5:1. `--text-3` is for non-essential hints only, never on `--surface-3`.
- Numbers the player decides with use `--text` (or `--you` for gains).
- Never put gray text on saturated purple. That combination causes most current readability problems: the station inventory table, "Hover your star…", the Buy/Sell labels, and "↓ sells ↑ buys".

---

## 7. Interaction states

| Control | Default | Hover | Pressed | Disabled |
| --- | --- | --- | --- | --- |
| **Primary** (one per screen) | `--brand-500` fill, white text | `--brand-400` | inset shadow | `--surface-2`, `--text-3` |
| **Secondary** (incl. card menu buttons) | `--surface-2`, `--border`, `--text` | `--surface-3` | `--border-strong` | `--text-3` |
| **Quiet / icon** (HUD rail) | `--surface-1`, `--text-2` icon | `--surface-3`, `--text` icon | `--brand-300` icon | 40% opacity |
| **Attention button** (retry, open wallet, cancel siege) | `--surface-2`, `--attention` text + border | 12% attention tint | attention fill, white text | as secondary |
| **Selected** (row, tab, star) | `--brand-ghost` + `--brand-400` outline | | | |
| **Focus** (keyboard / gamepad) | 2px `--brand-300` ring, 2px offset | | | |

- Buttons are always purple, lavender, or gray. An attention button keeps a neutral body and uses pink only on text and border. **Profitable or positive actions are never pink.**
- Readouts aren't buttons. Bal / Gain / Fin and stat boxes use `--surface-2` and must never outshine the primary action.
- HUD rail icons share one style. An icon may light up with a meaning accent when it applies (battle icon goes `--attention` during a siege involving you).

---

## 8. Resources

Each good has one muted material color and one icon, used everywhere: port lists, cargo, sliders, planet production, recipes, tech tree, and NFT SVGs. **The icon is the primary identifier; color is a fast second cue.**

| Resource | Token | Hex | Icon idea | Why |
| --- | --- | --- | --- | --- |
| Water ice | `--res-ice` | `#7FDDF0` | Crystal / droplet | Cold cyan |
| Helium-3 | `--res-he3` | `#6F8CFF` | Atom / canister | Fusion fuel, energetic blue |
| Organics | `--res-organics` | `#74CF84` | Leaf | Life is green |
| Electronics | `--res-electronics` | `#3CC7A8` | Chip | Circuit-board teal |
| Equipment | `--res-equipment` | `#E08A4F` | Gear / crate | Industrial copper. Kept clearly orange, away from "yours" yellow |
| Metals | `--res-metals` | `#A9B3C1` | Ingot | Steel |
| Silicon | `--res-silicon` | `#7A90A6` | Wafer | Dark slate |
| Rare elements | `--res-rare` | `#D9E1EC` | Faceted gem | Platinum-group metals are white-silver |

Rules:

- Resource colors are **muted on purpose**, so the meaning accents (yellow, pink) stay the loudest things in the interface.
- Resource color identifies the good, **never** the trade direction or profit. Gains are yellow (section 9).
- Resources may not use the yellow, pink, or purple families. That's why the earlier proposals' gold equipment, magenta rare elements, and lavender silicon were changed.
- Shown as an icon, small chip, thin accent bar, or slider fill. Never as a large fill.

---

## 9. Meaning accents in practice

### Yellow: yours / good for you

- Your ship marker, your assets, your name in lists.
- Galaxy map: yellow hex outline around stars you discovered or named, and small subtle yellow dots over stars where you own planets.
- **Gains:** credits you'll receive, positive balance change (`+962¢ ↑` in `--you`).
- Yellow badge on any card for an object you own.

### Pink: needs your attention

- Waiting on the wallet (pending signature), failed or reverted transactions.
- Sieges: the pink frame around a besieged planet or card, and siege alerts.
- Danger and damage: hull damage, weapons past the overheat threshold, hostile ships.
- Can't afford: a trade total you can't cover, insufficient credits.
- **Severity by weight:** pink outline or text = waiting/caution (pending wallet signature, can't afford). Filled pink or a pink frame = failure/danger (reverted transaction, active siege, damage).

### Neither

- **Costs** are neutral: `−242¢ ↓` in `--text`. Spending isn't bad or alarming, so it's not pink. It turns pink only when you can't afford it.
- Ordinary information, prices, and other players' things stay in text tokens.

**Why:** it's a two-word vocabulary the player learns in minutes. Yellow means "this is mine / good for me," pink means "look at this." It works only if nothing else in the interface is yellow or pink.

---

## 10. Stars (world)

**Existing rule:** stars are colored by real spectral class, with Sol yellow, rendered at three quality levels, and not overdone. Keep the current implementation. This table only names the tokens and the target tints.

| Class | Tint | Token |
| --- | --- | --- |
| O | `#9DB4FF` blue | `--world-star-O` |
| B | `#AABFFF` blue-white | `--world-star-B` |
| A | `#CAD7FF` white-blue | `--world-star-A` |
| F | `#F8F7FF` white | `--world-star-F` |
| G (Sol) | `#FFF1C4` pale yellow | `--world-star-G` |
| K | `#FFD2A1` orange | `--world-star-K` |
| M | `#FFB08A` red-orange | `--world-star-M` |
| Black hole | `#05040A` core, `--brand-300` accretion ring | `--world-blackhole` |

- These are pale, blackbody-style tints, with saturation coming from the glow. That keeps G-star yellow visibly softer than the flat `--you` yellow.
- Uncharted stars render desaturated gray.
- If `palette.js` already defines spectral colors, those win. Check that the G tint isn't the same value as `--you`.
- Future idea (not built): star class affects jump-drive charge speed. Color would then also hint at gameplay.

---

## 11. Planets (world)

The contract defines 10 planet classes (`PlanetLibrary.sol`, `class` 0–9). Koda liked the current planets and the tilted rings, so treat this table as a *consistency target*. Where existing planet art already reads well, keep it.

| `class` | Name | Base | Shade | Highlight / detail |
| --- | --- | --- | --- | --- |
| 0 | Terrestrial | `#2E6FD1` ocean | `#1F4E9A` | `#4FB37A` land, `#E8F1FF` cloud |
| 1 | Rocky | `#8A8496` | `#615B70` | `#B5AFC2` |
| 2 | Oceanic | `#1E5FB8` | `#16407E` | `#2A9FD6`, `#BFE9FF` |
| 3 | Desert | `#D9A35B` | `#A8713A` | `#F2D29B` |
| 4 | Ice | `#DDEBF7` | `#A9C9E8` | `#FFFFFF` |
| 5 | Volcanic | `#3A3036` basalt | `#241D22` | `#FF7A3D` vents (small) |
| 6 | Gaseous | `#E9A6C6` | `#B58CD9` | `#F2C98A` bands |
| 7 | Ferrous | `#A8553A` rust | `#6E3F33` | `#C9824F` copper |
| 8 | Lava | `#FF6A2B` | `#C8261E` | `#FFC15A` |
| 9 | Swamp | `#2F7D5B` | `#1F5A43` | `#6FA83E` / `#3FA59A` |

- Volcanic is mostly *dark* with small bright vents, and Lava is mostly *bright*. The lightness difference keeps them apart.
- Planets may contain pink or yellow inside the illustration (Gaseous bands, Desert sand). That's fine. It's world painting, not an interface mark.
- A planet card's border and heading use the class base color (section 5).
- Note: some comments in `PresetLibrary.sol` (e.g. "class K, Desert Wasteland" on `class = 1`) don't match `PlanetLibrary`'s names (1 = Rocky). Treat `PlanetLibrary` as canonical.

---

## 12. Ships, stations and effects (world)

The white silhouette is the brand and stays. Color comes in small, consistent accents.

| Part | Token | Hex | Notes |
| --- | --- | --- | --- |
| Hull | `--world-hull` | `#E6E4F2` | Off-white |
| Hull shade | `--world-hull-shade` | `#B9B6CC` | Panel lines |
| Windows / sensors | `--world-glass` | `#CFE9FF` | Pale glass, not ice cyan |
| Engine glow | `--world-engine` | `#FFB36B` → transparent | Warm exhaust (an illustration, so it doesn't break the yellow rule) |
| Damage | `--attention` + `#4A3A40` scorch | — | Damage needs attention, so pink |

- Your own ship's *marker* (on the system view or map) carries `--you`. The ship artwork itself stays white.
- Mirror the hull palette as Solidity constants for on-chain SVG ship images, so chain and client match.
- **Future: corporation liveries.** One livery color per corporation, used as a hull stripe and a badge. Liveries may not be yellow or pink, which are reserved. Pirates get no livery (an unmarked hull).

---

## 13. Decision procedure for any new color

1. **Does it need color at all?** Structure uses surface, border, and text tokens. Most UI needs no hue.
2. **Is it yours, or good for the player?** → `--you`, as a mark (outline, dot, badge, text). **Does it need the player's attention?** → `--attention`. Is it something positive? → Never pink.
3. **Which domain?** Space, Interface, Meaning, Resources, or World (section 3).
4. **Does a token already carry this meaning?** Use it. Same meaning means same color, everywhere.
5. **New meaning that must be recognized by color?** It needs a new interface hue:
   - ≥ 30° of hue from every entry in the hue map (or clearly different in lightness and saturation), and outside the yellow, pink, and purple families.
   - Passes contrast: ≥ 3:1 for icons and chips on `--surface-1`, ≥ 4.5:1 as text.
   - Has a non-color cue.
   - Gets added to `palette.js` **and** the hue map in this doc, with a one-line "why."
6. **World illustration?** Follow physics or the established palettes. Hue reuse is fine, but yellow and pink as flat marks on world objects are reserved for "yours" and "attention."

**Never:**

- Put pink on a profitable or positive action.
- Use yellow for anything that isn't the player's or good for them.
- Tint card backgrounds per selection.
- Use a resource color for decoration.
- Have two filled primary buttons on one screen.
- Encode meaning in color alone.
- Hard-code a hex value in a component.

---

## 14. Screen-by-screen changes (from the current screenshots)

**Trade screen**

- Card background `--surface-1`. The border and heading ("Tiangong") use the station's identity color.
- The port table, cargo tiles, and Bal/Gain/Fin become `--surface-2` readouts.
- Resource icon plus muted resource-color accent on every row and tile. Sliders fill with the resource color.
- `+962¢ ↑` and `Gain ↑ 720¢` in `--you`. `−242¢ ↓` in `--text`. Fin turns `--attention` only if unaffordable.
- **Make Trade** becomes the only `--brand-500` filled element. It's currently outshone by the bright Fin box.
- Small labels ("↓ sells ↑ buys", Buy/Sell headers) move to `--text-2` on the darker surface.

**System view**

- Station and action cards share the same `--surface-1` background. The station card's border and heading use the station identity color.
- In the action card, "Trade at Port" and "Visit Planet" use one consistent secondary style (existing rule). If a single primary is wanted, "Trade at Port" gets brand fill.
- The station inventory table uses resource icons and colors and `--text`/`--text-2`. It's currently the worst contrast in the build.
- Orbit lines stay solid (Koda liked them). Planets keep class palettes and tilted rings.
- HUD rail icons all use one quiet style. The battle icon goes pink during a siege.

**Galaxy map**

- Spectral star colors, kept restrained.
- Yellow hex outlines for stars you discovered or named, and subtle yellow dots for stars where you own planets (existing rule).
- Other hex outlines get quieter (`--space-orbit`, 50–70% opacity).
- The current selection uses a `--brand-400` outline. Back to Sol / My Ship are secondary buttons.

**Jump / loading screen**

- Keep the white silhouette. Engine trails go white → `--world-engine` → fade.
- While waiting on the wallet or transaction, the status line uses `--attention`. The flavor text uses `--text-2`.

**Title screen**

- Open from Koda's feedback: it's still very purple, and the story still uses the old graphics. The title is where saturated purple belongs as a brand moment, but it can use the planet and star palettes for more color (the Earth is already a good Terrestrial reference).
- "Begin" is primary. Settings, Network, and Story are secondary.

---

## 15. Implementation order

1. Read `palette.js` and `CLAUDE.md`. Map existing values onto the role names in section 4, and add only what's missing.
2. Surfaces and text contrast (sections 5–6), including the constant card background.
3. Button states and the one-primary rule (section 7), plus the gamepad focus ring.
4. Meaning-accent audit: find every yellow and pink in the client and confirm each one means "yours" or "attention."
5. Resource icons and colors (section 8).
6. Planet and star consistency pass (sections 10–11). Light touch, since these are already liked.
7. Ship accents, jump trails, and Solidity mirror of the hull palette (section 12).

Guardrail: a lint/grep check that fails on hex color literals outside `palette.js`.

---

## 16. Where this came from, and why

**Earlier rules, kept on merit after review (section 2):** yellow = yours/good, pink = attention, purple/lavender buttons, purple baseline, card border/heading = object color with constant backgrounds, spectral star colors at three quality levels, yellow galaxy-map ownership marks, and the liked/disliked list.

**From Claude's screenshot review:** "one hue, one job," lightness-stepped surfaces, contrast fixes, the one-primary-button rule, readouts never outshining actions, a consistent HUD rail, the gamepad focus ring, and signs and arrows alongside color.

**From ChatGPT's review:** planet palettes by class (its 10 classes match the contract), design tokens, ship hull/glass/engine accents, and separating resource color from buy/sell.

**Changed when the existing rules surfaced:**

- The proposed red alert signal became the existing **pink attention** accent. "No color for gains" became **yellow for gains** (good for you).
- Resource colors moved out of the yellow, pink, and purple families: equipment gold → copper, rare elements magenta → platinum, silicon lavender/sand → slate. Resources were also made muted so the meaning accents stay loudest.
- Stars switched from `starSize`-based colors to the existing spectral-class system.
- The proposed per-object card tinting was dropped in favor of the existing rule (border and heading only).
- Tokens live in the existing `palette.js` instead of a new file.

**Still from the earlier review (not in conflict):** ChatGPT's palette had hue collisions (silicon ≈ UI lavender, four cyans, three warm yellows), which is why the hue map exists.

---

## 17. Open questions

- [ ] Do players misread G-star (yellow) card borders as "yours"? (Section 3 fallback.)
- [ ] Final goods list (5–6 in the client, 8 proposed). The three neutral resources (metals, silicon, rare) are the weakest part of the palette. Revisit when the list is final.
- [ ] Title screen: more color, and update the story to the new graphics (open from Koda's feedback).
- [ ] Gray for UI components: how far to take it (Koda raised it).
- [ ] Cost of the highest star-rendering quality level (asked, not yet answered).
- [ ] Should star class drive jump-charge speed? (Unbuilt idea.)
- [ ] Corporation livery palette: fixed set or player-chosen within limits (excluding yellow and pink)?
- [ ] Should tech-tree branches get colors? They would compete with resources. The suggested alternative is icons and shapes only.

---

## Appendix A: Design considerations (beyond color)

These ideas came from a ChatGPT galaxy-map mockup. They're mostly layout and UX, not color theory, but Koda agreed to all six, so they're recorded here. Where they touch color, they follow the rules above.

### A1. Resource fingerprints on the galaxy map

- Under each system, show a small row of markers for what it produces, so players can plan routes at a glance.
- Each marker is the resource **icon** in its resource color, not a bare colored dot, so it doesn't rely on color alone. At very small sizes, a dot with a 1-letter glyph is acceptable.
- Show fingerprints only for **charted/visited** systems. Unexplored systems show nothing (or a "?"), so exploration keeps its value.
- Order the markers by abundance, with at most 4–5 shown and a "+n" for the rest.

### A2. Selected-system detail card

- Selecting a system opens a detail card on the right: name, star class, a one-line description, resource list with abundance, and a summary value.
- It follows the card rules: standard `--surface-1` background, with border and heading in the object's color (the star's spectral tint).
- Abundance (High / Medium / Low) is shown as **text or a 3-step bar** in neutral tones, not colored green/yellow, because yellow means "yours."
- A yellow badge appears if the system is yours, and a pink frame if it's under siege.
- The card's action ("Jump here" / "Visit") is the screen's single primary button, in brand purple.

### A3. Trade value summary

- One number estimating what the system is worth to the player (e.g. profit potential given current cargo and nearby prices).
- Shown in `--you` with a credit/coin icon, because it's "good for you."
- Open: define the formula. It should be computable client-side from on-chain reads, with no server.

### A4. Resource icon set

- One icon per good, used with its color everywhere (section 8). The mockup's set is a good starting point: droplet (water ice), ingots (metals), gem (rare elements), leaf (organics), wafer (silicon), gear (equipment), chip (electronics), atom (helium-3).
- Recolor to the palette: gem → platinum, gear → copper.
- Icons must work as simple SVG at 12–16px and in one color, since they may also appear in on-chain SVGs.

### A5. Strong selection marker

- The selected hex gets a thick glowing outline plus a small pointer marker, readable at a distance and on handhelds.
- Uses `--brand-400`/`--brand-300`, not cyan, which belongs to water ice.
- Selection (purple), yours (yellow outline), and attention (pink frame) can all appear on one hex at once, so give them distinct positions: selection = outer glow, yours = hex outline, attention = inner frame or pulse.

### A6. Plotted routes

- Dashed lines show a planned course across multiple systems. This becomes relevant once engine upgrades allow multi-star jumps.
- Route lines use `--brand-300` (it's the player's plan, an interaction), dashed, at moderate opacity. A route segment that's blocked or dangerous turns `--attention`.

### Not adopted from the mockup

- Planets drawn in place of stars (it labeled Sol "Terrestrial"). The galaxy map shows **stars** by spectral class. At most, a small thumbnail of the system's notable planet appears in the detail card.
- Bright nebula backgrounds, glow on everything, and large decorative planets in screen corners. This works against "the interface is quiet, the world is loud."
- Teal/cyan buttons and accents, which collide with resource colors. Buttons stay purple.
- A distinct decorative color per hex. Hex color must mean star class, yours, or attention.
