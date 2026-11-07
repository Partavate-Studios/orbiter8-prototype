# Handoff: where Orbiter 8 stands (2026-11-07)

For a Claude Code session picking up from the one that built the current release. Read `CLAUDE.md`
first (Koda's standing rules and the commands); this is the state of play and how to look at it.

## What the game is now

Branch `demo4` (278 commits beyond `demo3`, the last release). New contracts in `contracts/`: upgradeable
modules (Galaxy, Pilots, Market, Planets, Factory, Battle, Armory, tokens). The client in
`orbiter-client/` is the previous release's client, with its screens, card art, menus, HUD and audio,
rebuilt onto the new contracts, plus the new features in the same style.

A pilot's path:
1. **Title screen**, then the onboarding wizard: wallet (locally, the dev wallet), network, call sign,
   ship name (both register in one transaction), Take Command.
2. **Sol**, star 0, with nine planets and Federation stations. Select anything for its card and menu.
   - Earth's I.S.S.: trade (eight goods on Buy and Sell pages), the shipyard (holds get dearer as you
     add them; engine range), the armory (weapons and armor, fitted to the ship).
   - Earth: recruit colonists.
3. **Jumping:** "Jump To Neighbor Star" opens the galaxy map, a hex map over the game. Hover your star
   for dashed lines to every star in range; choose one, Jump. The jump animation runs at least 4.5 s.
4. **Discovery:** first arrival at a star starts a long-range scan, decided by a drand round about
   30 s later. The client records it automatically (a countdown shows under the minimap and on the
   map), then the new neighbors appear. New stars are "Star 1234" until named.
5. **Planets:** claim one (2,000 credits), then use its Colony menu: land colonists, deliver goods to
   storage, build Citadel → Colony → Station → Port → Yards → Armory, plus the Autofactory. The Tech
   Tree button explains the line.
6. **Battle:** "Attack" on another pilot's planet starts a public siege, fought in 30-minute rounds.
   The Siege menu shows both sides. The siege feed is the crossed-blades HUD button.
7. **Black holes** come in pairs. At one, the map links it to its far side; "Enter the black hole"
   plays a stretch-into-the-hole animation.
8. **Sessions** (the ship's menu): one wallet approval, then moves go through a browser key for 4 hours.

## How to see it

From `orbiter-client/`, on your own ports so you don't collide with Koda's copy:

```bash
source ~/.nvm/nvm.sh && nvm use 24
CHAIN_PORT=8546 UI_PORT=8092 npm run local     # run in the background
```

Drive and screenshot it with the harness (headless Chrome):

```bash
INJECT=0 node dev/harness/explore.mjs "http://localhost:8092/?account=1" /tmp/shots \
  wait:6000 click:Begin wait:1500 "click:Register My Call Sign" "type:input=Ada" \
  "click:File My Registration" wait:3000 "click:Find a Ship" "type:input=Lantern" \
  "click:Take Off" wait:8000 "click:Take Command" wait:9000 shot:sol
```

- Read the PNGs it writes to see the UI. Add `VW=390 VH=844` for a phone.
- The page's console is saved to `console.log` in the out dir.
- In `eval:` steps, `window.__o8game` is the game client (its `state` holds the pilot, cells, scans)
  and the Pinia stores are at
  `document.querySelector('#game').__vue_app__.config.globalProperties.$pinia._s.get('UI' | 'StarMap' | 'Player' | 'GameState' | 'Chain')`.
  With that as `$P` in the shell (`P="document.querySelector('#game').__vue_app__.config.globalProperties.\$pinia._s"`),
  `"eval:$P.get('UI').selectSprite('station:2')"` selects the I.S.S.
  - `ship:1`: your ship. `planet:256`: the first planet of star 1. Planet ids are `cell * 256 + body`.
- Test credits: grant the deployer the Credits contract's `GAME_MODULE` role and mint with
  `cast send --unlocked`. The addresses are in `dev/local-deployment-8546.json`.
- Skip chain time: `cast rpc evm_increaseTime 3600 --rpc-url http://127.0.0.1:8546`, then `cast rpc evm_mine`.
- Headless frames are coarse: to inspect an animation, set its start time back and screenshot single frames.

## Where the code is

- `src/sdk/client.js`: the game client. It loads the pilot, the system, the map regions and events,
  schedules scans, and holds every action. `src/sdk/contracts.js` wraps the contracts.
  `system-gen.js`, `hex.js`, `market.js` and `ship-art.js` mirror Solidity, with cross-check tests.
- `src/stores/`: `player.js` (sessions, planets, battle), `gamestate.js`, `starmap.js`, `ui.js`
  (menus, camera, jump animation), `game-bindings.js` (client → stores).
- `src/components/star-map/`:
  - `map.vue`: the system view's layers.
  - `galaxy-map.vue`: the hex map.
  - `black-hole-entry.vue`, `first-steps.vue`, `tech-tree.vue`.
  - `hud/`: the HUD, the card UI, and every menu in `hud/menus/` (trade, shipyard, colony, armory,
    loadout, siege, feed, chat, leaderboard, planets, ships, settings).
- `src/libs/palette.js`: the accent colors and the map's palette.

## Worth a reviewer's eye

Built quickly and only partly reviewed by Koda:
- **The newer menus** (Colony, Armory, Loadout, Siege, Feed) follow the trade menu's style but are
  dense, especially Colony's Storage and Factory pages and the Armory's part list. Check them at phone
  size.
- **The galaxy map** (`galaxy-map.vue`) is plain HTML/SVG in Orbiter 8's colors. It has none of the
  card art, and its card for the chosen star is a simple panel. Hover lines only work with a mouse; on
  touch, tapping a star draws its line.
- **The scan countdown** is small yellow text under the minimap.
- **The crossed-blades siege icon** is new and not Koda's art.
- **Black hole entry:** the part of the ship already inside the hole shows grey before it disappears.
- **The first-steps card** sits over the right side of the system view for new pilots; whether it's in the way hasn't been judged.
- **Wording:** player-facing text should be plain and short. Several new dialogs are long (session,
  attack, naming).

Known gaps:
- Gamepad and audio weren't tried in the last pass.
- `docs/baseline/` screenshots predate these screens.
- Testnets wait on Koda (milestone 6).

## Don't

- Restyle Koda's existing art (cards, menus, title, sprites) without a mockup he approves.
- Put pink on a button that earns the player something.
- Leave the current contracts, or re-add the old ones, or label anything "Demo 4".
- Push, or stop processes you didn't start.
