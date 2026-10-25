# A frank review of the Demo 3 client

Koda asked for an honest look at the original client (the `demo3` branch) once the upgrade was done. This is that review. It covers the client in `orbiter-client/`; the contracts get a short section at the end, since they weren't in scope.

The short version: the game's ideas and art were stronger than its plumbing. The visual design, the feel of the star map, the lore and the game model all hold up. The trouble was almost entirely in how data moved from the chain to the screen, and in how the screen was redrawn. Both are typical of a first big Vue project written fast, and both are now fixed. The patterns behind them are worth knowing, so they don't come back in the rebuild.

## What was good

- **The art is real work, and it survived intact.** The planet surfaces, the ships, the cards, the scope and the jump sequence are hand-built SVG with a consistent look. The upgrade changed how they're drawn, not what they look like.
- **The game model is clear.** Systems, planets, moons, stations, ships, ports with buy/sell inventories, cargo holds and credits map cleanly onto the contracts. Decoding them into named objects was easy because the concepts were already well defined.
- **The orbit and camera math was sound.** Orbital positions, bearings and the eased camera ("rubber") all work. They needed names and tests, not rewrites.
- **The game is playable end to end on chain:** register, launch, jump, trade, claim, build and rename. That's a lot of working surface for a prototype.
- **The lore and the small touches** (the jump screen's "did you know", Minerva, port codes like `[SBB]`) give it character.

## The biggest problems, in order of impact

### 1. The screen was redrawn as one giant SVG, about 20 times a second

`playgame.vue` ran a `setTimeout` loop that bumped `gameTime`. Every sprite read it, so Vue re-rendered the whole star map SVG each tick, and the browser re-rasterized the entire screen on several threads.

On the scripted pan/zoom test, the original spent about 29 seconds of raster time per 10 seconds of play: more than two CPU cores busy just repainting. Even sitting still, following your ship cost about 9.9 s of CPU per 5 s. The game capped at about 20 updates a second and still dropped frames.

Now:
- Static and moving things live in separate layers.
- Huge backgrounds are on canvas.
- Moving sprites update their own transform.
- The camera is a GPU-composited shift.

The same pan/zoom costs 0.5 s of raster at a locked 60 fps, and idle costs 0.7 s. Full numbers are in `docs/after/perf-comparison.json`.

**The lesson:** Vue's reactivity is for *state that changes sometimes*, not for animation. Anything that moves every frame should be drawn outside the template: on canvas, or by setting a transform directly from one `requestAnimationFrame` loop.

### 2. Data loading, game state and drawing were tangled together

The Vuex actions called the contracts directly. They decoded the results by position (`planetBase[2][0]` meant "size"), built `Sprite` objects that mixed game facts with drawing state, and toggled UI animations along the way. Each sprite was identified by its position in an array.

That one design caused a family of bugs:
- **Array positions as identity:** a station built while you watched shifted every sprite after it, so the selection jumped and orbits glitched.
- **Stale reads:** the import read owner names and the star's id *before* updating them, so the first load of every system showed the star as #0 with no owner names.
- **String keys in arithmetic:** progress like `6 + key` concatenated strings (`"60"`), so the loading bar jumped.
- **Contract layout leaks:** a change to any contract's return values would have meant hunting through stores and components.

Now `src/sdk/` owns the contracts, decoding, sync and actions, with no Vue. The stores mirror its state; sprites are keyed by what they are (`planet:3`) and hold only drawing data.

**The lesson:** keep "what the game *is*" (plain data from the chain), "what the screen *shows*" (UI state) and "how it's *drawn*" in separate places, and identify things by what they are, never by where they sit in a list.

### 3. Failures were swallowed, so the UI hung instead of saying what went wrong

The contract wrappers wrapped every call in a `new Promise` and, on error, logged and never settled it. The `reject(err)` line was literally commented out:

```js
}).catch(err => {
  console.log('!!! no galaxy instance', err.message)
  //reject(err)
})
```

So any failed call left whatever awaited it waiting forever. You saw this as "Game: ...loading" and a preflight frozen at 10%. Elsewhere, errors were logged as `oops`, and a failed jump left the "traveling" animation playing until a reload.

**The lesson:** let errors travel. `async`/`await` with one `try/catch` at the place that can tell the player something beats wrapping promises by hand. Every failure path should end in a visible state.

### 4. Copy-paste and magic numbers instead of names

- **Repeated math:** the same orbit formulas, trade math and click-sound-then-act handlers appeared in several components.
- **Unnamed numbers:** tuning values like `420`, `5200`, `0.0015` and `2000` sat inline with no names.
- **Unclear names:** `rubber`, `tickWork`, `know`, `amISelected`, a UI store field called `container`, and a component named `howtoweb3` that was actually the network-select screen.
- **Small bugs from duplicates drifting apart:** the right arrow panned 10× farther than the others; the shipyard demanded one credit more than the price; the scope arrow to your ship pointed at its offset from its planet instead of at the ship.

Now the game math lives once in `src/sdk/game/` with tests, the tuning numbers are named in `src/constants.js`, and the names say what things do.

### 5. Dead code and debris

Seventeen unused components and libraries, 43 debug `console.log`s, commented-out blocks, a How-to-Web3 page nothing linked to, Vuex `setProp` setters writing any key, store fields nothing read, and several deprecated network configs. None of it broke anything, but it hid what mattered and made changes riskier.

### 6. Security and hygiene

- **Public source maps:** the production build shipped 22 MB of source maps.
- **Dead networks still selectable:** Rinkeby, Goerli and Mumbai were all shut down, and the "View on OpenSea" links all pointed at testnets OpenSea has since closed.
- **RPC keys committed** to the repo. You've said these were meant to be public, which is fine, but treat them as burned.
- **No tests at all,** so every change was a manual check.

## Smaller Vue habits worth dropping

- **Vuex-style setters** (`commit('setProp', { key, value })`). In Pinia, just assign.
- **Logic in templates:** multi-statement `@click` handlers, and methods called from templates for values that should be cached computed properties.
- **Undeclared component contracts:** props without types, events without `emits`, and components reaching into global stores rather than taking props. The latter makes them hard to reuse and test.
- **Loose comparisons on ids** (`==`, `> 0` on things that may be strings). Several bugs, including one I introduced and fixed, came from comparing keys as if they were numbers.

For the rebuild, I'd start with `<script setup>` and composables. Small, typed, single-purpose components will make all of the above hard to do by accident.

## The contracts (not changed in this upgrade)

- **The admin setters have no access control.** `setShipTokenizer`, `setPlanetTokenizer`, `setCreditTokenizer`, `setAvatarControls`, `genesis` and `makeSolarSystem` are `public` with no owner check, so anyone can repoint the live game's token contracts. Fix this first in the next contract iteration.
- **Few events.** Only chat, trades, ship launches and new avatars emit events, so clients have to poll and reload whole systems. Events for every action would let any client update precisely.
- **Unnamed tuple returns and internal getters.** Named returns would make decoding self-documenting. A public `getSystemData(id)` would unlock neighbor maps and a "systems discovered" leaderboard.
- **Planet NFTs are the source of truth for ownership,** which is elegant: the leaderboard and Rarible work without extra contracts. The planet metadata route on `orbiter8.com` is currently broken.

## Bottom line

For a first big Vue and web3 project, this is a solid prototype: the hard creative parts are good, and the problems are the ones almost everyone hits the first time. The upgrade kept the art and the game and replaced the plumbing.

If you take three habits into the rebuild, make them these:
1. Animate outside reactivity.
2. Keep chain data, UI state and drawing separate, with stable identities.
3. Never swallow an error.
