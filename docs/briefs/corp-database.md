# Reference: your corporation's database, in Minerva's console

**For:** Fable (or whoever builds it), once the intro rework is done, and for Koda to review the words.
Written 2026-11-20 from Koda's direction. This file holds the **content**: the pages, their words, and
which art goes on each. How it's laid out is the builder's call, in the console's style. All copy is
**[draft]**, in each corporation's voice as `CORP_LOOKS` in `orbiter-client/src/libs/intro.js` already
writes it.

## What it is

A new screen in Minerva's console during the intro: **your corporation's database**, the one your
sponsor gives you access to. Each corporation's database looks and reads differently, because it's
theirs. In all three:
- **The Orbiter 8** is the ship being built for the pilot program, and the current **gold standard**.
- **How the Orbiter 8 works**, including why it needs a **human consciousness aboard**.
- **The corporation's own ship, in development**: one line on what they're improving; everything else
  **classified**.
- **History:** the Great Regrettion, the expansion and the rest. The same text for all three, for now.

It's one more option in the console beside Account, Health, Mail and Jobs: perhaps **"Database"**, or
the corporation's name for it (below). It's there once you have a sponsor, which is also when the rest
of the unit opens. It's a good place to send a curious player before the job board: the Orbiter 8 page
is the job's sales pitch, read in advance.

## How it differs by corporation

| | Corp X (shareholder, old Earth) | Corp Y (family conglomerate, old Earth) | Corp Z (space-born upstart) |
|---|---|---|---|
| The database's name | **Records** · "Access logged. Use is subject to the terms of your sponsorship." | **The Archive** · "Welcome. Everything here is shared within the family." | **the wiki** · "it's mostly up to date. mostly." |
| How they see the Orbiter 8 | The benchmark to beat on cost | A sound design, trusted as the family trusts its own | Great for its time. Its time is now, but not for long |
| Their own ship (hull) | `polygon` | `boba` | `moonbeam` |
| What they're improving | Cargo per jump: cost per ton | Endurance: armor, repair, coming home | Range: a bigger bank, farther stars |
| How "classified" reads | Redacted, pending patent | Restricted to the family | Under NDA. sorry |

The hull keys are the drawings in `sdk/src/ship-designs.js` (drawn by `fleet-ship.svg.vue`). Their keys
are old network names (`polygon`, `boba`, `moonbeam`), so **never show the keys**; the ships' in-world
names are below. Which hull goes to which corporation is a draft call: the angular, segmented one to
the contract company; the heavy, armored one to the family; the sleek crescent to the upstart.

## The pages

### 1. The Orbiter 8 (all three; the opening line is each corporation's)

**Art:** the Orbiter 8's hull, large: `SHIP_DESIGNS.orbiter8` (`fleet-ship.svg.vue`, with engines lit),
or `sdk/src/ship-art.js`'s full drawing (the same picture as the ship NFT, with shields, holds and guns
drawn from a loadout). Show it fitted to show off what it can carry. A spec block beside it.

**The opening line, per corporation:**
- **X:** "The Orbiter 8 is the industry benchmark. Every program, including ours, is measured against it."
- **Y:** "The Orbiter 8 is a sound ship. We build them with care, as we would for our own."
- **Z:** "The Orbiter 8. The gold standard. We say that with love, and with a stopwatch running."

**The same for all three:**

> **Orbiter 8.** Interstellar survey, freight and claim vessel. Open standard: no patent; any yard may
> build it. Every pilot program in Sol starts here.
>
> First flown as a next-generation prototype, with the strongest hull, the most powerful engines and the
> most advanced Minerva console of its day. It made history in 2140: to a foreign star and back in under
> 36 hours, the first return trip ever made.

| Spec | As delivered |
|---|---|
| Drive | Stellar capacitor bank; one jump per charge |
| Range | One star (the bank grows with upgrades) |
| Internal space | 5 bays, expandable to 250 (cargo or drone bays) |
| Drones | 4 built in: mining or repair |
| Hardpoints | Railguns, missile racks, point defense, armor, shields: fitted at any Yards |
| Pilot | One. See "How it works" |

(The numbers are the game's: `Pilots.sol` starts a ship at range 1 with 5 bays and allows 250 in all;
four drones come built in, as in `review.md` X12–X13.)

### 2. How it works (all three; each corporation adds one line at the end)

**Art:** `engine-range.svg` (the drive), `deep-scanner.svg` or `scanner-array.svg` (the scan),
`minerva-eye.svg` or her face (the pilot), from `orbiter-client/src/assets/art/`. Maybe a small diagram:
a star, the ship's close orbit, an arrow to the next star.

> **The drive.** A star pours out more energy in a second than humanity has ever used. The Orbiter 8
> drops into a close orbit, closer than any ship before it dared, and its capacitor bank drinks in the
> star's light and wind. Then it spends the whole charge in one shot: a jump faster than light, to a
> neighboring star.
>
> It arrives empty. To jump again it must charge again, and the only place to charge is around a star.
> So the Orbiter 8 travels star to star, never into the dark between them. A bigger bank reaches farther
> stars. Every jump still ends at a sun.
>
> **The scan.** While the bank charges, the long-range scanner sweeps the neighborhood. Every star it
> charts is a star the next jump can reach.
>
> **The pilot.** The jump has to be steered through the charge and the arrival, and adjusted thousands of
> times a second against a star nobody has measured. An AMI alone can't do it. A human working beside an
> AMI is far too slow. **A human mind uploaded into the ship, flying with Minerva's help, is fast
> enough.** That is the one part of the Orbiter 8 no yard can build.
>
> The prototype's first return took the full attention of Minerva's network for 36 hours. That can't be
> done for every ship. Every Orbiter 8 needs a consciousness aboard, or it stays in its berth.
>
> The pilot's mind lives on Minerva's network, copied across all of it, so there's no single place
> where it can be lost. The body waits in cold storage. A mind can fly one ship at a time.

**Each corporation's closing line:**
- **X:** "Pilots are contractors. Terms, earnings and storage of the body are set out in your agreement."
- **Y:** "Our pilots are family. Your body will be kept as we keep our own, until you come home."
- **Z:** "honestly the mind upload is the coolest part. you'll see."

(A reconciliation for Koda: the story says the prototype's return flew "under the sole command of that
console" (Minerva), while the pilots exist because "AMIs alone aren't good enough". The line about her
network's full attention for 36 hours makes both true: Minerva could do it once, not for thousands of
ships. Change it if you'd rather.)

### 3. Our ship (one per corporation; mostly classified)

**Art:** the corporation's hull from `SHIP_DESIGNS`, drawn in the corporation's color (`CORP_LOOKS`
`color`), with **redaction bars** over parts of the drawing and the spec block, so it reads as a
classified file. Engines unlit, or a "concept" label: it hasn't flown. The rest of each page is
redacted lines (solid bars the length of words) under a stamp in the corporation's style.

**Corp X: the Meridian [draft name]** (`polygon` hull)
> **Program:** Meridian. Status: in development.
> **Focus:** we're improving cargo per jump: more tons carried for every charge, at a lower cost per ton.
> Drive: ████████. Range: ████. Crew: ██████████. Yard: ████████████.
> *REDACTED: patent pending. Disclosure is a breach of your sponsorship agreement, clause 9(a).*

**Corp Y: the Heirloom [draft name]** (`boba` hull)
> **Program:** Heirloom. Status: in the family's hands.
> **Focus:** we're improving endurance: heavier armor, faster repair, and a ship that brings its pilot
> home.
> Hull: ████████. Shields: ██████. Yard: ███████████. First flight: ████.
> *RESTRICTED: shared within the family when the family is ready.*

**Corp Z: the Longshot [draft name]** (`moonbeam` hull)
> **Program:** Longshot. Status: very soon.
> **Focus:** we're improving range: a bigger bank, farther stars, fewer stops.
> Bank: ████████. Range: ██ stars (!!). Tested: ████. Exploded: █.
> *under NDA, sorry. ask again next quarter.*

The Orbiter 8 is still the gold standard on every corporation's page: their ship is a promise, not
something they can sell you today. In the story, other ship lines come later as patented corporate
models (`backstory.md`, "More ship lines").

### 4. History (the same for all three, for now)

**Art:** small pictures between sections from `orbiter-client/src/assets/art/` and the game's own
sprites: a planet (`planet-colony.svg` for the colonies), `belt-rocks.svg` or `asteroid-mine.svg`
(asteroids and ice), `good-water.svg` (water), `exchange.svg` (trade wars), `minerva-face.svg`
(Minerva), the Orbiter 8's hull at the end. The archived Story scene's panels
(`orbiter-client/src/components/archive/story/`) are drawn for these same eras and could illustrate
them; they're kept for Minerva's library.

> **2030s: the first colonies.** The first colony on Mars had it rough. Gravity and radiation crumbled
> their bones and wasted their muscles. The first generation suffered; the second and third adapted
> faster than anyone predicted.
>
> **The expansion.** The Moon, the moons of Jupiter, Venus, the larger asteroids. Genetic engineering
> gave us bodies made for space: we cured radiation's cancers, breathed thinner air, and kept every drop
> of water. Water became the most precious thing we had. Not for lack of ice: turning ice into water
> takes work, and work takes fuel.
>
> **The Great Regrettion.** The first surge faded into decades of trade wars. Progress slowed, then
> stalled, and left a regret nobody could quite name. The governments didn't survive it. By the time
> the expansion was done, none was left running anything. Nothing collapsed: the corporations already
> ran the water, the air, the power, the courts and the schools. People wanted a government, so the
> corporations became one. Today you are a citizen of a corporation, or of nothing.
>
> **Minerva.** Older than the corporations' rule is the Minerva Galactic Network. Nobody built her the
> way you build a product; she grew out of open, decentralized systems and became the one place every
> corporation agreed on the rules. Ledger, registry and court. She keeps the books for everyone and
> belongs to no one. In time she came to run Sol itself.
>
> **The 2090s: the Orbiters.** A new line of gravity-assist ships, the Orbiters, slung from planet to
> planet and opened the outer worlds. They took us to the edge of the solar system. That was as far as
> we could go, and we wondered whether we'd ever leave our sun.
>
> **The Orbiter 6.** A customized Orbiter 6 dove into a charging orbit around the sun, jumped, and was
> never heard from again. It is still out there somewhere.
>
> **2140: the Orbiter 8.** The Orbiter 8 charged at the sun, jumped to a foreign star, recharged there,
> and came back in under 36 hours: the first return trip in history. Now the corporations are building
> them by the hundred, and every one needs a pilot.

## For the builder

- **Data, not code paths:** keep the pages as data (e.g. a `DATABASE` object in `libs/intro.js`, or a
  file of its own like `libs/corp-database.js`), shared text once, and each corporation's lines keyed by
  `X`, `Y`, `Z` as `CORP_LOOKS` is. Then the words can change without touching templates, and the
  library (Minerva's history, in `demo4-plan.md`) can reuse the History page later.
- **Switching sponsor** switches the database: its name, its voice, its ship page.
- **Redaction** is drawn (bars), not text. Screen readers should hear "classified", not a run of blocks.
- **Colors:** the corporations' muted identity colors only. No yellow except where the game already uses
  it for "you and what's good for you" (the job offer, the ship). No pink: nothing here needs attention.
- **Phones:** the console is near-full-screen, so pages scroll; the art shrinks above the text, not
  beside it.
- **Big targets** for the page list (`docs/ui-guide.md` §1); every page reachable by keys and gamepad.

## For Koda to review

- The database's names (Records, The Archive, the wiki) and the three ships' names (Meridian, Heirloom,
  Longshot): all drafts.
- Which hull goes to which corporation.
- What each corporation is improving: cargo cost (X), endurance (Y), range (Z).
- The reconciliation in "How it works": Minerva flew the prototype home once, with her whole network.
- The "Exploded: █" joke on Corp Z's page.
