# The intro, in the apartment: a mockup

> **Built 2026-11-19:** `orbiter-client/src/components/intro/` (calls in `docs/review.md`, section 13).
> This folder stays as the approved design.

For Koda to approve before anything is built (brief: [`docs/briefs/intro-mockup.md`](../../briefs/intro-mockup.md)).
Nothing in the game changed. Every copy line marked **draft** is a placeholder in the right voice: the
words, company names and corporations' names are still on your list.

**Second pass (2026-11-19), from your notes:** the lights are off until you scan your card and file your
name; the curfew is for violence in the block and too little security to answer; Minerva's face (the new
widget) is at the center of the UI, not in a header; the balcony's terminal sits on the railing; the
colors are eased into a noir silhouette look; and the balcony door is on the left, the door out on the
right, both running off the edges.

**See it all at once:** [`overview-desktop.png`](overview-desktop.png) and
[`overview-phone.png`](overview-phone.png). Each screen is also an SVG at full size, desktop 1440 × 900
and phone 390 × 844 (open one in a browser). Dashed mono-type boxes are notes to you, not part of the
design; the small dashed **widget:** tags name the state Minerva's face is in.

**Remake them:** `node docs/mockups/intro/build.mjs` (Node 24). The room, the city, the hand, the console
and the corporations' looks are drawn once in `art.mjs`; `screens.mjs` frames each moment twice. Her face
is drawn from the widget's own parts and poses (`orbiter-client/src/components/minerva/`), so each screen
shows exactly what the widget would be doing.

## The screens

| # | Moment | Desktop | Phone |
|---|---|---|---|
| 1 | Dark: the power's off, only the ID scanner is lit | [01-dark](01-dark-desktop.svg) | [phone](01-dark-phone.svg) |
| 2a | The scanner asks your name (first transaction), still dark | [02a-scanner-name](02a-scanner-name-desktop.svg) | [phone](02a-scanner-name-phone.svg) |
| 2b | …and while it goes through | [02b-scanner-waiting](02b-scanner-waiting-desktop.svg) | [phone](02b-scanner-waiting-phone.svg) |
| 2c | Name filed: the lights come on, what you can use is marked | [02c-lights-on](02c-lights-on-desktop.svg) | [phone](02c-lights-on-phone.svg) |
| 2d | The door: the curfew, in your corporation's voice (all three, to compare) | [02d-door-curfew](02d-door-curfew-desktop.svg) | [phone](02d-door-curfew-phone.svg) |
| 3a | The housing computer's first boot: choosing a corporation | [03a-first-boot](03a-first-boot-desktop.svg) | [phone](03a-first-boot-phone.svg) |
| 3b | Switching later, and what changes | [03b-switching](03b-switching-desktop.svg) | [phone](03b-switching-phone.svg) |
| 4a–c | The TV: one ad per corporation | [X](04a-tv-x-desktop.svg), [Y](04b-tv-y-desktop.svg), [Z](04c-tv-z-desktop.svg) | [X](04a-tv-x-phone.svg), [Y](04b-tv-y-phone.svg), [Z](04c-tv-z-phone.svg) |
| 5 | The balcony: the city, the vape, a health notice; the terminal on the railing | [05-balcony](05-balcony-desktop.svg) | [phone](05-balcony-phone.svg) |
| 6a | Minerva's console over the room: Mail, in Corp X's skin | [06a-console-mail](06a-console-mail-desktop.svg) | [phone](06a-console-mail-phone.svg) |
| 6b | The same console in Corp Z's skin: Account and Health | [06b-console-account](06b-console-account-desktop.svg) | [phone](06b-console-account-phone.svg) |
| 7a | The job board's one eligible opening | [07a-job](07a-job-desktop.svg) | [phone](07a-job-phone.svg) |
| 7b | Naming your ship (second transaction) | [07b-ship-name](07b-ship-name-desktop.svg) | [phone](07b-ship-name-phone.svg) |
| 7c | "An escort will arrive shortly", while it goes through | [07c-escort](07c-escort-desktop.svg) | [phone](07c-escort-phone.svg) |
| 8 | Waking in your ship over Earth, Minerva's first message | [08-wake-in-orbit](08-wake-in-orbit-desktop.svg) | [phone](08-wake-in-orbit-phone.svg) |

## The look: noir silhouettes

Near-black shapes lit only by what gives light: the scanner, the TV, the terminal, the city through the
glass, the ceiling strip once the power's on. Edges catch a thin violet rim of light. The city is smog and
black towers; its billboards are dim and muted (a slate blue, a sage, a dull teal and copper, faded reds),
still the loudest thing in the scene but no longer bright. The corporations' colors are muted to match.
The interface keeps the game's purples, and the two accents keep their meanings: **pink** where it needs
you, **yellow** first on the job you're eligible for and the ship that will be yours.

## Minerva at the center

Her face is the widget, everywhere she speaks, in the state the moment calls for:

- **On the ID scanner**, the only light in the dark: idle, waiting for the card; listening while you type
  your name (each key flashes her eyes); thinking while it files.
- **In her console**, her face is the spine of the screen: a column on desktop (her face, large; her name;
  what she's saying, in her own blunt voice; then the tabs), a band across the top on phone. The screen's
  content is what she's talking about. The corporation's skin is only a thin band across the top.
- **In notices** while the console is closed: her face small, as it will be in the HUD corner (talking
  with a nod when the power comes on; skeptical at the vape).
- **On the balcony's terminal**, on the railing; and **at waking**, her face beside her first message.

## Layout and layers

Five planes, back to front, as in your notes:

1. **The city:** smog sky, far towers with a few dim windows, near black towers carrying the billboards.
2. **The balcony:** railing, with a Minerva terminal mounted on its top rail.
3. **The apartment:** one tiny room seen straight on, 1600 × 1000 in its own units. Left to right: the
   sliding glass door to the balcony (running off the left edge), a mattress on the floor under an old
   *Orbiter 8: First Return* poster, the TV on a crate with takeout, the desk and the housing computer
   with the bills, a dead plant, the ID scanner, and the door out, unit 7-2216 (running off the right edge).
4. **The hand:** the player's, a black silhouette with a rim of light, pointing at what has focus or
   holding the card or the vape.
5. **Minerva's console:** near full screen over the dimmed room when a terminal opens, until closed.

**Desktop** shows the whole room. **Phone** shows a slice of it at full height and pans: swipe or the
‹ › arrows, and a strip of four big round buttons along the bottom, in the room's order (Balcony, TV,
Terminal, Door), reaches every thing by thumb. Before the power's on there's only one thing to do, so the
phone shows a single big **Scan your ID card** button.

**Going to the balcony:** the room slides away to the right and scales up past the camera while the
city's layers move forward at different speeds (parallax), until the railing is in front.

## Motion and transitions

Every change of scene or state is animated; nothing cuts. Times are starting points to tune by feel.

| Moment | What moves | About |
|---|---|---|
| Dark → the name prompt | The camera eases in on the scanner; it grows into the prompt while the black deepens around it | 0.4 s |
| Name filed → lights on | The ceiling strip flickers on (two or three cold blinks), the room fades up from black, the TV powers on (a line opening into the picture), then the terminal boots with Minerva's face assembling | 1.5 s in all; you can act after the first 0.6 s |
| Room ↔ balcony | A camera move through the glass door: the room slides right and scales up past the camera as it fades; the city's layers come forward at different speeds (parallax); the railing rises into the foreground. Back inside reverses it | 0.8 s |
| Moving focus | The hand glides to the next thing; the focus ring fades across | 0.2 s |
| Phone: looking around | The room pans under your finger and settles with momentum; tapping the strip pans to that thing | 0.3 s |
| Opening a terminal | Her console grows out of the terminal's screen to near full screen while the room dims behind it; her face assembles. Closing shrinks it back into the screen | 0.35 s |
| The door's warning | Its panel slides up from the door's lock light | 0.25 s |
| The TV | On and off like an old set (a line opening, and collapsing to a dot); the ads cross-fade every 8 s | 0.3 s |
| Minerva's notices | Slide in from the corner with her face, stay a few seconds, slide out | 0.25 s |
| The vape | A hit draws the glow up the pen, then vapor rises, spreads and thins | 2 s |
| The waits | The scan line sweeps the card; the escort's car drives the route in step with the chain | while waiting |
| The escort arrives → orbit | The door's light turns, the door opens a crack and the corridor's light wedges in, then everything fades to white. Out of the white: Earth, your ship already in orbit, then Minerva's first message slides up like every menu | 1.2 s to white, a held beat, 1.5 s in |
| Always | The city lives: billboards flicker now and then, air traffic drifts, smog moves; Minerva's face breathes in its current state | looping |

**How it's built** (the game's rules, `docs/ui-guide.md` §4 and §6): moves, fades and scales only, on the
shared frame loop or CSS; no SVG filters, glows are gradients. **Motion explains, it never holds you up:**
any press skips a transition to its end, and nothing waits on an animation that a wait on the chain doesn't
already cause. **Reduced motion:** cross-fades in place of camera moves and parallax, no flicker, calmer
ambience, Minerva's face in its reduced mode.

## How you use things

- **Mouse and touch:** click or tap a thing. Everything usable has a generous hit area.
- **Keyboard:** Tab and the arrow keys move focus between things; Enter uses; Esc backs out.
- **Gamepad:** the D-pad or left stick moves focus by direction; **A** uses, **B** backs out or closes the
  console, **Menu** opens the game's menu (Back to title, Settings).
- **Focus is always visible:** the game's lavender ring, and the hand points at what has focus. Screen 2c
  also shows dashed rings on everything usable (perhaps for a first visit only).
- **The console traps focus** while open: big tab buttons (keys 1–4 or the shoulder buttons), ✕ or B to
  close.
- **Typing a name:** the system keyboard on phones; with a gamepad, A opens the platform keyboard (Steam
  Deck) or an on-screen one.

## The waits

Both transactions are real waits of a few seconds:

- **Your name (2b):** still in the dark, the scanner reads your card, a scan line sweeping it, while
  Minerva thinks. Three steps: card read, your signature (pink while it waits on your wallet), filed. When
  the block lands the lights come on (2c): the ceiling strip, the TV, the terminal, and Minerva nods.
- **Your ship (7c):** the escort's car crosses a map of the block toward your building, in step with
  signed, ship registered, at your door, while Minerva thinks. When the block lands, the door's light
  turns and the screen fades through white: processing, left unsaid. Then you wake in orbit.
- Nothing to click while waiting; after 30 s unanswered, Try again appears (`ui-guide.md` §3).

## Calls I made (for you to review)

- **I1. The corporations' letters:** X the shareholder corporation, Y the family conglomerate, Z the
  space-born upstart. Muted identity colors on their ads and console bands only: slate blue, sage, cold
  teal with a copper spark. Draft logos: X a contract's seal, Y three linked rings, Z a world with an orbit
  leaving it. They differ by business model: X sells the contract, Y belonging, Z speed.
- **I2. Minerva has no identity color:** white, her face, on the game's purples. The corporation's skin is
  a thin band (color, logo, typeface, name) and the content's greeting; her face, her column and her words
  never change with it.
- **I3. The curfew's reason, in three voices** (2d, and Minerva's ticker on the TV): violence in the block,
  and security that can't or won't come. X cites thresholds and voided coverage, Y worries, Z shrugs. A
  Block 7 Security mail reads "3 assaults, 0 arrests".
- **I4. Draft names:** "Rhea Okafor", the ship "Second Chance", the senders. Corp Y is the subscription
  shown from the job on; 6a and 6b use X and Z to compare skins.
- **I5. Lights:** the whole room is black until the name is filed; the scanner's glow is the only light,
  so the first thing you see is Minerva's face. The power comes on as the first transaction lands.
- **I6. Where yellow first appears:** the one opening you're eligible for, the outline of your ship to be,
  its name field, then your name and ship in orbit. Buttons stay lavender.
- **I7. Pink where it needs you:** overdue mail, the −45¢ owed, the health score and the vape notice, the
  wallet wait. Costs are plain text.
- **I8. Skip intro** sits top right until the job is accepted. Replaying from the title or Minerva's
  library isn't drawn.

## Open, for you

- The noir look overall: how dark, the rim light, the muted billboards against the purple console.
- Minerva's column in the console (desktop) and band (phone): is her face big enough, or too big?
- Whether 2c's dashed rings should show only on a first visit.
- The phone's pan-and-strip room against showing the whole room smaller.
