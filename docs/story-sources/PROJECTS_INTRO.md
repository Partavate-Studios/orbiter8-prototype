# Orbiter 8: Projects & Deliverables (Intro & Minerva)

**Date:** 2026-11-18. Companion to `STORY_UPDATE_INTRO.md` (story content and open questions).

**For Claude Code:** these are the work items that come out of the new intro and Minerva direction. They're ordered roughly by dependency. Each lists scope, dependencies, and open questions. Follow `COLOR_SYSTEM.md` for all new UI and art.

---

## Overview

| # | Project | Depends on | Size |
| --- | --- | --- | --- |
| P1 | Backstory development | — | Medium |
| P2 | Intro scene (interactive apartment) | P1 (text, names), P3 (art) | Large |
| P3 | Art: intro scene assets | P1 (corp identities for ads) | Large |
| P4 | Minerva console (in-intro and in-game) | P1 (voice) | Medium |
| P5 | Minerva in the HUD (UI redesign) | P4 | Large |
| P6 | Onboarding flow: remove launch, new callsign/ship naming, wake in orbit | P2, contracts | Medium |
| P7 | Story panels: replace or rework | P2 | Small–Medium |
| P8 | Minerva reading library (codex) | P1, P4 | Medium, ongoing |
| P9 | Contract changes for citizenship and onboarding | Decisions in P1/P6 | Medium |

---

## P1. Backstory development

**Goal:** write the world details the intro and Minerva need. Details are in `STORY_UPDATE_INTRO.md` section 2.

**Deliverables:**

- [ ] **Three corporations:** name, logo concept, nature and values, industry focus, history, laws and protections, gameplay identity, ad voice, job-listing text.
- [ ] **Fake company registry:** advertisers, billers, junk mailers, rejection senders. Each gets a name, what it sells or does, tone, and any link to the three corporations.
- [ ] **Intro copy:**
  - [ ] Billboard and TV ad scripts, with clues to each corporation's nature.
  - [ ] Account screen text.
  - [ ] Health score notices.
  - [ ] Inbox: junk mail, overdue bills, job rejections.
  - [ ] Curfew warning.
  - [ ] The pilot job listing (×3, one per corporation).
  - [ ] Application flow.
  - [ ] Final "escort will arrive" message.
- [ ] **World details:** basic income (resolve the "government check" conflict), health score, curfew, the city, processing, cold storage, the AMI.
- [ ] **Minerva's voice guide:** tone, vocabulary, message formats. Minerva narrates much of the game, so this is a reference for all future copy.
- [ ] **First in-game Minerva message:** what's expected of you as a new pilot.

**Open:** resolve the questions in `STORY_UPDATE_INTRO.md` section 7 first, especially the government check and which ship each pilot gets.

---

## P2. Intro scene (interactive apartment)

**Goal:** a short, playable scene in which the player chooses to upload into Minerva, picks a corporation, and learns the world by exploring.

**Structure: layered planes that scale and shift (parallax)**

1. **Cityscape (back):** dark blue sky, black buildings in **two layers** for depth, ads and billboards.
2. **Balcony:** railing. The vape interaction happens here, and there's a Minerva terminal.
3. **Apartment (front):** tiny room with a TV, a door, and Minerva terminals.
4. **Hand silhouette:** the player's hand, shown pressing buttons, so it feels like you.
5. **Minerva overlay:** near-full-screen takeover when a terminal opens, until closed.

**Interactions:**

- [ ] Move between apartment and balcony (layers shift and scale).
- [ ] **Vape** on the balcony. Each hit pushes a Minerva notice to the terminal: "health score −1."
- [ ] **TV:** turn it on, and ads cycle (corporation clues).
- [ ] **Door:** curfew warning.
- [ ] **Terminals:** multiple, including the balcony. All open the same Minerva console (P4).
- [ ] **Minerva console in intro mode:**
  - Account balance (−45 credits after the last payment went to bills).
  - Health score (very low; the vape count updates it).
  - Mail (junk, bills, rejections).
  - Job search: one eligible opening, three employer listings.
- [ ] **Apply** to one corporation, which sets the base corporation and citizenship.
- [ ] Final message: **an escort will arrive shortly to take you to processing.**
- [ ] Transition to waking in orbit (P6).

**Considerations:**

- Works with mouse, touch, and **gamepad** (handhelds). Every interactive object must be reachable by focus navigation with a visible focus ring.
- Keep it short and skippable for returning players, with an option to replay it from the title screen or the Minerva library.
- Suggestion: the moment of signing the job contract could be the wallet signature, so "signing your life away" is literally signing a transaction. Tie this to P9.

---

## P3. Art: intro scene assets

**Deliverables:**

- [ ] Cityscape: sky, two building layers, billboards and ads (animated or rotating).
- [ ] Balcony: railing and view framing.
- [ ] Apartment interior: tiny, cluttered, lived-in. TV, door, terminal(s), personal details that tell the character's story.
- [ ] Hand silhouette, with poses for pressing and pointing.
- [ ] Vape prop, with an exhale or vapor effect.
- [ ] TV ad loops.
- [ ] Logos for the three corporations and the main fake companies.
- [ ] Minerva's visual identity: console frame, typography, and its signature color within `COLOR_SYSTEM.md`.

**Considerations:**

- Same SVG and silhouette aesthetic as the rest of the game.
- **Color:** the city is dark, with ads as the loud color, an intentional "loud world" moment.
- Add the intro to the color system's screen list. Decide Minerva's identity color and give it a slot in the hue map.
- Pink (attention) fits overdue bills and health warnings. Yellow (yours / good for you) should first appear on the job offer and the new ship, a nice storytelling use of the existing color rule.

---

## P4. Minerva console

**Goal:** one console component used in the intro and in the game.

**Deliverables:**

- [ ] Near-full-screen overlay with open and close, and focus trapped while it's open.
- [ ] A modular section system (Account, Health, Mail, Jobs in the intro; more sections in the game).
- [ ] A notification system that can push notices while the console is closed (e.g. the vape notice on the terminal screen).
- [ ] Message reader for Minerva mail.
- [ ] Copy follows the Minerva voice guide (P1).

---

## P5. Minerva in the HUD (UI redesign)

**Goal:** Minerva is available at all times in the game HUD, and the UI is redesigned around it.

**Scope (to be designed):**

- [ ] Persistent Minerva entry point in the HUD (with a notification badge).
- [ ] Decide what moves into Minerva vs. what stays on screen. Candidates: messages, the help ("?") button, account and credits, citizenship and corporation, fleet list, claims and disputes, siege notices, the reference library.
- [ ] First in-game message on waking in orbit.
- [ ] Rework of the current HUD rail (help, battle, trophy, comms, settings) around Minerva.
- [ ] Gamepad navigation.

**Open:** this is a larger project. Start with a design pass (layout mockups) before building.

---

## P6. Onboarding flow changes

**Goal:** replace "launch your ship" with "wake up in orbit."

**Deliverables:**

- [ ] Remove the ship take-off / launch moment from the new-player flow.
- [ ] New screens for **callsign (pilot name)** and **ship name**, placed in the new flow. Candidates: during the Minerva job application (your pilot registration with Minerva), or on first waking in orbit (Minerva asks you to confirm your callsign and name your ship).
- [ ] Wake state: the player's ship is in **Earth orbit (Sol system)**, with Minerva's first message unread.
- [ ] Returning players skip straight to their fleet.

**Open:**

- Where do the wallet connection and the transaction happen in the flow?
- Is the ship minted at application time or at waking?

---

## P7. Story panels

**Goal:** decide what happens to the existing title-screen story panels.

**Options:**

1. **Replace** them with the intro scene. The Story button on the title screen replays the intro.
2. **Keep a short version** as a cinematic before or after the intro (the big-picture 2140 history), with the intro covering the personal story.
3. **Move the history into Minerva's library** (P8) as readable entries.

**Note:** Koda has said the title screen is still very purple and the story still uses old graphics. Whichever option is chosen should get the new art and color treatment.

---

## P8. Minerva reading library (codex)

**Goal:** Minerva holds lots of optional reading that tells the world's story.

**Candidate content:**

- History: colonization, the Great Regrettion, the Orbiters, the 2090s land rush, the Orbiter 8.
- How Minerva works, and the upload program.
- The three corporations: charters, laws, history.
- Pirates, from Minerva's neutral point of view.
- Guides: trading, claiming, sieges, crafting.
- Your pilot record and citizenship.

**Open:** structure, unlock rules (all at once vs. unlocked by play), and how much is in-client vs. on-chain.

---

## P9. Contract changes

To be confirmed with Koda before implementation.

- [ ] **Citizenship:** record the player's base corporation on-chain (set at application).
- [ ] **Pilot registration:** callsign registered with "Minerva" (existing avatar/pilot-name logic), unique names enforced.
- [ ] **Starting state:** ship created in Sol, in Earth orbit, instead of the current launch flow (`launchShip`).
- [ ] **Starter credits:** the current `launchShip` awards a placeholder 100 credits. Define the new starting balance (the pilot program's advance?).
- [ ] Changing corporations later: allowed? At what cost? Does it interact with pirates renouncing citizenship?
