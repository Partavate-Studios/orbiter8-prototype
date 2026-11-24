# Brief: Minerva's face, reworked (the standalone kit)

> **Built 2026-11-24 by Fable, merged the same day.** This was the README of `minerva-kit.zip`, a standalone
> copy of her face and lab (packed from f9c2326) handed to Fable to improve. What Fable did, and the choices
> left for Koda, are in [`minerva-face-rework-changes.md`](minerva-face-rework-changes.md); the merge is
> `review.md` section 19. The kit itself (its `src/in-game.vue`, `compare.vue`, `sheet.vue` views) was not kept.

**For:** Fable. **From:** Koda (the game's designer), with Claude, who packed this kit from the game's
code on 2026-11-24.

## The assignment

Minerva is the AI at the heart of **Orbiter 8**, an on-chain space trading game. Her face is her owl
emblem, cut into eight parts that float slightly apart, with glowing eyes that show through the gaps. It
reacts as the player plays. Koda's words: **"It's good, but I think it could be better."** Improve her
**in every way you can**:

- how she moves;
- how much character each expression carries;
- how she reads at every size the game uses;
- the eyes;
- the transitions between states;
- the one-offs;
- polish and performance.

This kit is a standalone copy of her code: the face component, her expressions as data, and the dev lab
the game uses to try them. It runs on its own, with no blockchain or game. Change anything inside it.
When you're done, Koda hands your result to Claude, which merges it back into the game. Because of that,
some things must stay compatible (see "What must keep working").

## Run it

Node 24 (with nvm: `source ~/.nvm/nvm.sh && nvm use 24`).

```sh
npm install
npm run dev      # http://localhost:5190
npm test         # the pose maths (vitest)
```

The page has two views. The pill at the bottom right switches between them.

- **Lab** (`#lab`): the game's own dev screen. It shows her at 320, 120 and 48 px. It has a button for
  every state and one-off, a text box (each key flashes her eyes), a speed slider and a reduced-motion
  switch.
- **In the game** (`#in-game`): every place the game shows her, at that place's real size, on a
  stand-in for that screen's background. One row of buttons drives them all. **Judge your work here**:
  an expression that's lovely at 230 px may be invisible at 22.

Check the phone layout too (390 × 844 in your browser's device mode). Koda plays on phones.

## Who she is

Read `reference/minerva-character.md` (from the game's story bible). In short:

- **She's the network:** the AI on every ship, the terminal in your apartment, and the voice in your HUD.
  Everyone's mind lives on her network, and in the fiction she *is* the smart contracts.
- **Provably neutral.** She runs the solar system, so she has nothing to prove.
- **Her voice is blunt and dry:** literal, direct, no small talk, honest to the point of deadpan humor.

Her face should feel the same: **precise, composed, a little wry. Not cute, not menacing.** Her strongest
expressions are small: a slow blink, one raised brow, a single deadpan "ha".

## The code

| File | What it is |
|---|---|
| `src/components/minerva/minerva-face.vue` | The face component. The comment at its top documents the props, `play()`, and the events. It's an SVG, with one transform per part per frame, set directly on the elements (not through Vue). |
| `src/components/minerva/minerva-poses.js` | Her expressions as data: `STATES` (looping) and `ONE_OFFS` (play once, over the state). Its header explains how a pose is written: the targets, the channels, and the mirrored aliases (`brow`, `cheek`, `jaw`, `sides`, `all`, `eyes`). |
| `src/components/minerva/minerva-parts.js` | The emblem's eight paths and their centers. `reference/art/minerva-face-parts.png` numbers them: 7 is the frame (brow, ear tufts and beak in one piece), 8 the forehead, 1–3 the left facets, 4–6 the right. |
| `src/components/minerva/minerva-poses.test.js` | Tests of the pose maths. Keep them passing, and change them where you change the maths. |
| `src/components/minerva/minerva-lab.vue` | The dev lab, as in the game (its link back to the title screen is removed for the kit). |
| `src/components/assets/minerva-emblem.svg.vue` | The static emblem, drawn elsewhere in the game from the same `PARTS`. |
| `src/libs/frame-loop.js` | The game's single `requestAnimationFrame` loop, which everything animated subscribes to. |
| `src/assets/art/minerva-eye.svg`, `minerva-face.svg` | Her eye and her resting face as standalone art (120-unit square, centered). The game uses these in places that can't animate. |
| `src/App.vue`, `src/in-game.vue`, `src/main.js`, `src/styles.css`, `index.html`, `vite.config.js` | Kit only, not part of the game. Change them freely, for example to add a comparison view. |

## Reference (`reference/`)

- `original-brief.md`: the brief her face was first built from, which lists every state and one-off and
  what each is for.
- `build-notes-M1-M9.md`: the choices made when she was built, with the reasons. Two of them are open
  questions Koda still has:
  - **M2: should part 7 be split** into tufts and beak, so they can move separately?
  - **M8: at 48 px the drift is under a pixel**, so small faces read only by their eyes. Should motion
    scale up at small sizes? She now sits on the HUD's plate at 46–58 px all game long, so this matters.
- `art/minerva-face-all-states.png`: every state and one-off as they look now.
- `art/minerva-face-parts.svg` and `.png`: the parts, numbered.
- `minerva-character.md`: who she is.
- `ui-guide.md` (excerpt), `color-guide.md` and `palette.js`: the game's rules for motion, art,
  performance and color.

## Where she appears, and what drives her

The "In the game" view shows each of these places.

| Place | Size | What the game does |
|---|---|---|
| **HUD plate**, top of the screen, always visible during play | 58 px (46 on phones) | It picks a state from what's going on: `offline` (connection lost), `waiting` (the wallet wants a signature), `alert` (a siege), `annoyed` (a move failed), `thinking` (a move going through), `scanning` (a scan running, about 30 s), else `idle`. |
| Her panel's title | 64 px | `idle` or `offline`. |
| A notice in the intro | 84 px | `pokeable`. |
| Her console in the intro's apartment | 230 px (120 on phones) | `pokeable`. Talking, thinking and listening; `play('flash')` on every keydown in an input; `play('nod')` when something files; `play('glitch')` when it fails. |
| Waking aboard the ship | 220 px (130 on phones) | `talking`, `pokeable`. |
| The building's scanner | `min(200px, 52vw)` | Scanning; `flash` as you type; `glitch` on a bad name. |
| The apartment, across the room | 44 px (her terminal) and 22 px (the scanner) | `assemble-on-mount` when the power comes on. |
| The balcony's screen | 70% of a small screen | `idle`, or `skeptical` after you vape. |

Poking her (`pokeable`) gives a flash, a shake of the head or a glitch. Poke her 6 times quickly and she
bursts apart and puts herself back together. Players like it, so keep it and feel free to make it better.

## What must keep working

The game uses the component in the places above, so these must keep working unchanged.

**The component's interface:**
- the file name `minerva-face.vue`, with the default export named `MinervaFace`;
- the props `state`, `size` (a number of px or any CSS width; the height follows), `color`, `speed`,
  `motion` (`auto`, `full` or `reduced`), `assemble-on-mount` and `pokeable`;
- the method `play(name)`, which returns whether it played;
- the events `done` (with the one-off's name) and `poke` (with the count and whether she burst).

**Names the game uses:**
- **States:** `idle`, `talking`, `thinking`, `listening`, `waiting`, `scanning`, `alert`, `annoyed`,
  `skeptical`, `offline`. `surprised` and `nervous` are in the lab and not yet used in play.
- **One-offs:** `flash`, `nod`, `glitch`, `assemble`, `disassemble`, `blink`. The rest of today's
  one-offs (`boom`, `no`, `slowBlink`, `ha`) stay too.

Add as many new states and one-offs as you like.

**Code the rest of the game shares:**
- `PARTS` and `ART_ORIGIN` from `minerva-parts.js` (the static emblem draws from them).
- `STATES` and `ONE_OFFS` stay as exports with `label` and `about` on each entry (the lab lists them).

If a better design needs a different interface, you can change it, but say so plainly in your notes
(below) and keep the old names working if you can.

## The game's rules for her

- **Keep the owl.** Koda's standing rule is to keep the game's art. Change how the parts move and sit,
  not the emblem's shapes or character.
  - New pieces are welcome: eyes, lids, glints, a pupil, a scan line.
  - Splitting part 7 into tufts and beak (question M2) is allowed if you think it earns its place. Keep
    the drawn outline the same when she's at rest, and flag it for Koda.
  - Save any new art as a standalone SVG in `src/assets/art/` (120-unit square, centered) too.
- **Performance:**
  - Animate by transform and opacity only, on the shared frame loop (`onFrame`) or with CSS.
  - **No SVG filters**: glows are gradients (filters are slow on phones and in the Polkadot App's
    webview).
  - Up to eight faces animate at once in the "In the game" view, and the game can show several. Aim for
    a steady 60 fps with Chrome's CPU throttling at 4×.
  - Don't make per-frame allocations or Vue re-renders in the frame loop.
- **Reduced motion:** honor `prefers-reduced-motion` (and the `motion` prop). It should be calmer, with
  no Boom or Glitch. Read M7 in the build notes.
- **Color:** she's white, like the emblem, on the game's dark purples. The game's accents mean things:
  - **yellow (`#ccff00`) means the player** and what's good for them;
  - **pink (`#e1177c`) means it needs attention** (failures, sieges, the wallet waiting).

  A touch of pink in her eyes on `alert` or a failure fits those rules. Yellow doesn't belong on her,
  since she isn't the player. Keep color rare. If you'd give her an identity color, propose it and flag
  it rather than making it the default.
- **No new dependencies** unless one clearly earns it. The game ships inside the Polkadot App, where
  every kilobyte counts.
- **Code style:**
  - Vue 3 Options API, plain JavaScript, Prettier (`.prettierrc.json`: no semicolons, single quotes,
    120 columns).
  - Comments in plain English that say what and why. The header comments are the documentation, so
    update them with your changes.
- **Sound:** her voice lines play in the game, but nothing here drives the face from audio. If you want
  `talking` to follow her actual speech (for example from its loudness), you can add an optional hook
  such as a prop or method the game can feed. The game would wire it up later.

## Ideas, if you want somewhere to start

These are only ideas; your judgment comes first.

- **Small sizes (M8):** scale motion with size, or give the small faces bolder eye work, so the HUD
  plate reads at a glance: thinking, waiting on you, alert.
- **Transitions:** a state change today blends poses evenly over 450 ms. Anticipation, overshoot or
  per-part timing could make her feel deliberate rather than tweened.
- **Eyes:** today each eye is a soft glow behind the gap. Shape, a lid edge, a pupil or a glint could add
  expression without breaking the angular owl.
- **Expressions:**
  - make the states easier to tell apart from each other, especially `thinking` from `scanning`, and
    `waiting` from `idle`;
  - give each its own rhythm;
  - make `talking` less mechanical.
- **Idle life:** micro-behaviors that keep a long-visible face (the HUD plate) from looping visibly
  without becoming distracting.
- **One-offs:** more personality in `nod`, `ha` and `glitch`, and maybe new ones the game could use, such
  as a pleased "noted" when a trade profits, a wince on a loss, or "paid in full" when the starting debt
  is cleared.
- **The lab:** anything that helps Koda judge her, such as a side-by-side of before and after, a timeline
  of a one-off, or every state at once.

## What to send back

Send this same folder (without `node_modules`) as a zip, with:

1. **Your changed and new files**, in the same layout, so the files under `src/components/minerva/`,
   `src/components/assets/`, `src/libs/` and `src/assets/art/` drop straight into the game.
2. **`CHANGES.md`**, covering:
   - what you changed and why, per state or one-off where it matters;
   - any change to the interface or to the names listed above;
   - any new art;
   - your choices on M2 and M8;
   - **a list of choices for Koda to review** (anything you guessed);
   - how you checked performance.
3. **`npm test` passing.**
4. Optionally, **a new `reference/art/minerva-face-all-states.png`** showing the new look, for the
   game's docs.

Don't edit anything outside this kit; the merge is Claude's job.
