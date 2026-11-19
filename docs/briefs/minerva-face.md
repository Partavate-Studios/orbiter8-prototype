# Brief: Minerva's animated face

**For:** a Claude session (Fable) working in this repo, `/home/koda/dev/orbiter8-prototype`, branch
`polkadot`. Written 2026-11-19 from Koda's direction. This file is everything you need: read it, then the
files it points to.

## What to make

Minerva is the game's voice: the AI on every ship, the terminal in your apartment, the voice in the HUD
(`docs/backstory.md`, "Minerva"). She needs a face that reacts while the player uses her console. Build:

1. **A reusable face component**, built from Minerva's owl emblem broken into its parts, with **states**
   (looping animations) and **one-offs** (short animations that play once and return to the current
   state).
2. **A test screen** Koda can open in dev builds, behind a "magic button", with a console to switch states
   and fire one-offs.

Later (not now) the face goes wherever the player talks to Minerva: her console, the intro's terminals,
the HUD. So design it as a component, not a page.

## The art: Minerva's owl, in parts

`orbiter-client/src/components/assets/minerva-emblem.svg.vue` is her emblem: an owl's face (a mask), about
180 × 100 units, drawn as **8 separate paths**. `docs/briefs/minerva-face-parts.svg` (and `.png`) shows them
numbered and colored:

| Part | What it is |
|---|---|
| 7 | The big piece: brow and ear tufts sweeping down into the beak (the face's frame) |
| 8 | A small piece above the beak, between the eyes (forehead) |
| 1, 2, 3 | Left facets around the eye: 1 the upper (brow, lid), 2 the cheek, 3 the lower cheek |
| 4, 5, 6 | The same on the right, mirrored |

There are **no eyes** in the emblem: the eye sits in the gap where facets 1 and 2 (4 and 5) meet part 7.
Design eyes that fit the owl's angular look, for the expressions and the eye flash. Keep the owl
recognizable: change how the parts move and sit, not the art's character (Koda's standing rule: keep the
art). Any new art (eyes, extra pieces) is saved as standalone SVG in `orbiter-client/src/assets/art/`
(120-unit square, centered), per `docs/ui-guide.md` §5.

The same art came from Koda's earlier project, `~/dev/enterprise-circuit`
(`client/src/components/assets/geometry/Minerva.svg.vue`): read it there if useful, but don't copy files in.

## How she moves

**The parts are separate, and the space between them breathes.** As Minerva floats on screen, the gaps
between the parts shift a little, slowly and continuously, so she reads as alive and assembled from
pieces, never as one flat image.

**States** (one at a time, looping):

| State | Feel |
|---|---|
| **Idle** | Floating gently; the parts' gaps drift; an occasional blink or glance |
| **Talking** | She's speaking (a message is showing): rhythmic movement around the beak and facets |
| **Thinking** | Waiting for something to go through on chain (a transaction in flight): a patient, working motion, e.g. the parts cycling or orbiting slightly, eyes scanning |
| **Surprised** | Parts spread, eyes wide |
| **Annoyed** | Brow (1, 4, and 7's tufts) pressed down, a tighter face |
| **Nervous** | Looking around: the eyes and face dart side to side |

More will be added later: make adding a state a small, data-driven change (e.g. a table of poses per
part: offset, rotation, scale), not new code paths.

**One-offs** (play once, then return to whatever the current state animates):

| One-off | What it does |
|---|---|
| **Boom** | Every part expands outward from the center, then contracts back |
| **No** | She shakes her head |
| **Eye flash** | A subtle flash in the eyes. Fired every time the player presses a key while an input box has focus (so it feels like she's reading as you type) |

One-offs layer on top of the state: firing "boom" while "thinking" plays the boom, then thinking
continues. Firing one while another plays should behave sensibly (queue or restart: your call; say
which).

## The component's interface (a suggestion; refine it)

- A Vue 3 component, e.g. `orbiter-client/src/components/minerva/minerva-face.vue`, taking a `state` prop
  and exposing `play(name)` for one-offs (or an event bus: your call), and a size that works from small
  (about 48 px, in a HUD corner) to large (about 320 px, beside the console).
- Animations by transform only (translate, rotate, scale, opacity), smooth at 60 fps. **No SVG filters**;
  glows are gradients (`docs/ui-guide.md` §6, Performance). Many sprites in this game draw every frame; the
  frame loop is `orbiter-client/src/libs/frame-loop.js` if you need one, or CSS animations.
- Respect `prefers-reduced-motion` (calmer idle, no boom).

## The test screen

- **Dev builds only** (`import.meta.env.DEV`, as the Settings menu's cheat button does in
  `orbiter-client/src/components/star-map/hud/menus/settings-menu.svg.vue`), so it never reaches the public
  site.
- Reached by a **magic button**: e.g. a small button on the title screen
  (`orbiter-client/src/components/title/title-screen.vue`), or a route like `#/minerva-lab` (router in
  `orbiter-client/src/router/`).
- **A console** beside the face: a button per state (the current one highlighted), a button per one-off,
  a text input to try the eye flash while typing, and the face shown at two or three sizes at once
  (HUD-small, console-large). Optional: a speed slider.
- It must work on a phone too (Koda's rule: check at phone size; the harness runs `VW=390 VH=844`).

## The game's look and rules

Read before designing: `docs/ui-guide.md` (layout, motion, art, performance) and `docs/color-guide.md`
(color). In short:

- **Color:** the interface is a quiet purple; brand purples and lavenders are in
  `orbiter-client/src/libs/palette.js` (`BRAND_*`, `SURFACE_*`). **Yellow means you and what's good for
  you; pink means it needs your attention** (failures, sieges): never decorative. Minerva has no identity
  color yet: propose one within the palette, or keep her in the brand lavenders.
- **Her character** (`docs/backstory.md`, "Minerva", her voice): **blunt and dry**, literal, direct,
  with deadpan humor; provably neutral. Her face should feel like that: precise, composed, a little
  wry; not cute, not menacing.
- **Motion explains** and shouldn't hold the player up (`docs/ui-guide.md` §4).

## Working here

- Read `CLAUDE.md` first (the project's rules). Node: `source ~/.nvm/nvm.sh && nvm use 24`.
- Run the game: from `orbiter-client/`, `npm run local` (a fresh local chain, the game at
  http://localhost:8080). **Another session may be running it:** use other ports,
  `CHAIN_PORT=8549 UI_PORT=8095 npm run local`, and stop only your own processes, by PID.
- Checks: `npm test`, `npm run lint`, `npx vite build --outDir <scratch dir>` (not `npm run build`).
- Screenshots: `orbiter-client/dev/harness/` (README there).
- **Commit, never push.** Commit messages say what and why.

## Done when

- The face component plays every state and one-off above, smoothly, at small and large sizes.
- The test screen opens from the magic button in a dev build, desktop and phone.
- New art is in `orbiter-client/src/assets/art/`; the component is documented in a comment at its top
  (states, one-offs, how to add one).
- Report what you built, how to open it, and any choices Koda should review.
