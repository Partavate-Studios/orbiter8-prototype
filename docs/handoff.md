# Handoff: where Orbiter 8 stands (updated 2026-11-22)

For a Claude Code session picking up the work. First written 2026-11-07 for the session that reviewed
the release; brought up to date 2026-11-22.

> **Since 2026-11-08 the direction is Polkadot.** Orbiter 8 is going Polkadot-only, as a Polkadot App
> mini-app, launching alongside the App. Read [`polkadot-direction.md`](polkadot-direction.md). Work on
> branch `polkadot`; the EVM version as it stood on 2026-11-08 is kept on `evm-archive`.

## Before anything else: read these, in order

1. `CLAUDE.md`: Koda's standing rules and the commands.
2. This file, to the end: how you'll work, where things stand, and what to focus on.
3. [`polkadot-direction.md`](polkadot-direction.md): the direction (D62–D66, D101–D110), the spike's
   results, and what's still open before the game becomes a Product.
4. [`demo4-plan.md`](demo4-plan.md): the goals, decisions D1–D110 (Koda's), the plan, the milestones and
   what's ticked, the "Consider next" to-do list, and calls B1–B56 (guesses made while building;
   struck-through ones were overruled).
5. [`review.md`](review.md): every call made while working without Koda, and at its end what still
   waits on him ("For Koda to decide"). Add to it as you work.
6. [`ui-guide.md`](ui-guide.md) and [`color-guide.md`](color-guide.md), before any UI work: how screens
   are built and colored, and why. Section 10 is Koda's UI direction (2026-11-21); section 11 is the kit
   and the screen standard every menu now follows (`hud/kit.css`).
7. [`ui-plan.md`](ui-plan.md): the UI plan built from that direction (one system, one card, one
   network, one you), Koda's feedback on its mockups, and the build log (section 15), which says
   what's built and what's left.
8. [`design.md`](design.md) and [`design-ideas.md`](design-ideas.md): Koda's design intent, and ideas
   for later.
9. [`backstory.md`](backstory.md): the story and its world (Minerva, the corporations, pilots as minds,
   the pirates, joining the game), with how settled each idea is. The only story file. It's Koda's:
   change it only when he asks.
10. [`demo4-tuning.md`](demo4-tuning.md): the economy and battle numbers.
11. [`cost-estimates.md`](cost-estimates.md), from "Demo 4, measured locally" on: gas and money per
    move, locally and on Polkadot Hub TestNet.
12. `readme.md`, `sdk/README.md`, `contracts/README.md` and `orbiter-client/dev/harness/README.md`:
    setup and tools.

Read when the work touches them:
- [`expansion-plan.md`](expansion-plan.md): asteroid belts, drones, ship bays, a fully built Sol and
  the contract refactor (D67–D100; built 2026-11-16, with its progress log).
- [`industry-plan.md`](industry-plan.md): autofactories of three sizes, drones that build, cargo ships
  within a system (Koda's direction of 2026-11-21; design only, with open questions for Koda).
- [`hud-redesign.md`](hud-redesign.md): the HUD's analysis and redesign (2026-11-14/15), imported into
  the client 2026-11-16.
- [`voice-lines.md`](voice-lines.md): Minerva's recorded lines, the ones still to record, and
  `orbiter-client/speech/` for the Piper text.
- [`tech-trees/`](tech-trees/README.md): the tech trees (Markdown is the source; pictures redrawn from it).
- [`story-questions.md`](story-questions.md) and [`story-sources/`](story-sources/): the story
  questions Koda answered (2026-11-19) and the sources folded into `backstory.md`.
- [`research/polkadot-hub-2026-11.md`](research/polkadot-hub-2026-11.md): the research behind the
  network choice (2026-11-06); a snapshot, with a note at the top on what has been answered since.
- [`mockups/`](mockups/): every mockup, by subject (`intro/`, `intro-zoom/`, `together/` for the UI
  plan, `ship-upgrades/`, `stages/`, `deeds/`, `card/`, `ports/`…), each linked from the review or plan
  that asked for it. `review/` holds the review's screenshots; `baseline/` and `after/` the
  modernization's before and after (they predate today's screens).
- `briefs/`: briefs written for another session (Fable) to build from. Built ones move to
  [`archive/briefs/`](archive/README.md), with the calls made building them in `review.md`.
- [`archive/`](archive/README.md): finished and historical documents (the built briefs, the original
  design notes and pitch, the old client's code review, the Enterprise Circuit walkthrough).
- For history only: `UPGRADE_NOTES.md` (the client's modernization, written against the old contracts).

Then read the code you'll touch before changing it (the map under "Where the code is" below), and
`git log` for why things are the way they are: every commit message says what and why.

## How you'll work: on your own

Koda wants you to work without asking him questions. Where you'd ask, decide and log it instead:

- **Keep the review log, `docs/review.md`.** Write it for Koda to read later: what you found, what you
  changed and why, and every judgment call you made in his place, in a numbered section of its own.
  Add what you chose not to do without him to the "For Koda to decide" list at the end, under the
  right heading. When he answers something, mark it answered where it was asked, and take it off
  the list.
- **Things `CLAUDE.md` says to ask Koda first:** don't do them. Log them instead. That covers dropping a
  feature, replacing a library, changing networks, mainnet deploys, and visible changes beyond "faster
  and sharper" to his art. (Testnet deploys with the throwaway spike key are fine: `CLAUDE.md`.)
- **Restyling his existing art** (the cards, his menus, the title screen, the sprites) needs his
  mockup approval. Make the mockup instead: an SVG or a screenshot of a scratch build, saved under
  `docs/mockups/` and linked from the log. Leave the game's art as it is, and carry on with other work.
- **Findings from playing:** write them in the log first, as a list. Then act on the ones that are
  clearly bugs or clearly within his style. Leave the taste calls listed for Koda.
- **Bring what you know about good game UI and UX:** the established body of work on game interfaces,
  from heuristics for playability to how strategy and trading games handle dense information,
  onboarding, feedback and readability. Name the principle behind a finding in the log, so Koda can
  weigh it. Weigh it against Orbiter 8's own identity: a menu-driven game ("the buttons are the
  game"), with NFT playing cards, big menus, Koda's art, and phones. Don't trade any of that for
  convention.
- Commit as you go, in small commits with messages that say what and why. Run `npm test`, `npm run
  lint` and the contract tests before each commit. Don't push.
- Keep going through the work until it's done; don't stop to check in.

## Where things stand (2026-11-22)

Branch `polkadot`. The contracts in `contracts/` are upgradeable modules (Galaxy, Pilots, Market,
Planets, Claims, Repairs, Drones, Factory, Battle, Armory, Deeds and DeedArt, Ships, Credits). The SDK
in `sdk/` reads the game, keeps its state and holds every move; the Vue client in `orbiter-client/`
draws from it.

**Built and working:**
- **The galaxy, trade, planets, battle** (milestones 0–5 in `demo4-plan.md`): the hex galaxy with drand
  scans, eight goods, the planets' building line and the Autofactory, sieges, moons as weapons
  platforms, black holes, session keys.
- **The expansion** (2026-11-16, `expansion-plan.md`): asteroid belts, drone pools, cargo and drone
  bays, the four built-in drones, ships mining a belt's empty sections, players' ports supplied by
  production, a fully built Sol (15 Federation stations, the belt's included).
- **Joining in two moves** (2026-11-19): register the call sign, then accept a job with a corporation
  (Corp X, Y or Z) and name the ship; a new pilot starts in debt (−45¢) with a hold of goods.
- **The intro** replaced the sign-up wizard (2026-11-19), rebuilt as a zoomable isometric diorama
  (2026-11-20): the apartment, Minerva's console (her animated face, mail, jobs, the corporation's
  database, music), the ID scanner, the balcony, body storage, waking in orbit. The old wizard and the
  Story scene are in `components/archive/`.
- **Minerva's face** (2026-11-19): `components/minerva/`, with a lab at `#/minerva-lab`.
- **Music** (2026-11-20): the apartment's radio, and a track for a newly found star.
- **NFTs draw themselves on chain** (D107): ships and deeds (`ShipArt`, `DeedArt`). The Orbiter 8's
  upgrades were redrawn 2026-11-22, in the game and in `ShipArt`.
- **The UI brought together** (2026-11-21/22, `ui-plan.md`): the selection card with a spine of tabs
  and one action row; one list for the system (Objects); the top right as one panel; Minerva's plate
  at the top as the activity window (what's under way, what's waiting, what needs you) and her menu
  for your link to the network and the session. **Every menu is HTML now**, on `hud/kit.css` and the
  screen standard (`ui-guide.md` section 11): Yards, Armory, Colony, Asteroid Works, your ship (was
  Loadout), Siege, Help, Chat, Sieges, Ranks, Settings, Trade (controls nearest the card on wide
  screens). Ships in the world show what's fitted outside.
- **Polkadot Hub TestNet:** redeployed 2026-11-19 with everything up to then (tagged
  `testnet-2026-11-19`, a local tag for Koda to push). Addresses are in `sdk/src/chain/networks.js`.
  The web build is published from this repo's GitHub Pages (D106). The dev client plays the testnet
  with `?network=testnet`. Reads are shaped for the testnet's per-read budget (`polkadot-direction.md`).
- **The spike** (milestone 7): the contracts run on Polkadot Hub as EVM bytecode and as PolkaVM;
  Polkadot Desktop runs the game; AutoSigning, personhood and the App's NFTs were researched and
  prototyped. Koda decided the follow-ups (D101–D110).

**Not on the testnet yet:** everything since 2026-11-19 that touches the contracts, among them the new
ship art in `ShipArt`. A redeploy (or an upgrade in place) brings it.

## What to focus on

In rough order; check `review.md`'s "For Koda to decide" and `ui-plan.md` section 15 for anything newer.

1. **Play the rebuilt UI with real moves.** The menus were rebuilt quickly and mostly checked by
   screenshots. Not yet exercised with a real move (`ui-plan.md` section 15): fitting a part at an
   armory that has stock, landing and boarding people, building, placing an order that goes through,
   installing finished parts, a siege (the Siege screen hasn't been seen at all), jumping, the
   gamepad. Play like a player: one long session, desktop and phone size.
2. **What's left of the UI plan** (`ui-plan.md` section 15, "Open"): the "Mine" holdings and Transfer
   in the list, the Details screens for planets, stations, moons and stars (mockup 3), and the phone
   layouts of Colony, Asteroid Works, Siege and your ship. Check the extra read of other pilots'
   armories' stock against the testnet's read budget (`dev/harness/read-costs.mjs`).
3. **The next testnet deploy**, when Koda wants it: the new ship art, and the contract fixes waiting in
   `review.md` (reassigning the built-in drones doesn't stop mining). Then play the intro through in
   the browser on the testnet (not yet done).
4. **The Polkadot App** (`polkadot-direction.md`, "Still open"): the phone session with Koda (the App,
   the Pocket, the signing prompt), the product id `orbiter8game`, and the migration plan.
5. **Industry** (`industry-plan.md`): waits on Koda's answers to its open questions before any build.
6. **"Consider next"** in `demo4-plan.md`: the to-do list Koda keeps (binary stars "soon", battle you
   can watch, the clean-room client's ideas, star density, the scan's randomness, and more).

## How to see it

From `orbiter-client/`, on your own ports so you don't collide with Koda's copy:

```bash
source ~/.nvm/nvm.sh && nvm use 24
CHAIN_PORT=8546 UI_PORT=8092 npm run local     # run in the background
```

Drive and screenshot it with the harness (headless Chrome). A new pilot plays the intro; the same steps
are in `dev/harness/capture.sh`, which also has the `B` helper (press a button by its text):

```bash
B() { echo "eval:[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith('$1'))?.click()"; }
INJECT=0 node dev/harness/explore.mjs "http://localhost:8092/?account=1" /tmp/shots \
  wait:5000 click:Begin wait:6500 "click:ID scanner" wait:1200 'type:#intro-name=Ada' \
  "$(B Register)" wait:9000 "click:Terminal" wait:1200 "$(B Subscribe)" wait:800 "$(B Jobs)" wait:500 \
  "$(B Pilot)" wait:600 "$(B Accept)" wait:800 'type:#intro-ship=Lantern' "$(B Sign)" wait:14000 \
  "$(B Understood)" wait:9000 shot:sol
```

- Read the PNGs it writes to see the UI. Add `VW=390 VH=844` for a phone, `TOUCH=1` for touch.
- The page's console is saved to `console.log` in the out dir.
- In `eval:` steps, `window.__o8game` is the game client (its `state` holds the pilot, cells, scans)
  and the Pinia stores are at
  `document.querySelector('#game').__vue_app__.config.globalProperties.$pinia._s.get('UI' | 'StarMap' | 'Player' | 'GameState' | 'Chain')`.
  With that as `$P` in the shell (`P="document.querySelector('#game').__vue_app__.config.globalProperties.\$pinia._s"`),
  `"eval:$P.get('UI').selectSprite('station:2')"` selects the I.S.S.
  - `ship:1`: your ship. `planet:65536`: the first planet of star 1. Body ids are
    `cell << 16 | kind << 8 | index` (`BodyId.sol`, `sdk/src/body-id.js`).
- Test credits: Settings' cheat button in dev builds (+10,000,000¢, `dev/cheat.js`), or grant the
  deployer the Credits contract's `GAME_MODULE` role and mint with `cast send --unlocked`. The addresses
  are in `dev/local-deployment-8546.json`.
- A fully built system to look at: `dev/harness/build-out.mjs` (test chain only).
- Skip chain time: `cast rpc evm_increaseTime 3600 --rpc-url http://127.0.0.1:8546`, then `cast rpc evm_mine`.
- Headless frames are coarse: to inspect an animation, set its start time back and screenshot single frames.

## Where the code is

- `sdk/src/client.js` (the SDK, its own package at the repo root since 2026-11-14; `sdk/README.md`):
  the game client. It loads the pilot, the system, the map regions and events, schedules scans, and
  holds every action. `sdk/src/contracts.js` wraps the contracts; `chain/` has the networks, wallet, RPC
  and gas; `game/` the rules (docking, mining, trade, orbits). `system-gen.js`, `belt-gen.js`, `hex.js`,
  `market.js` and `ship-art.js` mirror Solidity, with cross-check tests.
- `orbiter-client/src/stores/`: `player.js` (sessions, planets, battle), `gamestate.js`, `starmap.js`,
  `ui.js` (menus, camera, jump animation), `transactions.js`, `game-bindings.js` (client → stores).
- `orbiter-client/src/components/`:
  - `intro/`: the intro (with `libs/intro*.js`); `minerva/`: her face; `title/`: the title screen;
    `archive/`: the old wizard and Story scene, out of the build.
  - `hud/`: the HUD: the selection card (`selection-panel.vue`, `action-row.vue`, `card-actions.js`),
    Minerva's plate, the pilot plate, the system strip and block, and every menu as HTML (`panels/`,
    `trade/`, `yards/`, `armory/`, `objects/`, `ports/`, `profile/`), on `kit.css`.
  - `star-map/`: `map.vue` (the system view's layers), `galaxy-map.vue` (the hex map), the belt,
    `black-hole-entry.vue`, `tech-tree.vue`, the sprites.
- `orbiter-client/src/libs/`: `palette.js` (the accent colors and the map's palette), `08audio.js`
  (music, the radio, Minerva's voice), `activities.js` (Minerva's activity window), `small-icons.js`.

## Worth a reviewer's eye

- **The rebuilt menus and card**, at phone size especially (see "What to focus on").
- **The crossed-blades siege icon** is new and not Koda's art (2026-11-07; not rechecked since).
- **Black hole entry:** the part of the ship already inside the hole showed grey before it disappeared
  (2026-11-07; not rechecked since).
- Gamepad and audio weren't tried in the last passes.
- `docs/baseline/` and `docs/after/` screenshots predate these screens.

## History: the first review (2026-11-07)

The session this file was first written for reviewed the release in six focus areas: a first-time
player's eyes, leftovers of the old contracts, consistency across menus, player-facing wording, touch
and phones, and a code review of `sdk/src/client.js` and `stores/player.js`. Its findings and fixes are
`review.md` sections 1–6, and Koda's answers follow them. The leftovers hunt is worth repeating when
something odd turns up: `> 0` or truthiness checks on ids, cells, planets (Mercury is planet 0) or
orbits; fixed goods and old field names (`holds` vs bays, `inventory`, `prices`); avatar or Orbiter8
wording; code paths that can no longer happen.

Changed after that review, by the session that built the release:
- **First steps** became a menu: the HUD's "?" button (with a badge of steps left) opens it, sliding
  up like every menu (Koda: no floating cards in a corner). Now `hud/panels/help-panel.vue`, steps in
  `libs/first-steps.js`.
- **The loadout's ship** is drawn inline (sharp, no background box): `shipArtParts` in `sdk/src/ship-art.js`.
- **Moons are free weapons platforms** (D61, B55): six mounts a moon, weapons only, outside the
  planet's shield in a siege. Battle was 654 bytes under the size limit then.
- **Tech trees** for reference: `docs/tech-trees/`, redrawn by `orbiter-client/dev/tech-trees/build.mjs`.
- **Color** (`docs/mockups/color-direction.md`, B56): stars by spectral class, planets by class,
  tinted orbits and HUD buttons, purple-gray card insides, a pink frame on a besieged planet's card.
  Purple stays deep space's color. Costly detail is on high graphics only; measured, no cost on low
  and normal.
- **The story** was updated (`docs/backstory.md`): stars charge the jump drive; corporate governance,
  Minerva and the pirates are in it.

## Don't

- Restyle Koda's existing art (cards, menus, title, sprites) without a mockup he approves.
- Put pink on a button that earns the player something.
- Leave the current contracts, or re-add the old ones, or label anything "Demo 4".
- Push, or stop processes you didn't start.
