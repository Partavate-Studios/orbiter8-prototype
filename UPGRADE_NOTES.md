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

### Found, to fix in the phase that rewrites that code

- **Lint findings:**
  - `moons-icon.svg.vue` registers a `Ship` component that is never imported, and imports `Moon` without using it.
  - `space-dock-icon.svg.vue` registers `Station` without using it.
  - `card-button.svg.vue` is named `Button`, a reserved HTML element name.
  - Plus an unused variable in `NetworkSelect.vue` and a useless assignment in `playgame.vue` `onWheel`.
- **Timer loops never stop.** `playgame.vue` `tick()` and `TitleScreen.vue` `checkBlockLoop()` reschedule `setTimeout` forever, and nothing cancels them on unmount. Leaving and re-entering a screen stacks more loops. The block poller keeps polling after you leave the title screen. Fix in Phase 4/5.
- The brief's Phase 4 bugs are all present as described: the starfield never renders because the local array overwrites `this.stars`, the compass `getDegreesFromXY` returns `1` instead of `180`, there are duplicate `planetGradient` / `ringGradient` / `engineGradient` IDs, and the `setTimeout` animation loops.

### Found, not fixed (contracts; out of scope this iteration)

- **No access control on Orbiter8 admin setters.** `setShipTokenizer`, `setPlanetTokenizer`, `setCreditTokenizer`, `setAvatarControls`, `genesis` and `makeSolarSystem` are `public` with no owner check. Anyone can repoint the live game's token contracts, which would break minting and credits for every player. Fixing this needs a contract change and a redeploy.

## Plan

Each phase goes on `modernize` with its own commits. Bug fixes get separate commits.

1. **Phase 1, tooling.** Vite on Node LTS, with `.nvmrc` and `engines`. Keep the `@` alias and `.svg.vue` components. Scripts: `dev` / `build` / `preview` / `lint`, plus ESLint flat config with eslint-plugin-vue, and no reformatting. Bump the Dockerfile and CI image from node 16 to LTS. web3 + Truffle need Node polyfills under Vite. If that gets ugly, I'll do Phase 3's web3 removal first rather than fight the polyfills.
2. **Phase 2, Vue 3.** Via `@vue/compat`, then remove compat. Vuex → Pinia, one module at a time. vue-router 4. SVG `<a>` click handling, `xlink:href`, the lifecycle renames. Options API stays.
3. **Phase 3, chain layer.** ethers 6, with `@truffle/contract` and web3 removed. ABIs extracted to `src/chain/abi/*.json` and addresses to one per-network map. EIP-6963 wallet picker. Pruned network list (see the table), with working public RPCs. Contract wrappers that reject on error.
4. **Phase 4, known bugs.** One commit each.
5. **Phase 5, rendering.** Shared rAF loop. HUD and menus to HTML. Canvas backdrop, starfield and jump streaks. Wrapper pan/zoom with crisp commit on settle. Sprite split only if the profile says so.
6. **Phase 6, architecture and cleanup.** `chain/`, `game/`, stores, components. Naming, constants, dead code, Prettier in its own commit, Vitest for `game/` and `chain/` conversions.
7. **Phase 7, verification.** Same harness: `docs/after/`, the trace comparison, paint flashing, and a manual checklist for Koda.

Tests (Koda's call was "only where they catch important things"): Vitest unit tests for `game/` math and `chain/` bigint conversions, plus the Puppeteer harness as a smoke test of the full flow against the local chain. No coverage chasing.

## Decisions (Koda, 2026-10-24)

1. **Network list:** approved as proposed for now. Moonriver stays, flagged as an odd one: a production network labeled "Alpha". Revisit later.
2. **Local play:** yes. Make it easy to run the whole game locally (`orbiter-client/dev/`).
3. **Types:** JSDoc for now. No TypeScript.
4. **Node:** target the current LTS (24) via `.nvmrc`.
