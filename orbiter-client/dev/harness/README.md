# Visual and performance harness

Scripts that drive the game in headless Chrome (and Firefox) against the local chain. They take
screenshots to compare against `docs/baseline/`, record performance traces, and measure the things
the upgrade fixed. Use them to check that a change looks the same and isn't slower.

## Setup

- `npm run local` running (the local chain on :8545, the dev server on :8080).
- Google Chrome at `/usr/bin/google-chrome`, or set `CHROME_PATH`. Firefox scripts use `FIREFOX_PATH`.
- Python 3 with Pillow, for `diff.py`.
- Firefox installed as a snap can only use a profile folder inside `~/snap/firefox/common/`; pass one there to `ffps.mjs` and `ffjitter.mjs`.

`CPU_THROTTLE=4` slows the page's CPU four times (Chrome's throttling) for `explore.mjs`, which shows costs a fast machine hides.

Every script takes the game URL. With the dev server, use `?account=N` and `INJECT=0` (the app's own
dev wallet). For a production build, leave `INJECT` unset: `provider.js` injects a test wallet for
the address in `ACCOUNT`. `npm run build:local` builds a production bundle that knows the local chain.

## Scripts

| Script                                | What it does                                                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `capture.sh <url> <outdir>`           | **Resets the local chain** to its first snapshot, plays the new-player flow, then screenshots 16 screens and records a 10 s pan/zoom trace. Same names as `docs/baseline/`.    |
| `diff.py <outdir>`                    | Percent of pixels that differ from `docs/baseline/`, per screen. Star map screens differ a little run to run (orbits move).                                                    |
| `trace-summary.mjs <trace.json>`      | Main-thread and raster time by category from a Chrome trace.                                                                                                                   |
| `jitter-run.sh <outdir>`              | How far a selected ship, moon, station or planet moves on screen over 120 frames, at DPR 1 and 2. It should be 0.                                                              |
| `ffjitter.mjs <url> <profileDir>`     | The same in Firefox.                                                                                                                                                           |
| `idle.sh <outdir>`                    | 5 s traces while following the ship and with the whole system in view.                                                                                                         |
| `zoomset.sh <outdir>`                 | Screenshots at five zoom levels, for before/after comparisons of the world's look.                                                                                             |
| `paint.mjs <url> <outdir>`            | Screenshots with Chrome's repaint rectangles shown, at idle. Only moving things should flash.                                                                                  |
| `ffps.mjs <url> <profileDir>`         | Firefox frame rate with a ship selected and while wheeling out.                                                                                                                |
| `play-bot.js` | Load with `PRELOAD=dev/harness/play-bot.js`: a bot that plays through the client's own actions and logs each move's gas, credits, holds, time and RPC calls (`eval:bot.register('Name','Ship')`, `eval:bot.trade(20)`, `eval:bot.act('label', () => __o8game.actions.…)`, `eval:JSON.stringify(bot.log)`). Used for `docs/cost-estimates.md`. |
| `explore-bot4.mjs [moves] [account] [out.json]` | Demo 4 (`npm run local4` running): a pilot that explores outward from Sol in Node, carrying scan proofs along with its moves, and logs each move's gas. |
| `trade-bot4.mjs [moves] [account] [out.json]` | Demo 4: a pilot that starts a session key, then trades at Sol and fits bays with it, logging each action's gas. |
| `fake-gamepad.js` | Load with `PRELOAD=dev/harness/fake-gamepad.js`: replaces the browser's gamepads with one the steps can press (`eval:__pad.press(0)`, `__pad.hold(7, 1)`, `__pad.stick(0, 1)`, `__pad.release()`). |
| `explore.mjs <url> <outdir> [steps…]` | The driver the others use. Steps: `wait:ms`, `click:text`, `clickxy:x,y`, `type:selector=value`, `key:k`, `wheel:deltaY:times` (over the center), `wheelat:x,y:deltaY:times`, `drag:x1,y1,x2,y2`, `pinch:x,y,fromDistance,toDistance` (two touches), `shot:name`, `offline:on` / `offline:off` (cuts the page's network), `eval:js`, `commit:Store/action=json`, `trace:name`, `idletrace:name`. |

Example, from `orbiter-client/`:

```sh
INJECT=0 dev/harness/capture.sh "http://localhost:8080/?account=1" /tmp/after
python3 dev/harness/diff.py /tmp/after
```

`commit:` steps use a store hook that only exists in dev builds, so `capture.sh` needs the dev server.
