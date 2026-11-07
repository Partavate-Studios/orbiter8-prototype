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

Hunted with grep for `> 0` and truthiness on ids, the old three goods and field names, avatar
and Orbiter8 wording, and dead paths. Found and fixed (one commit, "Leftovers, consistency…"):

- **L1. The title's network panel listed "Game" and "Avatars": both were the Pilots address**, as
  Demo 3's two contracts. It lists the ten modules now, Galaxy to Planet NFTs, with "Add to
  wallet" still on Credits. The chain store's `galaxyAddress` and `avatarAddress` went with it.
- **L2. Minerva's profile panel read `gameState.systemCount`**, a field that no longer exists (it
  showed nothing), and said "total avatars". It reads the star count and says "pilots".
- **L3. Two star counts.** The title's "N star systems" counted the cells the client happened to
  have loaded (so it changed as you panned the map), while the network panel counted discovery
  events. One count now: discoveries plus Sol, read incrementally (section 6).
- **L4. Owner checks did arithmetic on addresses** (`parseInt(owner) === 0`, `owner > 0`), Demo
  3's habit from the old review. An owner is an address or none; they test for presence.
- **L5. Dead paths:** `GameState.createAvatar` and `launchShip` (the wizard registers through the
  onboarding store) and `buildStation` by name (Demo 3's one building; `Player.build` is the line).
- **L6. The credits token's wallet symbol was Demo 3's "OBTR8"**; the contract's is O8C.
- **L7. `sdk/chain/rpc.js` ended with a comment about the AvatarControls contract.** Gone.
- **L8. Two-letter names** (F1 above) were a leftover of the old contracts' looser rules.

Found and left (not bugs, or Koda's):
- **L9. The jump tips** (`jump-animation.svg.vue`): "Not all stars offer the same gravity assist. Just
  because you can jump from one star to another does not mean you will be able to jump back the
  same way" was true of Demo 3's one-way neighbor graph; on the hex grid every jump within range
  works both ways. And "you can rename new stars you visit first" is now "until the star has an
  owner, for 50,000 credits". Koda's text: listed for him (F21).
- **L10. The HUD and the ship's card show at most two goods and "+N more"** (F16): Demo 3's
  three-goods layout carried over on purpose (B45). A design call.
- **L11. `tradeEvents` in the events shape** is filled but no screen reads it (Demo 3's HUD did).
  Harmless; left.
- **L12. The "avatar" name lives on in code** (`avatar`, `haveAvatar`, `avatarNames`, the avatar
  icon): internal names only, not player-facing. Renaming them would touch forty files for no
  visible gain; left.

## 3. Consistency across menus

Compared each new menu (Colony, Armory, Loadout, Siege, Feed, the galaxy map, the tech tree,
the black-hole entry) with Koda's (trade, shipyard, planets, ships, settings, leaderboard, the
cards and the in-game dialog). What matched already: the menu container and close button, the
`menu-button` for actions, the trade slider for amounts (`amount-dial`), the title in
`#ffffff88` at 1.5em, the purples. The mismatches, and what was done:

- **C1. The tech tree was a plain rounded panel** (`#12052af5`, 12px corners) over the game, unlike
  the in-game dialog, which draws the card's frame (striped purple edge, wide corners, a title
  pill). *Fixed:* it uses the dialog's frame. `docs/review/desktop-13-tech-tree-card-frame.png`.
- **C2. The galaxy map's chosen-star card was the same plain panel.** *Fixed:* the dialog's frame,
  with the star's name in the title pill. The map itself stays as it is (F17).
- **C3. Ordering parts from the Autofactory went through two number dialogs** ("Which part? 1
  Drone (500¢), 2 Repair bot…", then "How many"), unlike every other purchase in the game, which
  is a list and a dial. *Fixed:* an Order page in the Colony menu, in the armory's row style, with
  the part's credits and build time on the row, a dial, what each takes from storage, and the
  total or what's missing in pink. `docs/review/desktop-14-factory-order-list.png`.
- **C4. Part counts read "How many Railgun".** *Fixed:* plurals ("How many railguns").
- **C5. Rows and tabs in the new menus were 18–22 units tall** where Koda's slots are 60 and his
  buttons 32. *Fixed:* 24–30 (section 5).
- **C6. The siege menu's "Record the Rounds" had no explanation** of what recording is. *Fixed:* a
  line under the buttons.
- **C7. The tech tree said "Parts are fitted to planets and ships with battle, in the next
  milestone"** and "(with battle)" on the Armory: milestone notes shown to players. *Fixed.*
- **C8. Type sizes:** the new menus use 0.75–0.85em for body text where the trade menu uses
  0.7em and the cards 0.4–0.5em (scaled up); within a step of each other. Left.
- **C9. Pink** is used in the new menus only for what needs the player (missing requirements,
  damage, a siege, a failed order), never on a button. Checked; nothing to change.
- **C10. Wording:** "holds" everywhere on screen (B46), "credits" with the cent sign as in the HUD,
  "Minerva" for filings. The Colony menu says "people" for a planet's population and
  "colonists" for the ones aboard, which matches the contracts; left.

## 4. Player-facing wording

Shortened, keeping Minerva's register (direct, a little formal, second person, no jargon):

- **W1. The session dialog** (55 words → 38): "Approve once. For the next 4 hours your moves go
  through a key kept in this browser, with no popups. It carries a little gas money; what is left
  comes back when you end the session." The tray's "no wallet popups for a while" says "for 4 hours".
- **W2. The attack dialog** (47 → 36): "A siege is public, fought in rounds every 30 minutes while
  your ship stays here. Wear the planet down, then file a claim: it completes a day later unless
  the defenses come back."
- **W3. The claim dialog** stays (it's already short: 24 words). The star-naming dialog stays
  (one sentence and the fee).
- **W4. The siege menu** for an undefended planet (F6), and the Colony menu's People page (F19).
- **W5. Refused moves** (F2): each contract error in one short sentence.
- **W6. The galaxy map's hint** on touch (F11).

Left for Koda: the settings menu's footer (F14), the jump tips (F21), and the wizard's
"Greetings Pilot" text, which is Minerva's own and reads well.

## 5. Touch and phones

Checked at 390 × 844 with touch emulation (the harness's new `TOUCH=1`), Apple's 44 pt and
Material's 48 dp as the yardstick (in the HUD's units, about 30–34 at phone scale):

- **T1. The trade slider couldn't be dragged with a finger:** it listened to mouse events only.
  *Fixed:* pointer events, with the pointer captured so a drag that leaves the bar keeps going.
  `docs/review/phone-10-trade-slider-touch-drag.png`. The slider's arrows were 16 × 16; each has a
  30 × 30 tap area now. This touches Koda's trade menu, but only how it listens, not how it looks.
- **T2. The new menus' rows** (armory parts, storage goods, the order list, finished parts' Install
  and To ship, the feed) were 18–22 tall. *Fixed:* 24–30, with the gaps to match.
  `docs/review/phone-11-armory-rows.png`.
- **T3. The Colony and trade menus' page tabs** were 22 tall. *Fixed:* 28.
- **T4. Stars on the galaxy map** had a 12 px tap radius. *Fixed:* 18 px on touch screens. The hover
  tooltip is mouse-only now (it sat under the finger).
- **T5. Portrait layouts:** the bottom card, the HUD's corner buttons (53 px) and the menus'
  close chevron are fine. The leaderboard (F7), loadout (F8), title (F9) and first-steps card
  (F10) were fixed under section 1. The Colony menu's five pages fit at 390 wide; the Order page's
  rows show the part, credits and time, with the goods under the dial, so nothing overflows.
- **T6. The tech tree** scrolls inside its card on a phone (it did before too).
- **T7. Not checked:** a real phone's keyboard over the dialogs, and pinch-zoom on the galaxy map
  (it has wheel zoom only; the system map pinches). Listed for Koda.

## 6. Code review of `sdk/client.js` and `stores/player.js`

Read both end to end, then the contracts they call. Fixed (one commit, "Client: the session key
is saved before it's sent…"):

- **R1. The session key was saved only after its transaction was mined.** A reload (or a closed
  tab) between the wallet's approval and the receipt lost the key, and with it the gas money the
  contract had just sent it (0.2 of the network's coin). *Fixed:* the key is saved, marked pending,
  before the transaction is sent; forgotten (and the previous key restored) if the wallet declines
  or the chain refuses; and picked up by `resumeSession` once the chain shows it. A pending key
  older than 10 minutes with no session behind it is treated as dead.
- **R2. A dead key's gas money was never swept back.** When a session expired, was ended from
  another browser, or was replaced by a new one, the browser kept the key and the menu simply
  offered "Start Session" again: the old key's leftover gas was stranded. *Fixed:* `resumeSession`
  forgets a key whose session is over and sweeps its balance home; `startSession` sweeps the key
  it replaces; `endSession` sweeps even when the key itself can't end the session.
- **R3. A move signed by a key the chain no longer honours failed outright** ("BadSession"). *Fixed:*
  it's sent again from the wallet, the session is dropped and the key swept.
- **R4. `endSession` from the key failed when the session was already over on chain** (the key
  reverts with BadSession), leaving the key stored. *Fixed:* it falls back to the wallet.
- **R5. Reloads could overlap and drop a move's reload.** `refresh()` ran as often as the block
  watcher and the moves asked; `refreshSystem` ignored a request while a load was in flight, so a
  move that landed during the watcher's reload could come back to a stale screen until the next
  block or the 2-minute reload. *Fixed:* one reload at a time, with one more queued when a request
  arrives during one; a caller gets the reload that includes its change.
- **R6. Every reload read every registration since block 0** (`pilotList`), and the title's star
  count read every discovery since block 0: two log scans per block that changed the game, growing
  with the galaxy. *Fixed:* both are read incrementally from the last block seen.
- **R7. A claim with a name reported "Couldn't claim" if the name failed after the claim went
  through.** *Fixed:* the claim stands; a failed name is logged, and the card offers Rename.
- **R8. The unregistered branch of `loadPilot` left `deeds` and `session` from a previous pilot**
  (a wallet that switched accounts). *Fixed.*

Verified on the local chain through the real UI and the dev wallet: a session resumes after a
reload of the same browser; a move goes through the key; ending the session leaves the key with
only dust (21,000 gas' worth); a session ended from the wallet behind the page's back leaves the
page's next move going through the wallet, the key forgotten and swept; the same after a reload.

Found and left (for Koda, or for the testnet milestone):
- **R9. Public RPCs cap `eth_getLogs` ranges** (Infura 10,000 blocks, some nodes 2,000; dRPC and
  Alchemy vary). The client reads trades, broadcasts and registrations over the last 20,000
  blocks and the siege feed over 50,000 on every reload. On the local chain that's nothing; on a
  public network a provider may refuse the call, and the siege feed and docking would silently
  come back empty. Belongs with milestone 6 (the first testnet run will show it); the fix is to
  page the range or to keep a cursor, as R6 does for registrations.
- **R10. Ships at a star are found by reading every pilot's record** (`shipsAt`, B49) on every
  reload, and the leaderboard reads every pilot's balance. Fine at demo scale; an index by star in
  the contracts, or an indexer, when pilots number in the hundreds.
- **R11. `dockedAt` draws a ship docked wherever its pilot last traded at this star,** even after
  the pilot left and came back (B50 says "while it stays at that star", but the client can't tell).
  Cosmetic.
- **R12. `declinedScans` is never cleared** after a declined wallet prompt, so a scan the pilot
  declined to record isn't offered again until the next reload of the page; it's still recorded
  with their next move. The comment says "until something changes"; it's "until the page reloads".
  Harmless; noted.
- **R13. `player.js` is thin and sound:** a mirror of the client's state with tracked actions. The
  one thing to watch is `besiegedCells`, which replays the whole feed on every sync; fine at the
  feed's size.

## For Koda to decide

- F13: the opening screen for a brand-new pilot (first steps hidden behind the ship's card).
- F14: the settings menu's to-do sentence.
- F15: thousands separators in the HUD.
- F16 / L10: the HUD and card show two goods and "+N more" with eight goods in the game.
- F17: the galaxy map itself (the hex view, its lines and tooltip) is still plain; only its card
  took the card frame.
- F21 / L9: the "can't jump back the same way" and "rename stars you visit first" tips.
- T7: pinch-zoom on the galaxy map; a real phone's keyboard over the dialogs.
- R9: log ranges on public RPCs, with the first testnet.
- The trade slider now listens to pointer events (T1): same look, but it's your menu.
