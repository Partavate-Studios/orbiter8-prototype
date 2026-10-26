# Enterprise Circuit: walkthrough notes

Notes from running Enterprise Circuit (`/home/koda/dev/enterprise-circuit`, last commit `c47815e`, 2025-02-09) and reading its client. They compare it with this repo's `modernize` client, ahead of bringing the two together. Written 2026-10-25.

## How it was run

- The client was copied to a scratch folder outside both repos, so nothing in either repo changed.
- It installs and runs on Node 24 as is (`npm ci`, then `vite`). The stack is Vite 6, Vue 3.5, Pinia 2, TypeScript and ethers 5.
- **It uses the same contracts as demo3.** The `Orbiter8` and `AvatarControls` ABIs are identical to `orbiter-client/src/sdk/chain/abi/`, and the Sepolia addresses match. So it ran against this repo's local chain (`npm run local`). The only change, in the copy, was adding the local addresses to `libraries/galactic/networkDeployments.ts`.
- Its wallet code calls `window.ethereum.removeAllListeners()`. Real MetaMask has that; the harness test wallet needed a stub.

## Screen by screen

### Title

- An animated scene: a sun with orbiting ships, a planet with two stations, and a ship drifting across. It's done with SVG `<animateTransform>`, so it costs no JavaScript per frame.
- The main button follows the player's state: **Connect**, then **Begin** (no callsign), **Launch** (no ship), then **Continue**. Settings and Network buttons sit below.
- A row of small demo buttons: Window, Portal, Tween, Assets, Ships (see "Demo pages" below).
- "Version 3.01" at the bottom left.
- A status pill at the top center is on every screen: block number, short address, "Loaded", and three status dots. It reads "network offline" before connecting.

### Network screen (Connect)

- A list of 11 networks on the left. The panel on the right shows the selected network:
  - its token and chain ID;
  - whether each contract is connected, with its address;
  - the player's balance and faucets;
  - a **Play on {network}** button.
- The header says "With 4 players exploring 22 star systems", which is a nice touch.
- Most of the networks listed are dead testnets (Binance test, Metis, Moonriver, Moonbase, Bobabase, Godwoken, Mumbai, Metal, Arbitrum Rinkeby).
- The Metis `Credits` address has paste junk in it: `…0911import ＋swap ⇄`.

### Callsign registration (Minerva AMI)

- Minerva introduces the game with a lore message ("Greetings Pilot… Cascadian Cyber Corp… Liberta Galactica"), then a **Register My Callsign** button.
- The name is typed into a pilot ID card. The input is a custom SVG widget that listens to keydown on the window, with no HTML input. That means no mobile keyboard, no paste and no screen reader.
- **Bug: a successful registration says it failed.**
  - The transaction is mined with status 1, but the screen says "Your transaction was either cancelled or failed".
  - `MenuAvatar.svg.vue` `handleSuccess()` calls `world.avatar.getMyAvatarName()`. That method was renamed to `setMyAvatarName` in `e572fbe` (2024-01).
  - The resulting TypeError is caught by `useContract`'s `callTransaction` (`stores/composables/contract.ts`), which reports any exception, including one thrown by the success callback, as a failed transaction.

### Ship registration

- "Please name your Orbiter 8", with a launch-pad drawing that puffs smoke while the transaction is pending.
- **Bug: the screen crashes on render.** `MenuShip.svg.vue` line 63 reads `world.avatar.me.name`, and the avatar store has no `me`.
- So **a new player can't get through onboarding** today: the callsign step reports a failure, and the ship step crashes.
- Choosing "Play on Localhost" with a callsign but no ship showed the game HUD with "Ghost Ship" and an empty map. This is probably the same crash leaving the menu half-drawn.

### In game (an account with a ship)

- **The HUD has the same layout as demo3.**
  - The profile card is top left; the star system name and icon are top right.
  - Planets and ships are bottom right, with info below them.
  - Sound, broadcast and settings are bottom left.
  - The zoom slider is at the bottom.
- It adds to demo3's layout:
  - a **minimap** under the star icon, showing the camera's view box;
  - the zoom value printed under the slider;
  - a speaker button.
- On entry, the camera zooms in from far out to the star over about 4 s.
- **The world:**
  - a six-layer parallax starfield over a background (`transformers/worldly.svg.vue` scales and shifts each layer by depth);
  - grid lines, and the sun with a glow;
  - planets drawn by type, with bands and rings;
  - stations orbiting planets;
  - a dashed ring around the selected object.
- The mouse wheel zooms smoothly, and dragging pans.
- **What works:**
  - **Planets menu:** lists each planet with its type, moons and station. Clicking one flies the camera to it, zooms to 4 and follows it.
  - **Ships menu:** lists the ships in the system. Clicking Rocinante didn't move the camera in my run; I didn't dig into why.
  - **Star icon:** selects the sun (zoom 2).
  - **Settings:** Quit to Title Screen, UI scale (50–400%), and FPS and Debug toggles.
- **What's not wired up yet:**
  - The avatar button does nothing.
  - **Info** throws `toggleShowLabels is not a function`.
  - **Broadcast** throws `showChat is not a function`.
  - The speaker does nothing.
- **No game actions.** There are no cards or menus for claiming, building stations, trading, buying holds, renaming, chatting or jumping. Jumping exists only in a debug overlay that is switched off (`World.svg.vue`, `v-if="false"`), as clickable neighbor ids.
  - So Enterprise Circuit is onboarding plus a system viewer. Playing the game is still demo3 only.

### Demo pages (title screen)

- **Window:** a cockpit view through an angled window: a planet below, a station outside, and four side panels (orbit diagram, moon, readout, station). A concept for a first-person bridge UI.
- **Portal:** the "About" storyboard: six panels with Close, 1–6 and next, which can autoplay.
- **Tween:** a row of ships for testing easing.
- **Assets:** an asset sheet with the network logos, planet types, moons and Minerva.
- **Ships:** the network ships (Orbiter 8, Moonbeam, Boba, Polygon designs) in colored rings around a hub.

## Code notes

- About 11,000 lines in 142 files. Most components mix `<script setup lang="ts">` (imports only) with an Options API block in the same file, and the TypeScript is loose (`any`, `this` in stores).
- **Everything is one SVG,** including the HUD and text (`layouts/svgContainer.vue`). There's no canvas and no HTML layer.
- **Routing:** a small Pinia store (`stores/routing.ts`) instead of vue-router.
- **The screen store** uses a centered coordinate system (`screen.left/right/top/bottom`), like demo3's `leftMostX` and its siblings.
- **The clock** (`stores/clock.ts`): a `setTimeout(24 ms)` plus `requestAnimationFrame` loop that updates a reactive `gameClock`. Every animation, tween and orbit is computed from it.
  - This caps the frame rate at about 30 fps and re-renders reactively each tick. It's the pattern the `modernize` branch replaced with one frame loop, canvas layers and direct DOM writes (Phase 5).
- **Tweens** (`composables/tween.ts`) read that clock. The camera adds tween offsets to the view point and zoom.
- **The contract layer** (`stores/composables/contract.ts`):
  - `read` returns `null` on any error;
  - `call` takes success, failed and rejected callbacks, and treats any exception as a failure (the cause of the callsign bug).
  - Same idea as `modernize`'s `sdk/chain/contracts.js`, with weaker error reporting.
- **Data loading:** reloads all of the player's system data on every new block (`eca8097`). That's demo3's old approach; the `modernize` SDK reloads only when the watched contracts changed.
- **The art library** is the biggest asset:
  - `components/assets/geometry|graphics|sprites` hold several ship designs, with engines;
  - planet sprites by classification (and named Sol planets);
  - stations, portals, Minerva, and network logos;
  - a backdrop.
  - It's richer than demo3's set.

## Side by side

| | Enterprise Circuit | `modernize` (this repo) |
| --- | --- | --- |
| Onboarding | Lore-driven Minerva screens and an adaptive title button (both registration steps broken) | Plain forms that work |
| Network choice | A full network screen with stats, mostly dead testnets | Sepolia plus local; EIP-6963 wallet picker |
| World rendering | All SVG, reactive ~30 fps clock, parallax starfield, minimap | Canvas backdrop/stars/guides, SVG sprites with direct writes, one frame loop |
| Game actions | None (debug-only jump) | Claim, stations, trade, holds, renames, chat, jump |
| Jumping | — | Neighbor view, jump and stall animations |
| Other | UI scale setting, About storyboard, cockpit concept | Leaderboard, Rarible links, smart-account detection, `sdk/` data layer, tests |
| Stack | ethers 5, Pinia 2, TS, Vite 6 | ethers 6, Pinia 3, JS with JSDoc, Vite 8 |

## Worth bringing over to `modernize`

- The **onboarding flow and Minerva's voice**: the callsign card, the launch-pad animation, and the adaptive title button. It needs an HTML text input instead of the SVG keydown widget.
- The **network screen's stats** ("N players exploring M star systems"), minus the dead networks.
- The **minimap**.
- **Parallax star layers.** They would be cheap on the canvas background layer.
- The **art**: planet types with bands and rings, the ship designs, stations, and Minerva.
- The **UI scale** setting.
- The **About storyboard** and the **cockpit window**, as later ideas.

## Recommendation

Bring Enterprise Circuit's screens and art into the `modernize` client, rather than porting the game into Enterprise Circuit.

- `modernize` already has the working game, the faster rendering core and the SDK that any UI can sit on.
- Enterprise Circuit's strengths are its look, its onboarding and its UX ideas. Those move over as components and assets.
- Its engine (the reactive clock and all-SVG world) and its contract layer would need the same rework `modernize` has already done.
