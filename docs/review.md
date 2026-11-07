# Review log (2026-11-07)

For Koda, from a session working through `docs/handoff.md` on its own. What was found, what was
changed and why, and every call made in your place. Screenshots are in `docs/review/`, taken with
the harness on a fresh local chain at 1440 × 900 and 390 × 844 (two pilots, Ada and Bob, through
the real UI: register, trade, holds, jump, scan, claim, name, session, armory, siege, black hole).

A "for Koda to decide" list is at the end.

## 1. A first-time player's eyes

Played from the title screen as someone who knows nothing, once at desktop size and once at phone
size, in one long session each. Each finding names the principle behind it (Nielsen's heuristics
for the general ones, and the usual lessons from strategy and trading games for the rest), and
says whether it was fixed or left for you.

### Fixed (clearly bugs, or clearly within the game's own style)

- **F1. A two-letter call sign or ship name fails with "execution reverted (unknown custom error)".**
  The client accepted names of 1–24 characters; the contracts want 3–24 for call signs and ship
  names (`Pilots.MIN_NAME`). *Error prevention; plain-language errors.* Fixed: the forms and the
  rename dialog ask for at least 3 characters before sending. Planet, moon, station and star names
  stay 1–24, as the contracts allow. `docs/review/desktop-12-registration-unknown-custom-error.png`.
- **F2. Every contract revert reads "execution reverted (unknown custom error)".** ethers only
  decodes a custom error when the call goes through the contract's own `staticCall`; a sent move
  fails in the wallet's gas estimate, where the ABI isn't at hand. The tray showed that line for
  every refused move. *Help users recognize and recover from errors.* Fixed: `sdk/contracts.js`
  decodes the revert against the game's ABIs and gives it plain words ("That name is taken", "Not
  enough credits: 4,200 needed", "Your ship has to be at that port"…), with the raw error name as
  the fallback.
- **F3. Colonists aboard are invisible.** After recruiting 100 colonists the HUD said "4 Empty" and
  the ship's card listed no cargo at all; a new player would think the 1,000 credits were gone for
  nothing. *Visibility of system status.* Fixed: colonists show as a cargo line in the HUD and on
  the ship's card. `docs/review/desktop-09-colonists-aboard-invisible.png`.
- **F4. A star you discovered is labelled "Mine", with "Owner: The Federation" underneath.** The
  card's "Mine" came from the discoverer; the owner is a different rule (holding the planets). On
  the same card, both at once contradict each other. *Consistency.* Fixed: "Mine" on a star means
  you own it; the "Discovered by" line already says who found it.
  `docs/review/desktop-03-star-card-mine-federation.png`.
- **F5. The siege feed and the galaxy map show addresses ("0x3c44…") where the pilot has a call
  sign.** The siege menu and the cards show names. *Consistency; recognition over recall.* Fixed:
  the client keeps a call-sign cache for every address it meets (feed, discoverers, attackers), and
  the feed and the map use it. `docs/review/phone-09-siege-feed-address.png`.
- **F6. The siege of an unsettled planet says "The planet is holding" over two empty bars and "No
  weapons left".** A claimed, unbuilt planet has no hull (60 per tech level), so it's worn down by
  the first recorded round, but until then the menu reads as if it were resisting. *Match between
  the system and the real world.* Fixed: bars with nothing to show are left out, a planet that never
  had defenses says "No defenses", and a defenceless planet says it falls at the next recorded round.
  `docs/review/desktop-08-siege-menu-attacker.png`.
- **F7. Phone: the leaderboard's Ports and Credits columns overlap.** At 390 px "0" sits on top of
  "298,979¢". Fixed: the columns move left and the credits shrink on narrow menus.
  `docs/review/phone-06-leaderboard-overlap.png`.
- **F8. Phone: the empty loadout's line runs off both sides of the menu.** Fixed: it wraps to two
  lines. `docs/review/phone-05-loadout-overflow.png`.
- **F9. Phone: the title's "Story" button is cut off at the right edge.** The three secondary
  buttons don't wrap. Fixed: they wrap and stay centered. `docs/review/phone-01-title-story-cut.png`.
- **F10. Phone: the first-steps card covers the leaderboard and chat buttons.** On a portrait phone
  it sat over the HUD's bottom-left column. Fixed: on portrait phones it sits under the profile card,
  over the map, where nothing else is. `docs/review/phone-03-first-steps-over-hud.png`.
- **F11. The galaxy map tells touch players to "hover".** There is no hover on a phone; tapping a
  star draws its line, but nothing says so. Fixed: on a device without hover the hint says "Tap a
  star for its path; tap your star for every jump you can make".
  `docs/review/phone-08-galaxy-map.png`.
- **F12. The card crashes the HUD if its sprite is gone.** Selecting a key that isn't in the system
  (it happened to the harness; a stale selection could do it) throws in `card-scaling` every frame
  and the whole HUD disappears. Fixed: a missing sprite draws nothing.

### For Koda (taste, or his art)

- **F13. On arrival the ship's card and menu are open, so the first-steps card is hidden until the
  player closes the card.** A brand-new pilot lands on a card that says "Jump To Neighbor Star / Ship
  Loadout / Start Session / Rename Ship" with no hint of what to do first; the first-steps list only
  appears once they find the × on the card. *Onboarding: the first screen should set a goal.* Options:
  show the first steps beside the card for a new pilot; or don't select the ship on a pilot's very
  first arrival. Left for you: it's your opening screen. `docs/review/desktop-01-arrival-sol.png`,
  `docs/review/desktop-02-first-steps-after-closing-card.png`.
- **F14. The settings menu ends with "Back to title screen, licensing information, how to play, about
  developers."** It's a to-do note from Demo 3 that reads as a sentence to the player, and on a
  phone it overflows the menu. It's yours, so it stays; it could become a "Back to title" button.
  `docs/review/phone-07-settings-footer.png`.
- **F15. Credits are "298979¢" in the HUD and "298,979¢" everywhere else.** The HUD is your art;
  only the number format differs. A one-line change if you want it.
- **F16. The HUD cargo slots show at most two goods and "+N more".** With eight goods a trader soon
  carries four or five; the card shows the same two. Fine for now; a scrollable cargo list is a
  design call.
- **F17. The galaxy map's chosen-star card is a plain panel** (you've noted it). The hover lines,
  the range ring and the tooltip work well with a mouse; on touch, a tapped star keeps its line.
  A mockup in your card style is in `docs/mockups/` if you want to take it up (see section 3).
- **F18. "Discovered by: Ada [0x709…c8]"** on cards: the bracketed address fragment is Demo 3's
  convention. Kept. On the galaxy map the same person reads "you" or a name now (F5).
- **F19. The claim dialog promises "Then bring colonists and supplies to found a Citadel", but
  nothing in the Colony menu says where colonists come from.** The Build page lists what's missing
  in pink ("Needs 100 people"), which is good; the Tech Tree explains Earth. I added one line to the
  People page ("Recruit colonists at Earth's hiring hall") since it's wording, not art. Say if you'd
  rather not.
- **F20. Sol's planets' menus for a new pilot show only "Recruit Colonists / Visit Space Station /
  Visit Moon".** There's no "Attack" or "Claim" on them (right, D49), but nothing tells a new player
  that Sol's planets can't be claimed. The card's "Owner: The Federation" is the only clue. Fine, I
  think; noting it.
- **F21. The jump tips** ("Not all stars offer the same gravity assist. Just because you can jump from
  one star to another does not mean you will be able to jump back the same way.") describe Demo 3's
  one-way neighbor graph; on the hex grid every jump within range works both ways. The tip is yours;
  it's now untrue, so I'd drop it or reword it. Left for you (see section 2, L3).

## 2. Leftovers of the old game

(Filled in below as the hunt proceeds.)

## 3. Consistency across menus

(Filled in below.)

## 4. Player-facing wording

(Filled in below.)

## 5. Touch and phones

(Filled in below.)

## 6. Code review of `sdk/client.js` and `stores/player.js`

(Filled in below.)

## For Koda to decide

- F13: the opening screen for a brand-new pilot (first steps hidden behind the ship's card).
- F14: the settings menu's to-do sentence.
- F15: thousands separators in the HUD.
- F21: the "can't jump back the same way" tip no longer holds on the hex grid.
