# Minerva's face, reworked: what changed (Fable, 2026-11-24)

> Fable's report, kept as it came. Paths are the kit's: its `src/` is `orbiter-client/src/` in the game.
> The kit-only views it mentions (Before / after, All at once, In the game) were not merged; the lab was.
> The merge, and what changed on the game's side for the crop, are `review.md` section 19.

**For:** Koda, and the Claude session that merges this into the game. **From:** Fable, 2026-11-24.
Built on the kit packed from commit `f9c2326` (see `BASE.txt`).

## In short

- **She reads at HUD size now.** Before, every state except Offline looked the same at 46–58 px. Now
  Thinking, Scanning, Waiting on you, Alert, Annoyed, Offline, Skeptical and Listening each have their own
  outline, light or rhythm at that size. Open **Before / after** in the kit to see both side by side.
- **Part 7 is cut into five pieces** (two ear tufts, two brow ridges, the beak), so her brow, tufts and
  beak move on their own. At rest her outline is unchanged. This is the biggest call here: see M2 below.
- **Her eyes are an owl's:** a round iris with a hard edge and a pupil you can see through, cut across
  the top by her brow. Lids close from above and below, pupils widen and pin, and the iris takes pink
  (attention) or teal (working).
- **At icon sizes she's drawn closer and cropped,** so a 22 px Minerva is a face, not a speck.
- **She moves in depth:** her head turns and nods with the beak leading and the tufts trailing, and she
  can come toward you or draw back (your idea; see "Depth" below).
- **State changes are sprung, not tweened:** the eyes arrive first, then the brow, then the rest.
- **13 new one-offs**, among them Noted, Wince, Paid in full, Side-eye and Peer.
- **The interface and every name the game uses are unchanged.** The additions are optional:
  props `accent`, `cool`, `crop` and `clip`, and a `setVoice()` method.
- `npm test` passes (167 tests). Nine faces hold 60 fps with the CPU slowed 4×.

## Run and look

```sh
npm install
npm run dev      # http://localhost:5190
npm test
```

I ran it on Node 23.3 (Node 24 isn't installed on this machine); nothing here depends on the version.

The kit's page has two new views beside Lab and In the game:

- **Before / after** (`#compare`): the face as it came in the kit beside the face now, at 230, 58, 46 and
  22 px, driven by one set of buttons. A dashed button is a one-off only the new face has.
- **All at once** (`#sheet`): every state and one-off on one page. `?strip=nod#sheet` lays one one-off out
  as twelve moments in a row.

In the game takes `?before` to show the old face in the same places.

## Choices for Koda to review

These are the things I decided or guessed. The first six matter most.

1. **Part 7 is split (M2).** Details below. If you'd rather keep it whole, say so: the tufts, ridges and
   beak would go back to moving as one, and Skeptical, Annoyed, Listening and Talking would lose most of
   what's new.
2. **The crop at icon sizes.** Under 80 px wide she's drawn closer: 1.3× at the plate's 58 px, up to
   1.7× at 22 px. Her eyes, brow and beak stay inside her box; her tufts (and at the smallest sizes the
   peaks of her brow) reach past it, and **the frame she sits in cuts them off**, so she fills the frame
   to its ring. That needs `overflow: hidden` on the frame, which is a change on the game's side: without
   it her tuft tips lie over whatever is beside her. On the HUD plate I clipped the whole plate and gave
   the rings a solid background, so a tuft passes behind the first ring. Where a frame can't clip, the
   `clip` prop cuts her at her own box instead, and `crop="none"` draws all of her as before. The amounts
   are `CROP_STEPS` in `minerva-face.vue`; look at In the game and Before / after and tell me if it
   should be tighter.
3. **The eyes.** White ring, see-through pupil, no glow except a brief one when she flashes (typing,
   Boom). I kept that one glow because a white iris can't get any brighter; say if it should go too.
   Surprised, with round eyes and pinned pupils, is the state closest to cute.
4. **The working color** is `#2ec4e6`, a cyan (bluer than the teal I first used, at Koda's request; it isn't a palette color). Only Scanning uses it (her irises and the scan
   line). Thinking would be the next candidate; I left it white to keep color rare.
5. **Pink in her eyes.** Alert's eyes are pink and beat. Waiting on you has a faint pink pulse (the
   README lists the wallet waiting under pink's meaning, but only names Alert and failures for her eyes,
   so this one is my reading). Glitch flickers pink, and Annoyed starts with a pink flare that drains away
   in about a second, since the HUD uses Annoyed for a failed move. Nothing else is tinted. I didn't give
   her an identity color.
6. **Peer on the HUD plate.** Peer brings her 60% closer for about two seconds, and Idle plays it once
   every 50–120 s. Where her frame clips (the plate, in the kit), she fills it with one eye and
   doesn't spill over what's beside her. Where nothing clips, she draws over her neighbours. To stop it on
   Idle, remove the `peer` line from `idle.tics` in `minerva-poses.js`.
7. **Thinking draws her back** to 80% of her size while a move goes through. On the plate that makes her
   smaller exactly when the player is waiting on her. The circling notch still reads there. The number is
   `z: -0.2` in `thinking.pose`.
8. **Movement grows at small sizes (M8).** Details below. The numbers are `FULL_PX`, `MAX_GAIN` and
   `SMALL_PX` at the top of `minerva-face.vue`.
9. **Idle does more on its own:** a tuft flick every 9–24 s, a ruffle every 16–38 s, a slow blink every
   22–50 s. They wait their turn and never cut off a one-off the game played. If the plate feels busy,
   lengthen the times in `idle.tics`.
10. **Scanning has a line of light** sweeping across her, and the facets it isn't on dim to 55%.
11. **Poking her** now goes flash, side-eye, shake of the head, huff, glitch, then the burst. The burst
   itself is the same two one-offs (Disassemble, then Assemble), which now come apart and fly in piece by
   piece.
12. **Her eyes at rest are lidded** (the upper lid sits at 68%, so the top of each iris is cut flat). It
    reads as composed. Wide open read as startled.
13. **Talking's made-up voice** has phrases and pauses, so her beak stops between them. With real audio
    fed in, it follows that instead.

## What I could not check

- **I never watched her move.** I worked from still frames and filmstrips taken in a headless browser.
  Poses, timing on paper and the order parts move in are checked; how the motion *feels* (the spring
  settings, the length of each one-off, whether Talking looks like speech) needs your eyes. Before / after
  with "Quarter speed" on is the quickest way to judge it.
- **No real phone and no Polkadot App webview.** Phone layout is checked at 390 × 844 in desktop Chromium.
- **`setVoice()` has only been driven by the lab's slider,** not by real audio.

## Interface

Unchanged: the file name, the `MinervaFace` export, the props `state`, `size`, `color`, `speed`,
`motion`, `assemble-on-mount` and `pokeable`, the method `play(name)`, and the events `done` and `poke`.
All twelve states and all ten one-offs keep their names. `PARTS` and `ART_ORIGIN` are untouched, so the
static emblem draws exactly as before. `STATES` and `ONE_OFFS` are still exported with `label` and
`about` on every entry.

Added:

| Addition | What it does |
|---|---|
| prop `accent` (default `#e1177c`) | The color her irises take when a pose sets `tint` (attention). |
| prop `cool` (default `#2ec4e6`) | The color her irises and the scan line take when a pose sets `cool` (working). |
| prop `crop` (default `'auto'`) | `'auto'` draws her closer under 80 px wide, reaching past her box for the frame to cut off; `'none'` always draws all of her; a number draws her that many times closer. |
| prop `clip` (default off) | Cuts her off at her own box, for a place whose frame can't clip her. |
| method `setVoice(level)` | Feeds Talking her real loudness, 0 to 1. Call it as often as you have a level. After 300 ms without a call, or on `setVoice(null)`, she goes back to her made-up voice. |
| export `FRAME_PIECES` in `minerva-parts.js` | Part 7's five pieces. Only the face uses them. |

Things the merge should know:

- **`minerva-poses.js` has a different shape inside.** A pose in memory is now one flat `Float64Array`
  instead of nested objects, and a compiled one-off is a set of tracks. If anything in the game besides
  the face and the lab imports `emptyPose`, `addCompiled`, `addOneOff`, `addState`, `compileOneOff` or
  `compileState`, it needs a look. `STATES`, `ONE_OFFS`, `BLEND_MS` and `compilePose` are as they were.
- **A one-off's `keys` can be a function** (Glitch's are). Code that lists keys should call
  `oneOffKeys(def)`. The lab doesn't read keys, so it's unaffected.
- **Under 80 px she's bigger than her box** (the crop) and expects the frame around her to cut her off.
  Each small placement in the game (the HUD plate, her panel's title, the apartment's screens) needs
  `overflow: hidden` on its frame, or `clip` on the face. The kit's stand-ins in `src/in-game.vue` show
  what I did for each. At every size she also draws outside her box more than before (Peer, Boom, the
  scan line's ends), as the SVG's `overflow: visible` always allowed.
- **Her lids and pupils are SVG clip paths,** each moved by a transform. No filters and no masks.
- **She uses `ResizeObserver` and `IntersectionObserver`** when they exist, and works without them.
- The lab gained a "Her voice" slider. `src/libs/frame-loop.js` and `minerva-emblem.svg.vue` are unchanged.

## M2: part 7 is split

Part 7 is one path that holds both ear tufts, both brow ridges and the beak. The two halves only join at
the beak, so nothing on one side could move without the other. It is now five pieces:

- each **tuft** comes off along the line from the notch above the brow to the brow's outer corner;
- the **beak** comes off across each leg in a shallow chevron, like the forehead piece's;
- each **ridge** is what's left: the brow and the top of the leg under it.

The pieces were cut by computer from the original path, and their union matches it exactly (I measured
the area missing and the area added: both zero). Each piece reaches a little past its cut, so neighbours
overlap and no seam shows at rest or while a piece only stirs. A tuft rides on its ridge. Target `'7'`
still moves all five together, so old poses that used it still work.

**Each brow is hinged** (Koda's suggestion). A ridge turns about the middle of the cut where it meets the
beak, so turning it lifts or lowers the brow like an eyebrow while it stays joined to the beak. Skeptical's
single raised brow, Surprised, Listening, Thinking and Peer all lift this way. Pressing a brow down
(Annoyed, Alert) slides the ridge down into the overlap, which also shows no cut. There is one hinge per
brow; I didn't cut the brow a second time along its length, which would let it arch. Say if you want that.

What it buys: one raised brow for Skeptical, tufts that prick up (Listening, Alert) or flatten (Annoyed,
Offline), a beak that opens when she talks, and an outline that changes with her mood, which is what
reads at 46 px.

What it costs: five more elements per face, and when a ridge is pulled sideways off the beak a cut shows
across the leg. That happens in Glitch (on purpose) and briefly in Assemble and Disassemble.

`reference/art/minerva-face-parts.svg` and `.png` still show eight parts. I left them alone, since they
document the emblem; `src/assets/art/minerva-frame-pieces.svg` shows the five pieces.

## M8: small sizes

She measures how wide she's drawn. Below 110 px, movement that would be under a pixel is enlarged, up to
2.2× at the smallest sizes, and her eyes grow with it. The crop (above) does part of this job now: at
58 px she's drawn 1.3× closer and movement is enlarged about 1.2× on top; at 22 px, 1.7× and 2×. A face under 30 px wide draws every other frame.

Enlarging alone wasn't enough, so each state the plate uses also has a signal that doesn't depend on
small movements:

| State | What reads on the plate |
|---|---|
| Thinking | A dark notch circling her six facets, like a spinner; she's drawn back and tilted. |
| Scanning | Teal eyes and a line of teal light sweeping across; the facets light as it passes. |
| Waiting on you | Head tilted, a slow two-beat pulse in her eyes with a little pink. |
| Alert | Pink eyes with pinned pupils, beating faster; tufts up. |
| Annoyed | Tufts flat, brow low, eyes narrowed to slits. |
| Offline | Dim, drooping, eyes nearly out, with a flicker now and then. |

## Eyes

I looked at how owl eyes work before redrawing hers. What I borrowed:

- **Round, with a hard edge.** The iris is a flat ring; the pupil is a hole, so you see the background
  through it, like the gaps between her parts. No fade.
- **The brow cuts the top.** Her eyes sit behind the parts, so the ridge and her upper lid cut each iris
  flat across the top. That is where an owl's stare comes from.
- **They barely move in their sockets.** An owl's eyes are fixed and it turns its head to look. Her pupil
  shifts a little inside the iris, and her head turns after it more than before.
- **Pupils widen and pin.** A new `pupil` channel: wide for interest (Listening, Noted, Offline's blown
  stare), pinned for alarm or a hard look (Alert, Annoyed, Surprised, each key you type).
- **One eye can blink alone,** as owls do: a new `blinkOne` tic in Idle.

Color goes in the iris: `tint` fades it to pink, the new `cool` to teal.

Sources: [A-Z Animals](https://a-z-animals.com/articles/why-owl-eyes-are-tubes-not-balls-like-ours/),
[Science Insights](https://scienceinsights.org/do-owls-have-eyeballs-the-truth-about-their-eyes/),
[Nature World News](https://www.natureworldnews.com/articles/59217/20231102/owl-eyes-anatomy-know-nocturnal-birds-dont-eye-balls.htm).

## Depth

This came from your message while I was building.

- The face has three new channels: `z` (toward you or away), and `fx`, `fy` (the point of her face that
  comes to the middle as she approaches).
- **Peer** (new one-off, an Idle tic): she pulls back a hair, then comes up close with one eye squinted
  shut and the other wide and centered, looks left and right, and goes back. Either eye.
- **Thinking** draws her back and lets her drift a little in depth, so she looks busy elsewhere.
- **Listening** leans in with `z` rather than a plain scale, and **Offline** sits a little further away.

## States

| State | What changed |
|---|---|
| Idle | Glances are followed by her head, a beat late; a long look across is sometimes covered by a blink. Tics as listed above. |
| Talking | Beak, forehead, cheeks, ridges and tufts follow a voice level with phrases and pauses; her head nods on stressed syllables and wanders slowly. |
| Thinking | Was: parts circling, eyes sweeping (too close to Scanning). Now: drawn back, looking up and away, a notch chasing round the facets, eyes brightening in turn. |
| Surprised | Ridges and tufts up, beak dropped; enters with Startle. |
| Annoyed | Ridges down, tufts flat, half-lidded stare; enters with Huff; one eye twitches now and then. |
| Nervous | Tufts tremble; her head follows her darting eyes. |
| Listening | Tufts pricked, leaning in, still; enters with Perk. |
| Waiting on you | Stronger tilt, one ridge raised, half-lidded, a heartbeat in her eyes, an impatient tuft flick every few seconds. |
| Scanning | Holds still, eyes wide and teal, a line of teal light. No longer shares Thinking's eye sweep. |
| Alert | Pink beating eyes with pinned pupils, tufts up, drawn tight; enters with Startle. |
| Skeptical | One whole brow and tuft raised, the other eye narrowed; blinks slowly. |
| Offline | Tufts droop, beak sags, eyes flicker as if looking for a signal. |

## One-offs

Kept, and reworked:

| One-off | What changed |
|---|---|
| Boom | Draws in first, bursts, overshoots on the way back. |
| No | Her head turns in depth; the tufts trail. |
| Nod | A small lift first, then down with her eyes closing, then back. |
| Eye flash | Same timing (it must keep up with typing); the eye swells as it brightens. |
| Blink, Slow blink | Shut fast, open slower; the facets above and below the eye close with the lids. |
| Assemble | Pieces fly in one after another (beak, ridges, tufts, facets, forehead), lock, then her eyes light. 1.3 s, was 1.1 s. |
| Disassemble | Eyes go out, a squeeze, then the pieces leave one after another. |
| Glitch | Whole rows of her face jump sideways, a facet drops out, pink in one eye. Different every time. |
| Deadpan "ha" | The beak drops once; her eyes narrow from below. |

New:

| One-off | For |
|---|---|
| `noted` | A trade made a profit: tufts up, eyes brighten and narrow from below, a small dip of the head. |
| `wince` | A trade lost money: eyes shut hard, tufts back, she pulls away, then recovers. |
| `paid` | The starting debt is cleared: a slow bow with eyes shut, then she rises, eyes bright, facets rippling out. 1.9 s. |
| `sideEye` | Her eyes slide to one side and back; her head stays put. |
| `peer` | See Depth. 3 s. |
| `ruffle`, `tuftFlick`, `blinkOne` | Idle tics. |
| `twitch` | Annoyed's tic. |
| `flicker` | Offline's tic. |
| `startle`, `huff`, `perk` | How she enters Alert and Surprised, Annoyed, and Listening. |

With reduced motion: drift and waves run at about a third, nothing overshoots, her head doesn't follow
her eyes, and Boom, Glitch, Peer, Startle and Perk don't play. Assemble, Disassemble and Huff keep only
their light. Light signals (the notch, the pulses, the tint) are kept at full strength, since they carry
the state.

## How a pose is written now

The header of `minerva-poses.js` is the full reference. What's new for whoever adds expressions:

- targets `tuftL`, `tuftR`, `ridgeL`, `ridgeR`, `beak`, and the mirrored pairs `tufts` and `ridge`;
- eye channels `lid` (upper lid), `under` (lower lid), `pupil`, `tint` (pink) and `cool` (teal);
- face channels `turn`, `pitch`, `z`, `fx`, `fy`;
- a `beam` target for the scan line;
- wave shapes `pulse`, `bump`, `sweep` and `noise`, and `talk` now follows the voice level;
- per state: `tics` (things she does now and then) and `enter` (a one-off played on entering);
- per one-off: an ease per key (`out`, `back`, `snap` and others), `stagger` (parts start one after
  another), `flip` (plays mirrored half the time), and `keys` as a function.

## New art

In `src/assets/art/`, each a 120-unit square, centered:

- `minerva-eye.svg`: replaced with the new eye, shown in white, pink and teal.
- `minerva-face.svg`: replaced; the emblem with the new eyes at rest.
- `minerva-frame-pieces.svg`: new; part 7's five pieces, drawn slightly apart to show the cuts.

`reference/art/minerva-face-all-states.png` is regenerated from the All at once view.

## Performance

Measured in headless Chromium with the CPU slowed 4×, on the In the game view (nine faces), six seconds
per state, old face against new:

| | Frame rate | Frames over 20 ms | Script per frame | All main-thread work per frame |
|---|---|---|---|---|
| Before, desktop | 60 fps | 0 of 361 | 1.7–1.8 ms | 6.9–7.0 ms |
| After, desktop | 60 fps | 0 of 361 | 1.3–1.6 ms | 7.7–8.8 ms |
| Before, phone size | 60 fps | 0 of 361 | 1.6–1.7 ms | 6.7–6.9 ms |
| After, phone size | 60 fps | 0 of 361 | 0.7–0.8 ms | 5.2–5.9 ms |

These were taken with everything in this document in place (Idle and Scanning). Script time went down
and total work on desktop went up by one to two milliseconds a frame: she has more shapes to paint (five
frame pieces) and her lids and pupils are clip paths. It stays well inside a 16.7 ms frame. The phone
number is lower because faces scrolled off screen no longer draw. Headless Chromium paints in software,
so treat the figures as a comparison, not as what a phone will show.

What changed for speed:

- poses are flat number arrays, and the frame loop makes no objects or arrays;
- transforms are written as numbers straight into each element's SVG transform (no strings built or
  parsed), and only when they changed;
- springs do no work once she has settled into a state;
- a face that's off screen doesn't draw, and one under 30 px draws every other frame;
- still no SVG filters and no masks. No new dependencies.

## Files

Drop into the game:

- `src/components/minerva/minerva-face.vue`, `minerva-poses.js`, `minerva-parts.js`,
  `minerva-poses.test.js`, `minerva-lab.vue`
- `src/assets/art/minerva-eye.svg`, `minerva-face.svg`, `minerva-frame-pieces.svg`

Unchanged: `src/components/assets/minerva-emblem.svg.vue`, `src/libs/frame-loop.js`.

Kit only (not for the game): `src/App.vue`, `src/in-game.vue`, `src/compare.vue`, `src/sheet.vue`, and
`src/before/`, which holds the original face files for the Before / after view. Prettier reformatted the
kit-only files along with the rest.
