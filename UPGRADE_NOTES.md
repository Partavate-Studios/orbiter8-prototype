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

## Bugs

### Found, to fix in the phase that rewrites that code

- **`_ship-scene.vue` renders an undefined `ship` and duplicate `NaN` keys.** The Vite dev server shows Vue warnings that the old production build hid. On the ship-creation and launch screens: "Property or method `ship` is not defined", and "Duplicate keys detected: 'NaN'" from a `v-for`.
- **Lint findings:**
  - `moons-icon.svg.vue` registers a `Ship` component that is never imported, and imports `Moon` without using it.
  - `space-dock-icon.svg.vue` registers `Station` without using it.
  - `card-button.svg.vue` is named `Button`, a reserved HTML element name.
  - Plus unused variables in `NetworkSelect.vue` and `store/actions.js`.

- **Contract wrappers swallow errors and never settle.** Almost every method in `contract-interfaces/galaxy.js` and `avatar.js` catches the error, logs it, and never resolves or rejects. If any call fails, the UI hangs forever. For example, the preflight check stuck at "Game: ...loading" while the RPC was slow. Fix in Phase 3, when these wrappers are replaced.
- **Timer loops never stop.** `playgame.vue` `tick()` and `TitleScreen.vue` `checkBlockLoop()` reschedule `setTimeout` forever, and nothing cancels them on unmount. Leaving and re-entering a screen stacks more loops. The block poller keeps polling after you leave the title screen. Fix in Phase 4/5.
- **`openMenu` doesn't clear `tradeMenu`.** In `store/ui/mutations.js`, switching from the trade menu to another menu leaves both open.
- **`<circle>` with empty `cy`.** The browser logs "attribute cy: Unexpected end of attribute" on every map load. Source not located yet.
- **`Method eth_getLogs is not supported`** is thrown as an uncaught page error during the event polling (`loadEvents`, `getPastEvents` with `fromBlock: block - 10`). Under investigation.
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
