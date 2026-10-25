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

The harness currently lives outside the repo. I propose adding it under `orbiter-client/dev/` (see "Decisions for Koda").

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

The baseline is the production build. The new build was measured on the **dev server** (unminified Vue with dev checks), which handicaps it, and it still wins. Phase 7 will re-measure a production build.

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

## Bugs

### Fixed

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

### 1. Gamepad support

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

### 2. Heliopause → neighbor-star view

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

### 3. Leaderboard (feasible with the current contracts)

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

## Contract wish list (next contracts iteration)

- Events for every game action (claim, build station, jump, rename, trade…), so the client can update from events instead of reloading.
- Access control on the admin setters (see Bugs, "Found, not fixed").
- A public `getSystemData(id)` (or `getSystemNeighbors(id)`), for the neighbor-star view's outer ring and a "systems discovered" leaderboard column.
- Named return values in the ABI, so tuples decode by name. The client's `sdk/chain/decode.js` is the only place that would change.

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
8. **Phase 7, verification.** Same harness: `docs/after/`, the trace comparison, paint flashing, a manual checklist for Koda, and the code review.

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
