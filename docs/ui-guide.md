# Orbiter 8 UI guide

How Orbiter 8's screens are built and why: the game's look and feel, layout, interaction, art,
motion and performance. For anyone (Claude included) building a new screen or changing one. Color has
its own guide, [`color-guide.md`](color-guide.md). The game itself (rules, economy, story) is in
[`design.md`](design.md), [`demo4-plan.md`](demo4-plan.md) and [`backstory.md`](backstory.md).

A working document: rules here come from Koda's decisions and reactions, each with its reason. Open
questions are at the end; when Koda settles one, it moves up into the guide.

## 1. What the game feels like

- **Menu-driven: "the buttons are the game."** Orbiter 8 isn't an action game. Big, clear menus are the
  game's controls, not something to minimize. Koda rejected a docked inspector and side panels that
  followed "industry best practice": they made it generic.
- **The selection card is an NFT playing card.** The left card looks like a collectible card, because
  ships and planets are NFTs. Keep the art.
- **Ports show three-letter trade codes** (e.g. BBS) for what they buy and sell.
- **A quiet instrument panel over a loud universe:** the interface stays purple and calm; stars,
  planets and ships carry the color (`color-guide.md`).
- **Polkadot first:** the game launches as a Product inside the Polkadot App (D62–D66), on desktop and
  phone, and the UI may be rethought for the App (D66). Until that's decided, the rules below hold.

**Changing an existing screen:** change behavior and placement, keep the art. Before restyling a
screen Koda made, draw a mockup (`docs/mockups/`) and get his go-ahead; working on your own, save the
mockup and log it in `docs/review.md`.

## 2. Layout

- **Two cards in the star system:** the selection card (left: what you selected, as a playing card)
  and the action card (right: what you can do with it). Card frames and titles take the selection's
  color; insides are the same purple-gray everywhere; menu buttons one purple (`color-guide.md`).
- **Menus slide up in the middle**, in the shared menu container, opened from a HUD button or a card's
  menu (`stores/ui.js` `MENUS`). **No panels parked in a corner of the game view:** Koda rejected a
  corner first-steps card ("keep popups consistent, so have it slide up like all of the other menus
  do"). A new info panel is a menu with a HUD icon, and a count badge if it needs attention.
- **The HUD:** round buttons down the side, tinted by what they open, white icons; the pilot's card at
  the top left; the star and minimap at the top right; zoom at the bottom.
- **Phones matter.** The game was built for phones from the start. Portrait layouts (`viewRatio <= 1`)
  put the selection card at the bottom. Design every wide-screen change with its phone counterpart, and
  check it at `VW=390 VH=844` in the harness (`TOUCH=1` for a touch screen).
- **Room for the longest name.** Names are the players' (ships, planets, stars, call signs): every place
  a name shows must fit the longest allowed one, shrunk to fit, then cut with an ellipsis
  (`libs/fit-text.js`).

## 3. Interaction

- **Big targets.** The whole hex on the galaxy map is clickable, not just the star; buttons are big.
- **The ship follows your focus.** Select a planet and the ship moves there; select a station and it
  docks; it stays docked through the trade.
- **One main action per menu**, plainly the strongest button (Make Trade, Take Off, Jump); readouts
  never outshine it.
- **Inputs are ready to type in:** when a step asks for a name, its field has focus.
- **Keyboard, gamepad and touch all work.** Every focusable thing shows a clear focus ring; touch gets
  pan and pinch; the gamepad has its overlay.
- **Say what's happening, in plain words.** Waiting for the wallet, a move on its way, a failed move:
  each says so, in pink when it needs the player (`color-guide.md`). After a while unanswered, offer a
  way to try again.
- **Never make the player wait for nothing.** No artificial delays. Waits that are real (a scan waits
  for its drand round, about 30 s on a live chain) get something to watch and a clear "ready".

## 4. Motion and sound

- Motion explains: the ship flies between bodies, jumps stretch toward the destination, the black hole
  pulls the ship in nose first. Animation shouldn't hold the player up beyond what it's showing.
- **A jump takes at least as long as its sounds,** so Minerva's lines finish (4.5 s).
- Background stars move with the camera (parallax in the expected direction).

## 5. Art

- **Use the game's own art first;** invent only where none exists.
- **New art is a standalone SVG** in `orbiter-client/src/assets/art/` (120 units square, centered), for
  the game and the docs' pictures alike.
- **Reference pictures are drawn from Markdown:** the data (tech trees, tables) lives in Markdown files,
  which are the source of truth; the pictures are regenerated from them
  (`orbiter-client/dev/tech-trees/build.mjs`).
- **Crisp at any size and pixel ratio:** SVG over bitmaps; canvases follow the screen's pixel ratio,
  including when it changes (moving a window between screens).

## 6. Performance

- **Three graphics levels** (Settings): low draws flat class colors, solid orbits and tilted rings;
  normal adds lit spheres, surface marks and glows; high adds light and shadow, fine ring lines and
  wider glows. Costly detail goes in high only.
- **Glows are gradients, never SVG filters.**
- **Measure what you add:** the harness can slow the CPU (`CPU_THROTTLE=4`) and record frame rates and
  paint time; compare before and after (`docs/mockups/color-direction.md` has an example).
- **Many small things draw cheaply:** swarms of drones as triangles or dots in groups, like the
  shuttles between ships and ports.
- Inside Polkadot Desktop the game runs about as fast as in Chrome (2026-11-14).

## 7. How a change is checked

- **Play-test like a player:** one long session on one page, many moves, waiting out timers (scans).
  Checking each feature after a fresh page load has hidden real bugs.
- Check desktop and phone sizes, and the three graphics levels when drawing changes.
- Tests only where they earn their keep (game math, chain conversions, critical flows, the HUD's
  render smoke tests).

## 8. Proposed: the galaxy map, further (Koda agreed, 2026-11-14; not built)

From a ChatGPT galaxy-map mockup, recorded with the color-system proposal. Colors follow
`color-guide.md`.

1. **Resource fingerprints:** under each charted star, a small row of the goods it produces, as icons
   in their goods colors, ordered by abundance, at most 4–5 and "+n". Unexplored stars show nothing (or
   "?"), so exploring keeps its value.
2. **A detail card for the selected star:** name, class, a line about it, its goods with abundance (as
   words or a 3-step bar in neutral tones, not green or yellow), and a value summary. Standard card
   rules: the star's color on the frame, a yellow mark if it's yours, a pink frame under siege. Its
   action (Jump here) is the menu's main button. *The galaxy map already shows the chosen star's card in
   its colors; this extends it.*
3. **A trade-value summary:** one number for what the star is worth to the player (profit from the
   cargo and nearby prices), in yellow with a credits icon. The formula is open; it must come from
   chain reads alone.
4. **The goods icon set** (`assets/art/good-*.svg`) used everywhere, in one color, readable at 12–16 px
   (they may appear in on-chain SVGs).
5. **A strong selection marker:** a thick glowing outline and a small pointer, readable on handhelds.
   Selection (purple, outer glow), yours (yellow, the hex outline) and attention (pink, an inner frame or
   pulse) each have their own place, so all three can show on one hex.
6. **Plotted routes:** dashed lines for a course across several stars, once ranges allow multi-star
   jumps; lavender (the player's plan), pink where a leg is blocked or dangerous.

**Not taken from that mockup:** planets drawn in place of stars (the map shows stars); bright nebula
backgrounds, glow on everything and big decorative planets (against "the interface is quiet"); teal or
cyan buttons (buttons stay purple); a decorative color per hex (a hex's color means its star's class,
yours or attention).

## 9. Open questions

- [ ] **The UI inside the Polkadot App (D66):** keep this client's layout, or rethink for the App? What
      does the App put around a Product (its own bars, safe areas, light or dark mode), and how should the
      game fit on a phone inside it?
- [ ] **The title screen and story:** Koda found them still very purple; the story's art has been
      updated once (4e38a01); what more?
- [ ] **Binary stars:** two stars at a system's center, selected as one object. How does the card show
      a pair?
- [ ] **Asteroid fields and mining drones:** how they look in the system view, and how drones bring
      goods back to a parked ship.
- [ ] **Drone swarms in battle:** a first drawing is `assets/art/drone-swarm.svg`.
- [ ] **Publishing builds quickly** for play-tests (waits for Koda's branch strategy).
