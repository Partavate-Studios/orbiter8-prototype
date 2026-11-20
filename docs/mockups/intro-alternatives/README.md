# The intro's "lights on" moment: six alternatives

Six other ways to stage [`../intro/02c-lights-on`](../intro/02c-lights-on-desktop.svg), the moment your
name is filed and the room lights up. Each one is a still at 1440 × 900. They're explorations: nothing
in the game changed. All six use the same parts as the approved mockup (Minerva's face from the widget's
poses, the city, the ads, the hand, the chrome, all from `../intro/art.mjs`) and the same noir look and
accents, so what differs is the approach. The dashed mono-type box on each one is a note, not design.

**See them together:** [`overview.png`](overview.png). **Remake them:** `node docs/mockups/intro-alternatives/build.mjs [a|b|…]` (Node 24).

| | Approach | What it's good at | What it costs |
|---|---|---|---|
| [A](a-diorama.svg) | **The diorama**: an isometric cutaway of the unit hanging in the dark tower, a small you (yellow rim) on the floor | The whole room at once, nothing runs off the edges; it reads like a game board; fits a phone's width without panning | Every object needs a top and two sides; the iso transforms make the room art a rebuild |
| [B](b-tower.svg) | **The tower**: outside, on the face of the block; only your unit and the corridor past your door are cut open | It shows the curfew instead of telling it (empty corridor, dead camera, "3 assaults, 0 arrests"); the escort can come up that corridor later | The room is small on screen; best for story beats, weaker for poking at things |
| [C](c-first-person.svg) | **First person**: sitting up on the mattress, looking across the room in one-point perspective, your hand pointing | The most intimate and atmospheric; you're in it | Walls in perspective are fiddly; on a phone the view has to turn left and right |
| [D](d-floor-plan.svg) | **The floor plan**: Minerva's top-down schematic of the unit, you as a yellow dot, her face and four big buttons beside it | The most readable; close to the game's own map; diegetic (the first lit screen is hers) | Loses the noir mood; feels like UI rather than a place |
| [E](e-comic.svg) | **The comic page**: an establishing panel (your window lighting up, the flicker lettered), then one panel per thing, each panel a button | Strong voice: captions, balloons, sound effects; every later beat is a new page | The most art to draw per beat; panel buttons are an unusual control |
| [F](f-menu-first.svg) | **Menu first**: a letterboxed shot of the room, a few lines of prose, Minerva, four big verb buttons | "The buttons are the game" taken literally; cheapest to build; kindest to phones and gamepads | The words carry the mood, so it depends on the copy |
