# The intro, in the apartment: a mockup

For Koda to approve before anything is built (brief: [`docs/briefs/intro-mockup.md`](../../briefs/intro-mockup.md)).
Nothing in the game changed. Every copy line marked **draft** is a placeholder in the right voice: the
words, company names and corporations' names are still on your list.

**See it all at once:** [`overview-desktop.png`](overview-desktop.png) and
[`overview-phone.png`](overview-phone.png). Each screen is also an SVG at full size, desktop 1440 × 900
and phone 390 × 844 (open one in a browser). Dashed mono-type boxes on the screens are notes to you, not
part of the design.

**Remake them:** `node docs/mockups/intro/build.mjs` (Node 24). The room, the city, the hand, the console
and the corporations' looks are drawn once in `art.mjs`; `screens.mjs` frames each moment twice. Changing
the room changes it in every screen.

## The screens

| # | Moment | Desktop | Phone |
|---|---|---|---|
| 1 | The apartment, with what you can use marked | [01-apartment](01-apartment-desktop.svg) | [phone](01-apartment-phone.svg) |
| 1b | The door: the curfew, in your corporation's voice (all three, to compare) | [01b-door-curfew](01b-door-curfew-desktop.svg) | [phone](01b-door-curfew-phone.svg) |
| 2a | The ID scanner asks your name (first transaction) | [02a-scanner-name](02a-scanner-name-desktop.svg) | [phone](02a-scanner-name-phone.svg) |
| 2b | …and while it goes through | [02b-scanner-waiting](02b-scanner-waiting-desktop.svg) | [phone](02b-scanner-waiting-phone.svg) |
| 3a | The housing computer's first boot: choosing a corporation | [03a-first-boot](03a-first-boot-desktop.svg) | [phone](03a-first-boot-phone.svg) |
| 3b | Switching later, and what changes | [03b-switching](03b-switching-desktop.svg) | [phone](03b-switching-phone.svg) |
| 4a–c | The TV: one ad per corporation | [X](04a-tv-x-desktop.svg), [Y](04b-tv-y-desktop.svg), [Z](04c-tv-z-desktop.svg) | [X](04a-tv-x-phone.svg), [Y](04b-tv-y-phone.svg), [Z](04c-tv-z-phone.svg) |
| 5 | The balcony: the city, the vape, a health notice | [05-balcony](05-balcony-desktop.svg) | [phone](05-balcony-phone.svg) |
| 6a | Minerva's console over the room: Mail, in Corp X's skin | [06a-console-mail](06a-console-mail-desktop.svg) | [phone](06a-console-mail-phone.svg) |
| 6b | The same console in Corp Z's skin: Account and Health | [06b-console-account](06b-console-account-desktop.svg) | [phone](06b-console-account-phone.svg) |
| 7a | The job board's one eligible opening | [07a-job](07a-job-desktop.svg) | [phone](07a-job-phone.svg) |
| 7b | Naming your ship (second transaction) | [07b-ship-name](07b-ship-name-desktop.svg) | [phone](07b-ship-name-phone.svg) |
| 7c | "An escort will arrive shortly", while it goes through | [07c-escort](07c-escort-desktop.svg) | [phone](07c-escort-phone.svg) |
| 8 | Waking in your ship over Earth, Minerva's first message | [08-wake-in-orbit](08-wake-in-orbit-desktop.svg) | [phone](08-wake-in-orbit-phone.svg) |

## Layout and layers

Five planes, back to front, as in your notes:

1. **The city:** a dark indigo sky with a purple haze, far towers with dim windows, near black towers
   carrying the billboards, lines of air traffic. The ads are the loudest color in the intro, on purpose.
2. **The balcony:** railing, and a Minerva terminal on a post.
3. **The apartment:** one tiny room seen straight on, 1600 × 1000 in its own units. Left to right: the
   door (unit 7-2216) and its ID scanner; a mattress on the floor under an old *Orbiter 8: First Return*
   poster (who lives here: someone who still dreams about it); the TV on a crate with takeout; the desk
   and the housing computer, with the bills; a dead plant; the sliding glass door, the city behind it.
4. **The hand:** the player's, a flat silhouette with a lavender rim, pointing at whatever has focus or
   holding the card or the vape.
5. **Minerva's console:** near full screen over the dimmed room when a terminal opens, until closed.

**Desktop** shows the whole room. **Phone** shows a slice of it at full height and pans: swipe or the
‹ › arrows, and a strip of four big round buttons along the bottom (Door, TV, Terminal, Balcony) reaches
every thing by thumb (like the HUD's nearby strip).

**Going to the balcony:** the room slides aside and scales up past the camera while the city's layers move
forward at different speeds (parallax), until the railing is in front. Back inside reverses it.

## How you use things

- **Mouse and touch:** click or tap a thing. Everything you can use has a generous hit area (the whole
  door, the whole glass door).
- **Keyboard:** Tab and the arrow keys move focus between things in the room; Enter uses; Esc backs out.
- **Gamepad:** the D-pad or left stick moves focus between things by direction (left of the TV is the
  door, right is the terminal); **A** uses, **B** backs out or closes the console, **Menu** opens the
  game's menu (Back to title, Settings). The bottom bar on desktop shows these.
- **Focus is always visible:** the game's lavender focus ring around the thing (solid when focused;
  screen 1 also shows dashed rings on everything usable, which you might want as a first-visit hint only).
  The hand points at what has focus, so it reads as you choosing.
- **The console traps focus** while it's open: big tab buttons (keys 1–4, or the shoulder buttons), ✕ or
  B to close. Desktop: tabs down the left. Phone: tabs along the bottom, like the App's own tab bars.
- **Typing a name:** the field takes the keyboard; on phones the system keyboard opens under it; with a
  gamepad, A opens the platform keyboard (Steam Deck) or an on-screen one.

## The waits

Both transactions are real waits of a few seconds, so each has something in the fiction to watch:

- **Your name (2b):** the scanner reads your card, a scan line sweeping it. Three steps under it: card read,
  your signature (pink while it waits on your wallet, as everywhere in the game), filed. When the block
  lands: "Name on file", and the unit powers up (lights, the TV, the terminal's first boot).
- **Your ship (7c):** the escort's car crosses a map of the block toward your building, in step with the
  three steps: signed, ship registered, escort at your door. When the block lands, the door's light
  changes and the screen fades through white: processing, left unsaid. Then you wake in orbit.
- Nothing to click while waiting. If 30 s pass unanswered, a Try again appears (`ui-guide.md` §3).

## Calls I made (for you to review)

- **I1. The corporations' letters:** X is the shareholder corporation, Y the family conglomerate, Z the
  space-born upstart (the story's order). Their identity colors, used only on their ads and their console
  skins: X a contract blue, Y jade, Z cyan with an orange spark. Never yellow or pink. Their logos are
  drafts: X a contract's seal, Y three linked rings (a family of companies), Z a world with an orbit leaving
  it. They differ by business model: X sells the contract, Y belonging, Z speed.
- **I2. Minerva gets no identity color.** She stays white (her owl) on the game's own purples, the neutral
  thing under every corporation. A corporation's **skin** is a layer on her console's header band only: its
  color, logo, typeface (X a serif, Y the game's Ubuntu, Z monospace) and greeting. Her owl, layout, buttons
  and her own words never change with the skin (6a against 6b).
- **I3. The subscription shown is Corp Y** from the job on (any would do); 6a and 6b use X and Z to show
  skins side by side.
- **I4. Draft names:** the player "Rhea Okafor", the ship "Second Chance", the senders (Grid Utility,
  Block 7 Housing, Harlan & Voss Logistics, NutriLoan, OxyPlus). All placeholders.
- **I5. Both prompts belong to things in the room.** The name prompt is the scanner's own screen, which
  comes forward as the room dims; the ship's name is asked on the job's own page in the console, under a
  picture of your ship. "Register with Minerva" and "Sign and name her" say what the wallet is signing.
- **I6. Where yellow first appears:** the one opening you're eligible for, the outline of your ship to be,
  its name field, then your name and ship in orbit. Button bodies stay lavender (never yellow, never pink).
- **I7. Pink where it needs you:** overdue mail (outlined tags and the Mail tab's count), the −45¢ owed, the
  health score and the vape notice, and the wallet wait. The cycle's costs are plain text (costs are
  neutral).
- **I8. The door is a third voice of your corporation** (1b): it's what enforces the curfew. Only your
  subscription shows in the game.
- **I9. The TV cycles its ads on its own** (about 8 s each), with big Previous, Next and Turn off buttons;
  a Minerva notice ticker runs under every channel (curfew; the pilot program hiring in all three).
- **I10. Waking is a fade through white,** and Minerva's first message slides up like every menu, already in
  your corporation's skin; "Show me the I.S.S." as a second button for those who want a nudge. The HUD
  arrives after the message (not drawn).
- **I11. Skip intro** sits top right on every screen until the job is accepted (the escort can't be
  skipped once the transaction is out). Replaying from the title or Minerva's library isn't drawn.
- **I12. The health score's only home is the intro** (the story says so); the notice says it dryly: "I'm only
  counting."

## Open, for you

- The look overall: the room's density, the hand, the loud billboards against the quiet console.
- I1–I2: the corporations' colors and logos, and Minerva staying white with skins on her header only.
- Whether screen 1's dashed rings on everything should show only on a first visit.
- The phone's pan-and-strip room against a phone layout that shows the whole room smaller.
