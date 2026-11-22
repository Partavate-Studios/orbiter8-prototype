# Brief: a mockup of the intro, in the apartment

**For:** a Claude session (Fable) working in this repo, `/home/koda/dev/orbiter8-prototype`, branch
`polkadot`. Written 2026-11-19 from Koda's direction. This file is everything you need: read it, then the
files it points to.

**This is a mockup, not the build.** Koda's standing rule: before a screen is built or restyled, he
approves a mockup. Design the intro and show it; don't wire it into the game. Where something below is
undecided, make a call, mark it, and move on.

## What the intro is

A short, playable scene that replaces "launch your ship". A new player starts as a nobody in a tiny
apartment on a bleak Earth in 2140, explores it, and leaves by taking the one job that's left: pilot,
uploaded into Minerva, one way. Then they wake in their ship orbiting Earth. The contrast is the point:
Earth is the dystopia, the frontier is the hope ("Liberta Galactica!" means escape).

Read first: [`docs/backstory.md`](../../backstory.md): "The story" (especially **Earth**, **Minerva** and
**The pilots**), and in "The world": **Society** (non-citizens, the three corporations, choosing a
corporation), **Minerva** (her voice and library), and **The player → Joining the game**, which lists the
intro's steps as decided. The original notes are in [`docs/story-sources/`](../../story-sources/)
(`STORY_UPDATE_INTRO.md`, `PROJECTS_INTRO.md`, `STORY_ANSWERS.md`); where they differ from `backstory.md`,
**`backstory.md` wins** (it has Koda's latest changes, including the two transactions below).

## The flow, as decided (Koda, 2026-11-18/19)

1. **You're in your new apartment**: a tiny corporate affordable housing unit in a dense city, after
   curfew. You're a non-citizen on a thin stipend: −45 credits, a very low health score, an inbox of junk,
   overdue bills and job rejections.
2. **The ID-card scanner** by the door turns the unit on. Scanning your card prompts for **your name**:
   your name in the game, and **the first transaction** (the wallet signs; registration with Minerva).
3. **The housing computer's first boot:** subscribe to one of three corporations (**Corp X, Corp Y,
   Corp Z** for now). A note says you can change it any time, and switching should be easy: parts of
   Minerva's interface change with it (its look, its voice, maybe its news).
4. **Explore**, in any order:
   - **The TV:** ads cycle, with clues to the three corporations' characters.
   - **The balcony:** the ad-saturated city. **Vape:** each hit costs a health point, and Minerva posts a
     notice to the terminal.
   - **The door:** after curfew; the warning is in your subscribed corporation's voice.
   - **Minerva terminals** (several, one on the balcony), all opening the same console: **Account**
     (−45), **Health** (very low), **Mail** (junk, bills, rejections), **Jobs**.
5. **The job board** (your subscription's): one eligible opening, the pilot program. The job screen says
   plainly what happens: your body is frozen, your consciousness goes into a machine, you'll have a call
   sign there, the industry is space shipping. It sells it as a new life.
6. **Accepting the job is the only way out** (other than back to the title). Before pickup you're asked to
   **name your ship: the second transaction**, which mints the ship and enrolls you in the corporation
   you're subscribed to. "An escort will arrive shortly to take you to processing."
7. **Processing is left unsaid.** When the transaction goes through, you **wake in your ship, orbiting
   Earth**.
8. **Minerva's first message:** what's expected of you.

Waiting on a transaction is a real wait (a few seconds on the chain): design something to watch, in the
fiction (the scanner reading your card; the pickup on its way). The two prompts (name, ship name) should
feel like part of the room, not like web forms.

## The three corporations (structure decided; names and details not)

| | Corporation | Character | Citizenship feels like |
|---|---|---|---|
| Corp X | A Western-style shareholder corporation (old Earth) | Contracts, lawyers, individual rights, quarterly profits; competitive, rules-driven | "Your rights are protected by contract." Free, but on your own. |
| Corp Y | A family-run conglomerate (old Earth; loosely keiretsu or chaebol) | Plans for generations; lifelong loyalty; the group over the individual | "You're taken care of, as long as you belong." |
| Corp Z | A space-born upstart (the colonies) | New money: hip, fast, on the edge of technology, sometimes unrealistic | To define |

Which letter is which is your call for the mockup; say so. Their ads, curfew warnings, console skins and
job listings should differ in **business model**, not cultural caricature.

## What to show

Static mockups, as SVG, of the key moments, at **desktop (about 1440 × 900) and phone (390 × 844)**:

1. The apartment, with what's interactive marked (TV, door and scanner, terminals, balcony door).
2. The ID scanner and the name prompt (the first transaction), and its waiting state.
3. The housing computer's first boot: choosing a corporation (and how switching looks).
4. The TV with an ad (one per corporation is ideal).
5. The balcony: the city, the vape, a health notice.
6. The Minerva console over the room (near-full-screen until closed): Account, Health, Mail, Jobs; and
   one corporation skin against another.
7. The job screen, then the ship-name prompt (the second transaction) and the "escort will arrive"
   waiting state.
8. Waking in orbit: the game as it starts, with Minerva's first message.

Plus a short write-up (`README.md` beside them): the layout and its layers, how the player moves around,
how each interaction works with **mouse, touch and gamepad** (every interactive thing reachable by focus,
with a visible focus ring), how the waits look, and the calls you made.

Save everything under **`docs/mockups/intro/`**. Commit, never push. No game code changes.

## Structure Koda has in mind (from `PROJECTS_INTRO.md`)

Layered planes that scale and shift (parallax): the **cityscape** at the back (dark sky, black buildings
in two layers, billboards); the **balcony** (railing, a terminal); the **apartment** in front (tiny,
cluttered, lived-in: TV, door, terminals, personal details that tell who lives here); the player's **hand
silhouette** pressing buttons and pointing, so it feels like you; and **Minerva's overlay** when a
terminal opens. Moving between the room and the balcony shifts and scales the layers.

It should be short and skippable for returning players, and replayable later (from the title, or
Minerva's library).

## Minerva

Her face is a separate project ([`minerva-face.md`](minerva-face.md)): show a stand-in where it goes (the
owl emblem, `orbiter-client/src/components/assets/minerva-emblem.svg.vue`). Her voice is **blunt and dry**:
literal, direct, deadpan; an occasional pointed observation (the vape notice is a good place). No
sugarcoating, no clutter of decimals.

## The game's look and rules

Read `docs/ui-guide.md` and `docs/color-guide.md`. In short:

- **The style:** flat SVG silhouettes, bold and clean, like the ship and station sprites
  (`orbiter-client/src/components/star-map/sprites/ship.svg.vue`, `station.svg.vue`) and the art in
  `orbiter-client/src/assets/art/`. New art is standalone SVG (120-unit square where it's an object).
- **Color:** the interface stays a quiet purple (`orbiter-client/src/libs/palette.js`: `SURFACE_*`,
  `BRAND_*`). The city is dark, and **the ads are the loud color**: an intentional "loud world" moment.
  **Pink means it needs your attention** (overdue bills, health warnings): never decorative. **Yellow
  means you and what's good for you**: let it first appear on the job offer and the new ship.
- **Phones matter**, and so do gamepads and handhelds: big targets, focus rings.
- **The menus are big and the buttons are the game** (`docs/ui-guide.md` §1); keep that spirit in the
  console.
- Today's onboarding, which this replaces, is in `orbiter-client/src/components/title/` (the wizard,
  `wizard-register.vue`, the pilot card and launch pad): look at it for what exists, not as a constraint.
  The pilot license on the card is issued by "Minerva Galactic Network, Pilot Registry".

## Copy

The words aren't written yet: the ads, bills, mail, rejections, job listings and the fake companies
behind them are on Koda's to-do list. Use short placeholder copy in the right voice, marked
**[draft]**, enough to judge the layout. Don't invent company names beyond what a frame needs; mark them
as drafts.

## Done when

The eight moments are mocked at desktop and phone size in `docs/mockups/intro/`, with the write-up, and
Koda can look at them to say what to keep and what to change. Report what you made and the calls you'd
like him to review.
