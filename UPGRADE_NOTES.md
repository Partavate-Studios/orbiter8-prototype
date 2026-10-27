# Orbiter 8 client upgrade notes

Branch: `modernize`, off `demo3`. Scope: the browser client in `orbiter-client/` only. Contracts, migrations and `truffle-config.js` stay untouched in this iteration.

## Phase 0: Inventory and baseline

### Versions

| Package | Version | Notes |
| --- | --- | --- |
| Node (this machine) | 23.5.0 | Not an LTS release, and past end of life. The Dockerfile pins `node:16-alpine`. |
| vue | 2.6.14 | |
| vuex | 3.6.2 | |
| vue-router | 3.5.3 | |
| @vue/cli-service | 4.5.15 | webpack 4.46.0, babel-loader 8.2.3 |
| eslint / eslint-plugin-vue | 6.8.0 / 7.20.0 | |
| sass / sass-loader | 1.44.0 / 9.0.3 | |
| @truffle/contract | 4.3.43 | |
| web3 | 1.6.1 | The client talks to the chain through web3 + Truffle, not ethers. |
| ethers | 4.0.49 | Only as a transitive dependency. The brief assumed ethers 5.5.2, which isn't in this tree. |
| js-cookie | 3.0.1 | |

Unused runtime dependencies in `package.json`: `latest`, `npm-check-updates`, `prettier`, `joi` (dev). These look like accidental installs.

### Does it build?

- `npm ci` works.
- `npm run build` **fails** on Node 17+ (`ERR_OSSL_EVP_UNSUPPORTED`, webpack 4's md4 hash).
- With `NODE_OPTIONS=--openssl-legacy-provider` it builds. Output:

| Asset | Size | Gzipped |
| --- | --- | --- |
| `chunk-vendors.js` | 7.4 MiB | 2.4 MiB |
| `app.js` | 781 KiB | 127 KiB |
| `app.css` | 13 KiB | 3 KiB |

Most of the vendor chunk is web3 + Truffle and their Node polyfills.

### Test harness (how the baseline was captured)

Public testnet RPCs proved unreliable for forking: the fork node hung or lost historical state. So the harness deploys the contracts to a **fresh local Hardhat chain (chain 1337)** and drives Chrome with Puppeteer:

- `deploy-local` deploys from the precompiled artifacts in `src/contract-artifacts/`, mirroring `migrations/1..15`. No Solidity compiler is needed. Result: 11 contracts and 14 star systems, at deterministic addresses.
- An injected EIP-1193 test wallet (it also announces itself via EIP-6963) signs with an unlocked Hardhat account.
- The capture script plays the new-player flow (register, name ship, take off), then opens each screen through store mutations, so the shots don't depend on where the orbits happen to be.
- The baseline client was built from a copy of `demo3` with `networks["1337"]` pointed at the local deployment. The repo artifacts were not modified.

The harness now lives in the repo under `orbiter-client/dev/harness/` (added in Phase 7).

### Baseline captures: `docs/baseline/`

`01-preflight` … `16-after-panzoom` cover: preflight checklist, registration (2 screens), ship creation, launch screen, star map with ship / planet / station cards, planets menu, trade menu (I.S.S.), settings menu, jump menu, jump animation (2 frames), star map, and the map after the pan/zoom session. Viewport 1440×900 at DPR 1.

### Baseline performance (10 s scripted pan + wheel zoom on the star map)

Headless Chrome on an i7-11800H. Rasterization is software here, so absolute numbers will be worse than on a real GPU. The point is the before/after comparison on the same harness.

| Metric | Baseline |
| --- | --- |
| Average fps | 50.5 |
| Frame time p50 / p95 / max | 16.7 / 33.4 / 33.4 ms |
| Frames over 50 ms | 0 |
| Script (main thread) | 1,498 ms |
| Style + layout + prepaint | 328 ms |
| Paint | 443 ms |
| Layerize / update layer tree / commit | 4,662 ms |
| **Raster** (all raster threads) | **28,168 ms** |

Raster time is about 2.5× wall time. Every tick re-rasterizes the full-screen SVG on several threads, which matches the diagnosis in the brief. Raw trace: `docs/baseline/panzoom-trace.json.gz`. Summary: `trace-summary.json`.

### Networks

What the client's deployment data says, compared with what is actually live today. Checked by calling `eth_getCode` at the Orbiter8 address from `Orbiter8.json` on each network's RPC, on 2026-10-24.

| Chain ID | Network | Contract still deployed? | Proposal |
| --- | --- | --- | --- |
| 11155111 | Sepolia | **Yes** | Keep. The client's suggested RPC `rpc.sepolia.org` is dead, so replace it. |
| 97 | BNB Smart Chain testnet | **Yes** | Keep. |
| 1287 | Moonbase Alpha | **Yes** (checked via dRPC) | Keep. The listed RPC `rpc.api.moonbase.moonbeam.network` timed out from here, so recheck it or swap it. |
| 1285 | Moonriver | **Yes** (checked via unitedbloc) | Keep? This is a **production** network with real MOVR, but the client labels it "Moonriver Alpha". Same RPC caveat as Moonbase. |
| 381932 | Metal Tahoe | No: the chain is up, but the address is empty (testnet reset?) | Remove. |
| 1297 | Bobabase | Unknown: RPC unreachable | Remove. Boba now points developers to Boba Sepolia (28882). |
| 71401 | Godwoken testnet | Unknown: RPC unreachable | Remove. |
| 15555 | Trust EVM testnet | Unknown: RPC unreachable | Remove. |
| 1666700000 | Harmony testnet | Unknown: RPC unreachable | Remove. Harmony proposed shutting down even its mainnet in Sept 2026. |
| 599 | Metis Goerli | Unknown: RPC unreachable | Remove. Goerli is gone. |
| 80001 | Polygon Mumbai | No: shut down | Remove. |
| 421611 | Arbitrum Rinkeby | No: shut down | Remove. |
| 3, 4, 42 | Ropsten, Rinkeby, Kovan | No: shut down | Remove. These carry the committed Infura key. |
| 28, 69 | Boba Rinkeby, Optimism Kovan | No: shut down | Remove. |
| 1337 | Local dev chain | n/a | Keep, dev builds only, for the harness. |
| 1, 2, 61, 1284, 4447, 5777 | Mainnet, Morden, ETC, Moonbeam, Truffle/Ganache dev | No deployment | Remove from the client config. |

Every removed network and its Orbiter8/AvatarControls addresses will be recorded here in Phase 3.

### Committed RPC keys

- **Infura project ID** (`truffle-config.js` and `src/store/store.js`). In the client it only appears in the `rpcUrls` of dead networks, so it will disappear with them in Phase 3.
- **Blast API project ID** (`truffle-config.js`, Moonbase/Moonriver deploys). Blast API has shut down ("Blast API is no longer available"), so the key is dead.
- `truffle-config.js` is out of scope for this iteration, so both stay there for now. Koda said they're fine either way.
- No private keys or mnemonics are committed anywhere in history. `PRIVATEKEY` comes from `.env`, which has never been committed.

## Phase 1: Build tooling

- **Vue CLI 4 / webpack 4 → Vite 7** on Node 24. The build no longer needs `--openssl-legacy-provider`. Build time is about 13 s.
  - Vite 7, not 8: `@vitejs/plugin-vue2` supports up to Vite 7. Phase 2 moves to Vite 8 together with Vue 3.
- **Vue 2.6.14 → 2.7.16.** This is a drop-in minor release, needed by the Vite Vue 2 plugin. `vue-template-compiler` is gone, since 2.7 ships its own SFC compiler.
- **web3 and Truffle run from their prebuilt browser bundles** (`web3/dist/web3.min.js`, `@truffle/contract/dist/truffle-contract.min.js`), so no Node polyfills are needed.
  - The Truffle bundle only sets `window.TruffleContract`, so `src/libs/truffle-contract.js` re-exports it.
  - Both go away in Phase 3.
- **Imports and aliases.** The `@` alias is kept. Imports without a suffix (e.g. `./hud/hud.svg` → `hud.svg.vue`) still resolve, because `.vue` is in `resolve.extensions`. SVG components remain Vue components.
- **`index.html` moved to the client root**, as Vite expects. `base: './'` keeps relative asset paths, which deploying under `/demo3` needs.
- **Scripts:** `dev`, `build`, `preview`, `lint`, plus `local`, `chain`, `deploy:local` (below).
- **ESLint 9 flat config** with `eslint-plugin-vue` (Vue 2 essential rules), no reformatting.
  - `vue/multi-word-component-names` is off, because single-word names are this project's convention.
  - 7 errors remain, all small and pre-existing. They're listed under Bugs and get cleaned up in Phase 6.
  - ESLint 9, not 10: `eslint-plugin-vue` 9 still has the Vue 2 rule set. Both get bumped in Phase 2.
- **Dependencies:**
  - `lodash` was imported but never declared. It's declared now.
  - Removed accidental runtime dependencies: `latest`, `npm-check-updates`, `prettier`, `joi`.
  - Removed `postcss.config.js` (autoprefixer). It wasn't adding anything the target browsers need.
- **Dockerfile:** `node:16` → `node:24-alpine`, `npm ci && npm run build`.
- **Bundle:** one 8.5 MB chunk (2.38 MB gzipped), the same size as before. Shrinking it is Phase 3's job.

### Local play (`npm run local`)

- `npm run local` starts a fresh Hardhat chain (chain 1337), runs `dev/deploy-local.js`, and starts Vite with the dev wallet.
  - The deploy script mirrors `migrations/` using the precompiled artifacts.
  - The dev wallet is `src/dev/dev-wallet.js`, an EIP-1193 + EIP-6963 provider backed by the chain's unlocked test accounts.
  - `?account=N` picks a pilot. The default is 1, because account 0 deployed the contracts and already owns "The Federation".
- Dev builds read `dev/local-deployment.json` (gitignored) for chain 1337.
  - Both the dev wallet and that lookup are behind `import.meta.env.DEV`. I checked that the production bundle contains neither.
- `npm run chain` / `npm run deploy:local` run the two halves separately. Use them when you want your own wallet pointed at `localhost:8545`.

### Verification

- **The full scripted flow passes on the Vite dev server against the local chain:** register, name ship, take off, star map, cards, menus, jump.
- **Static screens are pixel-identical to the baseline** (preflight, registration, ship creation, launch, star map).
  - Map screens differ by 0.1–2.7 % of pixels. Those are orbit positions at slightly different times.
- **Pan/zoom run (dev server):** 52.1 fps on average, p95 frame time 33.3 ms. Same as before, as expected, since rendering hasn't changed yet.

## Phase 2: Vue 3

- **Vue 2.7 → 3.5** through the `@vue/compat` migration build (MODE 2).
  - The full scripted flow (registration, ship launch, star map, every card and menu, the jump) produced **no compat deprecation warnings**, so compat was removed in the same step.
  - The code used almost none of the removed APIs: no filters, event buses, `.sync`, `$listeners` or `xlink:href`.
- **Router:** vue-router 3 → 4, with hash history as before.
- **Lifecycle hooks:** `beforeDestroy`/`destroyed` → `beforeUnmount`/`unmounted`.
- **Mount point:** Vue 3 mounts *inside* its container instead of replacing it. The app now mounts on `#game`, so `App.vue`'s own `#app` root and its styles behave exactly as before.
- **Vite 7 → 8 with `@vitejs/plugin-vue`.** Production build time dropped from 13 s to 1.9 s.
- **ESLint 10** with the Vue 3 rule set. It reports no Vue 3 deprecations.
- **Vuex → Pinia** (the brief's first choice), one store per commit, in this order:
  - `Config`, then `UI`, `StarMap`, `GameState`, and finally the root store as `Chain`.
  - **Same names.** State and action names are unchanged; former mutations are now actions. Components use `mapState`/`mapActions` with the same names.
  - **Identity getters are dropped.** Getters that only returned a state field are gone, because Pinia exposes state directly.
  - **One state field renamed.** `mapLoadedPercentage` kept its getter name, but its backing state field is now `loadProgress`, since Pinia can't hold a state field and a getter under one name.
  - **Undeclared fields are now declared.** `creatingAvatar`, `launchingShip` and `lastBlockNumber` used to be created on the fly by `setProp`. Pinia only tracks declared state, so they're declared now.
  - **Mechanical conversion.** Each store's logic was converted mechanically (`state.x` → `this.x`), so behavior is unchanged. Phase 5/6 restructure them properly.
- **Dev hook:** dev builds expose `window.__o8commit('UI/openMenu', 'planets')` to drive any store action by name. The smoke tests use it.
- **SVG `<a>` click handling** (HUD icons) was checked with real mouse clicks on both the baseline and the Vue 3 build. The behavior is identical, including the quirk where, with a menu open, the first click on another icon only closes it.
- **Verification:** after each store port, the full flow passed, the static screens were pixel-identical to the baseline, and the console was clean apart from the known `eth_getLogs` error. Pan/zoom held at about 51 fps on average with a p95 of 33.4 ms, unchanged as expected.

## Phase 3: Chain layer (ethers 6)

- **web3 1.6 and `@truffle/contract` are gone.** The client talks to the contracts through **ethers 6** only.
  - The repo has no other web3 packages. `truffle-config.js` and `migrations/` still use Truffle at the repo root, which is out of scope.
- **New `src/chain/` module.** This is the only code that touches ethers:
  - `abi/Orbiter8.json`, `abi/AvatarControls.json`. These are the `abi` arrays extracted from `src/contract-artifacts/Orbiter8.json` and `AvatarControls.json`, last compiled 2023-02-28 with solc 0.5.16. They're the only two contracts the client calls, and they match the deployed bytecode the artifacts describe.
  - `networks.js`: the approved networks (name, currency, wallet RPC suggestions, explorer, funding hint), with the Orbiter8/AvatarControls addresses for each.
    - Dev builds add the local chain from `dev/local-deployment.json`.
  - `wallet.js`: **EIP-6963** wallet discovery, falling back to `window.ethereum` for older wallets.
    - With several wallets installed, the preflight screen shows a **"Choose a wallet"** picker. The choice is remembered in `localStorage` (`o8.wallet`).
    - The session (BrowserProvider, signer) lives outside Vue reactivity.
    - Account, network or disconnect changes reload the page, as before.
  - `contracts.js`: every read, write and event query the client makes. The method names match the old wrappers. The `account` parameter is gone, because the signer sets `msg.sender`, including for views like `getMyShip`.
    - **Writes wait for the transaction to be mined**, as Truffle did.
    - **Failures now reject**, with the revert reason, instead of hanging forever.
    - Before binding, it checks that the addresses actually hold code, which catches reset testnets.
  - `convert.js`: `bigint` → `Number`, and ethers `Result` → plain arrays, at the boundary.
    - Every game value (ids, sizes, positions, credits at 0 decimals) is far below 2^53. The conversion throws rather than lose precision if one ever isn't.
    - This keeps the stores' `parseInt`/comparison code correct, and `JSON.stringify` can't hit a `bigint`.
    - Events keep web3's `returnValues` shape, so the chat menu is unchanged.
- **Preflight screen changes:**
  - One data-driven network row replaces the hard-coded chain-ID lists and the "Deprecated" row.
  - The per-network faucet hints come from config, kept for live networks only.
  - Explorer links are hidden when a network has no explorer.
- **Network fixes along the way:**
  - The Sepolia entry claimed `id: 421611` (Arbitrum Rinkeby) and "Arbitrum Ether" as its currency, both copy-paste errors.
  - Explorer URLs had trailing slashes, which produced `//address/` links.
  - Dead RPC suggestions were replaced: Sepolia uses publicnode/dRPC, and Moonbase/Moonriver get a working fallback after the official RPC.
- **Bundle:** **679 KB (218 KB gzipped)**, down from 8.5 MB (2.36 MB gzipped). That's about 11× smaller. Build time is 0.6 s.
- **Verification on the local chain:**
  - The full flow passes, and the console is now completely clean.
  - Static screens match the baseline, except the preflight screen, which changed as intended.
  - The wallet picker was tested with two announced wallets: it lists both, connects the choice, and skips the picker after reload.
  - Real transactions were tested: register, launch ship, chat (event read back), and a **jump to a neighboring system** (animation, then arrival in Star System 2).
  - A trade with invalid amounts reverted, and the contract's reason ("Equipment clash") reached the log instead of a silent hang.

### Removed networks

The client's config no longer lists these chains. The addresses are what the Truffle artifacts recorded for each.

| Chain ID | Network (client label) | Orbiter8 | AvatarControls |
| --- | --- | --- | --- |
| 1 | Ethereum Main Net | — | — |
| 2 | Deprecated Morden Testnet | — | — |
| 3 | Ethereum Ropsten Testnet | `0x73668aF7cC654634cc4EE81da6938416Eb45F4f6` | `0xD4D17A31D6F2aa295D1B3aF91D15A91Bc8CcDF06` |
| 4 | Ethereum Rinkeby Testnet | `0x08d4e18F80fC910a46EF730130B32cE062AC4129` | `0x8f1dC434E3D13f294B8FDe928B6235156a310239` |
| 28 | Boba Rinkeby Testnet | — | `0x9795e4E1fcD5d81399D6A7Acc404fD9Fd91c5747` |
| 42 | Ethereum Kovan Testnet | `0x6cECb50F52c52E746EE9Aba3fa17b9606f3b6D65` | `0xc820005F1EEA88EF4541398F3305d620E5F441d0` |
| 61 | Ethereum Classic | — | — |
| 69 | Optimism Kovan Testnet | — | — |
| 599 | Goerli Metis Testnet | `0xdd86445C07e140f284eE10A4c39dF7C568d88865` | `0x2460ED133589F70254f18277F42EDF539221C747` |
| 1284 | Moonbeam | — | — |
| 1297 | Bobabase Test Network | `0x2fceAd2954C53Cdc35a2E2D3C8d9d11a847D2842` | `0x3093022a0bfD02cFf56CD5B87809027BF88731cE` |
| 1337 | Truffle (old dev deployment; dev builds now use `npm run local`) | `0x58e60385A8883B3AA1539a0b969eC2EAd537589E` | `0x44AE472Ed19bB9b4a972D0e7dC9BbC3ae7C8b94f` |
| 4447 | Truffle Development Network | — | — |
| 5777 | Ganache Development Network | `0x1B99b6D2134DB585f47DAdbb99c4F6a61DBDE3f8` | `0xCe485db2E317062938c6b2B3c101eb08a34f8A44` |
| 15555 | Trust EVM Testnet | `0x26CB0C0FDed260684FE9E885ADf5563be1C550Bd` | `0x7a8950c192842820e0C12841DD52187896Db6030` |
| 71401 | Godwoken Testnet | `0xcA364F2EFE7c87f58A9988F7512A86b4b474D419` | `0x7Aa32471800488b9eC3693c35332CCbAfBb669AC` |
| 80001 | Polygon Mumbai Testnet | `0x8a782b354248b5F2C0F515536c98d47a6148Ac1D` | `0x137E576D7A22935e0FE33108Af39757a2957938B` |
| 381932 | Metal Tahoe C-Chain | `0x0f93785633fc437fDFcC707cc8c222F753486Ebc` | `0x2460ED133589F70254f18277F42EDF539221C747` |
| 421611 | Arbitrum Testnet (Rinkeby) | `0x911873281d209bD8b8C06282aB25b3b953267471` | `0x1bde28Bf4e0224A72EbC309992B0A5b32262b47A` |
| 1666700000 | Harmony One Testnet | `0xd63D3C8d6833359Fc093e9D3C769BD13108AD946` | `0xFab77fA380F2694A74C6Aae9dE90DE2426f0F85b` |

The committed Infura key only appeared in the RPC URLs of chains 3, 4 and 42, so it's gone from the client.

### For Koda to check by hand

- **Faucet links.** These are carried over and I haven't checked them: `sepolia-faucet.com`, `testnet.binance.org/faucet-smart`, and the Moonbeam docs link.
- **"Moonriver Alpha".** Moonriver is a production network with real MOVR, but the label is unchanged, as you decided.

## Phase 4: Known bugs

All four bugs from the brief are fixed, one commit each:

1. **Empty starfield** (`50e1cc4`). `generateStars()` replaced the stars with an empty array.
   - The stars now render: 800, or 3,200 on the high tier, each with its glare circle.
   - The array is frozen so Vue doesn't track every star.
   - **Side effect until Phase 5:** those 1,600–6,400 extra SVG circles are re-rasterized on every tick. One pan/zoom run measured 39 fps against about 51. Phase 5 moves the starfield to canvas.
2. **Compass bearing** (`bbed8a4`). `getDegreesFromXY` is now `atan2`-based. It was checked against the old function on 10^6 random points and is identical apart from the bug (x = 0, y < 0 now gives 180, not 1).
   - At the exact origin (the selected sprite) it returns 0, where the old code gave 1°, so the arrow points the same way.
3. **Duplicate SVG IDs** (`680e10f`).
   - Identical gradients, clips and masks now live in one hidden `<svg>` (`components/svg-defs.vue`) mounted once from `App.vue`. That covers planet, ring, engine, card, cargo-hold, tab, icon-clip and planet-clip, plus the old shared filters.
   - The three different `menu-slot-clip` shapes get a unique ID per instance.
   - The trade panels' generic `Mask` is now `tradeTabMask`.
   - Every screen still matches the baseline.
4. **Timer loops** (`94ead02`):
   - One `requestAnimationFrame` loop (`libs/frame-loop.js`); components subscribe and unsubscribe on unmount.
   - The game tick keeps its per-quality rate for now.
   - Block polling moved from `TitleScreen` into the Chain store as a single session poller. `TitleScreen`'s leaked loop had been the *only* block poller during play, so cancelling it on unmount would have frozen the game. It now pauses while the tab is hidden.

Also found:

- **`url(#cardGradient45)` is referenced, but nothing defines it**, so that element renders without its gradient. It isn't fixed: I don't know what it was meant to look like.
- **`scope-toggle.svg.vue` has an unfinished branch** that reads `sprites` and calls two methods it doesn't define. `sprites` is always empty, so it never runs. It goes in the Phase 6 dead-code pass.
- **Headless fps varies a lot between identical runs** (39–52 fps). Phase 5/7 comparisons will average several runs.

## Phase 5: Rendering (scope A: rendering core, HUD stays SVG)

### What changed, back to front

1. **Background on canvas** (`background-canvas.vue`). Everything is sized by `devicePixelRatio`.
   - **The nebula backdrop** is drawn from `assets/backdrop-art.js`, which holds the original SVG's 62 shapes extracted verbatim, as vector paths. It stays sharp at any zoom.
   - **The starfield** has 800 stars, or 3,200 on the high tier, each with its glare.
   - Both are drawn only when the zoom settles or the window resizes. In between, a composited CSS transform follows the camera, including the starfield's 1/20 parallax.
   - **The jump animation's star streaks** draw on a third canvas every frame, from a pre-rendered streak sprite.
2. **World layer.** The grid, the star, the planets' rings around the star, and ships orbiting the star.
   - It's drawn for one camera (`drawnView`) with a 256 px margin.
   - Each frame `libs/composited-layer.js` maps it onto the live camera with a CSS `translate` and `scale`, rounded to device pixels, with no repaint.
   - It's redrawn sharp when a zoom settles (about 100 ms still), when the zoom drifts past 15% (so long zoom animations re-sharpen as they go), or when a pan nears the margin.
   - `will-change` is set only while a transform is applied.
3. **Planet layers** (`planet-layers.vue`). Profiling showed the world SVG still repainted heavily, so this step was needed: every ring around a planet moved with the planet, and Luna's ring alone repainted an 800 px square per frame at ship zoom.
   - Each planet, with its moons, station, ships and their rings, is its own small SVG in its own composited layer, moved as a unit with a CSS translate.
   - That's nine promoted layers in Sol.
4. **HUD and menus.** These are their own SVG layer on top, as decided in scope A.
   - Only their painted parts take the mouse, so drags and clicks reach the world.
   - The HTML port waits for the UI rebuild.

### The loop

- **One `requestAnimationFrame` loop** (`libs/frame-loop.js`), ordered so game logic runs before rendering.
  - Each frame it advances game time and the camera animations, updates every orbit (including absolute positions), and keeps the camera on the selected sprite. Previously that was a deep watcher on every sprite component.
  - The game now ticks **every frame** on normal and high (it was every 32–64 ms); low ticks at about 30 fps.
- **Sprites and camera `Rubber`s are raw (`markRaw`) objects.**
  - The few components that draw live positions compute them from the raw sprite, and read `gameTime` as their per-frame signal. Those are sprite placement, planet surfaces, the scope, cards and the planet list.
  - Static art isn't touched per frame, and Vue hoists it.
- **Nothing ticks while the tab is hidden.** rAF pauses on its own, and the block poller skips hidden tabs.

### Quality tiers

- **Low** drops the starfield, glow circles, engine plumes, the ring gradient detail and planet surfaces.
- **Medium and up** now show the rotating planet surfaces, which used to be high-only. That's cheap now, as the brief notes. **This is a visible change on the default tier**, so please check you like it.
- None of the tiers uses the blur filters (`#blur`, `#soft`): they're defined but nothing references them.

### Numbers (10 s scripted pan + wheel zoom, headless Chrome, software raster, average of 3 runs each)

| | Baseline (demo3) | After Phase 5 |
| --- | --- | --- |
| Average fps | 50.3 | **56.2** |
| Frame time p95 | 33.4 ms (every run) | **16.8 ms** (2 of 3 runs) |
| Raster | 30.0 s | **11.5 s** |
| Paint | 577 ms | **250 ms** |
| Layerize | 4.4 s | **2.6 s** |
| Game ticks per second | ~20 | **60** |

The baseline is the production build. The new build was measured on the **dev server** (unminified Vue with dev checks), which handicaps it, and it still wins. Phase 7 re-measured the production build; see the Phase 7 section.

Paint flashing at idle confirms the split:
- At ship zoom, only the moving ship, the rotating planet body, the station and the card's mini ship repaint.
- At star zoom, only a few small boxes for distant moving bodies repaint.
- Zooming at DPR 2 stays sharp, because the world re-renders as soon as the CSS scale drifts.

## After Phase 5: Koda's testing round (Firefox, Chrome, all three tiers)

- **Preflight freeze on an unsupported network** (`85b59de`). The screen now tracks the wallet's state, says what it is waiting for, and names the wrong network.
- **Only touch the DOM when something visibly changes** (`0a2792e`, `ede0941`):
  - Positions snap to device pixels, and rotations to 0.25° steps.
  - Off-screen sprites aren't drawn.
  - Ships, moons and stations under ~6 px draw as dots.
  - Orbit rings fade out below ~24 px radius. That was Koda's choice over constant thickness.
  - Zoom gestures stretch the drawn world 0.5–2× before redrawing it.
  - Chrome pan/zoom raster went from 11.5 to 7.7 s. All three tiers hold ~57–59 fps in Chrome.
  - Headless Firefox at 2000×1100 @1.6: 60 fps idle on every tier, and ~46 while wheeling out hard (it was ~41).
- **Reload only when a block touches the game** (`743262b`). New blocks are checked for transactions to the game, avatar or token contracts. On Sepolia that skips nearly every 12 s block.
  - Contract events would be the cleaner signal, but they cover only chat, trades, ship launches and avatars. Events for every action are planned for the next contracts iteration.
- **Stable sprite keys** (`e89f225`). Sprites are keyed `star`, `planet:3`, `station:3`, `moon:3:1`, `ship:42` instead of by array position. That fixes the "station built while you're in the sector shifts everything" glitch, and the selection survives reloads.
- **Tests:** Vitest is set up (`npm test`), covering the star map import and the chain conversions.

### For Koda to check by hand

- **Firefox on your machine** (GPU, devtools closed). If zooming out still dips noticeably, please record a profile at profiler.firefox.com while zooming and share it.
- **The tiny-object dots and ring fade-out** at a few zoom levels, to judge the look.
- **Building a station while another player watches the sector.** It was verified by tests and a claim on the local chain, but not with real credits.

## Phase 6: Code quality and architecture

The app looks and behaves the same apart from the bug fixes listed under Bugs. The source went from 107 to 94 `.vue` files. Before Prettier, the phase removed about 750 lines net.

### Where things live now

- **`src/chain/`**: every contract call, plus wallet discovery and the network list. Nothing else imports ethers.
- **`src/game/`**: plain functions for the game's math, with JSDoc and unit tests. No Vue, DOM or ethers.
  - `orbits.js`: orbit positions and the orbit radius formulas for planets, moons, stations and ships.
  - `bearing.js`: scope bearings and marker fade.
  - `trade.js`: cargo, port trades and shipyard limits.
  - `sprite-types.js`: per-type click radius, camera zoom and sprite scale.
  - `planet-types.js`: planet class names.
- **`src/constants.js`**: the camera, timing and map tuning numbers, each named and commented.
- **Stores** hold state and call `chain/` and `game/`. View state, such as whether the scope or Minerva is showing, moved from the Config store to the UI store. Config now holds only saved settings.
- **Components** read stores and draw. Two-statement click handlers moved out of templates into methods.

### Cleanup

- **Dead code removed:**
  - 17 unused component and library files.
  - Unused data, store mappings, methods, computed properties and props.
  - 43 debug `console.log` calls.
  - Commented-out code.
  - No-op transforms (`translate(0 0)`, `scale(1)` and the like).
  - The How-to-Web3 page. Nothing linked to it, and its advice (Ropsten, the MetaMask faucet) was out of date. It's in git history if you want it back.
- **Errors** caught in stores now log what failed, with the revert reason, instead of `oops`.
- **The Minerva Debug tab** loads only in dev builds.
- **Renames** (`d8ca4bf`, `c9d3953`). Contract-bound names and the lore text are untouched.
  - `rubber` → `Tween`
  - `tickWork` → `advanceGame`
  - `getDegreesFromSprite` → `bearingToSprite`
  - `know` → `loreTip`
  - `amISelected` → `isSelected`
  - `showOrbit` → `hasOrbitRing`
  - `showEngines` → `shouldShowEngines`
  - The UI store's `container` → `screenSize`
- **Duplication:** the scope's three clickable markers share a `scope-marker` component, and the orbit and trade formulas exist once, in `game/`.
  - The planet surface art is left as hand-written SVG per class. Making it data-driven would make the art harder to edit and save little.
  - The menus already share `menu-container`.
- **Every TODO comment** is resolved or removed.
- **Prettier** (`npm run format`) was added in `eace115` and run in `630e9df`. That commit contains only formatting, so `git blame --ignore-rev 630e9df` skips it.
  - `semi: false` needed one prerequisite: Prettier splits `a(); b()` handlers onto separate lines without semicolons, which Vue's template compiler can't parse. Those handlers became methods first (`ca746c9`).
  - Screenshots before and after the format run match, apart from orbital motion.

### Tests (`npm test`, 38 tests, under 2 s)

- **`game/`**: orbits, bearings (checked against the original function on 2,000 points), trades and shipyard limits, and planet names.
- **`chain/convert`**: bigint handling.
- **Star map import**: stable keys, a station appearing mid-system, and the selection surviving a reload.
- **HUD smoke test**: mounts the HUD over a loaded star system, selects each kind of sprite, and opens every menu. It fails on any Vue error or warning. I checked that it catches a template reading a field that doesn't exist.

## Phase 6b: Data layer

Plan and reasoning: "Architecture: data flow" and "Plan" below. Every step is checked with lint, the tests, a full screenshot capture against the previous one (matching apart from orbital motion) and live checks on the local chain.

### Step 1: sync and actions in `src/sdk/` (done)

```
src/sdk/
  chain/      wallet, networks, contracts (unchanged; moved from src/chain)
  chain/decode.js   the contract's unnamed return tuples → named objects. The only code that knows their layouts.
  load.js     loadPlayer(), loadRecentEvents(block), loadSystem(onProgress) → plain objects
  actions.js  createAvatar, launchShip, moveTo, sendChat, claimPlanet, buildStation, trade, buyHolds, rename
  sync.js     createBlockWatcher({ watchedAddresses, onBlock }): new block? did it touch the game?
  game/       orbits, bearings, trade rules, planet types (moved from src/game)
```

- Nothing in `src/sdk/` imports Vue or Pinia. Wallet discovery uses `window`, since EIP-6963 is a browser standard; a non-browser client would pass in its own provider.
- **The stores now call the SDK** and keep only their own concerns:
  - **GameState:** busy flags, error logging, and the jump animation around `moveTo`.
  - **StarMap:** turning loaded data into sprites.
  - **Chain:** the poll timer, pausing while the tab is hidden, and what to reload.
- `sprite-types.js` moved to `libs/`. It's drawing data (click radius, camera zoom, sprite scale), not game data.
- **Still outside the SDK, for step 3:**
  - The Chain store binds the contracts and reads the token addresses itself.
  - The stores still hold the state. The SDK doesn't yet keep a state object of its own with `subscribe()`.
- **Tests:** a decoder test per tuple layout (42 tests in all).
- **Live checks on the local chain:**
  - an empty block is skipped;
  - a chat transaction triggers a reload, and the message appears;
  - a trade updates credits and cargo;
  - a rejected hold purchase logs the contract's reason ("insufficient credits").

### Step 2: game objects separate from sprites (done)

- **`sdk/system.js` `buildSystem(loaded, player)`** returns plain game objects keyed `'planet:3'`.
  - Each object has its game fields, owner names and `isMine`, and what it orbits (a key).
  - Each object also has its `orbit: { radius, speed }`. The radius and speed formulas are game rules, so they live here.
  - `objectKey()` and `STAR_KEY` moved here from `libs/sprite.js`.
- **`Sprite` (`libs/sprite.js`) is now drawing state only.** It holds the click radius, camera zoom, telemetry and position, plus a reference to its game data (`sprite.object`).
- **The StarMap store holds both, under the same keys:** `systemObjects` for game objects and `sprites` for drawing.
  - The HUD reads `systemObjects`.
  - The world, the scope and the camera read `sprites` for positions.
- **The card menu's actions** moved from `Sprite.getMenu()` to `card-ui/menus/card-menu.js`, built from the game object.
- **Rename:** `stationSprite` → `stationKey`.
- **Found and fixed along the way** (each in its own commit; see Bugs):
  - Owner names and the star's id on first load were stale.
  - Two store mappings I removed in Phase 6 were still in use.

### Step 3: thin stores (done)

- **`sdk/client.js` `createGameClient()`** is the game client; the app has one, `game`.
  - It connects to a wallet and binds the contracts (including the token addresses).
  - It watches blocks and, when a block touches the game, reloads the player, recent events and the current system.
  - It keeps all of that in one plain `state` object and calls subscribers with what changed. A failed load is reported as `{ error, what }`, and the previous state is kept.
  - It exposes `actions`.
- **`stores/game-bindings.js`** copies each change into the Pinia stores. The stores no longer load anything. What's left in them:
  - **Chain:** wallet discovery and choice, and the poll timer, which pauses while the tab is hidden.
  - **GameState:** the actions' error logging and the jump animation around `moveTo`.
  - **StarMap:** turning a loaded system into game objects and sprites.
- **Vue cleanups:**
  - Props are declared with types, events with `emits`.
  - Component names match their files: `NetworkSelect` was still named `howtoweb3`.
  - Templates no longer use `this.`, and five template-called methods became computed properties.
  - The Vuex-era `setProp` setters are gone, along with state nothing read.
  - ESLint uses `eslint-plugin-vue` `flat/recommended`, with the layout rules off since Prettier owns layout. Its style fixes are in a commit of their own (`b5a3185`).
- **Checked live on the local chain:**
  - an empty block is skipped;
  - a chat message triggers a reload and appears;
  - a real jump loads the new system and ends the jump animation;
  - trades, slider events and the slide-up menus' close button work.

### Step 4: tests for the sync logic (done)

- **`sdk/client.test.js`** runs the game client against a scripted chain:
  - the first block loads everything;
  - blocks that don't touch the game are skipped;
  - overlapping checks are ignored;
  - a system reload already in flight isn't started twice;
  - a failed load is reported and keeps the previous state.
- **`sdk/chain/contracts.test.js`** checks `gameChangedBetween` against scripted blocks.
- 55 tests in all, under 2 s.

### Step 5: the frame loop moves sprites directly (done)

- **Sprites, planet layers and planet surfaces write their own transforms** (and, for culling, `display`) from the frame loop, only when the value changes (`libs/dom-writes.js`).
  - They no longer read the per-frame `gameTime`, so Vue re-renders them only when what they show changes.
  - When the world is redrawn at a new zoom mid-frame, they re-place themselves before paint.
- **Measuring found the bigger cost elsewhere:** the guides canvas, new this phase, was redrawn every frame while the camera moved. Handing a new full-screen texture to the compositor every frame cost Chrome about half of each frame (`Commit`). It's now drawn 128 px beyond the screen and shifted with a whole-pixel CSS translate when only the camera's position changes.
- **Results:**

  | Measure | Before | After |
  |---|---|---|
  | Chrome, following a ship, Commit per 5 s | 2.3 s | 0.4 s |
  | Chrome, following a ship, script per 5 s | 644 ms | 306 ms |
  | Chrome pan/zoom trace | | 59.9 fps, no frame over 34 ms |
  | Firefox, ship selected | | 60 fps |
  | Firefox, wheeling out | about 46 fps earlier in the upgrade | 60 fps |

  Selected objects still move 0 px in both browsers, and the screenshots are unchanged.
- **The per-frame work in the frame loop itself** is about 0.6 ms per frame (measured per subscriber), so there's little left to gain there.

## Phase 7: Verification (done 2026-10-25)

### Before and after: the production builds

- **Setup:** the original `demo3` production build against the new production build (`npm run build:local`). Same local chain, same player, same scripted 10 s pan + wheel zoom. Headless Chrome with software raster, three runs each, averaged. Raw data: `docs/after/perf-comparison.json`.

| 10 s pan + wheel zoom | Original | New |
|---|---|---|
| Average fps | 51.7 | **60.0** (every run) |
| Frame time p95 / worst | 33.4 / 33.4 ms | **16.8 / 16.8 ms** |
| Raster (all threads) | 29.2 s | **0.5 s** |
| Paint | 583 ms | **96 ms** |
| Style + layout | 341 ms | **210 ms** |
| Script | 760 ms | 1,141 ms |
| Layerize / commit | 3.8 s | 4.8 s |

| 5 s idle, following the player's ship | Original | New |
|---|---|---|
| Raster | 8.9 s | **0.06 s** |
| Script | 780 ms | **218 ms** |
| Paint | 154 ms | **14 ms** |
| Layerize / commit | 49 ms | 438 ms |
| **Total CPU** | **about 9.9 s** | **about 0.75 s** |

- **What went up, and why:**
  - **Script:** the original ticked the game about 20 times a second; the new one ticks 60.
  - **Layerize/commit:** there are now several composited layers (background, guides, world, one per planet, HUD).

  Both are small next to the raster savings, and the new build never misses a frame.
- **Download size:** JavaScript went from 8.4 MB to 0.67 MB (2.6 MB → 0.2 MB gzipped). The original also shipped 22 MB of public source maps; the new build ships none. Images and audio are the same 13 MB.
- **Firefox** (headless, real GPU): 60 fps with a ship selected and while wheeling out.
- **Selection stillness:** a followed ship, moon, station or planet moves 0 px in Chrome and Firefox, at DPR 1 and 2.

### Screens and paint flashing: `docs/after/`

- **Screenshots** use the same 16 names as `docs/baseline/`; compare them with `python3 orbiter-client/dev/harness/diff.py docs/after`. Everything matches within a few percent (orbits move), except:
  - **the preflight screen,** whose network list and wording changed on purpose in Phase 3;
  - **the end of the pan/zoom,** where the test ends depends on timing.
- **Paint flashing** (`paint-flashing-idle-*.png`): at idle, only moving things repaint.
  - At ship zoom: the ship and its flames, the card's spinning mini-ship and a passing station.
  - With the whole system in view: a few small boxes for moving bodies.

### Kept in the repo

- **`orbiter-client/dev/harness/`:** the Puppeteer scripts used throughout the upgrade (captures, diffs, traces, jitter, idle, zoom sets, paint flashing, Firefox). See its README.
- **`npm run build:local`:** a production build that knows the local chain (output in `dist-local/`, ignored), to try the real bundle against `npm run local`.
- **`docs/original-code-review.md`:** the frank review of the original client Koda asked for.

### For Koda to check by hand

These need a real wallet, a real GPU or another player, which the scripted runs don't have:

1. **Sepolia with your wallet:**
   - connect (wallet picker; a wrong network gets a clear message, not a freeze);
   - take command, jump, trade, buy holds, claim a planet, build a station, rename, chat;
   - reload while on `#/play`.
2. **"View on Rarible"** from a planet card and a ship card on Sepolia. Planets will show "Untitled" until the planet metadata route is fixed.
3. **Firefox on your machine,** all three graphics tiers:
   - pan, wheel zoom, and select a ship, a moon and a planet;
   - the zoom-out after selecting a planet (no darker rectangle);
   - selected objects hold perfectly still;
   - after a reload, the low tier still runs at its lower frame rate.
4. **Several ships at Earth:** orbit rings pass under every ship.
5. **The planets menu** lists each planet's port with its `[SBB]`-style code.
6. **A station built while another player watches the system.** Tested locally, not with two real players.
7. **The look of the far-zoom simplifications** (tiny ships drawn as dots, rings fading out).
8. **Optional:** `npm run build:local` then `npx vite preview --outDir dist-local`, to play the production bundle locally.

## Bugs

### Fixed

- **The background and guides canvases redrew in full on every mouse move** (found 2026-10-27, through the canvas prototype). They watched `screenSize` deeply, and `screenSize` also holds the mouse position, so each move over the map re-sized (cleared) and redrew the backdrop, the starfield and the guides. They now redraw only when the window's size changes (`5d12577`).
- **Scroll bars on the star map, and wheeling out scrolled the page** (Koda, 2026-10-26). I caused it when I removed the old onboarding screens: I also deleted the global `.layer` style from `App.vue`, thinking only those screens used it. The map's container (`map.vue`, `class="layer star-map"`) used it too. That style held the map to the window with `overflow: hidden`; without it, the layers' 256 px drawing margin spilled out (1696×1156 in a 1440×900 window). Restored. It came in with `587f787`.
- **The volume dots sometimes showed the wrong setting** (Koda, 2026-10-25). The music played at the chosen level, but the highlight was off. Two causes:
  - **Rounding.** Volumes were saved as fractions in a cookie, and 1/3 read back as `"0.3333333333333333"`; three times that is just under 1, so the dots showed one step lower. The old default of 0.25 wasn't a step at all, so it showed as "off" while the music played.
  - **No redraw.** The volume wasn't reactive, so the dots only changed when something else redrew.
  - **The fix:** `08audio.js` keeps whole steps (0–3) in a reactive `levels` object, and reads old cookies by rounding to the nearest step. The settings menus read `o8audio.levels`. Covered by `libs/08audio.test.js`.
- **Contract calls that failed never settled**, so the UI hung (e.g. "Game: ...loading" forever). The Phase 3 rewrite makes failures reject, with the revert reason.
- **Event queries went below block 0 on young chains** (`fromBlock: block - 950`). The node then rejected them with "Method eth_getLogs is not supported". The query now clamps at 0 (Phase 3).

- **Empty `cy=""` on HUD icon circles** (`_icon-container.svg.vue`). The browser logged an error on every icon render. It's now `cy="0"`, which looks the same. (`d6c2514`)
- **`NaN` keys in the ship-creation fleet animation** (`_ship-scene.vue`). `:key="ship-x"` evaluated as the expression `ship - x`. (`fb0954a`)
- **Getter mappings to store modules that don't exist:**
  - `Map` in `TitleScreen.vue` (`ce64930`).
  - `Avatar` in `minerva.vue` (`d479497`).
  - The unused `radial-menu.vue` mapped `Map`/`Avatar` actions and has been deleted (`87889db`).

- **A failed star map load left `isLoading` stuck**, so the map never refreshed again in that session. (`dddd969`)
- **Chat messages flipped order on every re-render.** The menu reversed the store's array in place. Opening the chat before events had loaded also threw. (`7711bf6`)
- **The graphics quality cookie was read back as a string**, so toggling did `"3" + 1`. (`d9d75ca`)
- **`openMenu` reset a nonexistent `portMenu` flag instead of `tradeMenu`**, leaving the trade menu open under other menus. (`ea31e02`)

- **Regression I introduced in Phase 2, found by Koda in Firefox:** after a reload on `#/play`, the map stayed at 0% forever. (`783b947`)
  - Under Vue Router 4, `App.vue`'s "always start at the title screen" redirect checked the route before it was resolved, so it never fired.
  - The title screen is what starts block polling, and the map only loads when a block is seen.
  - Fixed by waiting for `router.isReady()`. The game screen now also starts the poller, which is idempotent.
  - My scripted runs always started at `/`, so they missed it. The smoke tests will cover a reload on `#/play`.
- **Invalid table and list markup** (Vue 3 compiler warnings) in the debug panel and the How-to-Web3 page. (`79ebfee`, `6eac1a6`)

Phase 6:

- **The jump animation never ended when a jump failed** (rejected in the wallet, or reverted). The game sat on "traveling" until a reload. (`e8b34e1`)
- **Menu buttons were silent.** `menu-button` read `playEffect['click']` instead of calling it. (`f2d91b6`)
- **Declining a network switch offered to add the network anyway.** That offer now appears only for EIP-1193 error 4902 (unknown chain). (`2a33c32`)
- **The scope's arrow to the player's ship pointed the wrong way.** It used the ship's offset from its planet rather than its position. (`ee33aca`)
- **The shipyard needed one more credit than the price.** It required credits > cost, while the contract accepts credits = cost. (`9350822`)
- **The right arrow key panned 10× farther than the other arrows.** (`5b43e7e`)
- **Zooming back in after zooming far out took extra wheel steps.** Zoom requests aimed past the camera's limit. (`caddba3`)
- **Hovering the sun's scope marker threw** instead of labeling the sun. I introduced this with the Phase 5 sprite keys. (`ad11592`)
- **A saved low graphics tier ran at full frame rate after a reload.** The tick delay only updated when a tier was picked, and the original had the same problem. The `~` key's tier toggle now also saves its choice. (`78f561e`)
- **The map loading bar jumped in big steps.** Object keys are strings, so `6 + key` concatenated (`"60"`) and each stage went straight to its cap. Found while moving the loaders into the SDK. (`1489b25`)
- **Regression I introduced in Phase 5, found by Koda:** a selected ship, moon or station jiggled in place. (`dc3d055`)
  - Its screen position was the sum of separately rounded pixel offsets (world layer, drawn camera, planet layer, offset from the planet), and the rounding errors didn't cancel.
  - Measured with a followed object over 120 frames: it moved 1–2 px on 15–70% of frames in Chrome and Firefox.
  - The world is now drawn for a camera on the device-pixel grid, and sprites in a planet's layer are placed by rounding their absolute position. A followed object now moves 0 px in both browsers, at DPR 1 and 2.
  - The measurement script is `jitter.js` in the test harness.
- **Regression from Phase 5: the world could stay soft after selecting something at a different zoom.** It only redrew sharply once the camera held still, and a camera following a moving object never does. Now only the zoom has to settle. (`51b24ee`)
- **Orbit rings were drawn across ships, found by Koda on Sepolia.** Each sprite drew its own ring just before itself, and all ships at a planet share one orbit, so each ship's ring cut across the ships drawn before it. The original had the same order. The world and each planet layer now draw every ring first, then the bodies. Reproduced and checked locally with two ships at Earth.
- **Owner names were missing on the first load of a system, and the star showed as #0.** The import read them from the store before updating it, so they came from the previous load. After a jump, they belonged to the previous system. Found while moving the import into `sdk/system.js`. (`8d3b043`)
- **Regression from my Phase 6 cleanup (`4c4945d`):**
  - The planet card's moons menu ("Visit Moon") threw an error.
  - Minerva's Profile tab logged a Vue warning every frame.

  My unused-mapping check missed templates that read `this.x`. A scan of every template finds no others, and the smoke test now opens the moons menu. (`206a308`)
- **Regression from the Phase 5 stable keys: the planets menu lost each planet's port** (its name and what it buys and sells, e.g. `[SBB] Icarus`), found by Koda. The menu checked `portForPlanet(planet) > 0`, which is false for a key like `'station:3'`. Arriving in a system checked `myShipId != 0` the same way. The smoke test now checks for the port line. (`3f2edfc`)
- **A darker rectangle appeared during zoom-outs (Phase 5), found by Koda.** The star's glow, the grid, the heliopause and the planets' orbit rings were drawn in the world layer, which is briefly shrunk by CSS while zooming out, so its edge showed. They're now drawn on a canvas (`guides-canvas.vue`) for the live camera.
  - They look the same at every zoom level (under 0.2% of pixels differ, all from moving bodies).
  - Pan/zoom raster time dropped from 7.5 s to 0.4 s, because the SVG grid had thousands of lines. (`98e3014`)
- **Smart-account players' actions weren't noticed, found by Koda on Sepolia** (his chat didn't appear until a reload).
  - Koda's account is an EIP-7702 smart account (MetaMask). Its transactions go to a wallet contract that then calls the game, so the game is never a transaction's recipient, and the Phase 5 block check only looked at recipients.
  - **Fix, part 1:** the player's own actions now reload the game as soon as they're mined, whatever wallet sent them.
  - **Fix, part 2:** the block check also counts any event from the game, avatar or token contracts, in one `getLogs` request. That covers smart accounts for chat, trades, launches, claims and anything that moves credits or tokens.
  - **Fix, part 3:** a full reload at least every 2 minutes catches the rest (a smart-account player's jump or rename emits no event).
  - Events for every action, on the contract wish list, would make part 3 unnecessary. Checked against the real Sepolia block holding Koda's chat.
- **The backdrop showed its edges during zoom-outs (Phase 5), found by Koda.** The nebula backdrop is opaque and could be CSS-shrunk to half size before redrawing.
  - The backdrop and the starfield now redraw as soon as shrinking them would uncover any of the screen (the `mustCover` option in `libs/composited-layer.js`).
  - Over 25 wheel steps out at 2000×840, the backdrop's edge was visible in 113 of 243 frames (gaps up to 372 px) before the fix, and in none after.
  - Firefox still holds 60 fps while wheeling out.
- **The lint findings** listed below for "the phase that rewrites that code" are fixed. (`215d2c1`)

### Found, to fix in the phase that rewrites that code (all fixed in Phase 6)

- **Lint findings:**
  - `moons-icon.svg.vue` registers a `Ship` component that is never imported, and imports `Moon` without using it.
  - `space-dock-icon.svg.vue` registers `Station` without using it.
  - `card-button.svg.vue` is named `Button`, a reserved HTML element name.
  - Plus an unused variable in `NetworkSelect.vue` and a useless assignment in `playgame.vue` `onWheel`.

### Found, not fixed (contracts; out of scope this iteration)

- **No access control on Orbiter8 admin setters.** `setShipTokenizer`, `setPlanetTokenizer`, `setCreditTokenizer`, `setAvatarControls`, `genesis` and `makeSolarSystem` are `public` with no owner check. Anyone can repoint the live game's token contracts, which would break minting and credits for every player. Fixing this needs a contract change and a redeploy.

## Feature to-dos (Koda, 2026-10-25; next up after Phase 6b and 7)

### 1. Gamepad support (parked 2026-10-25, after Koda tried the first version)

**Koda's verdict:** it works, but it feels bolted on, and a lot is missing. A good controller experience needs:
- **a UI designed for a controller from the start**, not a focus ring over a mouse UI;
- **a way to sign without the wallet popup**, which a controller can't operate.

That's a lot to build, so it's parked, possibly for good.

**What's in the code** (`libs/gamepad/`, `components/gamepad-overlay.vue`): the first version, which does nothing unless a pad is in use. It's harmless to keep, and `git revert` of the gamepad commits removes it.

**What a real version would need, for whenever it's revisited:**
- **Controller-first UI design.** Every screen built around a focus model: a clear focused state, predictable D-pad paths, menus as lists, big targets, and B always meaning back. The star map would select objects by cycling or radial selection rather than pointing. The current HUD's free-floating SVG buttons and tiny card buttons don't fit.
- **Signing without the popup.** Options, roughly from simplest:
  - **An in-app burner wallet:** a local key holding a little test ETH, used only for game actions.
  - **Session keys:** a key the main wallet authorizes once, scoped to the game's contracts and with a spending cap. Koda's MetaMask account is already an EIP-7702 smart account, which can delegate like this.
  - **An embedded-wallet service.**

  Any of these is a product and security decision, not just client code.
- **Text entry:** an on-screen keyboard, generated names, and preset chat messages.
- **Polish:** button glyphs that match the connected pad, rumble, and a Steam Deck pass.
- **Platform quirks found so far:**
  - **Chrome on Linux** needs access to a Bluetooth pad's `hidraw` device (a udev rule).
  - **Firefox** reported Koda's 8BitDo (as 045e:02e0) with the standard mapping and worked.

**The first version's notes follow.**

#### First version (done 2026-10-25)

**Koda said "let's do the gamepad support" without picking options, so the first version uses the suggested defaults:**
- The mapping in the table below, including the *(suggested)* rows.
- The left face button opens the existing jump menu.
- **Not in this version:**
  - typing (naming things and chat still use a keyboard prompt);
  - wallet approvals (they still need the mouse);
  - button glyphs and rumble.

**Build plan** (each step is its own commit; tick it off here when it lands):
1. [x] `libs/gamepad/`: pure helpers, with tests.
   - Reading a pad: dead zones, and buttons that went down this frame.
   - Spatial navigation: from a focused rectangle, pick the nearest one in a direction.
2. [x] `libs/gamepad/controller.js`, which polls the pad from the frame loop and maps it to game actions:
   - triggers zoom; past the limit, the zoom-out trigger enters the neighbor view;
   - the left stick pans;
   - the right stick moves a free cursor;
   - the face buttons, bumpers, Start and Select;
   - the D-pad moves a focus ring over the visible clickable things (HUD buttons, menus, cards, HTML buttons), and A clicks it, or clicks whatever is under the cursor if the cursor was used last.
3. [x] `components/gamepad-overlay.vue`, mounted in `App.vue`: draws the focus ring and the cursor while a pad is in use, and hides them when the mouse moves.
4. [x] Verify with a scripted fake gamepad in the harness (navigator.getGamepads replaced), plus notes. All of these were checked through the real app with `dev/harness/fake-gamepad.js` (`PRELOAD=`):
   - R1/L1 step through planets; Start selects your ship; Y, X and Select open their menus; B backs out of each;
   - the D-pad shows the focus ring, and A clicks the focused element (a planet row in the planets menu);
   - R2 zooms in; holding L2 reaches the zoom limit, and pressing it again there opens the neighbor view; R2 closes it;
   - the left stick pans and lets go of the selection; the right stick shows the cursor;
   - moving the mouse hides the overlay.

**Follow-ups:**
- suggested names and preset chat messages, so a controller can name things and talk;
- button glyphs on screen while a pad is in use;
- rumble;
- **Chrome on Linux with Bluetooth Xbox-mode pads** (Koda's 8BitDo SN30 Pro+, which reports as 045e:02e0): Chrome showed nothing while Firefox worked.
  - The pad's raw `hidraw` device is root-only, and Chrome uses it for these pads. Firefox reads the input device, which the desktop user can already access.
  - The fix is on the machine, not in the game: a udev rule granting the desktop user access, e.g. `KERNEL=="hidraw*", KERNELS=="0005:045E:02E0.*", TAG+="uaccess"`. The `steam-devices` package also ships rules like it.
- **Firefox (2026-10-25):** works with Koda's 8BitDo, which it reports with the standard mapping.

The original mapping and analysis follow.

### 1a. Gamepad support: mapping and analysis

Koda's mapping, with suggestions marked *(suggested)*. Buttons are named by position, because the browser's standard gamepad mapping numbers them that way. Xbox A/B/X/Y and PlayStation ✕/○/□/△ land in the same places; Nintendo's letters are swapped.

| Input | Action |
|---|---|
| L2 / R2 | Zoom out / in. The triggers are analog, so pressure sets the zoom speed *(suggested)*. |
| Left stick | Pan, like dragging. |
| D-pad | Move focus between the HUD buttons in the current context (HUD, open menu, card). |
| Bottom (A / ✕) | Select / confirm. |
| Right (B / ○) | Cancel / back: close the open menu first, then deselect. |
| Top (Y / △) | Planets menu. |
| Left (X / □) | Jump interface (the neighbor-star view; see to-do 2). |
| L1 / R1 | Previous / next planet *(suggested; Koda proposed R1/R2, but R2 zooms)*. |
| Start / Menu | Go to my ship. |
| Select / View *(suggested)* | Settings menu. |
| Right stick *(suggested)* | A free cursor for anything the D-pad can't reach, such as ships and moons in the world, with Select to click. This is the safety net that makes everything reachable. |
| L3 / R3 *(suggested)* | Toggle labels / toggle the scope. |

Other suggestions:
- Show button glyphs (Ⓐ Select, Ⓑ Back) while a controller is in use, and switch back to mouse hints when the mouse moves.
- Rumble on a jump or a purchase. Chrome supports it; Firefox mostly doesn't.

**Reachability check.** Every part of the interface, and how a controller gets there:
- **Star map, all reachable:**
  - HUD buttons (profile → my ship, system → star, mute, chat, settings, ships, planets, labels, scope toggle, zoom +/−): D-pad focus.
  - The card's actions (jump, visit station/planet/moon, trade, shipyard, rename, claim, build station, OpenSea) and the moons menu: D-pad.
  - The trade sliders (left/right on the focused slider) and Make Trade: D-pad.
  - Shipyard holds and Buy: D-pad.
  - Settings radio buttons: D-pad.
  - The jump menu's neighbor list: D-pad.
  - Ships and moons in the world: L1/R1 for planets, the right-stick cursor for everything else, or the planets menu, which lists moons and ports.
- **Pre-game screens, reachable:** Play, wallet and network choice, graphics quality, Take Command: D-pad.
- **Not reachable without more work:**
  - **Typing.** Avatar name, ship name, claiming or naming a planet, building a station, renames and chat all use text fields or `prompt()`. Options:
    - rely on the OS keyboard (the Steam Deck has one);
    - a "suggest a name" button using generated names;
    - canned chat messages;
    - an on-screen keyboard (the most work).
  - **Wallet confirmations.** Every action opens the wallet extension's popup, which a gamepad can't operate. This is the real blocker for controller-only play. Fixing it means a different signing model, such as an embedded wallet or session keys, which is beyond the client alone. Until then, the controller covers looking around and navigating, and a mouse confirms transactions.
- **Minerva** (dev only): skip.

Notes: the browser only reveals a gamepad after a button is pressed on the page. Firefox reports the standard mapping for fewer controllers than Chrome, so test with Koda's controllers early.

### 2. Heliopause → neighbor-star view (done 2026-10-25)

**Round 3 (Koda, 2026-10-25), done. Each step is its own commit; tick it off here when it lands:**
1. [x] **The top-right button:**
   - It shows a plain star until the star is selected; clicking it selects the star, and it becomes the star-nav icon.
   - Clicking the star-nav icon zooms all the way out into the neighbor view, as if scrolling out.
   - The old ring menu around the sun goes. Everything that opened it (the card's jump buttons, the gamepad's X) opens the neighbor view instead.
2. [x] **An Orbiter 8 ship in the neighbor view:** it pops out from behind the sun as the stars arrive, then orbits at a modest speed, passing behind and in front of the star. The center star gets slightly larger.
3. [x] **The jump only plays once the move is on chain:**
   - After Jump, the view stays open while the wallet and transaction are pending, with the ship circling the sun fast, getting ready to jump.
   - The jump animation starts once the transaction is mined.
   - A rejected or failed jump returns to the choice with a message.
4. [x] **Verify.** Checked on the local chain with automatic mining off, so the jump stayed pending:
   - the view stayed open, with "Preparing to jump…" and the ship racing;
   - after the block was mined, the jump animation played once the transaction reported back (ethers checks for receipts every few seconds);
   - it then ended in the new system.

   If the block watcher loads the new system first, the arrival plays the animation itself (StarMap `importSystem`), so the two can't fight. The animation always plays at least 2.5 s.
5. [x] **Koda's follow-ups (2026-10-25):**
   - **The orbit is a top-down circle,** matching every other orbit on the map. The ship comes out from under the star as the view opens.
   - **The jump animation starts when the wallet *sends* the move** (committed), not when it's mined. The contract layer now reports the moment a transaction is sent (`send(…, { onSent })` in `sdk/chain/contracts.js`; `actions.moveTo(id, { onSent })`). "Preparing to jump" only covers the wallet step.
   - **If a sent move then fails,** the animation stops and the player is back in the system; the error is logged.
   - Checked with mining paused: the animation was already playing with the move sent and not yet mined, and it ended on arrival.
6. [x] **A stalled jump (Koda, 2026-10-25).** If a move was sent and then fails (reverted, dropped or replaced), the jump animation stalls out instead of quietly ending:
   - The star streaks coast to a stop over 3 s.
   - The ship's engines cut out, and it falls behind: it spins faster and faster, shrinks, and slides off the left edge in about 2.5 s.
   - Below the ship, where the travel text was, it says "The jump didn't go through", with the reason. A **Return to {star}** button is there from the first frame, so players who know the screen don't have to wait. The screen stays up until the player clicks the button.
   - The button zooms back into the system with the star selected.
   - A move rejected in the wallet never sent anything, so the neighbor view still handles that itself.
   - Code: `ui.jumpStalled(reason)` and `ui.jumpRecover()`, the `stall` computed in `jump-animation.svg.vue`, and the streak speed in `background-canvas.vue`.
   - Checked with the harness by triggering a stall from the store: the frames show the slide, and the button.
7. [x] **Clicking the center star closes the neighbor view (Koda, 2026-10-25).** It zooms back in and selects the star (`ui.zoomInToStar()`, also used by the stall's Return button). It's ignored while a jump waits on the wallet. The subtitle now reads "Click {star} or scroll in to return." Esc and scrolling in still work.

**Round 2 (Koda, 2026-10-25), done.** The rings settle mid-screen and stretch sideways on wide screens. Verified at 1440×900 and 2000×840.

**Round 2 plan (kept for reference). Each step is its own commit; tick it off here when it lands:**
1. [x] **Remember explored systems.** `sdk/explored.js` records each visited system's neighbor list, per network, in localStorage. The contracts can't list other systems' neighbors (`getSystemData` is internal), so the outer ring can only show neighbors the player has visited.
   - **Koda (2026-10-25):** a client-side memory isn't a long-term answer, since it keeps growing. His new star-creation algorithm tracks physical positions in space, and that, with the next contracts, should replace this. Keep it for now, and pull it if it causes problems.
   - Capped at the 1,000 most recently visited systems (about 60 KB).
2. [x] **The entrance animation:**
   - The heliopause becomes the star: it starts at the heliopause's on-screen size and position, then shrinks and moves to the center. The real heliopause on the guides canvas is hidden while the view is open.
   - The neighbors fly in from beyond the screen edges instead of bursting out of the center.
3. [x] **Hover on a reachable star:** it glows, and its dotted route brightens.
4. [x] **The outer ring:**
   - Each explored neighbor's own neighbors appear as small dots, under half the size, with no labels, outside the ring. They're grouped near the neighbor they belong to, never on top of each other, and not interactive.
   - When a neighbor's neighbor is the current system, there's no dot: a second dotted line, curving the opposite way, shows the path back.
5. [x] **Verify** with screenshots of the animation frames, hover, and the outer ring after exploring, plus tests.

**Koda's decisions (2026-10-25):**
- This is an *additional* way to jump. The existing jump menu stays as it is.
- Once a destination is picked, a dashed, slightly arced path runs from the current star to it, suggesting a curved route through space.

**Build plan** (each step is its own commit; tick it off here when it lands):
1. [x] `sdk/game/neighbor-layout.js`: place each neighbor at an angle derived from its id (golden-angle hash), spread out any that overlap, and build the arced path. Pure functions, with tests.
2. [x] UI store: `neighborView` state and `enterNeighborView()` / `exitNeighborView()`. Wheeling out while already at the camera's zoom-out limit enters it; wheeling in or Escape leaves it (clicking empty space only clears the chosen star).
3. [x] `hud/neighbor-view.svg.vue`, drawn over the map while active:
   - the current star in the middle, shrinking in from the heliopause's on-screen size;
   - the neighbors around it, brighter if visited ("Unexplored Star" is the contract's default name);
   - clicking one shows the arced dashed path and a card with Jump and Cancel. Jump runs the same `moveToSystem` as the jump menu.
4. [x] Verify with screenshots (enter, pick, jump, leave), plus the smoke test. Checked at 1440×900 and 2000×840: Escape and wheel-in leave; Jump took the ship from system 2 to Sol.

The original analysis follows.

### 2a. Heliopause → neighbor-star view: original analysis

Zooming out past the system's outermost circle (the heliopause) turns the system smoothly into a single star. The camera keeps pulling back, and the neighboring stars appear around it. Click a neighbor to choose it and jump. This replaces or absorbs the current jump menu.

**What the contracts allow today:**
- The current system's neighbors (up to 12, from `getPlayerSystemData`) and their names (`getSystemName`).
- Not the neighbors' own neighbors: `getSystemData(id)` is `internal`. Contract wish: make it public, or add `getSystemNeighbors(id)`.
- No positions in space, only adjacency. Every neighbor is exactly one jump away.

**Ideas:**
- **Remember what the player has seen.** Each visit reveals that system's neighbor list, so the client can store it (per network, in localStorage) and build a personal map of the explored region over time. That gives neighbors-of-neighbors for any neighbor the player has visited, with no contract change, and doubles as fog of war.
- **Consistent directions.** Place each star at an angle derived from a hash of its id, then spread out any that overlap. A star then always appears in roughly the same direction, whichever neighbor you view it from, which makes the map feel stable. Distance stays uniform, since every neighbor is one jump away.
- **Show what's known:**
  - visited or unexplored (unexplored systems have default names);
  - whether your ship has been there;
  - outer-ring stars dim, small, unlabeled and not clickable, as Koda suggested.
- **Make the jump continuous:** the jump animation flies toward the chosen star's direction, and the new system grows out of it.

**Open questions for Koda:**
- Does zooming out past the heliopause always enter this view, or only on a deliberate extra scroll?
- Should "jump" from the star's card (and X on the controller) open this view too?

### 3. Leaderboard (done 2026-10-25)

**Built:**
- A trophy button in the HUD's left column opens a slide-up menu, ranked by planets or by credits, with ports alongside.
- It shows the top eight, plus your own row (highlighted) if you're further down.
- It's cached for a minute, and Refresh reloads it.
- The house account ("The Federation") is left out.

**Data:** `sdk/leaderboard.js` loads it, and `sdk/chain/batch.js` batches the reads through Multicall3 where available.

**Checked on Sepolia** (read-only, as Koda's address): 8 ranked pilots in about 1 s. Koda ("Cloud") is #4 on planets.

**Koda's defaults to revisit:** the columns, the placement, and whether the house account should appear.

The original analysis:

Checked against the contracts and the local chain:
- **Players:** every player who has launched a ship owns a ship NFT. `ShipTokens` is `ERC721Full` (OpenZeppelin 2.x), which includes Enumerable, so `totalSupply()`, then `tokenByIndex(i)` and `ownerOf(token)`, lists them all. Players without a ship have no planets or credits.
- **Planets owned:** `PlanetTokens.balanceOf(player)`. In-game ownership *is* the NFT (`getPlanet` and the claim checks use `ownerOf`), so this is exact.
  - Unclaimed planets sit with the game. On the local chain the deployer, "The Federation", holds them, so leave the game contract and the token owner off the board.
- **Credits:** `Credits.balanceOf(player)`. That's the current balance; lifetime earnings would need event scanning, which isn't practical.
- **Optional "ports" column:** `tokenOfOwnerByIndex` for each owned planet, then `getPlanet().hasStation`. That's one more read per planet.
- **Cost:** about 4 reads per player, plus names.
  - With Multicall3 (deployed at the same address on most public networks, but not on the local chain; check at runtime and fall back to plain calls), it's one or a few requests for hundreds of players.
  - Without it, still seconds.
  - Load when the leaderboard opens, and refresh at most every minute or so.
- **Not possible without scanning everything:** "most systems discovered". It needs `getSystemData` to be public, or events.

**Open questions for Koda:** which columns (planets, credits, ports, ships), and where it lives (a HUD button, the title screen, or both).

### 4. NFT market links (done, 2026-10-25)

OpenSea shut down every testnet with its OS2 launch ([support article, 2025-07-23](https://support.opensea.io/en/articles/11833955-farewell-testnets)), so the old "View on OpenSea" links (Rinkeby, Mumbai, BSC testnet) all went nowhere.

Koda chose Rarible. Each network in `networks.js` can now name an `nftMarket`; Sepolia's is Rarible's testnet.
- Planet and ship cards show "View on Rarible", which opens the token on the planet or ship contract.
- Networks without a market show no button.
- Checked on Rarible: Sepolia planet 3 and ship 0 both have pages. The ship page is complete (name, image, owner).

**A working market on Sepolia: Rarible's testnet.** It has already indexed the planets (31 items, 6 owners) and shows owners, bids and "not for sale". Link format: `https://testnet.rarible.com/token/<planet token>:<id>`. Checked 2026-10-25.

**Metadata (checked 2026-10-25):** the contracts' `tokenURI`s point to a Laravel app on `orbiter8.com`. The server code isn't in this repo.
- `tokens/credits` and `tokens/ship/<id>` work.
- **`tokens/planet/<id>` hangs** until the request times out, and `tokens/planet/<id>.json` returns a Laravel 500.
- The likely cause is that the planet endpoint reads the chain through an RPC that no longer answers; the ship endpoint doesn't need the chain. That's a guess until Koda checks the server's code.
- Until it's fixed, every market and explorer shows planets as "Untitled" with no image.

### 5. The best of Enterprise Circuit (started 2026-10-25)

Koda wants the best parts of Enterprise Circuit (`/home/koda/dev/enterprise-circuit`, his UI rebuild) brought into this client. They're taken **one at a time, together**: for each, before/after screenshots (this client's current screen beside Enterprise Circuit's), then Koda decides what to take, then it's built.

- Enterprise Circuit stays in its own repo. Bring over designs and art, adapted to this client's code (JS, Options API, `sdk/`, the frame loop), not its engine.
- Screenshots come from a scratch copy of it run against the local chain (see `docs/enterprise-circuit-walkthrough.md`).

Order (from the walkthrough's list). Tick each when it lands:
1. [x] **Onboarding:** Minerva's voice, the callsign card, the ship launch pad, and the title button that follows the player's progress.
2. [ ] **Network stats** on the connect screen ("N players exploring M star systems").
3. [ ] **Minimap.**
4. [ ] **Parallax star layers** on the canvas background.
5. [ ] **Art:** planet types with bands and rings, ship designs, stations, Minerva.
6. [ ] **UI scale setting.**
7. [ ] **Later ideas:** the About storyboard and the cockpit window.

**Step 1 decisions so far (Koda, 2026-10-25):**
- **Enterprise Circuit's title screen replaces the preflight checklist as the first screen.** Onboarding becomes a wizard, one step at a time.
- **Keep everything useful from the old checklist.** Each item gets a place in the new flow; see the inventory in the step 1 plan, once written.
- **The dev links on its title (Window, Portal, Tween, Assets, Ships) don't come over.** They were Koda's exploration screens.
- **The animation may be simplified.** It's rebuilt cheaply: CSS transforms on their own layers instead of 44 SMIL animations repainting the whole SVG (about 0.5 s of raster per 5 s at 1440×900, measured).
- **The station scene is a favorite.** Ships of various sizes are docked around the station, with shuttles (the small dots) going between the ships and the station.
- **Version number:** 3 for demo 3, 2 for the rebuilt client, and .X for each distributed build (e.g. 3.2.0).
- **The dark band behind the title menu** is there for contrast with the menu (Koda took it from another design he liked). Keep that purpose.
- **Emphasize the station.** Ship types are variations within one class: like a Klingon Bird of Prey beside the Enterprise, close in size, not wildly different.
- **"Swap on Sushi" is hidden for now.** Sushi's UI no longer supports testnets. Uniswap does, but has no Credits pool. The feature is kept as an idea for a real launch (see "Ideas for later").
- **The wizard outline is right:** title → wallet → network (only if needed) → callsign → ship → take command. The input fields can change to whatever works best.

**Step 1: every wallet and game state the wizard has to handle.** ✓ = handled today, ✗ = not handled (or handled badly), ~ = partly.

| | State | Today | In the wizard |
| --- | --- | --- | --- |
| Wallet | No wallet installed (desktop) | ✓ "install MetaMask, then reload" | Same, on the wallet step. |
| | No wallet on a phone (no extension) | ✗ same desktop message | Offer to open the game in MetaMask's in-app browser (a deep link). WalletConnect would be a bigger, later job. |
| | One wallet | ✓ connects automatically | Same. |
| | Several wallets | ✓ picker, remembered | Same, styled as a step. |
| | Returning player, already authorized | ~ asks for accounts at once (no popup if MetaMask already trusts the site) | Check silently first (`eth_accounts`), so the title can say **Continue** straight away. Ask only on a click. |
| | Popup open, waiting | ✓ "approve in its popup" | Same. |
| | Popup dismissed or rejected (4001) | ~ generic error, retry | Say plainly "You closed the wallet's request", with a Try again button. |
| | Request already pending (-32002) | ✗ generic error | "Your wallet already has a request open: click its icon in the toolbar." |
| | Wallet locked or no accounts | ✓ message | Same. |
| | Account or network changed mid-flow | ~ page reloads | Keep the reload; the wizard resumes at the right step because it's derived from the chain. |
| | Site disconnected in the wallet | ~ reload | Back to the title with Connect. |
| Network | On a supported network | ✓ | Skip this step. |
| | On another network | ✓ warning and chips | The network step: one button per network; Sepolia first for players, Local in dev. |
| | Wallet doesn't know the network (4902) | ✓ adds it | Same, without `alert()`. |
| | Switch or add rejected or failed | ~ `alert()` | An inline message with retry. |
| | RPC or contracts unreachable | ~ "Contracts not found, try reloading" | A Retry button, not a reload. |
| Funds | Zero balance | ~ "low balance warning" | **Blocks the next step**, shows the faucets, and moves on by itself once funds arrive. Every later step needs gas. |
| | Low balance | ✓ warning | Same. |
| Game | Loading game data | ✓ "...loading" | A loading state on the title button. |
| | No callsign / no ship / ready | ✓ | Begin, Launch, Continue. |
| Transactions (callsign and ship, same for both) | Waiting for the wallet | ~ | "Confirm in your wallet". |
| | **Rejected or failed** | **✗ stuck: the error is only logged and the screen never moves on** | Back to the form with the reason; the typed name is kept. |
| | Sent, waiting to be mined | ~ | "Transmitting…" with an explorer link to the transaction; reassurance if it's slow. |
| | Reverted (e.g. "You already have an avatar." from a second tab) | ✗ | Show the reason; re-read the chain and move on if the avatar exists. |
| | Replaced (sped up in the wallet) | ✗ | ethers reports it: treat a repriced replacement as success. |
| | Page reloaded or closed while pending | ✗ the form shows again, and a resubmit reverts | Remember the pending transaction (localStorage) and resume "Transmitting…". |
| Names | Empty, spaces only, very long, emoji | ~ only empty is refused, by `alert()` | Trim it, 1–24 characters, a live preview on the pilot card, and an inline hint. **The contracts accept any string and don't make callsigns unique.** That's for the contract wish list. |
| Audio | Music before any click | n/a (Play was the first click) | **The first click on the title starts the music**, whatever the button is. |
| Motion | Reduced motion | ✗ | The title animation holds still. |

**Step 1 build plan (Koda signed off, 2026-10-25). Done 2026-10-26.** Each step is its own commit; tick it off when it lands:
1. [x] **Version.** `package.json` becomes 3.2.0, and Vite bakes it in as `__APP_VERSION__`; dev builds add the commit (`3.2.0-dev+abc1234`). Release builds: `npm version patch`.
2. [x] **Art from Enterprise Circuit.** Its ship designs (Orbiter 8, Polygon, Boba, Moonbeam, with engines), the station, and Minerva's badge go into `src/components/assets/`, as small SVG components.
3. [x] **The title scene** (`components/title/title-scene.vue`):
   - The backdrop and stars are drawn once on a canvas (`backdropShapes`). Each moving part is its own layer, animated with CSS `@keyframes` on `transform`, so nothing repaints per frame.
   - **The sun:** two ray layers turning in opposite directions, with a slow shimmer.
   - **Ships:** three ships circling the sun, and one ship drifting across the screen.
   - **The planet and station, featured:** bigger than in Enterprise Circuit. Docked ships are close in size, varied within one class. **Shuttles fly** from each docked ship to the station and back, with short trails and staggered timing.
   - Everything holds still under "reduce motion".
4. [x] **The title menu:**
   - the dark band for contrast, the logo, and one main button that follows the player (Connect, Begin, Launch, Continue, or a loading state);
   - Network and Settings buttons, and the version at the bottom left;
   - **the first click anywhere starts the music** (`08audio.js` retries after a blocked autoplay).
5. [x] **The onboarding logic**, kept out of the components:
   - **`libs/onboarding.js`:** works out the current step from the stores (wallet, network, funds, game data, callsign, ship, a pending transaction), with tests covering the state map above.
   - **Wallet:** a silent check for returning players (`eth_accounts`); plain messages for 4001 and -32002; a phone link into MetaMask's own browser.
   - **Transactions:** pending callsign and ship transactions are remembered across reloads; a replaced transaction counts as success; failures come back as a reason.
   - **SDK:** `listCallsigns()` reads every callsign once (`getAvatarCount` + `getAvatarNameById`, batched), so the "taken" check costs nothing per keystroke. It's a hint only: the contracts allow duplicates.
     - **Works today, not at scale** (Koda): the player count has no limit. It only loads while there are 2,000 callsigns or fewer; above that the hint is skipped. The real fix is a contract lookup (see the contract wish list).
6. [x] **The wizard steps,** in Minerva's panel with step dots and a way back to the title:
   - **Wallet** and **Network**, including the funds gate with faucets, which moves on by itself when funds arrive.
   - **Callsign:** a real text box, the pilot card filling in as you type, trimmed to 1–24 characters, and "already taken" shown as you type.
   - **Ship:** the launch pad with the fleet behind it, and smoke while pending.
   - **Shared transaction states:** confirm in wallet, transmitting (with an explorer link), success, failed (with the reason, back to the form, name kept).
   - **Take command:** the welcome-back stats.
7. [x] **Network and Settings panels.**
   - **Network:** the old status report, with contracts and explorer links, import Credits, faucets, and balance. The Sushi link is hidden.
   - **Settings:** music, effects and graphics.
8. [x] **Wiring.** The title is the first screen; the preflight checklist and the old onboarding screens go; `/play` needs a loaded game and a ship. The harness's `capture.sh` follows the new flow (and loses the removed jump-menu steps).
9. [x] **Verify:**
   - harness screenshots of every state on the board, beside Enterprise Circuit's;
   - a title performance trace against Enterprise Circuit's (0.5 s of raster per 5 s);
   - lint and tests.

**Step 1 results (2026-10-26):**
- **Checked on the local chain with the harness.**
  - The full flow with a fresh account: title → Begin → Minerva's welcome → call sign ("vega" flagged as taken) → success → ship → launch → Take Command → the game.
  - Every wizard state, set through the stores: no wallet, connecting, declined, wrong network, unreachable node, no funds, low balance, transmitting, failed, back to the form.
  - The Settings and Network panels, and a returning player's title (Continue, with a welcome line).
  - **Reloading while a registration waits to be mined** (mining paused): the wizard reopens on "Transmitting…" and moves on to success when the block is mined.
- **Performance:** 5 s of the animating title at 1440×900 cost 0 ms of raster, paint, style and layout. Enterprise Circuit's title costs 495 ms of raster. What's left is the block watcher's regular check.
- **Found along the way:**
  - **The Ubuntu font never loaded for players.** The `@import` sat inside a CSS rule, where browsers ignore it, so only machines with Ubuntu installed (like Koda's) showed it. It now loads from `index.html`, along with Ubuntu Mono.
  - **The parked gamepad support polled every frame on every screen,** about 0.4 ms per frame. It now waits for `gamepadconnected`.
- **Not checked:**
  - real wallet popups (MetaMask's approve, decline and speed-up), and the phone link into MetaMask's browser;
  - claiming from the new Sepolia faucets (the links load);
  - Firefox.
- **For Koda:**
  - **Continue goes straight into the game.** The old welcome-back screen's stats moved onto the title, under the button.
  - **The station:** four ship designs docked nose-in, eight shuttles, the port turning once every 150 s. Positions and timings are constants at the top of `title-scene.vue`.
- **The departing ship (Koda, 2026-10-27):** replaces the separate drifting ship. Code in `libs/title-flight.js`, with its timings at the top of the file.
  - **The loop.** One of the three orbiting ships leaves and comes back:
    1. It lights its engines, speeds up and closes in on the sun.
    2. It makes about three fast laps, then slingshots off the top right.
    3. It flies past the viewer: far off at the top right, close at the lower left.
    4. It comes back in from the left and slides into its old place.

    The loop repeats every 90 s, and the first departure comes 8–23 s after the page opens.
  - **How it's driven.** The other two ships still turn with CSS. The departing ship is placed each frame from that same CSS animation's clock, and the whole loop is a pure function of that clock, so it always rejoins its own empty place. It never drifts out of step, even after the tab was hidden. The fast laps run up to 2 s longer as needed, so the slingshot always leaves from the top of the sun, heading right.
  - **The flyby is in perspective.** It closes at a steady speed in depth, so on screen it speeds up as it nears; before, it moved at a steady pace and seemed to slow down. Crossing the logo, it fades behind the menu's dark band, like smoked glass, and comes out bright and close below it.
  - **Engine flames show again.** Copying the ship designs from Enterprise Circuit lost the flames' widths (all 0), so no ship ever showed them. The departing ship uses a stronger plume (`engineTrailGradient`), so the trail reads even at orbit size.
  - **Tests:** `title-flight.test.js` checks that the ship never jumps while on screen, that it leaves from and returns to its own place, and that the first departure comes soon after the page opens.

**Ideas for later (Koda, 2026-10-25):**
- **Engine trails:** ships that jumped recently arrive with fading engine trails.
- **Owner colors:** each player gets a color derived from their address (a hash to a hue), with no contract change. A later contract could let players choose their own. Uses: faint rings on claimed planets, ship trails, the leaderboard.

- **Shuttle traffic at in-game stations,** especially when selected. Eventually the docked ships would be the players who recently traded there, with shuttles in proportion. Koda wants this kind of living detail in many places.
- **A Credits swap.** Where to put a pool depends on the launch network. Decide it with the launch.

**Steps 2–7 plan (Koda, 2026-10-26: "keep going through the steps as long as you can"; he's away).** Decisions I'm unsure of go into the review doc ([Orbiter 8: Decisions to Review](https://claude.ai/artifact/NFFPZXFd4rvEDW7k3T47wi)). Each step is its own commit; tick it off when it lands:
- [x] **2. Network stats.** Done 2026-10-26: Sepolia 11 pilots / 66 systems, BNB testnet 13 / 47, Moonriver 6 / 39, Moonbase 19 / 126 when checked. dRPC became Moonriver's third RPC; the official Moonbeam RPCs failed TLS from here, and unitedbloc sends no CORS headers. The calls go one at a time (dRPC refuses JSON-RPC batches). "N pilots, M star systems" for every network, read before switching (`getAvatarCount` + `getSystemCount`, two calls per network through its public RPC, cached). Shown on the wizard's network step and in the Network panel.
- [x] **3. Minimap.** Done 2026-10-26 (`hud/minimap.svg.vue`). It's scaled to the system's outermost orbit, not the heliopause: Sol's planets all sit within a sixth of the heliopause's radius, so a heliopause-sized map put every planet in the middle. Moons are left off (too close to their planets to tell apart). A click stops following the selection and moves the camera there. A small map of the current system in the HUD's top right, under the star button: the star, the orbits, the planets, the player's ship, and the camera's view as a box. Clicking it moves the camera there. Drawn on a canvas, redrawn only when something it shows changes.
- [x] **4. Parallax star layers.** Done 2026-10-26, as two layers rather than two canvases. Another full-screen canvas costs about 44 MB of GPU memory at 2× (the map already has two).
  - **Deep stars** are painted into the backdrop canvas, which never pans, so they read as infinitely far away and cost no memory. Moderate and Luxurious.
  - **Near stars** get one extra canvas that pans at 1/7 of the camera (the starfield pans at 1/20). Luxurious only.
  - **Original plan, for reference:** Two more star layers on the background canvas, at different depths, so panning feels deeper. Each is its own composited layer, like the existing starfield.
- [x] **5. Art.** Done 2026-10-26. Most of it is already at parity:
  - **Planets:** the same family (bands, rings, surface patterns). Enterprise Circuit's `luminanceRotation` (the lit side facing the star) is what this client already does: the sprite turns with its orbit while the surface turns back.
  - **Stations:** the same outline.
  - **Brought over:** the four ship designs and Minerva's emblem (in step 1), and now the launch pad's fleet mixes all four designs.
  - **Left for Koda:**
    - Giving other players' ships different designs (by ship id) would change the game's look for everyone; ships have no type on chain.
    - Network logos: Enterprise Circuit only has Ethereum and Moonbeam among this client's networks, so BNB and Local would have none.
  - **Original plan, for reference:** Look at Enterprise Circuit's planet art (bands, rings, named Sol planets), stations and ships against this client's, and bring over what improves the map without changing what the game means. Anything that changes how the game looks for every player is noted for Koda.
- [x] **6. UI scale.** Done 2026-10-26, as an "Interface size" setting (75, 100, 125, 150%, saved in a cookie) in the title's Settings panel and the in-game Settings menu. **Only the HUD's corner controls scale** (profile card, buttons, minimap, zoom slider, system name), each from its own corner. The full-screen menus and the selection cards stay as they are. Scaling the whole HUD, which was tried first, cut off the planets list at 150% on a 900 px screen. The original plan said: A Settings option (75–200%) that scales the HUD, kept between visits.
- [ ] **7. Later ideas.** Looked at 2026-10-26 and **not built: it needs Koda's content call.**
  - **The storyboard's six panels:** "By the year 2140…", "Still bound to our sun…", "That was until today! The first starships have arrived.", "Orbiter 8 is an MMO … for the EVM.", "Introducing Portals!", "Portals are Bridges…".
  - **Panels 4–6 are the Bobabeam hackathon pitch.** Portals don't exist in this game, and "for the EVM" is pitch language.
  - **Porting means about 20 Enterprise Circuit components (~2,000 lines):** the named Sol planets, moons, stations, portal, logos, and the panels' SMIL animations.
  - **Options:**
    - panels 1–3 only, as a short intro story behind a "Story" button on the title, rebuilt with CSS animation like the title scene;
    - all six, verbatim;
    - wait for new story text.
  - The cockpit window stays an idea.
  - **Original plan, for reference:** The About storyboard (Enterprise Circuit's six panels, story text verbatim) as a "Story" button on the title. The cockpit window stays an idea.

### 5a. The Bobabeam Portals demo (looked at 2026-10-26)

`/home/koda/dev/orbiter8-multiverse-bobabeam` is a 2022 hackathon one-off (Boba × Moonbeam). Its idea: **flying through a portal is how a ship changes networks**, with the ship NFT bridged between universes. It has a six-panel story, then a screen to send a ship between Moonbase and Bobabase.
- **Little new for us.** Enterprise Circuit grew out of it: the story panels, portal, planets, Minerva and logos are the same art, or earlier drafts of what Enterprise Circuit has. When those come over (art in step 5, the storyboard in step 7), use Enterprise Circuit's versions.
- **Unique to it:**
  - the splash (a ship flying out of a portal);
  - the teleport screen;
  - the `MultiverseShip` L1/L2 contracts: an ERC721 ship bridged through Boba's standard bridge.
- **The contracts are a starting point for portals** in a future contract iteration. They're tied to Boba's bridge, and Bobabase's RPC no longer answers.
- **An idea for later:** the wizard's network step could present networks as portals to other universes. That ties network choice to the game's fiction.

### 6. UI review: seven improvements (Koda, 2026-10-27)

**The review, in short.** Orbiter's top-down command view is the right model. Sins of a Solar Empire, Stellaris, Supreme Commander, KSP's map view and Dark Forest all converged on it for games where you give orders rather than pilot. Zooming straight out of the system into the neighbor view is rare and good. A chase camera would be wrong here, because the ship moves only when a transaction goes through. The gaps are in what the map shows at each zoom level, and where the controls sit.

**Koda's notes (2026-10-27):**
- All seven sound great.
- The game was built to work on phones. The card's popup from the bottom must keep working there.
- He wants to see the side-panel concept. It will touch the ships list, the leaderboard and chat too.
- **Correction to the review:** Trade at Port and Dock at Shipyards do work. `enabled: false` only dims a card button's label; I misread `menu-button`'s check as `card-button`'s.

**Build plan** (each step is its own commit; tick it off here when it lands):
1. [x] **Map handling.**
   - The wheel zooms toward the cursor. While the camera follows a selection, it still zooms around that selection.
   - Dragging moves the map 1:1 with the pointer. It used to move at about half the pointer's speed.
   - Touch: one finger pans, two fingers pinch to zoom (pointer events). Pinching out past the system's edge opens the neighbor view, as the wheel does.
   - **Bigger click areas, for planets and the star only:** about 14 px, however small they're drawn. Moons, stations and ships are drawn after their planet, so a bigger area for them would steal the planet's clicks when zoomed out; step 4 folds them into the planet instead.
   - **Checked in the harness** (new steps `wheelat:`, `drag:`, `pinch:`):
     - the world point under the cursor stays put through a wheel zoom;
     - after a drag, the point that was under the pointer is still under it;
     - a pinch zooms by the fingers' spread and keeps the point between them in place.
2. [x] **Keyboard and tooltips.**
   - **Esc backs out one level:** the neighbor view, then an open menu, then the selection. It skips "hide the card": hiding it would also hide the card for every later selection.
   - **Space** selects my ship.
   - **Tab and Shift+Tab** (or `]` and `[`) step through the planets.
   - These keys do nothing while you type in a text field.
   - The keyboard and the gamepad's B and L1/R1 now share the same store actions (`back`, `stepPlanet`).
   - Every HUD button has a tooltip, naming its key where it has one.
   - **Fix:** ship icons in the ships menu were scaled by `NaN` (ships have no `size`), so none was drawn.
3. [x] **Every transaction shows its progress.** A tray at the top center (`components/transaction-tray.vue`, `stores/transactions.js`) follows each action through four steps:
   1. "Confirm it in your wallet";
   2. "Sent: waiting for the network";
   3. done ("Mars is yours");
   4. or declined in the wallet, or failed with the contract's reason ("Couldn't claim Barsoom: Must be unclaimed planet.").

   Done and declined entries clear after 4 s; failed ones after 15 s, or with their ×.
   - **Covers** claims, stations, renames, trades, cargo holds and chat. Jumps keep their own animation; registration keeps the wizard.
   - **Every SDK action now takes `{ onSent }`,** not just jumps and registrations.
   - **Fixed:** the trade and shipyard menus said "Transacting..." forever, even after a failure. They now come back:
     - after a trade, set to zero for the next one;
     - after a failure, with the same amounts, so the player can try again.
   - **Checked on the local chain:**
     - a ship rename showed "Renamed to Rocinante II";
     - claiming an owned planet showed the revert reason.

     The local chain mines at once, so the two waiting steps only flash by there. `transactions.test.js` covers them.
4. [x] **A readable zoomed-out system** (strategic zoom).
   - **Orbit rings** are never thinner than a pixel (two when selected). Their width was in world units, so they vanished when zoomed out.
     - **For Koda:** at middle zooms, rings that used to fade to near-invisible hairlines now show as clean one-pixel dotted paths.
     - Close in, they look as before.
   - **Minimum sizes.** Planets are never drawn smaller than a 4 px radius, and the star never smaller than 7 px. Above that they're their true size.
   - **Folding.** A moon, station or ship whose orbit would sit inside its planet as drawn is hidden. My ship and the selection never fold.
   - **Names.**
     - They scale with the world as before, but stay between 12 and 20 px on screen.
     - Planets and the star show their names by themselves until they're 40 or 60 px across.
     - My ship shows its name and a ring when zoomed out.
     - The labels button still shows every name.
   - **Names never overlap.** Every sprite showing a name offers it to `libs/label-layout.js`. Several times a second the map places them, most important first: the selection or hover, then the star, my ship, then planets by size. Each goes below its sprite if there's room, else above, else it waits until there's room. Tested in `label-layout.test.js`.
   - **Before and after** at whole-system zoom: a few dozen unlabeled dots with no rings, against nine labeled planets on visible rings.
5. [x] **The neighbor view helps choose a jump.** Under each star's name, a status:
   - "where you came from", with its route drawn a little brighter;
   - "you've been here";
   - "already charted" (named by someone);
   - "be the first to arrive".

   - **Less than planned:** the contracts only describe the system you're in. A neighbor is just an id and a name, so its planets, ports and pilots can't be shown. That needs a contract read like `getSystemSummary(id)` (added to the wish list below).
   - **Where the history lives:** your visits are remembered on this device (`sdk/explored.js`). The visit before the latest one is where you came from, even after a reload.
   - **Fix:** the world's new automatic names (step 4) showed faintly through the neighbor view; they're hidden there now.
   - **Checked:** a real jump from Sol to #2 on the local chain; the neighbor view there marked Sol as where you came from. Tested in `explored.test.js`.
6. [ ] **A side panel** (an outliner beside the map). **Built (`62bbca1`), then reverted at Koda's request (`e3e3750`).**
7. [ ] **One inspector instead of two cards.** **Built (`09a8e23`), then reverted at Koda's request (`975a3a0`).**

   **Koda's verdict (2026-10-27):** the new panels looked far worse than the originals.
   - **Ports lost their trade codes.** The three letters (e.g. BBS) that say what a port buys and sells were gone.
   - **The left card is meant to look like a playing card,** tying in with ships and planets being NFTs. That was lost.
   - **The game is menu driven.** "The buttons are the game"; it isn't an action game, so big menus make sense.

   **Restored:** his cards and the planets and ships menus, as they were.
   **Kept:**
   - Trade at Port and Dock at Shipyards marked enabled, so they aren't drawn dimmed. They always worked.
   - The trade and shipyard menus no longer stuck on "Transacting..." (step 3).

   **For the future:** keep his card and menu art. Change placement or behavior, not the look, and only with his go-ahead.

**Checks after all seven (2026-10-27):**
- **`capture.sh` on a fresh chain:** the whole new-player flow and every screen, with no console errors.
- **Pan and zoom, before and after the seven steps** (the same 10 s scripted session on the dev server, two runs each):

  | | Before | After |
  |---|---|---|
  | fps | 59.5 / 59.7 | 59.6 / 60.0 |
  | Script | 1,186–1,288 ms | 1,310–1,371 ms |
  | Paint | 132–135 ms | 173–182 ms |
  | Raster | 736–757 ms | 865–903 ms |

  The frame rate is unchanged. Paint and raster rose about 20–30%, because rings and names that used to be invisible are now drawn. Script time rose slightly, mostly from the label layout (every 150 ms).

**After these, to walk through with Koda** (his ideas, 2026-10-27):
- other players' ships fly from orbit to orbit when they move, instead of jumping;
- my ship sets off at once toward whatever I select, client-side only, and flies back to its real place when I deselect;
- Bobabeam's pink and yellow as sparing accent colors (started below, as step 7).

### 7. In-game dialogs, and the Portals demo's two accents (Koda, 2026-10-27)

Koda: "please make pretty input boxes for those things", then "look at the two colors I mentioned from the Portal demo... take a shot at how they should be used... and make corrections from there".

1. [x] **An in-game dialog instead of the browser's boxes.**
   - **Covers:** claiming a planet, building a station, renaming, and sending a broadcast. It also replaces the five "coming in a later demo" notes (factories, moon defences, port upgrades, transfers, attacking).
   - **Look:** drawn like the selection card: the striped purple frame, the wide rounded corners and the name pill. The buttons are the card's pills.
   - **Names follow the callsign rules:** up to 24 characters, trimmed, with a hint as you type. The confirm button stays off while a name is empty or too long. Broadcasts are capped at 120 characters.
   - **Claiming** now asks once (the name, with Claim or Cancel), instead of a yes/no box followed by a name box. **Renaming** starts with the current name selected.
   - **Keys:** Enter confirms, Escape cancels. While the dialog is open, keys and the wheel don't reach the map.
   - **Two typos fixed** in the notes' wording: "coloinists" and "prouction".
   - `stores/dialog.js` (`ask`, `tell`) and `components/game-dialog.vue`.
2. [x] **The accents** (`libs/palette.js`; CSS variables in `App.vue`). Moonbeam's pink `#e1177c` and Boba's yellow `#ccff00`, the pair the storyboard's last panel uses. Each color gets one meaning, so it stays rare and readable.
   - **First try, corrected by Koda:** pink was the action color (Make Trade, Upgrade, Send Broadcast, Jump, the title's main button, the dialog's confirm). Koda: on Make Trade it reads as **red, which feels like danger or overspending, on a button that makes you money**. So pink is never a button now, and the buttons keep the game's purples.
   - **Yellow is you, and what's good for you:**
     - the ring round your ship when zoomed out, and your dot on the minimap;
     - the names on the map of your ship and of what you own;
     - "Mine" on a card;
     - your row in the leaderboard, and the planet you're orbiting in the planets list;
     - your name on your own broadcasts;
     - in the neighbor view, the route back to where you came from;
     - **Koda's idea:** in the planets list, a port's **B** is yellow when it buys something your ship carries.
   - **Pink needs you:**
     - the tray's spinner while a transaction waits for your wallet (lavender once it's sent);
     - a failed transaction;
     - a name too long for the dialog.
   - **Everything else stays purple and lavender,** buttons included. The dialog's confirm is lavender, like the title's primary buttons. Selection and hover stay white and lavender.
3. [x] **The star chart's grid removed** (Koda: it made sense when systems were empty and a drag needed something to show movement; now it's clutter). The spokes through the star, the ticks on the axes and the square grid are gone from `guides-canvas.vue`; the background stars still show a drag. **Not a performance problem:** the grid was drawn only when that canvas redraws (zooming, selecting), never while panning.
4. [x] **The title's departing ship builds up speed the whole time it spins** (Koda: "the idea is that spinning around the sun helps build up the speed to get to another star"). It used to reach full speed in 5 s and hold it. Now its speed rises with the square of the time, from orbit speed to 280°/s as it leaves: about 20 units/s at the start, 90 at 5 s, 220 at 8 s, 370 at the slingshot. The spin lasts 8 to 11.7 s so the exit still lines up; the slingshot's own speed-up is 1.9× (was 3×), so its top speed is what it was.

## Sizes and speeds: history

**2026-10-27: Enterprise Circuit's proportions and speeds adopted** (Koda: "let's go with the overall EC settings for size and speed").
- **How it was chosen:** temporary sliders (`b5e4f3f`, reverted in `e492b73`) went from a half step below the old look (1) through the old look (2) and halfway (3) to Enterprise Circuit's (4) and a half step beyond (5). Koda picked 4 for both. To try other values again, bring the sliders back with `git show b5e4f3f`.
- **Orbit distances didn't change** (`sdk/game/orbits.js`: planets `150 + 50p + 15p²`, moons, stations and ships as before). Only body sizes and orbit speeds changed.
- **Sizes match Enterprise Circuit's proportions, not its raw units.** Its system is about 2.9× larger (Pluto's orbit 4,340 against 1,510), so:
  - planets and the star are sized against the whole system;
  - moons, stations and ships against their orbit around their planet.
  The code is `spriteScaleOf()` in `libs/sprite-types.js`.

**Sizes** (world units per sprite unit; the art's radius is 130 for the star, 10 for planets, 2 for moons, 7.25 for stations, and a ship is 11.5 long):

| | Before | After (Enterprise Circuit's proportions) |
| --- | --- | --- |
| Every type | `0.02 × size + 0.1` (ships: size 10) | One formula per type, below |
| Star | radius `130 × (0.02s + 0.1)`: 15.6 (size 1) to 28.6 (size 6) | radius `R × 13 × (s + 0.5)`: 6.8 (size 1) to 29.4 (size 6) |
| Planet | radius `0.2s + 1` (Earth 3.4, Pluto 1.2) | radius `R × 10 × (s/16 + 0.5)` (Earth 4.35, Pluto 1.96) |
| Moon | radius `2 × (0.02s + 0.1)` | `4(s/12 + 0.5) / (65 + 30m + 1.5·planet)` of its orbit (about 2.5× bigger) |
| Station | radius `7.25 × (0.02s + 0.1)` | `290(s/1000 + 0.02) / (40 + 1.5·planet)` of its orbit (about 1.3×) |
| Ship | length 3.45 | `9.2 / (12 + 1.5·planet)` of its orbit, or `9.2 / 240` around the star (about the same at planets; half around the star) |

- `R` is `1510 / 4340`, Pluto's orbit here over Enterprise Circuit's.
- The range of star sizes widened a lot: the biggest is now 4.3× the smallest, where it was 1.8×. Most stars got smaller; Sol (size 4) is 0.87×.

**Speeds** (units: radians per game ms divided by `ORBIT_SPEED_SCALE`, 5e-9; Enterprise Circuit's "periods" are radians per ms divided by 1e-7, hence the factor of 20):

| | Before | After |
| --- | --- | --- |
| Planet | the contract speed `v` | `20 × (v / (position + 1) + 5)`: outer planets slower, with a floor |
| Moon | `v × orbit radius` (outer moons faster) | `20 × (4v / (position + 1) + 100)` (outer moons slower) |
| Station | 3,000 | `20 × max(50, (50 − planet size) × 10 + 150)` |
| Ship | `2000–2900` by id | 8 × that (`16,000–23,200`), around Enterprise Circuit's 20,000, kept varied so ships at one planet don't move in lockstep |
| Sol's Mercury / Earth / Pluto, one orbit | 84 min / 7 h / 14.5 days | 4.1 min / 48 min / 3.4 h |

**2026-10-27, later: speeds halfway back** (Koda: Enterprise Circuit's speeds "look good, real good, but now it's hard to click on things because they move so fast... go with a speed halfway between the current and the original"). Halfway is the geometric mean of the two formulas, `√(original × Enterprise Circuit)`, the same "halfway" as step 3 on the tuning sliders. Sizes are unchanged.

| | Original | Enterprise Circuit | Now (halfway) |
| --- | --- | --- | --- |
| Sol's Mercury, one orbit | 84 min | 4.1 min | 18.5 min |
| Sol's Earth, one orbit | 7 h | 48 min | about 2.4 h |
| Sol's Pluto, one orbit | 14.5 days | 3.4 h | about 34 h |
| Ships | 2,000–3,000 | 8× | √8× (about 5,660–8,480) |

A planet or moon whose contract speed is 0 used to stand still. Its original speed counts as 1 here, so it still moves.

## Contract wish list (next contracts iteration)

- **A neighbor summary:** a read like `getSystemSummary(systemId)` returning a system's name, planet count, port count and the number of ships there. The neighbor view could then show what each jump leads to (UI review step 5).
- Events for every game action (claim, build station, jump, rename, trade…), so the client can update from events instead of reloading.
- Access control on the admin setters (see Bugs, "Found, not fixed").
- A public `getSystemData(id)` (or `getSystemNeighbors(id)`), for the neighbor-star view's outer ring and a "systems discovered" leaderboard column.
- Named return values in the ABI, so tuples decode by name. The client's `sdk/chain/decode.js` is the only place that would change.
- **Design for any number of players** (Koda, 2026-10-25: the game can have as many players as Ethereum has users). Anything the client gets by reading *every* player stops working as the game grows:
  - **Callsigns:** a name lookup (`isCallsignTaken(name)`, or a name → owner mapping that also enforces uniqueness). Today the contracts allow duplicates and empty or very long names, and the client can only check by reading every callsign.
  - **The leaderboard:** it reads every ship and its owner's holdings. It needs either events plus an indexer (a subgraph or similar), or on-chain running totals the client can page through (top N).
  - Name rules on chain: a length limit, at least.

## Proposed refactors (bigger than a day; not started)

1. **HUD and menus to HTML/CSS.** This was deferred in Phase 5 (option A) and should be folded into Koda's UI rebuild.
   - Its colors should become CSS variables. The palette (`#c3b3da`, `#280b4b`, `#5c1aae`…) appears about 300 times in the SVG art, mostly with a per-use alpha, so binding it to JS constants in SVG wasn't worth the churn.
2. **Event-driven updates once the contracts emit events for every action.**
   - Today the client checks each new block for transactions to the game's contracts, then reloads the whole system.
   - With events it could apply just the change: a planet claimed, a station built, a ship moved.
   - `chain/contracts.js` `gameChangedBetween` and `stores/starmap.js` `loadStarMap` are the two places to change.
3. **Load the star map in parallel.** `loadStarMap` reads planets, moons, stations and ships one call at a time. Batching them (`Promise.all`, or a multicall) would cut load time on remote networks a lot.
4. **Store restructuring.**
   - The UI store (about 420 lines) mixes camera motion, menus, selection and the jump sequence. A camera store or composable, separate from menu state, would make each easier to follow.
   - The stores' generic `setProp({ key, value })` setters could become plain assignments.

## Architecture: data flow

### Before Phase 6b (step 1 has since moved loading, actions and block watching into `src/sdk/`; see Phase 6b)

```
wallet ─ chain/wallet.js ─┐
                          chain/contracts.js   every contract call; bigint → number; gameChangedBetween()
                               ▲
stores/chain.js      polls blocks every 2 s; if a block touched the game contracts, triggers all three loads:
  ├─ stores/gamestate.js  loadGameState(): player, ship, credits   loadEvents(): chat, trades, launches
  │                       actions: moveToSystem, tradeAtPort, claimPlanet… (some also drive UI state, e.g. the jump animation)
  └─ stores/starmap.js    loadStarMap(): reads system → planets → moons → stations → ships one call at a time,
                          decodes contract tuples by position (planetBase[2][0] …) → importStarMapBlockData()
                          → Sprite objects (game data + drawing data mixed) keyed 'planet:3' etc.
stores/ui.js         camera, selection, menus, jump sequence
components           read the stores directly; sprites re-render whenever the per-frame gameTime ticks
game/                pure math used by the stores and components
```

Problems this leaves:
- Contract data shapes leak into the stores.
- Sync is spread over three stores and tied to Vue.
- Actions reach into UI state.
- A contract redesign would touch the stores and the components.

### Target (Phase 6b)

```
src/sdk/                  no Vue; could become its own package later
  contracts adapter       the only code that knows ABIs and tuple layouts → named objects (planet.size, …)
  sync                    block watching (events once the contracts emit them) → one plain state object + subscribe()
  actions                 moveTo, trade, claimPlanet, buildStation, rename…; send the tx and report status, no UI
  rules                   today's src/game/
stores                    thin: subscribe to sdk state, expose it to components, hold UI-only state
renderer                  builds sprites (drawing data only) from sdk state; the frame loop moves them directly
```

Why (Koda and Claude, 2026-10-25):
- A contract redesign then changes only the adapter. Old and new deployments can run behind one interface during a migration.
- Sync becomes testable without a browser.
- Koda's rebuild can plug into the same layer.
- Doing it now, while the contracts are fixed, means the refactor can be checked against unchanged behavior.

## Plan

Each phase goes on `modernize` with its own commits. Bug fixes get separate commits.

1. **Phase 1, tooling.** Vite on Node LTS, with `.nvmrc` and `engines`. Keep the `@` alias and `.svg.vue` components. Scripts: `dev` / `build` / `preview` / `lint`, plus ESLint flat config with eslint-plugin-vue, and no reformatting. Bump the Dockerfile and CI image from node 16 to LTS. web3 + Truffle need Node polyfills under Vite. If that gets ugly, I'll do Phase 3's web3 removal first rather than fight the polyfills.
2. **Phase 2, Vue 3.** Via `@vue/compat`, then remove compat. Vuex → Pinia, one module at a time. vue-router 4. SVG `<a>` click handling, `xlink:href`, the lifecycle renames. Options API stays.
3. **Phase 3, chain layer.** ethers 6, with `@truffle/contract` and web3 removed. ABIs extracted to `src/chain/abi/*.json` and addresses to one per-network map. EIP-6963 wallet picker. Pruned network list (see the table), with working public RPCs. Contract wrappers that reject on error.
4. **Phase 4, known bugs.** One commit each.
5. **Phase 5, rendering.** Shared rAF loop. HUD and menus to HTML. Canvas backdrop, starfield and jump streaks. Wrapper pan/zoom with crisp commit on settle. Sprite split only if the profile says so.
6. **Phase 6, architecture and cleanup.** `chain/`, `game/`, stores, components. Naming, constants, dead code, Prettier in its own commit, Vitest for `game/` and `chain/` conversions.
7. **Phase 6b, data layer** (agreed with Koda 2026-10-25; see "Architecture: data flow" below). Behavior-preserving: the contracts don't change, and the captures and tests must match.
   1. ~~Move sync and actions into `src/sdk/`, with no Vue imports. Decode contract tuples into named game objects there.~~ Done; see the Phase 6b section.
   2. ~~Split game data from drawing data in `Sprite`.~~ Done; see the Phase 6b section.
   3. ~~Make the stores thin subscribers.~~ Done; see the Phase 6b section. At the same time:
      - remove `setProp`;
      - declare props (with types) and emits;
      - turn template-called methods into computed values;
      - switch ESLint to `flat/recommended`.
   4. ~~Add tests for the sync logic, against fixture chain data.~~ Done.
   5. ~~Frame loop: the loop writes sprite transforms directly, and Vue renders only on rarer changes (selection, labels, menus). This removes the `void this.gameTime` per-frame re-render. Measure it with the same trace.~~ Done.
8. ~~**Phase 7, verification.** Same harness: `docs/after/`, the trace comparison, paint flashing, a manual checklist for Koda, and the code review.~~ Done; see the Phase 7 section.

Not on this branch:
- Options API → `<script setup>`. Koda's rebuild should start in that style instead.
- Publishing the SDK as a package. Wait until the contracts settle and someone wants to build on them.
- Any contract change.

Tests (Koda's call was "only where they catch important things"): Vitest unit tests for `game/` math and `chain/` bigint conversions, plus the Puppeteer harness as a smoke test of the full flow against the local chain. No coverage chasing.

## Decisions (Koda, 2026-10-24)

1. **Network list:** approved as proposed for now. Moonriver stays, flagged as an odd one: a production network labeled "Alpha". Revisit later.
2. **Local play:** yes. Make it easy to run the whole game locally (`orbiter-client/dev/`).
3. **Types:** JSDoc for now. No TypeScript.
4. **Node:** target the current LTS (24) via `.nvmrc`.
5. **Phase 5 scope (2026-10-24): option A.**
   - The rendering core is in scope: canvas background, a separate world layer with compositor pan/zoom, and animation outside Vue reactivity.
   - The HUD and menus become their own overlay layer but **stay SVG**.
   - The HTML/CSS port of the menus waits for the integration of Koda's UI rebuild, which would replace them.
