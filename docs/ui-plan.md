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

---

## 10. Koda's feedback on the mockups (2026-11-21, being collected)

Notes as Koda gives them. Nothing here is designed yet; the next move is decided once he's done.

1. **An activity window, in place of the mining chip.** The mining message "looks like an
   afterthought". Koda wants one small window of icons for what you have going on:
   - **Things that block you:** an icon per activity that means you can't do anything else until it's
     through. A trade just submitted (you can't submit another elsewhere until it lands); active mining.
   - **Things that are only waiting:** shown in the same window though they don't block you. A claim
     filed and not yet through (you can still file more) gets a little claim icon.
   - All in the same place, as icons, one per activity.
   - *Touches:* the mining chip under the pilot plate (4.4 kept it there), the tray's rows under
     Minerva's plate, and Minerva's Waiting page (4.4). Whether blocking moves should also dim the
     actions they block is not yet said.
2. **The top right still doesn't hold together.** Sol's name and button, and the Objects and Map
   buttons, still read as separate pieces. It is "this is where you are", but **the minimap feels
   awkward there**. (Mockup 1, section 4.7.)
3. **The menus need a walk-through, and a standard.** "The sub menus are a bit of a mess."
   - Example: Help leads with First Steps ("do these things"), while the information on planets (How
     Planets Grow, the tech tree) is buried, though it's the far more useful page.
   - Koda wants to go through these screens one by one and improve them all, probably against **a
     standard for how a screen like that is built**.
   - *Touches:* 4.8 and Part 5 left every menu's inside unchanged; this plan has no menu standard yet.
4. **The wing is "almost good": join the two headings.** The planet's title and the wing's title
   should be combined somehow. Koda's idea: the two title pills keep their own colors and names, but
   their inner ends meet in the center, touching, so they make **one big heading across the top** of
   the whole card. Otherwise the wing stays as drawn. (Mockup 1, section 4.2.)
5. **The Objects menu is good, with three changes.** (Mockup 2, section 4.1.)
   - **Icons for the filter tabs, not words** (All, Planets, Stations, Moons, Asteroids, Ships, Mine).
     And as a rule for the whole UI: **icons in place of words when and where we can.**
   - **No "Objects of Sol" title** at the top.
   - **Don't say "things"; say "celestial bodies".** (The mockup's line reads "27 things here".)
     *Claude's reading, to confirm:* the word replaces "things" in that line. Whether "Objects" as the
     menu's and button's name should become "Celestial bodies" too, and what ships are called in it
     (a ship isn't a celestial body), is not yet said.
6. **Planet Details: "look fantastic... great work."** Keep as drawn. (Mockup 3, section 4.3.)
7. **The pilot card is boring.** Players will want to make an **avatar of some kind**. That's for
   later; it's on the to-do list in `demo4-plan.md` ("Consider next", Pilot avatars). Until then the
   profile needs more life than the plain figure in mockup 3. (Section 4.5.)
8. **Keep the data, tighten the labels.** Koda loves how much data the mockups show, but labels must
   not be verbose: "we have to keep the final UI clean and tight". His example: "stars named" runs out
   of its tile on the profile (mockup 3). A rule for every screen: short labels, and nothing ever
   spills out of its container (`ui-guide.md`, "Room for the longest name", applies to labels too).

## 11. Claude's own review of the mockups (2026-11-21, at Koda's request)

Three passes over the four mockups (how it's used, how it's built, how it looks), then what to change.
Recommendations only; Koda decides.

**Use**
- The wing has two action rows on screen (the planet's, dimmed, and the station's), both showing keys
  1–5. Only one can be live.
- "Back to Earth" is offered three ways: the wing's first well, the lit Station well, Earth's own side.
  The well spends the best action slot on navigation.
- What's going on is told in four places: Minerva's line, the tray rows, the mining chip, the Waiting
  page (Koda's note 1).
- Objects asks for a hidden double press ("press one to select it, again to go").
- Earth shows three empty sockets out of five: the first card a new player sees looks hollow.
- Link makes End Session the biggest button on the page, though it's rarely wanted.
- Details repeats the owner as a link and as an Owner well.

**Build**
- Type is too small in places: 9–10 px labels on the card, the wing's goods table, key hints.
- The action wells are 38 px, under the 44 px the plan promised; five don't fit the card's width at 44.
- The game's art turns to blobs under about 24 px (citadel, colony and claim look alike). Replacing
  words with icons (Koda's note 5) needs icons that read small.
- Too many one-off parts: filter chips, state chips, rank pills, the IN tag, "You're here", tiles,
  sockets. No shared kit.
- Text runs out of its box in more places than "stars named" (the Weapons line in Details).
- The phone's top strip holds eight things in 60 px.

**Look**
- Planet Details works because it has big art, one identity color and room. The profile and the
  sheets (Objects, Minerva, Ships) have none of the three: all the same purple.
- Dashes mean five things: selected, empty slot, not yet, being built, under siege.
- Circles mean three things: an action, a way to somewhere, a status (the works icons can't be pressed).
- Yellow is on the session line and bars, the IN tag, "You're here", gains and wanted goods. Too much
  for it to keep its force; a session's time isn't "yours" or a gain.
- Green means both "the network is in contact" and "this port buys your cargo". The color guide has
  no green.
- The wing's goods table is the densest spot in the UI, in its smallest type.

**Recommended**
1. **One card, one heading, one action row.** With Koda's joined heading on top, put a single action
   row across the bottom of the whole card, belonging to whichever leaf is in front. Drop the back
   well. Move Details to the title (press the title or the art), so four slots fit at 44 px.
2. **Minerva's plate is the activity window** (Koda's note 1): her face, then an icon per activity
   with a progress ring, blocking ones marked. Mining, trades in flight, claims, scans, builds. The
   tray rows and the mining chip fold into it. Blocked actions dim and say why.
3. **A small-icon set before swapping words for icons:** one grid, one line weight, tested at 20 px,
   with a caption or tooltip always available.
4. **A kit and a screen standard** (Koda's notes 3 and 8): well, pill, chip, tile, row, section
   heading, bar, socket; smallest type 11 px (12 on phones); label length limits; nothing overflows;
   every sheet built as Details is (art, identity color, sections).
5. **One meaning each:** dashes only for "not there yet" (siege keeps its pink dashes); "buys your
   cargo" in yellow, as the color guide says, and no green; session time in lavender.
6. **Tell actions, ways and statuses apart:** filled wells with captions for actions; statuses lose
   their rings.
7. **Top right in two parts** (Koda's note 2): where you are (the name, which opens the list, and Map)
   apart from how you're looking (minimap and zoom together). Needs its own mockup.
8. **Trims:** the wing shows its code and the one line that matters, the goods table stays in Trade
   and Details; no sockets for actions a body can never have; a Go button on Objects' selected row;
   End Session as a quiet button; no Owner well in Details.

**Koda's answer (2026-11-21):** "I like all of that." All eight recommendations stand. He added:

9. **Moons: with more than one, open a list of moons first.** The moon menus "were awkward before":
   they defaulted to the first moon. With several moons the wing should show a list of them, by name.
   It's "one of the few places we have words".

Mockup 5 (`mockups/together/5-revised`) draws the recommendations and notes 1, 2, 4, 5, 8 and 9 together,
before building starts.

## 12. Pointer travel on the trade loop (Koda, 2026-11-21)

Koda's measure: for a loop players repeat (find a port that buys what you carry, go there, trade,
again), how far does the mouse travel between clicks? It should be comfortable. Measured on the
mockups at 1440 × 900, in straight lines, with the trade menu where it is today (Make Trade at the
bottom center).

| Route, one loop | Clicks | Travel |
|---|---|---|
| Today: Ports button, a row's Trade shortcut, a slider, Make Trade | 3 and a drag | about 2,400 px |
| Mockup 5, the list: open it (top right), Stations, Buying, the row's Trade, a slider, Make Trade | 5 and a drag | about 3,000 px |
| Mockup 5, the list, if it remembered its filters | 3 and a drag | about 2,700 px |
| Mockup 5, strip and card: a planet's mark, Station, Trade, a slider, Make Trade | 4 and a drag | about 2,200 px |

**The new design is no better than today on this loop, and through the list it's worse.** Why: the
openers are in corners and the work is in the center, so every loop crosses the screen twice; the list
adds two filter clicks; nothing at Make Trade leads to the next port; selling needs a slider drag per good.

**To fix (not yet drawn):** a budget for repeated loops (say 3 clicks and 600 px); "Next buyer" offered
where Make Trade was, once the trade is through; arriving from Buying presets the sliders to sell what
the port buys; the list remembers its filters; a best-buyer shortcut on the ship's card or the cargo
cells.

**Koda's correction (2026-11-21): steps are good, work is bad.** The player should feel they went
somewhere: a few clicks to reach a new planet is right, and clicking a planet and then its station is
good when it tells you where you are. What's bad is the work around those clicks: moving the mouse far,
or menus shifting in an unsettling way.

So the measure for a loop is **travel and stability, not the number of clicks**:
- Keep the steps that carry a sense of place (planet, then station, then trade).
- Each next step appears close to the last click.
- Nothing moves under the pointer: a control keeps its place from one step to the next and from one
  planet to the next.
- This drops two of the fixes above as written: a "Next buyer" button that skips the trip, and a
  best-buyer shortcut. Kept: the list remembers its filters; and the strip-and-card route (planet's
  mark, Station, Trade) becomes the one to make short, since it's the one that shows where you are.
- **Never preset a trade slider (Koda, 2026-11-21).** Sliding and choosing what to buy and sell is one
  of the few fun interactions the player has. And they may have come to buy for a build: something
  else already selected would feel wrong. The trade screen always opens with every slider at rest.

## 13. An option: the card less than double wide (Koda, 2026-11-21)

Koda: when something secondary is selected, the card needn't be double width; it could be some amount
less, with the emphasis on the selected thing. An option, not a requirement.

Claude's suggestion, not yet drawn: **a spine and one face.** The planet's side narrows to a spine
about 90 px wide (its sphere, then its station and moons as a column of tabs), and the selected thing
takes the full face beside it. About 1.4 times a card's width, not 2. The heading stays joined.
- The tabs sit in the spine in every state, the plain planet card included, so they never move under
  the pointer when the face changes.
- It answers two open problems: whose actions the row holds (the one face), and telling ways (tabs
  down the spine) from actions (wells along the bottom).
- It's close to what a phone needs.
- The cost: the planet's readouts aren't shown while its station or moon is in front; its name and
  sphere are.

**Koda's choice (2026-11-21): the milder take.** The card stays double wide for the moons' list (the
planet is still the subject), and narrows to a spine and one face when a station or a single moon is in
front. Claude's worry that the card changes width between two clicks is noted; Koda prefers it. Design
it so the tabs and the action row hold their places through the change.

## 14. Going ahead (Koda, 2026-11-21)

Koda: the proposal is an improvement; carry the concepts "a bit further and deeper"; the up-front prep
is a good plan. Prep first, shown to Koda before any game code changes:

1. The small-icon set (`mockups/together/6-small-icons`, drawn by `dev/mockups/icons.mjs`).
2. The kit and the screen standard.
3. Deeper mockups: the card in each state (plain, moons' list, spine and face) on desktop and phone;
   the activity window; the top right; the trade loop's travel, measured.

Assumed unless Koda says otherwise (his answers to Part 9 so far cover 1, 2, 4, 7 and 8 only):
with nothing selected the card shows your ship; the nearby strip goes; Loadout folds into the ship's
Details; Rename moves into Details; the minimap's new place is still open and gets drawn two ways.

## 15. Progress notes (kept as the work goes, so another session can pick it up)

**State on 2026-11-21:** Koda approved the direction and the icon sheet ("the icons are all great, you
can begin"). Prep comes first; no game code is changed until Koda has seen the prep (section 14).

How to redraw the mockups, from `orbiter-client/`: `node dev/mockups/together.mjs --png` (mockups 1–5
and 7 on) and `node dev/mockups/icons.mjs --png` (mockup 6). The icon paths are in
`dev/mockups/small-icons.mjs`.

| Prep item | State |
|---|---|
| Small-icon set (mockup 6) | Done, approved by Koda as drawn |
| The kit and screen standard (`ui-guide.md` section 11, mockup 7) | Drawn: `mockups/together/7-kit.png`. Waiting for Koda |
| The card in every state, desktop and phone (mockup 8) | Drawn: `mockups/together/8-card-states.png` (ship, planet, moons' list, station, a blocked action, one moon, three phone sheets). Waiting for Koda |
| The activity window in every state; the top right two ways (mockup 9) | Drawn: `mockups/together/9-activity-and-top-right.png`. Koda to choose way A (two pieces) or B (one panel that folds) |
| The trade loop, travel measured (mockup 10) | Drawn: `mockups/together/10-trade-loop.png`. 2,153 px a loop with today's trade menu; 1,758 px (18% less) with its sliders and Make Trade on the side nearest the card. Koda to say whether the trade menu may be laid out that way |

**The card, as now designed (after Koda's "milder take"):**
- A card with a family is a **spine** (a column of tabs: the planet, its station, its moon or Moons)
  and one **face**. The tabs are in the spine in every state, so they never move.
- Plain planet: the planet is the face. Station or a single moon: it becomes the face; same width.
- Several moons: the Moons tab opens a **list** panel beside the face (the only wider state). Picking
  a moon makes it the face and closes the list.
- **One heading** across the top: the planet's name alone, or the planet's and the face's, each in
  its color, meeting.
- **One action row** across the bottom, the face's: the main action as a wide pill with its picture
  and word, the others as 44 px wells, Details always last.
- A ship or a star has no family, so no spine.

Log:
- 2026-11-21: plan, mockups 1–4, Koda's feedback (section 10), review (11), mockup 5, the trade-loop
  measure (12), the narrower card (13), go-ahead (14), icon sheet (mockup 6).
- 2026-11-21: `ui-guide.md` section 11 (kit and standard, proposed). Mockup 8 drawn. Tabs are rounded
  squares and actions are round, so the two can't be confused. Widths: ship 250, planet/station/moon
  312, moons' list 512.
- 2026-11-21: mockups 7 (kit), 9 (activity window: quiet, busy and waiting, needs you, failed, a lot,
  phone, and the list it opens; the top right two ways; a black hole or a pair at the center) and 10
  (trade loop) drawn. **All the prep is drawn. Next: Koda reviews mockups 7 to 10.** After that the
  build starts with the card (Part 7's order), on branch `polkadot`, each step checked at phone size
  and in one long play session.
- Still to carry further, not yet drawn: the walk through each menu against the standard (Help first:
  lead with How Planets Grow, not First Steps, per Koda's note 3); the pilot plate; a ship's Details;
  the profile with more life (avatars are on the to-do list in `demo4-plan.md`); the list (Objects) on
  a phone.
- 2026-11-21: **Koda on mockups 7 to 10: "everything looks good."** Taken as: the kit and standard
  agreed; the trade menu may be laid out with its controls nearest the card; the card as in mockup 8.
  Not answered: the top right, way A or B (asked again; it doesn't block the card). **Building starts:
  step 1, the card** (`orbiter-client/src/components/hud/selection-panel.vue` and what it uses).
- 2026-11-21: **Step 1 built: the card.** `hud/selection-panel.vue` rewritten (a spine of tabs, one
  face, one heading, one action row); new `hud/action-row.vue`, `hud/small-icon.vue`,
  `libs/small-icons.js` (the icon set, now the game's; the mockup scripts read it from there);
  `card-actions.js` gained `ACTION_LOOK` and `cardButtons()`; the card art has a frameless `bare` mode
  (`themed-card.vue`, `card-ui/info.svg.vue`, `card-text.svg.vue`); `nearby-strip.vue` is deleted (the
  belt's places are the spine's tabs); the card is never put away (`ui.toggleScope` only keeps it
  shown); with nothing selected it shows your ship. Screenshots from the running game:
  `mockups/together/built/`. Lint, tests and a build pass.
  - **Not yet play-tested with real moves:** checked by screenshots at desktop and phone size against
    Koda's running dev server, selecting things only. Trade, claim, jump and the number keys from the
    new row still need a real session.
  - **Left for later steps:** Details (so Rename, Loadout and Session are still wells on the card, and
    a body with no actions has an empty row); actions dimmed by an activity in flight ("One in
    flight") wait for the activity window (step 3); `ui.actionsOpen` / `toggleActions` and the `A` key
    are unused now and can go; the belt's spine scrolls with no hint that there's more.
  - **Next: step 2,** the list (Objects) and the top right. Koda still to choose way A or B for the
    top right (mockup 9).
- 2026-11-21: **Koda chose way B for the top right** (mockup 9): one panel, the name leading, the map
  and zoom folding out under it and folding away. Step 2 starts: the list and the top right.
- 2026-11-21: **Step 2 built: the list, and the top right (way B).**
  - `hud/objects/objects-panel.vue` is the list (menu `objects`, key `O`): icon tabs for the kind (all,
    planets, stations, moons, asteroids, ships, yours), the center pinned, the tree with a planet's
    station and moons folded inside it, the belt's places, the ships. Pressing a row selects it and
    leaves the list open; Go on the selected row closes it. Stations are the ports menu's rows
    (`ports-panel.vue`, now with `embedded` and `want`), narrowed by Buying (best first), Yards or Armory.
    The filter is remembered (`ui.listKind`, `ui.listWant`).
  - The planets and ships menus are deleted; `openMenu('planets' | 'ports' | 'ships')` and the `P` key
    open the list on that kind.
  - `hud/system-block.vue` is one panel: the center's button, the name (press: the list, with the
    count), Map with the new hex icon (`map-icon.svg.vue`); the minimap and zoom fold out under it and
    fold away (`ui.mapFolded`, remembered).
  - The system strip has a list button at its end. A phone's tabs are My ship, Objects, Map, Chat,
    More; Star moved under More.
  - Screenshots: `mockups/together/built/list-*.png`, `top-right-folded.png`, `phone-list.png`,
    `phone-tabs.png`. Lint, 247 tests and a build pass. **Not play-tested with real moves.**
  - **Left:** "Yours" lists your bodies and ship here but not yet their goods, drones and builds (the
    industry plan's holdings), and Transfer isn't drawn; arrow keys and typing to filter aren't in;
    the old `jump-icon`, `planets-icon`, `ports-icon` and `ships-icon` components are unused now.
  - **Next: step 3,** Minerva's plate as the activity window, and her Link page (the session moves
    there from the ship's card).
- 2026-11-21: **Play-tested steps 1 and 2 with real moves,** on a private copy (`CHAIN_PORT=8546
  UI_PORT=8092 npm run local`, stopped afterwards; Koda's own copy on 8080 wasn't touched). One page,
  one session: registered a new pilot through the intro; Earth from the strip; its station from the
  spine's tab (heading "Earth | I.S.S.", Trade as the pill, Yards and Armory as wells); key `1` opened
  Trade; sold 3 Helium-3 (credits -45 to 533); Esc back to nothing selected (the card showed the ship,
  Jump as its pill); Mars and its station the same way; `O` opened the list, Stations then Buying
  listed the 8 ports that buy the cargo. No errors in the page. Not covered: claim, jump, siege,
  colony, the gamepad, a phone-size session with moves.
- 2026-11-21: **Koda on the Yards menu (cargo holds and drone bays):**
  - He loves the background color of those menus (the station's menus) "as a default color".
  - He does not like the purple buttons on them: purple clashes with that background.
  - They have little iconography, give no feedback on what you can afford, and have minor issues.
  - Done in answer: every menu's inside is now that color; the Yards menu is rebuilt in HTML to the
    standard (`hud/yards/yards-panel.vue`), its buttons in the menu's own color, with icons, prices,
    what you can afford and what's left after. The first menu of the walk-through (Koda's note 3).
  - **Changes the kit:** on a menu about a thing, the main button takes that thing's color (dark text
    on it, as headings do), not the brand purple. The card's own pill is still purple; ask Koda.
- 2026-11-21: **Koda on the Orbiter 8's upgrades:** they "all look pretty bad... the color is bad, the
  shapes don't cut it... you can re-conceptualize them completely". The art is `sdk/src/ship-art.js`,
  which mirrors `contracts/src/art/ShipArt.sol` character for character (the NFT's picture), so new
  art means a contract change too. New art is drawn as a mockup first:
  `docs/mockups/ship-upgrades/` (script `orbiter-client/dev/mockups/ship-upgrades.mjs`).
  - Drawn: `docs/mockups/ship-upgrades/sheet.png`, each part today and proposed, and four whole ships
    at 300, 92 and 44 px. One family of colors (the white hull, two lavenders, a dark inset); only the
    capacitors, the shield and damage keep a color. It also draws jump range and mining drones, which
    have no picture today. **Waiting for Koda.** If he agrees: port to `sdk/src/ship-art.js` and
    `ShipArt.sol` together, update the pinned hashes in `sdk/src/ship-art.test.js`, check the
    contract's size (`forge build --sizes`), and redeploy on the test chains.
- **Where things stand:** steps 1 (card) and 2 (list, top right) built and play-tested; Yards rebuilt;
  step 3 (Minerva's plate and Link) is next; the other menus still to walk through (Armory, Colony,
  Loadout into the ship's Details, Help).
- 2026-11-21: **Koda on the first upgrade sheet: "not a big fan of any".** His notes:
  - Railguns are "close to good", and can be white.
  - Shields should **wrap the ship**, not make a bubble.
  - The armor "doesn't look good at all".
  - **Cargo holds go inside the ship.** The Orbiter 8 is designed to be built out: "like getting a big
    flatbed truck, you design it... it's a big empty space and the cargo holds get fitted inside... or
    drone bays... or maybe other things later."
  - Longer thrusters could show that the ship jumps further.
  - He likes the battle drones most of all.
  - A ship with every upgrade "should look really cool" but this one looks cluttered: "everything
    should fit together nicely".
  - Round 2 is drawn to these: `docs/mockups/ship-upgrades/sheet.png` (round 1 kept as `round-1.png`).
- 2026-11-21: **Koda on round 2: "mostly improvements".**
  - Keep the old shields' **blue glow**, in the ship's shape: the same shape, larger, behind the ship.
  - He loves the missile racks as little round ports.
  - **Two kinds of thing:** what's outside affects the ship's shape (guns); what's inside you wouldn't
    see on a ship flying around (cargo bays, drones).
  - He doesn't like the range change: it looked like another cone layer added on.
  - Round 3 (`docs/mockups/ship-upgrades/sheet.png`; rounds 1 and 2 kept beside it): two pictures of
    every ship. **As it flies:** railguns, missile ports, point defense, armor, the blue ship-shaped
    shield, and for range the pods themselves longer. **Opened up** (for a yard or the ship's Details):
    the bay with cargo holds and drone bays (darts for battle drones, rings for mining drones), repair
    bots, and the capacitor bank in the pods, a cell a step of range. Waiting for Koda.
  - Open: whether the NFT's picture is the outside or the opened-up one; whether battle drones show as
    an escort while fighting.
- 2026-11-21: **Koda on round 3: "getting better".**
  - The opened-up view's bay can use more of the space, since nothing else is drawn with it.
  - He likes the yellow for engine power.
  - The shield should fade in and out, or fade between two colors, all the time.
  - The NFT's picture is the outside view, for now.
  - Battle drones are not escorts for now; the idea is on the list in `demo4-plan.md` to consider later.
  - Round 4 drawn to these (`sheet.svg` moves: open it in a browser to see the shield; the PNG is still).

