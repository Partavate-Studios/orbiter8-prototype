# Orbiter 8 UI guide

How Orbiter 8's screens are built and why: the game's look and feel, layout, interaction, art,
motion and performance. For anyone (Claude included) building a new screen or changing one. Color has
its own guide, [`color-guide.md`](color-guide.md). The game itself (rules, economy, story) is in
[`design.md`](design.md), [`demo4-plan.md`](demo4-plan.md) and [`backstory.md`](backstory.md).

A working document: rules here come from Koda's decisions and reactions, each with its reason. Open
questions and unbuilt UI work are in section 9, the one list for them; when Koda settles one, it moves
up into the guide.

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

- **The selection card** (bottom left: what you selected, as a playing card). Its frame and title take
  the selection's color; its inside is the same purple-gray everywhere (`color-guide.md`). Until
  2026-11-21 its actions were a second card beside it, as a list of purple buttons; now they're the
  card's own action row (below). Menus' insides are a blue-gray (section 11, rule 13).
- **Over the selection card, the system strip** (Koda, 2026-11-17): the star, the planets and the
  asteroid belt, in orbit order, with a list button at its end that opens the list of everything here.
- **The card itself** (built 2026-11-21, `ui-plan.md`; replaces the 2026-11-17 nearby strip, the card
  dealt out beside the planet's (X27) and the menu that slid out from behind the card): a planet's
  station and moons, or the belt's places, are tabs down the card's **spine**; the chosen one takes the
  card's **face**; one heading across the top; **one action row** of pictured wells across the bottom,
  the main action as a pill (section 11). The 1–9 keys press the actions, named in each one's tooltip.
  With nothing selected the card shows your ship; it's never put away.
- **Menus slide up in the middle**, in the shared menu container, opened from a HUD button or a card's
  menu (`stores/ui.js` `MENUS`). **No panels parked in a corner of the game view:** Koda rejected a
  corner first-steps card ("keep popups consistent, so have it slide up like all of the other menus
  do"). A new info panel is a menu with a HUD icon, and a count badge if it needs attention.
- **The HUD** (as rebuilt 2026-11-21/22): the four corners of `hud-redesign.md` (P2). You at the top
  left (the pilot plate: your call sign opens your info card, your ship's name selects your ship);
  Minerva's plate at the top center (the activity window and your link to the network); where you are
  at the top right (one panel: the center's button, the system's name, which opens the list, Map, and
  the minimap and zoom folding out under it); the card at the bottom left; the dock at the bottom right
  (Help, Sieges, Ranks, Chat, Settings), round buttons tinted by what they open, white icons, each
  with its word. A phone has a tab bar: My ship, Objects, Map, Chat, More.
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

## 8. Proposed: the galaxy map, further (Koda agreed, 2026-11-14; item 5 built, the rest not)

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
   pulse) each have their own place, so all three can show on one hex. *Built (`color-guide.md` row
   G1 · 1, `star-map/galaxy-map.vue`).*
6. **Plotted routes:** dashed lines for a course across several stars, once ranges allow multi-star
   jumps; lavender (the player's plan), pink where a leg is blocked or dangerous.

**Not taken from that mockup:** planets drawn in place of stars (the map shows stars); bright nebula
backgrounds, glow on everything and big decorative planets (against "the interface is quiet"); teal or
cyan buttons (buttons stay purple); a decorative color per hex (a hex's color means its star's class,
yours or attention).

## 9. Open questions and what's left

The one list of open UI questions and unbuilt UI work. Other UI docs (`ui-plan.md`, `hud-redesign.md`,
the mockups' notes) point here; color-only questions stay in `color-guide.md` section 10.

### For Koda to decide

- [ ] **The UI inside the Polkadot App (D66):** keep this client's layout, or rethink for the App? What
      does the App put around a Product (its own bars, safe areas, a theme, light or dark mode, colors of
      its own), and how should the game fit on a phone inside it?
- [ ] **The title screen and story:** Koda found them still very purple; the story's art has been
      updated once (4e38a01); what more? (The planet and star palettes could bring more color; the
      Earth by the port is a start: `color-guide.md`.)
- [ ] **Binary stars:** two stars at a system's center, selected as one object. How does the card show
      a pair? (The top right is drawn to hold a pair: `mockups/together/9-activity-and-top-right`.)
- [ ] **Mining drones:** how drones bring goods back to a parked ship, drawn in the system view. (The
      belt itself is drawn, 5737c8b; mining shows on Minerva's plate.)
- [ ] **Drone swarms in battle:** a first drawing is `assets/art/drone-swarm.svg` (used on the cards'
      works icons).
- [ ] **Publishing builds quickly** for play-tests: where builds go is decided (D106, GitHub Pages); a
      fast page per build is still to do (`demo4-plan.md`).
- [ ] **The card's main pill:** on a menu the main button takes the menu's own color; on the card it's
      still the brand purple. Should the card follow? (`ui-plan.md` section 15, the Yards.)
- [ ] **"Celestial bodies":** the list's count line says it; whether the list's and button's name
      ("Objects") should change too, and what ships are called in it (`ui-plan.md` section 10, note 5).
- [ ] **Holds in the pilot plate** at 250 are about 2 px cells: exact, but a texture at that size
      (`hud-redesign.md`, round 2).
- [ ] **The pilot's info card needs more life:** avatars are for later (`demo4-plan.md`, "Consider
      next"); until then, what?

### Designed, not built yet (section 10 and `ui-plan.md`)

- [ ] **Details** for a planet, station, moon, asteroid and star (mockup 3; Koda: "look fantastic").
      With it, a Details well on every card; Rename moves into Details, by the name. The ship's own
      screen (Your ship) and the pilot's info card are built.
- [ ] **Your ships:** the switcher for when a pilot has several ships (D26), always saying which ship
      you're in. Whether to show it switched off before then is open (`ui-plan.md` Part 9, question 10).
- [ ] **The list's "Yours" holdings:** your bodies' goods, drones and builds (the industry plan's "one
      screen of everything you own in the system"); Transfer and cargo ships, switched off until the
      contracts exist.
- [ ] **The list's keys:** arrows to move, right and left to unfold and fold, typing to filter by name.
- [ ] **Blocked actions dim and say why** while an activity in flight blocks them (`ui-plan.md`
      section 11, recommendation 2; the activity window is built, the dimming isn't).
- [ ] **Names as links everywhere:** owners' names in the card's readouts aren't links yet (chat, the
      siege feed, ranks and the Owner well are). Another pilot's ship's card face is thin (Pilot, At).
- [ ] **The block lamps** still sit at the bottom center (`star-map/hud/connection-status.svg.vue`);
      the plan moved them into Minerva's plate (the block number is on her Link page).
- [ ] **Minerva's Library, News and Mail** pages: switched off until their content is in the game.
- [ ] **Fitted ships in the passages:** the jump and black-hole passages, the trade and yards scenes
      still draw the plain Orbiter 8.
- [ ] **The galaxy map, further:** section 8, items 1–4 and 6.

### Not yet checked in play

- [ ] With a real move: fitting a part at an armory that has stock, landing and boarding people,
      building, an Autofactory order that goes through, installing finished parts, a siege, jumping
      through the new card, the gamepad on the new HUD.
- [ ] Not seen at all: the Siege screen (no siege on any chain at hand), on desktop or phone.
- [ ] Read costs: the extra read of other pilots' armories' stock against the testnet's read budget
      (`dev/harness/read-costs.mjs`).
- [ ] The belt's spine scrolls when it has many places; check it shows there's more.
- [ ] The ships' new art (c939272) is on a chain only after a redeploy: a fresh `npm run local` has it;
      the testnet needs a deploy.

## 10. Direction: bringing the system together (Koda, 2026-11-21; mostly built 2026-11-21/22)

Koda's notes on where the HUD should go next. Each part needed a mockup that Koda approved before it
was built (CLAUDE.md, "Keep the card and menu art"). The card's art and the big menus stay; what
changes is how the pieces connect.

**The plan and mockups:** [`ui-plan.md`](ui-plan.md) and [`mockups/together/`](mockups/together/);
screenshots of what was built in [`mockups/together/built/`](mockups/together/built/).

**Where it stands (2026-11-22).** Koda's notes below are kept as he gave them. Against them:

| Part | State |
|---|---|
| One list for the system | Built (`hud/objects/objects-panel.vue`, key `O`): the center pinned, the tree with a planet's station and moons folded in, icon tabs for the kinds, Buying under stations. It replaced the Planets, Ports and Ships buttons. Left: its keys, the "Yours" holdings (section 9). |
| The card never collapsed | Built: never put away; with nothing selected it shows your ship. |
| Station and moons as part of the planet's card | Built as a spine of tabs and one face, one heading (Koda's "milder take", `ui-plan.md` section 13). |
| Icons rather than text menus, in the card | Built: one action row of pictured wells (`hud/action-row.vue`, `libs/small-icons.js`). |
| Details | The ship's (Your ship, `hud/panels/ship-panel.vue`) is built. A planet's, station's, moon's, asteroid's and star's are not (section 9). |
| Minerva, your network connection | Built: her plate at the top center is the activity window; her menu's Link page has the network, block, address, balances, how you're signing and Start / End Session (`hud/minerva-plate.vue`, `hud/panels/minerva-panel.vue`). Start Session left the ship's card. |
| You, as a player | Built: your own info card from the pilot plate (`hud/profile/profile-panel.vue`). Achievements and rankings on it: later. |
| Other players' profiles | Built, simple: from another pilot's ship, an Owner well, ranks, chat and the siege feed. Not yet from owners' names on the card's readouts. |
| Your ships (a switcher) | Not built: waits for several ships per pilot (D26). |
| The galaxy map's icon | Redrawn: hexes and a straight jump (`hud/map-icon.svg.vue`, `map-rim-icon.svg.vue`); the button is named Map. |

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

## 11. The kit and the screen standard (2026-11-21; Koda agreed; built in `hud/kit.css` and every menu)

From Koda's notes on the mockups ("some standard on how we build screens", "clean and tight", icons
over words) and the review in [`ui-plan.md`](ui-plan.md) section 11. Drawn in
[`mockups/together/7-kit`](mockups/together/7-kit.png). Koda agreed (2026-11-21: "everything looks
good"); it's the rule for every screen, and every menu was rebuilt against it on 2026-11-21/22.

### The parts

Every screen is made of these and nothing else. A new part needs a reason and goes in this list.

| Part | For | Rules |
|---|---|---|
| **Main pill** | A screen's or card's one main action | One per screen. Its picture in a well at its left, one or two words. On a menu it takes the menu's own color with dark words (Koda, 2026-11-21: the brand purple clashed with the menus' background); on the card it's the brand purple. At least 44 px tall. |
| **Well** | Any other action | A 44 px circle with a small icon and a one-word caption under it. Dimmed when it can't be used now, with the reason in the caption's place. |
| **Tab** | A way to somewhere (a planet's station, a list's filter, a menu's page) | A rounded square, never a circle, so it can't be taken for an action. The current one is lit. A count badge if it stands for several. |
| **Row** | One thing in a list | Its mark, name, one line under it, one value at the right. The selected row is lit and carries Go. |
| **Tile** | One fact with a number | A label of at most 10 letters, a value. Never wider than its text allows. |
| **Bar and ring** | How much, how far along | A bar for an amount, a ring for time. Lavender; pink only when it needs the player. |
| **Section heading** | Groups a screen | Small capitals and a rule. At most five to a screen. |
| **Link** | A name that goes somewhere | Underlined, in the color of what it names. |
| **Socket** | Something that isn't there yet | Dashed outline, dimmed picture, "Not yet". Dashes mean this and nothing else (a siege keeps its pink dashes). |
| **Status mark** | Something that's simply true (built, yours, besieged) | Flat, no ring, can't be pressed. |

### The standard for a screen

1. **A screen is a card, big.** The frame and heading of the thing it's about, in that thing's color;
   its picture on the left (on top, on a phone); sections on the right. Planet Details is the model.
2. **One main action,** a main pill, in the same place on every screen: the bottom left of the
   content, nearest the card in your hand.
3. **Icons before words.** A word only where an icon can't carry it: names, numbers, the main
   action, a well's one-word caption, a list of moons.
4. **Type:** nothing under 11 px (12 on a phone). Four sizes to a screen at most.
5. **Labels are short** and never leave their box: shrink to fit, then cut with an ellipsis, as
   names do (`libs/fit-text.js`).
6. **One meaning each.** Yellow: yours, and gains. Pink: needs you. Lavender: waiting, time, progress.
   Dashes: not there yet. No green.
7. **Steps are fine, work isn't** (`ui-plan.md` section 12). The next thing to press appears near the
   last one. Nothing moves under the pointer: a control keeps its place from step to step and from
   one planet to the next.
8. **Sliders start at rest.** Nothing is chosen for the player.
9. **Every screen has its phone layout,** drawn with it.
10. **Group by the limit that governs,** and put that limit in the group's heading (mounts, holds,
    drone room, orders of five).
11. **The chosen row opens in place,** with its amount, its cost and its button: nothing to cross the
    screen for.
12. **Never a "can't" without a reason,** and where there is one, a way on (the Armory's way to the Yards).
13. **Every menu's inside is the same blue-gray;** the frame and the buttons take the menu's own color.

