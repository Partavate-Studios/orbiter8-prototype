# Archive

Finished or historical documents, kept for the record. Nothing here describes the game as it is now:
for that, start at [`../handoff.md`](../handoff.md).

## Briefs, built (`briefs/`)

Instructions written for another Claude session (Fable). Each one has been built; the calls made while
building are in [`../review.md`](../review.md).

| Brief | Built | Where it lives now | Calls |
|---|---|---|---|
| [`intro-mockup.md`](briefs/intro-mockup.md) | Mockup 2026-11-19, then built as the intro (daff848), later the zoomable diorama | `orbiter-client/src/components/intro/`, `docs/mockups/intro/`, `docs/mockups/intro-zoom/` | review.md §12–14 |
| [`minerva-face.md`](briefs/minerva-face.md) and its parts drawing (`minerva-face-parts.svg`/`.png`) | 2026-11-19 | `orbiter-client/src/components/minerva/` | review.md §11 (M1–M9) |
| [`music.md`](briefs/music.md) | 2026-11-20 (13a96fd) | `orbiter-client/src/libs/08audio.js`, `components/playgame.vue` | review.md §15 |
| [`corp-database.md`](briefs/corp-database.md) | 2026-11-20 (7889b7a) | `orbiter-client/src/libs/corp-database.js` (the words), `components/intro/intro-database.vue` | review.md §17 (D1–D7) |

The corporation database's draft names and words are still Koda's to review; that list is in
`review.md`'s "For Koda to decide".

## Older documents

| File | What it was |
|---|---|
| [`original-design-notes.md`](original-design-notes.md) | The original design goals and notes, from the repo's root in the Demo 3 prototype (Ethereum, music folders by scene, vendor recharge). |
| [`original-description.md`](original-description.md) | The original pitch: why a game for blockchain adoption. |
| [`original-code-review.md`](original-code-review.md) | A frank review of the Demo 3 client, written once its modernization was done, with before/after performance; screenshots in `docs/baseline/` and `docs/after/`. |
| [`enterprise-circuit-walkthrough.md`](enterprise-circuit-walkthrough.md) | Notes from running the sibling project Enterprise Circuit and comparing it with the modernized client (2026-10-25). |
