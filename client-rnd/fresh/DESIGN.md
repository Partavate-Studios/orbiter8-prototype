# Orbiter 8 — a clean-room client: the design

Working name: **Chart Room**. Designed from GAME.md (the rules and the SDK), without sight of the
existing client. Mockups: `mockups/`. Screens as built: `shots/`.

## Who plays, and where

- **A phone in the Polkadot App**, portrait, one thumb, in short check-ins ("is my Citadel done?", "is
  the claim through?") and longer trading runs of dozens of quick moves. The Product runs in a
  sandboxed web view that reaches only its own origin; performance is unproven there.
- **Polkadot Desktop / the web host**, wide window, mouse and keyboard, perhaps a gamepad: the same
  bundle, with room to keep the map and the working panel side by side.
- Players arrive expecting an app, not a dapp: no wallet ceremony, no jargon, nothing that looks like
  a block explorer.

## The experience I'm aiming for

**A navigator at a chart table, filing moves with Minerva.** Calm, legible, a little austere; the
excitement comes from the map filling in and numbers going up, not from chrome. Three convictions,
each taken from a rule of the game:

1. **The star is the place.** Nothing in the rules cares where in a system the ship is, so the
   client never makes the player "go to" a planet or "dock" at a station. Arriving at a star puts
   everything there within reach at once. The market is one board for the whole star, not nine
   shops. (GAME.md, "the one rule".)
2. **Thinking is free, committing costs.** Every action is a transaction. So the client does the
   arithmetic first, with the SDK's own rule functions (best trade routes, a multi-jump course, what
   a building still lacks, what a load will fetch after slippage), and the player commits a *decided*
   move. Anything that writes to the chain is an **amber, chamfered "commit" button** stating what it
   does and what it costs; nothing else in the interface is amber-filled. You can always tell
   looking from spending.
3. **The game is mostly waiting, so waiting is a first-class screen.** Scans, buildings, factory
   orders, siege rounds, claims, repairs and the session key are one **Agenda**, sorted by when they
   come due, wherever in the galaxy they are. Opening the app answers "what's ready?" before
   anything else. And since buildings, factory orders and defenses can be ordered *from anywhere*,
   the Agenda and the Domain list are where you act on them, not just watch.

## Waiting on the chain: "filings"

Minerva is the story's ledger; a transaction is a **filing** with her. Each commit becomes a filing
with a visible life: *signing* (wallet) → *sent* → *stamped* (mined) or *refused* (with the
contracts' reason in plain words, from the SDK's revert parser). The latest filing shows as a
one-line ticker under the top bar (clear of the thumb and of the sheet); the full list is in the Minerva drawer. Nothing blocks: while a
filing is in flight only its own button is busy, and the player can keep reading the board. Refusals
stay on the ticker until dismissed, and price-moved refusals re-quote in place.

- **Jumps** animate on the chart the moment they're sent (the ship slides along its leg), and the
  system swaps in when stamped.
- **Scans** are a sweep around the new star with a countdown to its drand round; when the round is
  out the client files it by itself if no wallet prompt would appear (session key or dev wallet),
  otherwise it offers one "File scan" chip. Either way the SDK attaches pending proofs to the next
  move.
- **Autopilot** is what the client calls the session key: "approve once, move freely for 4 hours".
  It's offered right after registration and lives on the Ship tab. Inside the Polkadot App its
  AutoSigning allowance replaces it and this row disappears (D64).

## Information architecture

```
Top bar      call sign · star you're at · credits · bays · [Minerva]
Stage        one canvas: the System you're in  ⇄  the Galaxy chart   (pinch / wheel through)
Dock         System · Galaxy · Market · Ship · Domain        (bottom on phones, left rail on desktop)
Sheet        the working panel for the tab or the selection   (bottom sheet / right panel)
Ticker       the latest filing, under the top bar
Minerva      drawer: Agenda · Filings · Comms · Sieges · Ranks
```

- **System** — where you are. An orrery of the star and its worlds (alive, slow), and under it a
  **world rail**: one chip per planet with what matters at a glance (port, yard, armory, owner mark,
  siege). Tap a world (on the orrery or the rail) for its sheet. The star itself has a sheet too
  (naming, scan, black-hole traverse).
- **Galaxy** — the hex chart: charted stars by spectral colour, uncharted-but-known stars as open
  rings ("be first"), the void left blank, your reach shaded, black-hole pairs linked, your planets
  pinned. Tap a star for its survey (derived planets, discoverer, owner) and a **course**: the
  client plots the jumps (breadth-first over known stars at your range) and the commit button is
  always the next leg.
- **Market** — the star-wide board. *Routes* lists the profitable buy→sell pairs available right
  here, sized to your free bays, credits, stock and slippage, best first; one tap runs a route (two
  filings: buy, then sell). *Cargo* offers the best port for what's aboard. *Ports* is the manual
  desk: pick a port, set quantities per good with a live quote, commit one ticket.
- **Ship** — the Orbiter 8 as its NFT draws it, bays as a segmented bar (cargo / people / parts /
  damaged / free), range, loadout and battle condition; the yard and armory desks when one is at
  this star (bays, range, parts, repairs); colonists at Sol; names; Autopilot.
- **Domain** — everything you own, anywhere: each planet with its level, people, what it's building
  and its **project** (the next building as a checklist; every unmet line says what would satisfy
  it), factory queue, defenses, siege state; plus the Agenda and a short **Orders** ladder for new
  pilots (first trade → more bays → range 2 → chart a star → claim → Citadel …) derived from state.
- **Planet sheet** (from System or Domain) adapts to whose planet it is:
  - *unclaimed*: what it is (class, size, cap, what it would produce), Claim.
  - *Federation*: its port's board, yard/armory shortcuts, Recruit at Earth.
  - *yours*: Project · People (land / board) · Storage (deliver / collect) · Autofactory (order,
    queue, store) · Defenses (fit planet / moons / ship, unload) · Names.
  - *another pilot's*: owner, level, scouted defenses, its port and armory; Lay siege / Join defense.
  - *under siege*: the siege panel on top — both sides as layered bars in the order hits land, the
    next round's countdown, and the one action that applies (advance, file claim, complete, withdraw).

## Flows

- **First launch → pilot.** Title over the live Sol system. The wallet connects silently when it can
  (dev wallet, authorised wallet, the App's account). Two fields on one card, call sign and ship
  name, validated against the contracts' naming rule and the taken call signs as you type; one
  commit ("Register with Minerva"). A reload mid-registration resumes the wait. Arrival: Orders says
  "Make your first trade", and the Market tab has a dot on it.
- **Exploring.** Galaxy → tap a star → survey + course → Jump. On a first arrival: "Discovered by
  you", the scan sweep, then the six neighbours resolve on the chart; new stars pulse once. The
  10-minute first-claim window shows on the Agenda.
- **Trading.** Market → Routes → Run. Or Ports → a ticket. Prices and stock re-read with each block
  that touched the game.
- **Building up a planet.** Claim → the Project checklist drives it: "100 people — recruit at Earth",
  "40 equipment in storage — 12 aboard: Deliver 12". When every line is met the commit is "Build
  Citadel · 5,000 c · 10 min"; then it's an Agenda timer. Later lines work from anywhere.
- **Battle.** Arm at the I.S.S. (Ship → Armory). At a claimed planet: scout its defenses → Lay siege.
  The siege panel then carries it: rounds tick on the Agenda; "worn down" unlocks File claim; 24 h
  later Complete claim. Defenders see the same panel from Domain, with Fit defenses beside it.

## Layout

- **Phone (390×844).** Top bar 44 px. Stage fills the rest. Dock 58 px at the bottom (thumb zone).
  Sheets rise from the dock: a slim strip (the world rail, or the stars in reach), 60% of the height
  (the stage stays visible and re-centres on its free area), or full; tapping the handle steps between them. Every commit
  button sits at the bottom of its sheet, full width, ≥48 px tall.
- **Desktop (≥900 px).** Dock becomes a left rail; the sheet becomes a 400 px right panel that's
  always present; the stage takes the middle. Same components, no separate code path beyond CSS.

## Interaction

- **Touch:** tap to select, drag to pan, pinch to zoom; pinching out of the system falls through to
  the galaxy, pinching into your star dives back. The sheet's handle steps its height.
- **Mouse:** click, drag, wheel (same fall-through). Hover shows a name tag.
- **Keyboard:** `1–5` tabs, `M` Minerva, arrows pan, `+ −` zoom, `[ ]` previous/next world or star,
  `Enter` the sheet's commit, `Esc` back.
- **Gamepad:** LB/RB tabs, d-pad or left stick steps through worlds/stars, right stick pans,
  triggers zoom, A commits, B back, Y Minerva.

## Visual language

- **Night chart.** Ink-blue ground (`#060d14`), hairline rules, no boxes where a line will do: a
  chart you could read in a dark cabin. Space is the content; panels are translucent slate over it.
- **Colour means one thing each.** Cyan = selection and things you can look at. **Amber = yours, and
  anything that writes to the chain.** Green = gain / ready. Red = siege, damage, refusal. Violet =
  the unknown (uncharted, black holes). Stars keep their spectral colours; planet classes a small
  fixed palette.
- **Hexes and chamfers.** The galaxy is a hex grid, so the interface's own shapes are cut from it:
  commit buttons and tags have chamfered corners; the dock's active mark is a hex.
- **Type.** System sans for words; tabular monospace for every number (prices and timers align and
  don't jitter as they tick); small spaced capitals for labels. No web fonts: nothing to fetch in the
  sandbox, nothing to weigh down a phone.
- **Motion** only where it carries information: orbits (it's alive), the jump (I'm moving), the scan
  sweep and countdown rings (it's coming), a filing's shimmer (it's in flight). All of it stops under
  `prefers-reduced-motion`.
- **Sound** (optional, off until toggled): four synthesized cues — sent, stamped, refused, scan —
  from WebAudio, no assets.

## Technology

- **Preact** for the panels (3 kB, JSX, no compiler plugin beyond the bundler's own) and **Canvas 2D**
  for the stage: one canvas, one draw loop, no per-object DOM, which is what a phone web view wants
  from a scene with moving parts. `ethers` 6 only through the SDK. Vite, Vitest, ESLint for tooling.
  No state library: the SDK's `game.subscribe` drives one small store.
- The SDK is aliased, not copied.

## What the client adds beside the SDK

- `logic/routes.js` — the best buy→sell routes at one star (uses `sdk/market` pricing).
- `logic/course.js` — a jump course over known stars at a given range.
- `logic/agenda.js` — every timer the pilot has, as one sorted list.
- `logic/orders.js` — the new pilot's next step, from state.
- `store.js` holdings — the pilot's planets at other stars (views, defenses, factories, sieges), the
  defenses of other pilots' planets at this star, and other pilots' Armory stores (what they can
  sell), read with the SDK's `createGame` on the session's provider (the game client only loads these
  for the current system / own planets).
- `dev/wallet.js` — the dev wallet (EIP-1193 over the local chain's unlocked accounts, announced by
  EIP-6963 under the rdns the SDK prefers).

## As built: what differs from the plan above

- The sheet's handle is tapped, not dragged (three heights).
- "Advance the siege" turned out to be bookkeeping: the contracts' preview already plays the rounds
  due, and filing a claim, completing one (up to 64 rounds) or withdrawing advances the siege itself. It stays as a small secondary
  button ("Record the rounds so far").
- Timers run on the **chain's clock** (the latest block's timestamp), not the device's: they can sit
  apart (Polkadot Hub steps its timestamps; a test chain can be warped). Scans alone run on real time,
  because drand does.
- Price-moved refusals show the reason on the ticker; the quote on screen is already fresh (prices
  re-read with every block that touched the game), so the player taps again rather than the client retrying.
- Siege rounds are counted on from the last checkpoint (the views play the rounds due, so a stored
  checkpoint is often rounds behind), and the client re-reads the siege the moment a round falls or a
  claim's wait runs out. Completing a claim plays at most 64 rounds and is refused if more are due, so
  when a claim has sat over a day and a half the Complete button records the rounds first.
- Allies of a defense are read from the public siege feed: it shows who is defending, and hides "Join
  the defense" once you have (the contracts would accept the same pilot twice).
- The armory desk checks the contracts' limits before filing: free mounts (6), armor ≤ 5, shields ≤ 3,
  free bays, and at a pilot's Armory what its store holds.
- The galaxy chart follows the ship when it leaves the visible part of the chart (a black hole's far
  side is 8–24 cells away), and at a black hole the "In reach" list offers the way back through it.
- One scan filing at a time: the SDK can announce a due scan again while the first filing is in
  flight.
- On a phone the slim sheet is the world rail alone; the system summary shows once it's raised.
- Not built: hover name tags beyond the pointer cursor, a "new star" pulse after a scan, remembered
  prices at other stars, drag on the sheet, allied ships' strength in the siege panel (the contracts
  expose only the planet's side and the attacker's ship).
