# Brief: the apartment's radio, and music for a new star

**For:** a Claude session (Fable) working in this repo, `/home/koda/dev/orbiter8-prototype`, branch
`polkadot`. Written 2026-11-20 from Koda's direction, for after your intro rework. Read `CLAUDE.md`
first (the project's rules), then this.

Two features:
1. **A Music option in Minerva's console in the apartment**, with three tracks, Off, and its own volume
   slider.
2. **A new-star track in the game:** played in place of the star map's usual music when you arrive at a
   star for the first time and its planets are about to be revealed.

The audio files are already in place; nothing needs fetching or converting.

## The tracks

All under `orbiter-client/public/audio/music/`, served as `./audio/music/...` (as the existing music is
in `src/libs/08audio.js`). All are 320 kbps MP3, like the existing tracks.

| Use | File | Title | Composer | Length |
|---|---|---|---|---|
| Apartment | `apartment/SweatyElectronicMurmurings.mp3` | Sweaty Electronic Murmurings | Schmidt | 3:23 |
| Apartment | `apartment/Funkytunz.mp3` | Funkytunz | Guerrier | 2:13 |
| Apartment | `apartment/CarrierOfLife.mp3` | Carrier of Life | Bennie | 4:12 |
| New star | `discovery/ReflectionsInTheWind.mp3` | Reflections in the Wind | Schmidt | 2:49 |

Koda supplied them. The files' original names were `F004-…`, `F018-…`, `F022-…` and `F013-…`; the
composer is from those names. Use these titles wherever the tracks are named.

## 1. The apartment's music, in Minerva's console

**What Koda asked for:**
- A **"Music"** option in Minerva's console in the apartment, beside Account, Health, Mail and Jobs
  (wherever the console's options live after your rework).
- It switches between **any of the three apartment tracks**, or turns the music **Off**.
- It has a **volume slider** of its own, **unrelated to the Music volume in Settings**, defaulting to
  **half volume**.

**Calls left to you** (log the ones you make in `docs/review.md`, as with the intro):
- **What plays at first.** A suggestion: nothing in the dark (the unit has no power); when the lights
  come on, the first track starts at half volume, like a radio left on. The title's music stops when the
  intro starts.
- **Remembering the choice.** A suggestion: keep the track (or Off) and the volume in the browser, so a
  returning player in the apartment hears what they left. `08audio.js` keeps its levels in cookies;
  local storage is fine too.
- **Looping.** One track on repeat, or the three in turn: either works. Say which.
- **Where the music is heard.** It's the apartment's: it should stop or fade when you wake in your
  ship, and the star map's own music takes over there. Whether it carries onto the balcony (quieter,
  perhaps) is your call.
- **How the Settings level relates.** Koda: the slider is "unrelated to the volume of music in
  settings". So the apartment's music follows only its own slider, and Settings' Music level doesn't
  change it. If Settings' Music is off, the apartment's music still plays at its own level. Say so in
  the console if that could surprise a player.
- **The look.** In the console's style, with big targets: one button per track, the playing one
  marked; Off; the slider. The slider needs a visible focus ring and must work with touch, keyboard
  (arrows) and gamepad. Check it at phone size (`VW=390 VH=844` in the harness).

**Where the code is:** `orbiter-client/src/libs/08audio.js` is the game's sound (music by name, with
`playMusic`, `stopMusic` and the levels). It holds one music track at a time (`currentMusic`), at the
Settings level. The apartment's music needs its own volume, so either give `Sound` a second channel
for it (e.g. `playRadio(track)`, `setRadioVolume(v)`, `stopRadio()`, separate from `currentMusic`), or
play it from the intro's own component. The first keeps all audio in one place. Browsers block audio
until the player's first click or key: `startPlaying` and `unlock()` handle that for music today.

## 2. Music for a new star

**What Koda asked for:** a song that plays **instead of the standard one** (the star map's
`UnderwaterWorld`) **when you're at a star for the first time and new planets are about to be revealed**.

**How the game works today:**
- **The star map's music:** `orbiter-client/src/components/playgame.vue` plays `'map'` on mount, and
  switches between `'jump'` and `'map'` as the jump animation starts and ends (the `jumpAnimationState`
  watcher).
- **"About to be revealed":** a first visit to a star schedules a scan. The SDK's `state.scan`
  (`sdk/src/client.js`, `scheduleScan`) is `{ cell, readyAt, status: 'waiting' | 'due' }` for the
  pending scan at the ship's star, and null when there's none. When the scan's drand round is out,
  subscribers hear `'scanDue'`. `orbiter-client/src/stores/game-bindings.js` then records it
  (`player.resolveScans()`) and plays the chime when it's recorded. That is the moment the new stars
  and planets appear. A scan takes about 30 seconds.

**What to build:**
- Add the track to `08audio.js` (e.g. `music['discovery']`).
- When a jump ends at a star that has a pending scan (a first visit), play `'discovery'` in place of
  `'map'`. Otherwise play `'map'` as now.
- **When it ends (your call; say which):** a suggestion is to let it play out (2:49, not looped), then
  return to `'map'`, unless another jump starts first (then `'jump'`, as now). Cutting it off the
  moment the scan lands would end it after about 30 seconds, which is too short for the music. Either
  way, the next first visit plays it again from the start.
- **What counts:** a pending scan at the ship's star (`state.scan?.cell` equal to the ship's cell). A
  star someone else has already scanned has no scan pending, so it gets the usual music. A reload
  mid-scan may play it again: fine.
- It uses Settings' Music level, like the other game music.

## Working here

- Node: `source ~/.nvm/nvm.sh && nvm use 24`. Play locally from `orbiter-client/`: `npm run local`.
  **Another session may be running it:** use other ports (`CHAIN_PORT=8549 UI_PORT=8095 npm run
  local`), and stop only your own processes, by PID.
- Checks: `npm test`, `npm run lint`, `npx vite build --outDir <scratch dir>` (not `npm run build`).
  The harness (`orbiter-client/dev/harness/`) runs Chrome muted, so check that a track starts by
  hooking `HTMLMediaElement.prototype.play` in the page, not by ear. Resource timing doesn't list audio
  loads.
- Play-test like a player (CLAUDE.md): one long session. Go through the intro with the music changed and
  the volume moved, wake, then make several jumps, including at least one to a new star, and wait for
  its scan.
- **Commit, never push.** Commit messages say what and why.

## Done when

- The apartment's console has Music: three tracks, Off, and a volume slider defaulting to half. It
  works by mouse, touch, keyboard and gamepad, on desktop and phone, and the Settings music level
  doesn't change it.
- Arriving at a star for the first time, with its scan pending, plays Reflections in the Wind instead of
  the usual star-map music, and the usual music comes back as described.
- Report what you built and the calls you made (logged in `docs/review.md`).
