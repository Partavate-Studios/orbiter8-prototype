# Orbiter 8

Koda's on-chain space trading game: explore a hex galaxy, trade, claim and build up planets, fit
weapons, lay sieges. Solidity contracts in `contracts/` (Foundry), and a Vue 3 client in
`orbiter-client/` (Pinia, Vite, ethers 6, Vitest, SVG graphics).

**New to this repo? Read `docs/handoff.md` first:** where things stand, how to run and see the game,
and what to look at.

## Commands

- Node 24: `source ~/.nvm/nvm.sh && nvm use 24`. Foundry is in `~/.foundry/bin`.
- Play locally, from `orbiter-client/`: `npm run local`. It starts a fresh chain, deploys, and serves
  the game at http://localhost:8080 with a built-in dev wallet (no MetaMask). Add `?account=2`,
  `?account=3`… for other pilots. Every start is a full reset.
- **If Koda or another session may already be running it, use other ports:**
  `CHAIN_PORT=8546 UI_PORT=8092 npm run local`. Stop only your own processes, by PID: a broad
  `pkill -f "dev/local.js"` stops theirs too.
- Client checks: `npm test`, `npm run lint`, `npx vite build --outDir <scratch dir>`. (`npm run
  build` bumps the version; don't use it for checks.)
- Contracts, from `contracts/`: `forge test`, `forge build --sizes` (each must stay under 24,576
  bytes). After changing a contract's interface: `npm run abi` in `orbiter-client/`.

## Koda's standing rules

- **One project, current contracts only.** Demo 3, Demo 4… are releases, not separate games. The
  client works only with the current contracts. Don't stamp "Demo 4" (or `v4`) on names, labels or code.
- **Every feature of an earlier release survives**, working on the current contracts. A missing one
  is a bug, never a design call.
- **Keep the card and menu art.** The selection card looks like an NFT playing card; menus are big and
  menu-driven ("the buttons are the game"); ports show three-letter trade codes. Change behavior and
  placement, not the art. Before restyling an existing screen, show Koda a mockup.
- **Accent colors** (`orbiter-client/src/libs/palette.js`): yellow means you and what's good for you;
  pink means it needs your attention (waiting on the wallet, failures, sieges). Never pink on a
  profitable or positive button. Buttons stay in the game's purples and lavenders.
- **Phones matter.** Check every UI change at phone size too (`VW=390 VH=844` in the harness).
- **Play-test like a player:** one long session on one page, many moves, waiting for timers (scans
  take about 30 s). Checking each feature after a fresh page load has hidden real bugs.
- **Tests only where they earn their keep:** game math, chain conversions, critical flows, and the
  HUD's render smoke tests. Don't chase coverage.
- **Commit, never push.** Koda pushes. Commit messages explain what and why. Never commit keys,
  mnemonics, RPC keys or `.env` files.
- Ask Koda before dropping a feature, replacing a library, changing networks, or making visible
  changes beyond "faster and sharper". No testnet deploys until Koda chooses the network.

## Where things are documented

- `docs/demo4-plan.md`: decisions D1–D60, milestones with checkboxes, and calls B1–B54 (guesses made
  while building, for Koda's review).
- `docs/demo4-tuning.md` (economy and battle numbers), `docs/cost-estimates.md` (gas and money per
  move, and per release), `docs/design.md`, `docs/backstory.md` (the lore; don't change its text).
- `UPGRADE_NOTES.md`: the client's modernization history (older; some of it describes the old contracts).
- `orbiter-client/dev/harness/README.md`: the screenshot and play harness.
