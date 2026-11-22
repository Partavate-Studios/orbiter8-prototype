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
- **Over the selection card, two selectors** (Koda, 2026-11-17): the system strip (the star, the
  planets and the asteroid belt, in orbit order) and under it the nearby strip, round icons (no names;
  names are tooltips) for what's around the selection: its planet, port and moons, or the belt's eight
  places (asteroids, their ports, the empty dust). A planet's port and moons are buttons on its
  card's bottom edge: choosing one deals that card out beside the planet's, which waits behind it
  (X27); the menu slides out from behind the front card. The menu's actions wear their pictures from
  `assets/art/` (`libs/body-art.js`); the 1–9 keys still press them, named in each button's tooltip.
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

- **Big targets.** The whole hex on the galaxy map is clickable, not just the star; a whole belt section
  is clickable, not just its asteroid; buttons are big.
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

## 10. Direction: bringing the system together (Koda, 2026-11-21; not built)

Koda's notes on where the HUD should go next. Not designed or built yet: each part needs a mockup that
Koda approves before it's built (CLAUDE.md, "Keep the card and menu art"). The card's art and the big
menus stay; what changes is how the pieces connect.

**The plan and first mockups** (2026-11-21, for Koda's review): [`ui-plan.md`](ui-plan.md) and
[`mockups/together/`](mockups/together/).

### What's wrong now

- **The same things are reached in three ways that don't agree.** At the top right, a button per kind
  of object (Planets, Ports, Ships…) and one for the star; the minimap splits the system up another
  way; at the bottom left, the planet strip on the card, where selecting a planet brings up its own
  sub-list. Opening a menu beside the card changes context away from the thing the card shows, which
  feels wrong.
- **The UI doesn't follow how ownership works.** A **planet is one thing**: its moons, its station and
  whatever orbits it belong to it. An **asteroid is one thing**. The **star** is a container, and
  sometimes a black hole instead (or two stars: see binary stars in section 9). Whatever is at the
  center, every system has something there. The UI should group things the same way.
- **A station doesn't feel like its planet's.** The second card that slides over the planet's card when
  you select its station looks good, but it doesn't read as part of the planet. The moon and station
  buttons look good, but they're less obvious than the menu buttons beside the card.
- **Network matters sit among game actions.** Start Session is on your ship's menu, though it's about
  the wallet, not the ship.
- **The galaxy map's icon** comes from an old design and no longer looks like how jumping works. Redo it.

### Where it should go

**One Objects menu for the system.**
- It always shows what's at the system's center (the star, the pair, or the black hole) at the top.
- By default it lists every object in the system, with anything a second layer deep (a planet's moons
  and station, an asteroid's station) folded under its parent and expandable.
- Filters along the top: Planets, Stations, Moons, Ships, and more as needed. With **Stations**, a
  second filter, **Buying**, shows only the ports that buy what you carry.
- Players will drill into this often, so it has to be fast to reach and quick to filter. It should
  replace the top right's buttons by kind, and the planet strip may fold into it.

**The card.**
- **Never collapsed.** It looks great and sits out of the way in the corner. Whatever is selected shows
  in the card.
- **A planet's station and moons open as an extension of the planet's card** (the card grows, or a
  section unfolds from it), not as a separate card laid over it.
- **Icons rather than text menus**, so the text doesn't overwhelm the icons, and perhaps built into
  the card itself instead of in a menu beside it.
- **A Details option on most things:** a big version of the card with everything the small one can't
  show.
  - **A ship:** every upgrade and its whole loadout.
  - **A planet:** every building and upgrade, weapons included; what it produces; its size and
    nature; the star it belongs to; its owner, with a way through to the owner's profile. Its moons
    and station read as part of it, as on the small card.
  - **A moon or station:** a button back to its planet.

**Your network connection: Minerva.** A dedicated piece of UI for "your connection to the Minerva
network", which is your status on Polkadot: what a wallet shows (address, balance), the session (Start
Session moves here from the ship's menu), the block number, and anything else about the network.

**You, as a player.**
- A **player-centric view**: you as an identity, not only your ship. Later it holds achievements and
  leaderboard rankings (both on the to-do list for much later, `demo4-plan.md`).
- **Other players' profiles:** anything owned by someone else links to its owner's profile. One day
  that may show their corporate rank, their property, their achievements and more; for now a simple
  profile, with room to grow.

**Your ships.** When pilots can have several ships, a menu to switch which ship you control, which
always makes clear which ship you're in.
