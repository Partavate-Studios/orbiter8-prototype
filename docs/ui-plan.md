# Orbiter 8 UI plan: one system, one card, one network, one you

For Koda. Written 2026-11-21 from his direction in [`ui-guide.md`](ui-guide.md) section 10, from every
doc that says what the UI must do, and from the HUD's code as it stands. **A plan and four mockups:
nothing here is built.** Each part needs Koda's go-ahead on its mockup before it's built (CLAUDE.md,
"Keep the card and menu art").

- Part 1: what the UI has to carry (today's features, and the ones that are coming).
- Part 2: what's wrong now, in one page.
- Part 3: the design, as six ideas that hold it together.
- Part 4: each piece, with its phone version.
- Part 5: where everything goes (nothing is dropped).
- Part 6: what can be built today, what's built and switched off, and what waits for contracts.
- Part 7: build order.
- Part 8: the mockups.
- Part 9: questions for Koda.

**Sources:** `ui-guide.md` (section 10 above all), `color-guide.md`, `hud-redesign.md` (the inventory
and round 2), `demo4-plan.md` (decisions, "consider next"), `review.md`, `industry-plan.md`,
`expansion-plan.md`, `design.md`, `design-ideas.md`, `polkadot-direction.md`, `backstory.md`,
`briefs/minerva-face.md`, `briefs/corp-database.md`, `tech-trees/`, and the client's
`components/hud/`, `star-map/hud/`, `stores/` and `libs/`.

---

## 1. What the UI has to carry

### 1.1 Built today (every one keeps a home: Part 5)

| Area | What the player does |
|---|---|
| You | See call sign, ship, credits, every hold; session time; scan countdown; mining progress |
| The system | Select and step through the star, planets, belt, asteroids, stations, moons, ships; minimap; zoom |
| Travel | Galaxy map, jump, go through a black hole, scans, name a star |
| Trade | Trade at a port (eight goods, two-way sliders), the Ports list with trade codes and what your cargo fetches |
| Ship | Shipyard (cargo holds, drone bays, range, repairs), Armory, Loadout (fit, unload, drones) |
| Planets | Claim, rename, recruit and land colonists, storage, the building line, Autofactory orders, defenses |
| Asteroids | Claim, Asteroid Works, drone pool; Mine Here / Stop Mining in an empty section |
| Battle | Attack, Siege (rounds, claim), join a defense, the siege feed |
| People | Chat, leaderboard |
| Help | First Steps, the tech tree |
| The network | Start / End Session (on the ship's menu); the tray; block number and lamps; Settings |
| Input | Mouse, touch, keyboard (Esc, Space, Tab, 1–9, M P H C L F A), gamepad |

### 1.2 Coming, and what each asks of the UI

"Contract" means it can't work until contract changes land. The UI should have its place ready.

| Feature | Status | Contract | What the UI needs |
|---|---|---|---|
| One Objects menu, the card that grows, icon actions, Details, the Minerva panel, profiles, ship switcher, new map icon | Koda's direction, 2026-11-21 | Mostly no | This plan |
| Several ships, one in focus (D26; "one mind, one ship at a time") | Planned | Yes | A switcher that always says which ship you're in; ships on autopilot show their job |
| Relays and signal lag | Leaning | Yes | A signal reading on a ship; lag shown where a move is waiting |
| Other players' profiles; achievements; rankings on a profile | Simple now; the rest much later | Later parts | A profile card with room to grow; every owner's name is a link |
| Corporations: rank, law, taxes, protected zones, liveries | Partly on chain (sponsor, switching, `lawAt`) | Mostly yes | Corporation on the profile; "whose law" on a star's and planet's details; a Switch Corporation action |
| Industry: three autofactories, drones that build, cargo ships, transfers, "one screen of everything you own in the system" | Design (`industry-plan.md`) | Yes | Holdings in the Objects menu; drones and builds on Details; a Transfer action |
| Ships and planets bought and sold | Decided (D65), needs research | Yes | A Market action on a card (it exists as a link today) |
| Damage to systems, overheating, repairs | Leaning / built in part | Partly | A condition row on the ship's card and Details |
| Binary stars | To do soon | Likely | The system's center may be two stars, selected as one |
| Minerva's face in the HUD; her library, news, mail | Face built, not placed; content partly drafted | No | A home for Minerva in play |
| Galaxy map: fingerprints, trade value, routes (`ui-guide.md` section 8) | Agreed, not built | No | Out of this plan's scope; the star's card there follows the same card rules |
| Terraforming, crafting, supply routes, pirates and bands, aliens | Later | Yes | Sections on Details, and filters in Objects, added when they come |
| The Polkadot App: per-move phone approval, AutoSigning, personhood, PGAS | Decided (D103, D104, D102) | No | The Minerva panel shows how you're signing and what it costs |

### 1.3 Rules that bind the design

From Koda's verdicts, each already in a guide:

- The buttons are the game: big, pictured, never hidden behind a small control.
- The card is an NFT playing card. Keep the art.
- Ports show three-letter trade codes.
- Menus slide up in the middle. No panels parked in a corner.
- Yellow is yours and good for you. Pink needs you. Buttons stay purple.
- Phones matter: every piece below has its phone version.
- Every feature of an earlier release survives.
- Room for the longest name. Never color alone. Glows are gradients.

---

## 2. What's wrong now

Koda's five points (`ui-guide.md` section 10), with what the code shows:

| Problem | In the code today |
|---|---|
| The same things are reached three ways that don't agree | Top right: Planets, Ports and Ships buttons, each its own menu (`planets`, `ports`, `ships`). The minimap. The system strip over the card, and under it the nearby strip, which repeats the card's own station and moon buttons. |
| The UI doesn't follow ownership | A station is a separate selection with a separate card dealt over its planet's. The belt's asteroids are reached through a second strip. |
| A station doesn't feel like its planet's | The dealt card covers half the planet's card and dims it. The station and moon buttons hang off the card's bottom edge, smaller than the menu's buttons. |
| Network matters sit among game actions | Start Session is slot 3 of your ship's menu. The block number and lamps are tiny, bottom center. Address, balance and network are only on the title screen. |
| The galaxy map's icon is from an old design | `jump-icon.svg.vue` draws curved slingshot arcs. Jumps charge at a star and go straight to the next. |

Three more, found while reading:

- **Things that wait are in three places.** The session and scan chips are under the pilot plate, the
  tray is top center, the block lamps are bottom center. All four are the network talking.
- **There is no "you".** The pilot plate's round button selects your ship. Nothing shows you as a
  pilot: your corporation, your debt, what you own, where you rank.
- **The card can be put away** (the × in its drawer, a pill to bring it back). Koda: never collapsed.

---

## 3. The design in six ideas

**1. One order for the system, used everywhere.** The center first (a star, a pair, or a black hole),
then each planet in orbit order with its station and moons folded inside it, the belt with its
asteroids folded inside it, then the ships. The strip, the Objects menu, the minimap and the card all
follow it. A planet is one thing.

**2. Everything is a card, at three sizes.**

| Size | Where | For |
|---|---|---|
| A **mark** | the strip, a row in Objects, the map | finding it |
| The **card** | in your hand, bottom left, always | acting on it |
| **Details** | a big card that slides up | knowing all of it |

Ships, planets, stations, moons, asteroids and stars already work this way at the first two sizes.
This adds the third size, and adds **pilots** as a kind of card.

**3. The card grows; it's never covered.** A planet's station or moon opens as a wing of the planet's
own card, inside the same frame. The planet stays in view.

**4. Actions are pictures in the card.** The text drawer becomes a row of pictured wells on the card
itself, each with a one-word caption. Slots stay fixed, 1–9 still press them, one is the main action.

**5. Minerva is the network.** Everything about your connection (the wallet's address and balances, how
you're signing, the session, the block, a move on its way, a scan) is Minerva's, in one place at the
top center, with her face on it.

**6. A name is a link.** Any owner's name opens that pilot's profile. Any planet's or star's name
selects it. So a profile, a card and Details are always one press from each other.

The four corners stay as they are (`hud-redesign.md`, P2): **you** top left, **where you are** top
right, **what you selected** bottom left, **everyone else and the game** bottom right. Minerva takes the
top center, where the tray already is.

### One look for "not yet"

Features that wait for contracts are drawn in place and switched off, all the same way: the dashed
socket the drawer's empty slots already use, the picture dimmed, and a plain line under it ("Not yet").
No pink (nothing is wrong) and no lock icons. When the contract lands, the socket fills in and nothing
moves.

---

## 4. The pieces

### 4.1 Objects: one menu for the system (mockup 2)

Replaces the Planets, Ports and Ships buttons and their three menus.

- **Opens** from one **Objects** button under the minimap (count badge: everything here), key `O`, and
  from the list button at the end of the system strip. It slides up in the middle like every menu.
- **The center is pinned at the top:** the star (its class and name), the pair, or the black hole. It
  doesn't scroll away.
- **Below it, the tree** in orbit order. A planet's row shows its sphere, name, class, owner and, at
  its right, small marks for what it holds (station, moons). A chevron unfolds its station and moons
  as indented rows. The belt unfolds its asteroids and its empty sections. Ships come last.
- **Filters along the top**, as chips: All, Planets, Stations, Moons, Asteroids, Ships, Mine. A filter
  flattens the tree to that kind; each row then says what it belongs to ("at Earth").
  - **Stations** adds a second chip, **Buying**: only ports that buy what you carry, sorted by what
    your cargo fetches. Rows become the Ports menu's rows (trade code, prices, Trade / Yards / Armory
    shortcuts), so that menu loses nothing.
  - **Ships** shows every ship here with its pilot, as the Ships menu does.
  - **Mine** is the industry plan's "one screen of everything you own in the system": your bodies with
    their goods, drones and builds. Goods and builds show today. Cargo ships and **Transfer** are
    switched off until the contracts exist.
- **Pressing a row selects it.** The card in your hand changes while the menu stays open, so you can
  browse. Pressing the selected row again (or Enter) closes the menu and flies there.
- **Status marks are the strip's:** a yellow dot for yours, a pink dashed ring under siege, the green
  dot for a port that buys your cargo.
- **Keys:** arrows move, right and left unfold and fold, typing filters by name.

**The system strip stays**, as the Objects menu's short form: the center and each planet and the belt
as marks, ‹ › to step, and now a list button at its end that opens Objects. **The nearby strip goes:**
the card's own family row does its job (4.2), and it was already an open question (`review.md` X27).

**Phone:** Objects is a tab in the bar (in place of Planets). The sheet is full width; the filter chips
scroll sideways; a row is 52 px.

### 4.2 The card (mockup 1)

**Always in your hand.** The × and the bring-it-back pill go. With nothing selected the card shows your
ship: it's the body you're wearing. Esc steps back to it.

**Built in three bands,** top to bottom, in Koda's frame (brackets, title pill, yellow badge, pink
siege frame, all unchanged):

1. **The art,** with the works icons arced under it, as now.
2. **The family row** (planets, asteroids with a port, the belt): round wells for what belongs to it,
   each with a short caption: `Station`, `Moon`, `Moon`. They're the buttons Koda likes, moved up into
   the card and given words, so they're as plain as the actions.
3. **The readouts,** as now, then **the action row:** up to five pictured wells with one-word captions.

**The wing.** Pressing a family well unfolds a second leaf from the card's right edge, the same height,
inside one frame, joined at a hinge:

- The planet's side stays lit, with the pressed well marked.
- The wing has its own small title pill in its own color (steel blue for a station, gray for a moon),
  its art, its readouts and **its own action row**. The planet's action row dims while the wing is
  open, because the wing is what you're acting on.
- The wing's first well is always **back to the planet** (the planet's own sphere), which folds it.
- ‹ › on the wing step through the moons.
- The ship still docks, and the camera still frames the station beside its planet.
- The belt works the same way: the belt's card, and a wing for the asteroid or empty section.

**The action row.**

- Wells are 44 px, the drawer's own `.o8-well` look, with the action's picture from `body-art.js`.
  The caption under each is one word: `Trade`, `Yards`, `Armory`, `Colony`, `Attack`, `Claim`, `Jump`.
- **Fixed slots,** as `card-actions.js` has them; an empty slot is a dashed socket; keys 1–9.
- **The main action** has the bright ring and fill (`BRAND_500`, `BRAND_300`), one per card.
- **A price or a reason sits in the caption's place** when it matters: `2,000¢`, `free`, or in light
  pink `Can't afford`. Hover, focus and a long press show the full line and the key.
- **The last slot is always Details** (4.3). Rename moves into Details, next to the name.
- Text menus aren't gone: pressing Trade still slides up the Trade menu. What goes is the list of
  words beside the card.

**Phone:** the card stays small at the left of the sheet (132 px). The family row and the action row
sit to its right as two rows of 48 px wells with captions. The wing replaces the small card's face
(the planet's title stays above it as a tab to go back); holding the card up shows the planet and its
wing stacked, full size.

### 4.3 Details: the big card (mockup 3)

A Details well on every card opens the big version in the menu container, in the card's own frame and
color. Art on the left, sections on the right; on a phone, art on top and sections scrolling.

| Thing | Details shows | Switched off for now |
|---|---|---|
| **Ship** | Name (rename here), pilot (link), where it is. **Every hold drawn** (cargo, drone bays, parts). Engine range 1–4. The six weapon mounts and what's in each. Armor, shield, repair bots, drones and what they're doing. Condition and repairs. | The ship's autofactory. Signal and relay. Heat. |
| **Planet** | Name (rename here), class, size, rings, orbit, **its star (link)**, **its owner (link to the profile)**. **Its family:** station and moons as tiles that open their own Details. **The building line** with what's built and what's next. People. **Production** per hour by good. Storage. **Defenses** in the order hits land: platforms, moon guns, shield, armor, weapons, hull. A siege, if one is on. | Whose law applies. Cargo ships and transfers. Terraforming. |
| **Station** | Name, **back to its planet**, owner (link), the trade code and each good's stock and price, yards and armory, the last three ships docked. | Standing orders. |
| **Moon** | Name, **back to its planet**, its six mounts. | Mining a moon. |
| **Asteroid** | Kind, size, yields, the works line, drone pool, store, defenses, owner (link). | |
| **Star / black hole** | Class, discoverer and namer (links), who owns it, its planets, ports and belt; a black hole's partner. | Charge speed by class. Whose law. A second star. |

The ship's Details takes in the **Loadout** menu: fitting and unloading happen there. One screen for
"everything about my ship" instead of two.

### 4.4 Minerva: your link to the network (mockup 4)

**In the HUD:** a small plate at the top center with Minerva's face (the built component, at its 48 px
size) and one line of status. The tray's rows drop down from under it, so a move on its way is plainly
her talking.

- The line shows the most pressing thing: `Waiting for your signature`, `Scanning Barnard's Star · 23 s`,
  `Session · 3h 12m`, or when all is quiet just the network's name and a steady dot.
- Her face shows the same thing (`briefs/minerva-face.md`): Thinking while a move is in flight, Waiting
  on you for a signature, Scanning, Alert under siege, Offline with no chain.
- The session and scan chips leave the pilot plate. The block lamps leave the bottom center. Mining
  stays under the pilot plate: it's your ship's work, not the network's.

**Pressing it slides up Minerva's menu,** with pages along the top as her console has in the intro:

| Page | Holds |
|---|---|
| **Link** (first) | The network and its state; the block number and how long since the last one. Your address (copy), and what the wallet holds: PAS, PGAS, credits. **Signing:** which way you're signing now (each move on your phone, a session, or AutoSigning), the session's time and gas left, and **Start Session / End Session** as the page's main button. Contracts and the explorer. In dev builds, the local / testnet switch. |
| **Waiting** | Every timer in one list: moves in flight, scans, builds, factory orders, sieges' rounds, repairs, mining. Each links to its thing. |
| **Library, News, Mail** | Switched off until their content is in the game (`backstory.md`, Minerva's library). |

Start Session leaves the ship's card. First Steps' "Start a session" step points here.

**Phone:** her face sits at the left end of the pilot strip (where the my-ship button was on desktop),
with the status line under the strip in place of the chips.

### 4.5 You, and other pilots (mockups 3 and 4)

**The pilot plate splits in two,** each half a button:

- **You** (left: the avatar, call sign, corporation, credits): opens your profile.
- **Your ship** (right: the ship's name, its holds): selects your ship; its chevron opens Ships (4.6).

**A profile is a pilot's card,** in the same frame as every card, opened big in the menu container:

- Call sign, corporation and since when, credits (and your debt, on your own).
- Rank by credits and by planets (the leaderboard's numbers).
- What they hold: planets, ports, asteroids, stars discovered and named. Each is a link, when it's in
  this system; otherwise it names its star.
- Their ship, and where it was last seen.
- **Switched off, with their places drawn:** achievements, corporate rank, your body in cold storage
  (your own profile only).

**Reaching one:** any owner's name on a card, in Details, in Objects, on the leaderboard, in chat and
in the siege feed. The address fragment ("0x709…c8") moves from cards to the profile.

### 4.6 Your ships (mockup 4)

For when a pilot has more than one (D26). Opened from the pilot plate's ship half.

- One row per ship: its name, where it is, what it's doing on autopilot (holding a siege, mining), its
  holds, its signal.
- **The ship you're in** is marked in yellow with the words "You're here", and the same mark sits on
  the pilot plate at all times.
- **Take Control** is the main button on any other ship.
- Today there is one ship, so the plate shows no chevron. The menu is built and switched off: it lists
  your one ship and a dashed socket, "More ships: not yet".

### 4.7 Where you are (mockup 1)

The top right, simpler:

- The system's number and name, and the center's button (the star, the pair or the black hole), as now.
- The minimap and its zoom rail, as now.
- Under it, **two** buttons where there were four: **Objects** (with the count) and **Map**.
- **The Map's new icon:** three hexes of the galaxy map, your star in the middle one, and a straight
  line to a neighbor. It shows what a jump is now: hex to hex, star to star. The button is named Map,
  because that's what it opens; Jump is the action on the ship's and the star's cards.

### 4.8 The dock, the tray, dialogs

Unchanged: Help, Sieges, Ranks, Chat, Settings at the bottom right; dialogs in the center. The tray's
rows keep their look and hang under Minerva's plate.

### 4.9 The phone, all together

| Region | Holds |
|---|---|
| Top strip | Minerva's face, your call sign and credits (press: your profile), the ship and its holds (press: your ship) |
| Under it | Minerva's status line on the left; the system's name and minimap on the right |
| Above the tabs | The selection: small card, with the family row and action row beside it |
| Tab bar | My ship, **Objects**, **Map**, Chat, More |
| More | Help, Sieges, Ranks, Minerva, Settings, Ships (when you have several) |

---

## 5. Where everything goes

| Today | In this plan |
|---|---|
| Planets button and menu | Objects, filter Planets |
| Ports button and menu (trade codes, "your cargo here", shortcuts) | Objects, filter Stations (and Buying); rows unchanged |
| Ships button and menu | Objects, filter Ships |
| Jump button | Map button (new icon); Jump stays an action on the ship and star |
| System strip | Kept; gains a list button that opens Objects |
| Nearby strip | Removed; the card's family row and Objects' tree |
| Card's station and moon edge buttons | The family row inside the card, with captions |
| Dealt second card | The wing |
| Text drawer and its tab | The action row in the card |
| "Put the card away" × and pill | Removed; the card is always there |
| Rename (a slot on every card) | In Details, by the name |
| View on market | In Details (and an action when trading ships and planets lands) |
| Loadout menu | The ship's Details |
| Start / End Session | Minerva, Link |
| Session and scan chips | Minerva's status line and her Waiting page |
| Mining chip | Stays under the pilot plate |
| Block number and lamps | Minerva's plate (the dot) and Link (the number) |
| Pilot plate's my-ship button | The plate's ship half |
| Cargo dropdown on the plate | Kept, on the ship half |
| Minerva's debug box (backtick) | Kept for dev builds; its Profile tab is replaced by the profile |
| Network panel on the title | Kept there; Link shows the same in play |
| Trade, Shipyard, Armory, Colony, Asteroid Works, Siege, Feed, Chat, Ranks, Help, Settings, tech tree, galaxy map, dialogs, tray, jump and black hole passages | Unchanged |
| Keys | All kept. New: `O` Objects, `I` Details, `N` Minerva. `P` opens Objects on Planets. `A` (the drawer) is free. |

---

## 6. What can be built when

| Piece | Today, client only | Built and switched off | Waits for contracts |
|---|---|---|---|
| Objects menu, tree and filters | Yes | Transfer; cargo ships | In-system transfers (`industry-plan.md`) |
| Buying filter | Yes (the Ports menu already computes it) | | |
| Mine filter | Goods, people, builds, drones on your bodies here | | Drones committed to builds; cargo ships |
| Card always shown; family row; wing | Yes | | |
| Action row | Yes | | |
| Details: ship, planet, station, moon, asteroid, star | Yes, from data the client already reads | Law, terraforming, heat, signal, ship's autofactory | Each of those |
| Minerva's plate and Link page | Yes: address, balance, block, network, session time are in the stores | PGAS, personhood, AutoSigning (the App) | The session key's gas left needs a small SDK addition, no contract |
| Minerva's Waiting page | Yes | | |
| Library, News, Mail | | Yes | Content, not contracts |
| Your profile | Yes | Achievements, corporate rank, body buy-back | Each of those |
| Other pilots' profiles | Yes: call sign, corporation, the leaderboard's planets, ports and credits | Their holdings list beyond this system | A cheap read of a pilot's deeds (a contract view) |
| Ships switcher | | Yes, with your one ship | Several ships per pilot (D26) |
| Map icon | Yes | | |
| Binary stars at the center | The center row and button are drawn to hold two | | The contracts' second star |

**Read costs:** Details and profiles add per-body reads. Check each against the testnet's read budget
with `dev/harness/read-costs.mjs` before building (`polkadot-direction.md`).

---

## 7. Build order

Each step is shown to Koda as a mockup or a running screen before the next.

1. **The card:** always shown, the family row, the wing, the action row. The heart of it, and the
   riskiest for the art, so first.
2. **Objects** and the top right (two buttons, the Map icon). Retire the three menus into it.
3. **Minerva's plate and Link.** Move the session, the scan line, the block.
4. **Details,** ship first (it absorbs Loadout), then planet, then the rest.
5. **Profiles,** yours and others'; names become links.
6. **Waiting** (every timer), then the switched-off pieces: Ships, Mine's transfers, the future
   sections of Details.

Each step is checked at phone size, with keyboard and gamepad, in one long play session.

---

## 8. The mockups

In [`docs/mockups/together/`](mockups/together/), drawn by
`orbiter-client/dev/mockups/together.mjs` (SVG, with a PNG beside each; redraw with
`node dev/mockups/together.mjs --png` from `orbiter-client/`). The numbered notes on each mockup say
what to look at. Mockups 1 and 2 are set in Sol, so Earth is Minerva's and its claim, colony and siege
slots are empty; mockup 3 shows a player's planet with everything on it.

| # | File | Shows | The design answers in it |
|---|---|---|---|
| 1 | `1-card-and-wing` | Desktop. Earth selected, its station's wing open. | The card that grows; the family row; actions as pictured wells; the top right with two buttons and the new Map icon; Minerva's plate; the split pilot plate |
| 2 | `2-objects` | Desktop. The Objects menu over the system, and under it the same menu on Stations with Buying on. | The center pinned; the tree; filters; the Ports menu's rows kept whole |
| 3 | `3-details-and-profile` | Desktop. Another pilot's planet in Details, and that pilot's profile. | The big card; family as part of the planet; owner as a link; the profile as a pilot's card; "not yet" sockets |
| 4 | `4-phone` | Three phone screens. | The phone's layout; Minerva's Link page with the session in it; the Ships switcher, switched off |

---

## 9. Questions for Koda

1. **The wing.** It makes the card wider (about twice) while a station or moon is open. On a 1440-wide
   screen that's a third of the width, at the bottom left. Too much? The fallback is a wing that covers
   the planet's readouts but leaves its art and title showing.
2. **Captions under the action wells.** One word each. You asked for icons over text; the guide says
   never a picture alone. Keep the captions, or show them only on hover and focus?
3. **With nothing selected, the card shows your ship.** Or should it show the system's center?
4. **The nearby strip goes.** The belt's eight places then live on the belt's card and in Objects.
5. **Loadout folds into the ship's Details.** One screen for the ship. Agreed?
6. **Rename moves into Details.** It frees a slot on every card; it's one press further away.
7. **Minerva at the top center.** Her face is on screen all through play. Right, or should she be
   smaller and in a corner until she has something to say?
8. **Scan and session leave the pilot plate** for Minerva's line. One line shows one thing at a time;
   the rest are on her Waiting page.
9. **Profiles of other pilots: how much to show now?** Everything here is public on chain. Is showing a
   rival's credits and holdings on their profile what you want?
10. **The Ships switcher, switched off, visible today?** Or hidden until a pilot can have two ships?
11. **The Map button's name.** Map, Galaxy, or keep Jump?
