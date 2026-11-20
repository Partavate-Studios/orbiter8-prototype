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

## Koda's decisions (2026-11-07), and what was done

Koda answered the list below in one sitting. Each answer, and the change it led to:

- **F13, the first arrival:** "Show first steps beside the open card." On landscape screens the
  first-steps card sits at the bottom right, clear of the open card and the HUD's buttons, whether
  or not something is selected; on a portrait phone it still shows only with nothing selected,
  where the card would cover it.
  - *Later the same day, Koda:* "I don't like this popup in the corner… bury it under an icon with a
    question mark and have it pop up in the middle of the screen… slide up like all of the other
    menus do." The corner card is gone. A "?" button in the HUD's left column, above the siege
    feed, opens a First Steps menu in the usual menu container: five steps ticked off in yellow as
    they're done, how many are left, and "How Planets Grow" (the tech tree). The button carries a
    badge with the steps left, like chat's count, until all five are done.
- **F14, the settings footer:** "Replace it with a Back to Title button." Done, a menu button.
- **F15, thousands separators:** "Yes, separators everywhere." The HUD, the trade menu's balance
  boxes and tabs, the port's prices and the shipyard's first-hold price.
- **F16 / L10, the cargo lists:** "Generally, we want to show every good on any screen. On the trade
  screen you have to flip tabs between buy/sell which I find cumbersome. Come up with your best
  layouts. This will be harder on the phone, so a tab might make sense there, but there's no excuse
  for it on a desktop display." Done:
  - the HUD's profile card lists every good aboard (and the colonists), two by two, and grows a row
    at a time; on a portrait phone it keeps to three rows (the sixth slot reads "+N more") so it
    stays above the card;
  - the ship's card lists every good (nine rows at most, closer past six);
  - the trade menu on a wide screen shows Buy and Sell side by side, every dial at once, with no
    tabs; the Port of Trade panel lists every good the port trades (one line each past four, with
    the card's arrows: ↓ sells, ↑ buys); the cargo tabs show every good traded here or aboard, in
    two columns past five. On a phone the Buy and Sell pages stay, with the page's goods.
- **F17, the galaxy map:** "Bring it in line now." Its buttons are the card's pill (the dialog's,
  shared from `App.vue`), its title the menus' dim 1.5em; the hex view, lines and stars are as they were.
- **F21 / L9, the jump tips:** "We may want one way jumps later, but for now we don't, so remove
  those tips. Feel free to add 3–6 new tips, and to use cheeky language like the one that says brb."
  The two went; six new ones: Minerva's books, black holes in pairs ("Probably. It has always been
  fine so far."), the thirty-second scan, nobody has lost an Orbiter 8, colonists a hundred to a hold
  ("They say it is cosy"), the weapon counters, and Sol's planets.
- **T7, pinch-zoom on the galaxy map:** "Yes." Two fingers zoom about the point between them, as
  on the system view; the wheel zooms about the cursor now too. The pointer is captured only once
  a drag or pinch is under way, so a tap still picks a star.
- **R9, the event reads:** "This seems like a bug and we should fix it. Chunk the reads." Done:
  `sdk/event-log.js` reads every event range in 2,000-block chunks (under every provider cap seen),
  and keeps a rolling window per feed (trades, broadcasts, registrations, the siege feed) so each
  reload reads only the blocks since the last. Networks can carry a `startBlock` (the deployment's)
  so the first read never walks the chain from genesis; set it for every public network with
  milestone 6. For the record: the contracts' view calls (regions, systems, ports) have no range
  limit; only event reads go through `eth_getLogs`.
- **T1, the trade slider's pointer events:** "Fine, keep it."

## 7. The wallet connect flow (Koda, 2026-11-07: "super awkward")

Read `sdk/chain/wallet.js`, the chain store, the onboarding store and the wizard against the
intended flow (connect once, register, then one approval for a session key). Tried four paths in
headless Chrome: the dev wallet; a plain injected wallet (the harness's) with `?wallet=browser`;
a wallet whose popup is never answered; and no wallet at all. Fixed:

- **W1. Nothing to do when the wallet's popup went unanswered.** A closed or hidden MetaMask
  popup (or a locked wallet) left "Waiting for MetaMask" on screen for good: the request never
  errors, and clicking Connect again only reopened the same screen. After 15 seconds the wizard
  now says the wallet hasn't answered and offers "Ask MetaMask again"; a request still open in the
  wallet comes back as "already has a request open: click its icon", as before.
- **W2. The real flow couldn't be tried locally:** under `npm run local` the dev wallet is always
  preferred, so the connect wizard is bypassed. `?wallet=browser` leaves the dev wallet out, so an
  extension pointed at the local chain (chain id 31337) goes through the real steps. Documented in
  `readme.md` and `CLAUDE.md`.
- **W3. A wallet that announces late** (an extension still loading) was reported as "No wallet was
  found… reload". Discovery now asks three times over about three seconds before giving up.
- **W4. The wallet's `disconnect` event reloaded the page.** MetaMask fires it when it loses its own
  connection to the chain, so a flaky RPC could reload the game in a loop, mid-move. It's logged
  now; the block watcher already reports lost contact and recovers. Account and network changes
  still reload (every store starts over on the new one). Listeners are set once per provider, not
  once per attempt.
- **W5. Adding a network didn't switch to it** in wallets that add without switching, leaving the
  player on the network step with no message. After adding, the switch is asked for again.
- **W6. The call-sign step said "Confirm the registration in your wallet"** for a moment, though
  that step never touches the wallet (the name is checked free and held until the ship is named).
  It says "Checking with Minerva that the call sign is free…".
- **W7. A wallet answering a declined request with an empty account list** (some do, instead of an
  error) now reads as "declined" rather than failing on an undefined account.

Left as is: the returning-player auto-connect (no popup when the wallet already trusts the site);
the funds step's six-second balance poll; the one-wallet / remembered-wallet shortcut on Begin.
Not tried here: a real MetaMask (none in headless Chrome); `?wallet=browser` is for that.

### Checked against a simulated wallet (2026-11-07, after the wallet pass)

The real connect flow was driven through `?wallet=browser` with the harness's injected wallet
patched to behave as a real one does: a fresh wallet that approves; one that declines (4001); one
whose popup never answers; one with a request already open (-32002); and one on Ethereum mainnet.
Each gave the right screen: connected and on to the call sign within a second; "You closed Test
Wallet's request, so nothing was connected" with Try again; after 15 s "hasn't answered" with
"Ask again", which connects once the wallet answers; "already has a request open"; and the
network step with the local chain offered. Two gaps found and fixed:

- **A retry's outcome could be overwritten by the first, hung attempt.** Attempts were told apart
  by the wallet object, which is the same for a retry; a first popup answered late would have set
  the error state (or cleared the retry's timer) over the retry. Each attempt has its own token now.
- **A wallet that switches network without saying so left the player on the network step** with
  no message, since the page reloads only on the wallet's `chainChanged`. After a switch the wallet
  agreed to, the chain is read back: if it changed, the page reloads itself; if the wallet stayed
  put, it says so and asks the player to switch in the wallet. Verified with a wallet that never
  emits the event.

Not exercised: a real MetaMask (none in headless Chrome). `?wallet=browser` is there for you to try.

## 8. The story page (Koda, 2026-11-07: "it kind of sucks")

Koda's brief: the Story page was too thin, its opening orbiting planets looked terrible (one gradient
for every planet), its Back button was confusing and the close "×" easy to miss. Tell the story in
summary, as before, with the game's own assets, inspired by how comics and graphic novels tell a
story; eight panels or so (four to twelve). Done, and seen at 1440 × 900 and 390 × 844
(`docs/review/story-*.png`):

- **Eight panels, one per page, each framed like a comic panel** with the narration in caption
  boxes on the frame's corners (lead on the top left, close on the bottom right, sentences arriving
  one at a time): Sol in 2140; the first colony on Mars; thriving across the system (Jupiter's
  moons, the ice of the asteroids); the Great Regrettion and the corporations (a crowded port, every
  trade code falling); Minerva (her owl, the ledger's entries stamped one after another); the
  Orbiters of the 2090s slinging planet to planet to the dashed edge of the system; the jump (a
  charging orbit around the sun, then the flash and the streak to a neighboring star); and the land
  rush (the galaxy map, routes in your yellow, claim flags going up, a pirate band in the dark),
  closing on "Liberta Galactica!". The words are `docs/backstory.md` shortened to captions; the
  story text itself didn't change.
- **The game's art throughout:** the sun is the star sprite; the planets are drawn by a new
  `story-planet` component with the planet sprite's disc, lighting and per-class surfaces (the
  surfaces now live in `components/assets/planet-surfaces.js`, shared with the tech tree's pictures,
  which had already invented Oceanic, Desert and Swamp surfaces in the sprite's style); Sol's nine
  planets use the classes, sizes and rings SystemGen gives them; the station, the moons, the ships
  (with engine trails) and Minerva's owl are the sprites' art. Invented, small and on-brand: the
  colony domes and the descending pod on Mars, the ledger stamps, the trade ticker, the claim flag
  (from the tech-tree art), the heliopause flare.
- **Navigation:** "◀ Title" top left goes back to the title; "◀ Back" and "Next ▶" turn the pages
  (the last says "Done ▶" and returns to the title); page dots jump to a panel; "3 / 8" top right;
  a tap on the panel reads on; a sideways swipe turns the page on touch; ← → Space and Escape work.
  The "×" is gone, replaced by the Title button.
- **Phones:** the frame turns tall (9:16), the captions span its width, and the four wide
  compositions (Minerva, the Orbiters, the jump, the land rush) are shown whole as a square in the
  middle instead of cropped to a column. The other scenes are cropped to their middle, where the
  subject is.

Koda's second pass (same day): the frame's white border was too intense and its square corners off
style; the captions covered the art; the type was small. Now: a thin lavender border, rounded
corners (as the panels and cards have), captions that hang over the frame's top-left and bottom-right
edges so they cover little of the scene, and larger type.

Calls made in your place:
- **Nine panels would have given the pirates their own page**; eight keeps your target, so they
  share the last panel's closing caption and the dark corner of its map. Easy to split if you'd
  rather.
- **The story doesn't mention the Federation** (the trust holding Sol's worlds): it's a game rule
  more than a story beat, and the caption was already long.
- **The ticker's codes fall (▼) in lavender, not pink:** pink is reserved for what needs you.
- **Routes on the last panel are your yellow** (yellow is "where you can go" on the galaxy map).

## 9. The expansion (2026-11-16, `expansion-plan.md`)

Calls made building it, for Koda's review:

- **X1. Only the Federation's port fees go to the treasury** (decision 28 names the fee). The Federation's
  other income still burns: parts bought at a Sol armory (twice their cost) and repairs at a Sol yard.
  Sending those to the treasury too is a one-line change each in `Armory.sol` if wanted.
- **X2. The treasury starts as the deployer** (`Market.initialize`'s admin); `setTreasury` is admin-only
  and refuses the zero address.
- **X3. Every Sol station sells parts at the Federation's price** (twice their cost), as the I.S.S. did.
- **X4. The HUD redesign's analysis** moved to `docs/hud-redesign.md`, its mockups and screenshots to
  `docs/mockups/hud/`, when `client-rnd/hud/` was removed.
- **X5. Seen, not fixed:** at phone size the zoom rail's "−" looks clipped beside the minimap.
- **X7. Planets keeps its name** after Claims was split out (the plan says "Settlements"). Renaming it
  touches the deploy script, the SDK, the ABIs and every client; it's cheaper to rename once asteroids
  make it settle more than planets. Planets keeps an `ownerOf` passthrough so Battle, Armory and Factory
  didn't change.
- **X8. The star-name fee** is now Claims' own number (`starNameFee`, 50,000, what a Station cost), so
  tuning buildings no longer changes it.
- **X9. Testnet** (done 2026-11-17: redeployed): body ids and Claims change the contracts' interface; the Paseo deployment needs a
  fresh deploy (throwaway key, as before) before the client plays the testnet again. Not done yet.
- **X10. Drone bays in the shipyard:** a two-way toggle (Cargo Holds / Drone Bays) above the existing
  stepper, drawn like the stepper's buttons; the menu's art is otherwise unchanged. It's a new control in
  one of your menus, so look at it (`docs/mockups/` has no mockup for it; screenshots in the commit's
  play-test). The loadout's summary line adds "drones N of M".
- **X11. Bay prices count both kinds:** each bay, cargo or drone, costs a little more than the last
  counting every bay the ship has (the 250 cap counts both too).
- **X12. Ships start with no drone bays** (and 5 cargo bays, as before). The 4 built-in drones (decision
  26) will take no bays.
- **X13. The built-in drones' repairs** (decision 26), in `Repairs`: 10 hit points a repairing drone an
  hour (`setDroneRate`), so four restore five armor plates (250) in about 6 h, against the yard's 3 h
  and 3,000 credits. Order: armor, systems (a weapon 30, a drone 10, a bot 20), bays (2 each), range
  (40 a level). A ship whose damage is all restored is no longer "retreated" (D52 said only a yard
  cleared it). New ships start with all four mining. Work during a siege is counted when it ends,
  before the siege's losses.
- **X14. The loadout's drone row** ("4 × Built-in drone", − / + to move one between repairing and
  mining) uses the Unload button's look. New control in an existing menu: for Koda's eye.
- **X15. The mining drone** is Factory part 9 ("Mining drone", 800 credits, 5 min, 5 metals and 3
  electronics; at Sol 1,600 as every part is doubled there), fitted to ships only until bodies get drone
  pools (Phase 3); a planet's store offers "To ship" for it, not "Install". It may be fitted or unloaded
  mid-siege, since it never fights.
- **X16. Belt generation** (`BeltGen.sol`): a belt at a star when its hash says 1 in 4; it lies just
  outside a planet picked from the hash (Sol's outside Mars). Sections: 1 in 6 empty; compositions
  carbonaceous 50%, silicate 30%, metallic 20% (gameplay odds; real belts are mostly carbonaceous);
  size 1–8. **Sol's belt is hand-placed:** Ceres (C 8), Vesta (S 6), empty, Pallas (S 6), Hygiea (C 5),
  Psyche (M 5), empty, Juno (S 3). Two empty sections so new pilots can mine near home. Yields:
  carbonaceous water ice and organics; silicate silicon and metals; metallic metals and rare elements.
- **X17. The asteroid line** reuses the planets' step numbers: Platform 1, Mine 2, Port 4, Armory 6 (no
  Station, Yards or Autofactory), so the Market's port and the Armory's checks work as they are. Costs
  (keys step + 8, tunable): Platform 3,000 credits, 10 min, 20 people, 20 equipment, 20 metals; Mine
  15,000, 30 min, 60 equipment, 30 electronics; Port 60,000, 2 h, 80 equipment, 80 electronics; Armory
  200,000, 6 h, 120 rare elements, 80 electronics. An asteroid holds 100 people a unit of size. Its port
  class is 10 + composition: carbonaceous sells water and organics and buys He-3, equipment and
  electronics; silicate sells metals and silicon and buys water, organics and electronics; metallic
  sells metals and rare elements and buys water, He-3 and equipment. Asteroids don't produce from
  people; their mining drones will (next step).
- **X18. Drone pools** (rate superseded by X19) (`Drones.sol`, decision 24): asteroids only for now; a pool holds 10 drones a unit
  of size; mining drones are landed from the ship (and boarded back) like colonists; the owner sets how
  many defend, from anywhere, not during a siege. Once the Mine stands, each mining drone makes 0.25 of a
  unit an hour of each good the asteroid yields (both tunable: `setRates`). A size-8 asteroid with 80
  drones makes 20 an hour of each, what a full planet makes. Planets keep their fitted defenses and
  people-driven production; giving them pools too (decision 11's "bigger scale") is for later.
- **X19. Ports supplied by production** (decision 23): a player's port (planet or asteroid) sells only
  what its body's storage holds, priced by how full that is against the port capacity, and **the buyer
  pays the owner** (price and fee), where before the price was burned and the port restocked for free.
  Its buying side is unchanged (goods sold to it are consumed, the seller paid by the Federation as
  before): putting them into the owner's storage would let an owner sell to their own port forever.
  **The top rate:** Sol's ports restock as before (capacity 300 over 2 hours: 150 an hour a good), and
  the drone rate was raised to 1.875 units an hour (from X18's 0.25) so that the largest asteroid full
  of drones (80) makes exactly that. Capacity grows with pilots and drones don't: past 300 the Federation
  restocks faster than any station; for Phase 5. Planets' people still make 20 an hour at most, now far
  below a well-droned asteroid; for Phase 5. The economy simulator only plays Sol's ports, so it can't
  measure this yet. `portsAt` now lists asteroid ports too.
- **X20. Ships mining empty sections** (in `Drones`): a slot of six, at the bodies' rate (1.875 units an
  hour a drone: the ship's mining drones plus its built-in drones set to mining; the rate is fixed when it
  starts). A new ship's four built-in drones fill its five bays in 40 minutes. What an empty section
  yields: its "dust", a composition from the section's hash (Sol's: silicate between Vesta and Pallas,
  carbonaceous between Psyche and Juno), split half and half between the composition's two goods. Any
  change to the ship stops it, through Pilots (every ship-changing function, including a siege's damage
  and reassigning the built-in drones); renaming the ship and chat don't. `stopMining` ends it too.
  Mining is allowed in Sol's belt (only claims are the Federation's).
- **X21. Asteroid sieges** (approved by Koda, 2026-11-17) (decisions 6, 29): an asteroid's defenses are at most six weapon mounts and
  one shield level, fitted from its store like a planet's; no armor, repair bots, platforms, BFG or
  fitted drones (its drones are its pool's defense drones, which fight and can be lost; mining ones never
  are). Its hull is its step × the planets' 60. A captured asteroid falls one step of its own line
  (Armory → Port → Mine → Platform), never into a Yards. Landing more drones during a siege is allowed
  (they join as miners: the split is frozen).
- **X22. The belt's screens** (Phase 4), for Koda's eye: the far band tinted by section; the close rock
  field (small irregular rocks, two layers, normal and high graphics only); Fable's asteroid and station
  art (`assets/art/asteroid-*.svg`, reference `docs/mockups/belt-levels.svg`); the asteroid card (Owner,
  Kind, Size, Yields, Built, Drones) and empty space's (Dust, Yields, Slots); the new Asteroid Works menu
  (in the loadout's row style, not a restyle of an existing screen). Mine Here takes the first free slot;
  the slots aren't picked one by one.
- **X23. Reads go straight to the network, not through the wallet** (2026-11-17, from Koda's first
  testnet session). Claims sat on "waiting for the network" though they had landed in seconds, and second
  tries failed with "Someone claimed it first" on planets already his. Cause: after a claim the client
  re-reads the pilot's planets, and that read walked deed transfers from block 0, 2,000 blocks at a time:
  about 8,000 reads on the testnet (half an hour), inside the reload every move waits for. Locally the
  chain starts at 0, so it never showed. Fixes: event reads start at the network's deployment block;
  reads and receipt waits go to the network's own RPC (`rpc[0]`) instead of through the wallet (which
  relays them to whatever RPC the player set, with no time limit), and the wallet only signs and sends;
  RPC requests give up after 30 s; a landed move reports done after at most 15 s of reloading; and a
  claim refused because the planet is already yours counts as done (and the name is given). The
  Polkadot App's host may want reads through it later (D43, smoldot).
- **X24. The selection's selectors and menu** (2026-11-17, Koda asked; designed on Fable, built on Opus;
  shots in `docs/mockups/selection-strips/`, before and after, wide and phone). Under the planet strip, a
  second one ("nearby"): the selected planet, its **Port** and its moons as big chips with a picture and
  a name; for the belt, its places (asteroids by their art, an asteroid's port after it, empty dust).
  The planet strip gains the belt (a dotted ring) at its orbit; pressing it picks the belt place last
  chosen, else the first (Ceres at Sol), and the nearby strip lists the rest. A planet (or asteroid) with
  a port gets **Trade at Port** in its menu, which selects the port and opens trading. The menu loses its
  small planet/station/moon icons and its moons page (the chips replace them), and its key numbers (the
  keys still work; the tooltip names them); each action shows its picture instead (port, yards, armory,
  claim, colony, siege, colonists, holds, drones). Untouched: the card, the empty slots that hold each
  button's place, the tab. To check when playing: phones (the strips take ~95 px above the card), and
  whether the port chip should say the port's three-letter code instead of "Port".
  **Revised the same day (Koda):** the nearby strip is icons only (names in tooltips); "Trade at Port" on
  planets is gone; instead the menu's top holds big wordless icons, a port and a moon (with a count),
  or the planet to go back to, and the planet's actions follow below. The moon icon lists the moons in
  the menu (one moon: straight to it).
- **X25. The selection beside an open menu** (2026-11-17, Koda: the station and everything round it
  "disappear" when the shipyard opens). They were drawn but under the menu: the camera centers the
  selection, and menus open in the middle. Now, while a menu is open on a wide screen with at least
  180 px free right of it, the camera eases the selection into the middle of that space, and back when
  it closes (`stores/ui.js` selectionShiftPx, measured from the sheet). Phones are unchanged (their
  sheet spans the screen).
- **X26. The menu's action buttons, restyled** (2026-11-17, Koda: the bright purple pills didn't sit with
  the new menu, and their icons were squeezed onto the edge). Now pills in the menu's plum and lavender
  (dark gradient, lavender outline, lavender on hover), each with its picture in a round well like the
  big icons above; actions without art get a line glyph (jump, session, rename, market, black hole, name
  star; `libs/body-art.js` ACTION_GLYPH). The ✕ moved up beside the big icons, so five slots fit.
  Shots: `docs/mockups/selection-strips/buttons-*.png`. This is a restyle of the card menu's buttons
  (Koda asked for it directly).
- **X27. A port's or moon's card is dealt out beside its planet's** (2026-11-17, Koda's idea). The port
  and moon buttons left the menu for the card's bottom edge (round wells, a count on the moons). Pressing
  one deals that card out from behind the planet's, which stays, dimmed; pressing the button again or
  the planet's card puts it back. A moon's card adds ‹ › on the edge to step through the planet's moons
  (up to eight, too many for one button each). An asteroid with a port works the same way.
  Impact, and how it's handled:
  - **The selection is still one thing** (the front card): the camera, the menu's actions, keys 1–9,
    the trade/shipyard/armory menus and the system strip all act on it as before. Clicking a port or
    moon on the map deals its card the same way, so the two routes agree.
  - **Each card keeps its own colors** (`hud/themed-card.vue` supplies each card's theme).
  - **The menu** comes out from behind the front card; its big icons are gone (the edge has them), the
    moons list is gone (the ‹ › steps and the nearby strip cover it), and the ✕ is back at its foot.
  - **Phones:** the dealt card covers its planet's but for a sliver; the edge buttons ride the front
    card. Tapping the front card still holds it up full size.
  - **The nearby strip** now partly repeats the edge buttons; worth deciding whether it stays.
  - Motion: the card slides out in 0.25 s (none with reduced motion).
  Shots: `docs/mockups/selection-strips/dealt-*.png`.
- **X28. A Ports menu, and port signs on the planet strip** (2026-11-17, Koda). A fourth button beside
  Planets, Ships and Jump (under More on a phone) opens every port in the system, in orbit order: where
  it is and whose, its trade code, what your cargo would fetch there, each good it buys and sells at its
  next-unit price, and buttons straight to Trade, Yards and Armory (they select the port, so its card is
  dealt out). On the planet strip, a **green** dot above a planet whose port buys something you carry,
  and a gray dot below one with shipyards or an armory; the belt shows its asteroids' ports' signs.
  **To decide:** Koda asked for green, but the color guide makes "good for you" yellow, and the trade
  panel and this menu's code letters mark "buys what you carry" in yellow. Either the dot turns yellow,
  or green becomes the "sell here" color everywhere. In Sol every port has yards and an armory, so every
  planet there has the gray dot. Shots: `docs/mockups/ports/`.
- **X29. The selection card, readable** (2026-11-17, Koda: "hard to read… the data isn't as useful as
  it could be… make it clear when a planet has infrastructure"). The frame, corner brackets, title pill
  and picture are kept; the info panel is redone: the kind in the card's own color with a tag at the
  right (a planet's orbit, a star's class, a ship's number), then label and value rows about twice the
  old size. Planet: owner (You in yellow, the Federation in lavender), world (class, size, rings), its
  port's trade code, moons, people, and what's being built. Port: owner, trade code, yards/armory, and
  every good it trades with ↑ buys / ↓ sells and its next-unit price. Your ship: captain, holds used,
  where it is, cargo by code. Star, moon, asteroid and empty belt space get their facts the same way.
  Dropped as low value: the orbital ring line (now the header tag) and the "Mine" word (the yellow badge
  says it). **Infrastructure** is drawn on the picture: the built buildings' icons arced under the
  planet or asteroid (Citadel, Colony, Station, Port, Yards, Armory, Autofactory; an asteroid's Platform,
  Mine, Port, Armory), the one being built dashed. Sol's ports, yards and armories count, though their
  planets' level is 0 in the contracts. Shots: `docs/mockups/card/`.
- **X30. Sol's asteroid stations have a yard** (2026-11-18, Koda: Sol is fully built, a yard included). The
  yard is the Federation's addition, outside the asteroid line: players' asteroids still have none
  (decision 22). So Ceres, Vesta, Pallas, Hygiea, Psyche and Juno each have a port (by composition), a
  yard (cargo and drone bays, range, repairs) and an armory (parts at twice their cost, burned), like
  the nine planet stations. Which bodies are Federation stations is one pure library,
  `contracts/src/planets/Sol.sol` (mirrored by `isSolStation` in `sdk/src/market.js`). On chain their
  level stays 0 (as Sol's planets'); they have no drone pool, since their ports restock themselves at
  the top rate (decision 23), which is what a full pool would give. Their card shows "Port" and "Built:
  Fully built" in place of an owner's "Built" step and drone counts, and the line's icons with the yard.
- **X31. Their names are "Ceres Station", "Vesta Station"…**, not invented names like the planets'
  stations (I.S.S., Tiangong…). Easy to change in `portNames` (`sdk/src/market.js`) if you'd like names.
- **X32. Reads reshaped for the testnet's per-read budget** (2026-11-18, `polkadot-direction.md`). It's a
  compute budget (about 39,000 units a read), not memory. Interface changes, all for smaller reads:
  `Market.portsAt` replaced by `portIds` + `portViews`; `Planets.belt` replaced by `views(ids)` (the SDK
  derives the sections); `Galaxy.statesOf` + `cellsOf` beside `region`; `Claims.ownersOf`;
  `Planets.suppliesOf(id, goods, mix)` replaces `supplyOf`. Planets now stores the universe's seed (read
  from Galaxy once, at initialize). Two dev tools: `dev/harness/read-costs.mjs` (cost model) and
  `dev/harness/build-out.mjs` (a fully built system, test chain only: it makes buildings free).
- **X33. Play-tested Sol's belt** (2026-11-18, one session at desktop, one at phone size, local chain):
  bought water at Ceres Station, sold it at Psyche Station (silicate/metallic prices as expected), a drone
  bay at Ceres' yard, a mining drone at Psyche's armory (800¢, the Federation's price), mined Sol's
  carbonaceous dust for an hour (5 units, holds full), sold it at Tiangong, jumped to Alpha Centauri and
  back (the region read through `statesOf`/`cellsOf`; Sol reloads with 15 stations). The Ports menu lists
  all 15 in orbit order; the galaxy map counts 15. Shots in `docs/mockups/sol-belt/`. Seen, not changed:
  - **The armory's quantity dial goes to 20 for every part** (`armory-menu.svg.vue`, `:max="20"`), so with
    one drone bay it offers 20 mining drones; the contract refuses what doesn't fit. Older than this work;
    worth capping by the part's room (drone bays, holds, mounts).
  - A Federation asteroid's menu says "Nothing to do here." beside the card (its port is the button on
    the card's edge), as a Federation planet's does.
- **X34. Polkadot Hub TestNet redeployed** (2026-11-18, throwaway spike key, EVM bytecode as before):
  `forge script script/Deploy.s.sol`, 60 transactions, all successful, 17.96 PAS. The old deployment's
  pilots and planets are gone with it (a fresh galaxy). The two probe contracts used to find the read
  budget (`MemProbe`, `CostProbe`) are also on the testnet, unrelated to the game; they cost about 48 PAS,
  mostly storage deposits for 200 probe slots. The GitHub Pages build plays the new addresses once pushed.
- **X35. Testnet costs measured, and a 30% gas margin** (2026-11-18, `cost-estimates.md`). The cost bot's
  pilots got their credits from the deployer (it granted itself the Credits contract's game role on
  the throwaway testnet deployment, as the handoff does locally), to afford bays, parts and a claim. Two
  moves sent right after another move into Planets ran out of gas on the testnet's own estimate (a
  delivery and a Citadel); the same moves estimated higher moments later. So every signer the SDK sends
  through now asks for 30% more than the node's estimate (`sdk/src/chain/gas.js`; `WalletSigner` fills
  the gas limit itself instead of leaving it to the wallet). A player pays for gas used, not the limit.
  Worth knowing for the App's signer later: it may estimate the same way.
- **X6. Wording:** the loadout's empty-weapons line says "Every Sol station's armory sells them." (was "The
  I.S.S. armory").
- **X36. Stations show what they have** (2026-11-18, Koda picked system E in `docs/mockups/stages/`, "please
  integrate"). The station keeps the original hexagon; the port's docking collars sit at three alternate
  faces, which are now the only docking pads (`sdk/src/game/docking.js` PADS 0°, 120°, 240°; three ships
  at most, as before), and the yards, armory and autofactory take the other three. Planets show the
  Citadel's gun on the limb and the Colony's lights on the night side; asteroids show the Platform's
  footing and the Mine's derrick and drones, and their station now sits at the rock's middle, a third
  of it across. Sol's Federation worlds and asteroids draw fully built. The parts are standalone art in
  `assets/art/` (station-*, planet-citadel, planet-colony, asteroid-platform, asteroid-mine; the
  asteroid-station icon redrawn to match), from `docs/mockups/stages/gen-stations.py`. Calls: the
  **Station** stage (a planet's level 3, before its Port) draws the bare hexagon on the station's orbit
  as a `shell` object: drawn, not selectable, and not a station to anything else (stations still mean
  ports, as 45 places in the client assume); the selection card drew a station as a dot since Demo 3
  (1/30 of its size), now about a planet's size; the title scene's station stays bare, with its own six
  visitor pads.
- **X37. A whole belt section is a click target** (2026-11-18, Koda: "clicking the little asteroid is
  very difficult"). A click (not a drag) anywhere in a section's slice of the band selects its asteroid,
  or its empty dust; done in the map's own click handling (`map.vue` beltSectionAt), so dragging over
  the belt still pans. Stations, ships and planets keep their own clicks.
- **X38. Deeds draw themselves** (2026-11-18, D107). `Deeds.tokenURI` builds the card each time it's asked:
  the body's class colors, the Citadel's gun and Colony's lights, the station and its parts by level
  (the same design as the game, X36), the asteroid's footing, derrick and drones; name, kind, what's
  built and the owner's call sign; an unnamed body is called as the game calls it. The drawing is its
  own contract, `DeedArt` (11 KB; Deeds is 15 KB), set with `Deeds.setSources` in a step of its own
  after `wire` (inside `wire`, the tests' fixture ran out of stack). Names and call signs go through
  `SafeText` (quotes, brackets, ampersands and control characters become spaces) in deeds and, since
  the same gap was there, in ships' metadata. Samples: `docs/mockups/deeds/`. On Polkadot Hub TestNet
  since the same day, without a redeploy: Deeds' proxy upgraded (implementation
  `0x25Bad24e57cA321f9D07dda5ba7ccfF6a0a099d9`), DeedArt at `0x59Ce7965D7338D4c4201D03DeF97057E31b59129`,
  sources set; the cost bot's Ferrous planet draws itself (`tokenURI(393216)`), pilots and claims kept. `polkavm/deploy-polkavm.mjs`
  (unused, already behind the newer modules) doesn't wire deeds.
- **X39. Contracts upgraded in place on the testnet** (2026-11-18, spike key, no redeploy, pilots kept):
  Credits for the cheat button (implementation `0x1e30C6D4645cb2f63689483DEB6d57b192b114C2`), Claims for
  the discoverer's free claims (`0x8Ce494050a66b1a669C1aa263E1E0069B5A7eA40`; its tuning reads 2,000 /
  50,000 / 0), as Deeds before (X38). The full redeploy before the next push brings everything fresh.
- **X40. Joining is two moves, with a corporation, a debt and a hold of goods** (2026-11-19, Koda: the ID
  card scanner registers the name; accepting the job names the ship, the second move, and you wake in
  it). `Pilots.register(callsign)` makes a non-citizen with no ship (ship moves refuse with `NoShip`);
  `Pilots.acceptJob(corporation, shipName)` mints the ship at Sol, joins the corporation and loads the
  starter kit; `switchCorporation` changes it for a fee (5,000, burned). Guesses, all admin-settable
  (`setCorporations`, `setStarterKit`, set by the deploy's `wireJoining`): the names **Corp X, Corp Y,
  Corp Z**; the kit **3 Helium-3 and 2 Electronics** (about 800 credits; Earth buys Helium-3, Ceres and
  others Electronics), **no cash**, a **debt of 45** (the −45 from Earth). Credits keeps the debt beside
  the balance (`debtOf`; what the game pays clears it first); the game shows balance minus debt (−45¢
  at the start). `Claims.lawAt(id)`: the star owner's corporation, else the body owner's, else 0
  (Minerva's rules); nothing uses it yet. Until the intro exists, the wizard's ship step has a small
  "You'll fly for" choice of the three; its wording still says "Take Off" and the launch pad (the intro
  replaces it, in the Fable session). Pilots is 22.9 KB (the defaults moved out of its initializer to
  fit). The trade and explore bots now start with a full hold and no cash: they'll need to sell first.
  Played locally: register, choose Corp X, name the ship, wake at Sol with −45¢ and the hold full.

## 10. The Polkadot App spikes (2026-11-18, milestone 7 steps 4–6)

Results in `polkadot-direction.md` (steps 4, 5, 6). Calls made on my own:

- **P1. The spikes live outside the game.** Contracts in `contracts/spikes/` (own Foundry project, forge-std
  from `contracts/lib`), the App-signer prototype in `orbiter-client/dev/spikes/app-signer/` (own
  `package.json`, `npm install --ignore-scripts`). Nothing in `contracts/src`, `sdk/` or the client changed.
- **P2. Throwaway keys outside the repo:** the product-account stand-in's mnemonic and the session key are in
  `~/.config/orbiter8/app-signer-spike.json` and `app-signer-session.json` (mode 600), next to the
  spike key. The stand-in was funded from the spike key by a local XCM transfer through the XCM precompile
  (40 PAS, because a stale balance read funded it twice).
- **P3. Personhood: where to use it is yours to decide.** Proposed in step 5: one pilot per person at
  registration, once-per-person give-aways (the free claim, starter credits), Lite to play, Full for
  anything of real value. Whatever is chosen should key on the per-context alias, not the account.
  Open: our product id (it fixes the context), and whether Lite is enough at launch.
- **P4. Ships as Scarcity NFTs is a design change for later, not done.** The game keeps its ERC-721-style
  ships; the spike shows the App's NFT system is reachable from Solidity. Whether ships become Scarcity
  tokens (and how the purse-key model maps onto pilots) waits for seeing one in the Pocket, and for
  mainnet to have the pallet.
- **P5. Session keys stay (D41), as the fallback; recommended in step 4.** AutoSigning returns
  `NotAvailable` on both phone wallets today, so dropping session keys now would mean a phone approval
  per move.
- **P6. The collection on the testnet is called "Orbiter 8 Ships (spike)"**: it's the testnet's
  collection 0 and visible to anyone browsing Scarcity there. Throwaway, like every testnet address.
- **P7. Open for Koda after the spikes** (*answered 2026-11-18: D101–D106; the phone session still to do*) (2026-11-18; details in `polkadot-direction.md`, "After the
  spike"): the product name (`orbiter8` is in dotNS's restricted 6–8 band: a verified person on the
  testnet, not sold publicly on mainnet; 9+ characters are open to anyone); whether to replace the
  Demo 3 build at `partavate-studios.github.io/orbiter8-demo3-client` with a testnet build; a phone
  session to see the Pocket, the signing prompt, and his personhood status in the App.

## 11. Minerva's face (2026-11-19, `docs/briefs/minerva-face.md`)

Built from the brief, with Koda's answers before starting: eyes are just a glow in the gap, the face stays
plain white like the emblem, the lab opens from both a title-screen button and `#/minerva-lab`, and six
more states and six more one-offs were added (listed in the brief). Every state and one-off is pictured in
[`mockups/minerva-face.png`](mockups/minerva-face.png). Calls made on my own:

- **M1. The eyes sit behind the parts.** Each eye is a soft white glow (two radial gradients, no filters)
  drawn under the eight parts, so it shows only through the gaps and leaks a little along them. A blink
  squeezes it flat, a glance moves it across the gap, wide eyes make it bigger and brighter. Also saved as
  art: `assets/art/minerva-eye.svg` and `minerva-face.svg` (the owl at rest with her eyes).
- **M2. Part 7 stays one piece.** Talking and Annoyed stretch or squash it about its middle (tufts and beak
  move together) rather than splitting the art into tufts and beak. Splitting it would allow more, but it
  changes your art.
- **M3. One-offs overlap by layer, and restart rather than queue.** Body moves (Boom, No, Nod, Glitch,
  Assemble, Disassemble, "ha"), the eye flash, and blinks are three layers that play together. A new one-off
  on a busy layer fades the old one out in 0.16 s and starts at once, so typing fast keeps her eyes lit
  without stutter. Disassemble holds: she stays apart, and no body move plays until Assemble.
- **M4. A Slow blink one-off** came with Waiting on you (it blinks that way); it's in the lab with the others.
- **M5. The emblem now reads its paths from `components/minerva/minerva-parts.js`**, shared with the
  face. Its drawing is unchanged (same paths, same order).
- **M6. In the lab, the text box puts her in Listening while it has focus** (a checkbox turns that off),
  and she returns to her earlier state when it loses focus. On phones the faces stick to the top while the
  console scrolls under them.
- **M7. Reduced motion:** drift and waves at about a third, no glances that turn the head, Boom and Glitch
  don't play, Assemble and Disassemble only fade. The lab can force it on or off.
- **M8. At 48 px the drift is under a pixel,** so a HUD-sized face reads by its eyes (blinks, glances,
  flashes) more than its parts. If the HUD wants more life, scale the motion up with size (not done).
- **M9. A commit mix-up:** a parallel session's commit (`7d7d12f`, "Joining in two moves") swept up the
  face's first draft with its own work, because both sessions share one working tree. I left that commit
  as it is (not mine to rewrite) and committed the rest on top. Nothing was lost.

Measured: three faces animating in the lab hold 60 fps with the CPU slowed four times. The face isn't used
in the game yet; per the brief, it goes to her console, the intro's terminals and the HUD later.

## 12. The intro mockup (2026-11-19, `docs/briefs/intro-mockup.md`)

A mockup only, for Koda's approval: [`mockups/intro/`](mockups/intro/README.md), 17 screens at desktop and
phone size, as SVG, with overview sheets. No game code changed. Second pass the same day, from Koda's
notes: lights off until the name is filed; the curfew is for violence and thin security; Minerva's face
(the widget, drawn from its own poses) at the center of the UI; the balcony terminal on the railing; a
noir silhouette look with muted colors; the balcony door left, the door out right. The calls made on my
own are I1–I8 in that README.

## 13. The intro, built (2026-11-19)

Koda: "this will fully replace the current signup process … end to end", keep the old graphics somewhere
to reference, remove the title's Story and its animation (perhaps reused for history in Minerva later: a
to-do). Built from the approved mockup into `orbiter-client/src/components/intro/` (with `libs/intro.js`
for where it starts and its words, and `libs/intro-art.js` for the still art). Played end to end on the
local chain at desktop and phone size, landing in the game with the name, ship, corporation and the −45¢
debt. Calls made on my own:

- **N1. Connecting stays on the title.** The wallet, network and gas steps keep their panel (now two dots,
  Wallet and Network); the moment a new pilot is connected and funded, the intro takes over. The title's
  button reads Begin (no name yet) or Continue (name on file, or a ship).
- **N2. The corporation lives in the browser until the job.** The chain records it only with
  `acceptJob`, so the first boot's choice is kept per network and account in local storage and survives a
  reload; a new browser asks again at the terminal.
- **N3. Resuming:** a reload goes to the title as always (App.vue); Begin or Continue lands where the
  chain says: the dark room, the scanner waiting on a name already sent, the lit room, or the escort
  waiting on a ship already sent.
- **N4. Skip intro jumps to the next thing that needs you:** the name prompt in the dark; the job's page
  once the lights are on (or the first boot, if no corporation yet). Nothing skips a move on its way.
- **N5. Hovering a thing focuses it,** so the hand, the focus ring and the label always agree; the
  gamepad's spatial navigation reaches the room's things because they're real buttons.
- **N6. The face is the widget everywhere** (scanner, terminal, console, notices, balcony terminal,
  waking), in states that fit: listening while you type, waiting on the wallet, thinking while it's mined,
  annoyed with a glitch when it fails, skeptical at the vape and the balance.
- **N7. Failures keep what you typed:** a declined or failed move says why in pink with Try again.
- **N8. Waking is part of the intro,** then "Understood" enters the game. The game starts the ship at
  Sol as before (the contract places it); a camera move to Earth, or starting docked at the I.S.S., would
  make "in orbit over Earth" literal: for Koda.
- **N9. Archived, not deleted:** the wizard's call-sign and ship steps (`wizard-register`, `pilot-card`,
  `launch-pad`) and the Story scene with its eight panels are in `components/archive/` with a README;
  nothing imports them, so they're out of the build. The to-do for Minerva's library (reusing the panels)
  is in `demo4-plan.md`.
- **N10. `backstory.md`**: its Story-scene section pointed at `components/title/`; the paths now point at
  `components/archive/` (fixed 2026-11-19; only the paths changed, not the story).
- **N11. `dev/harness/capture.sh`** now plays the intro for its new-player shots (same steps as my manual
  run); not run itself, since it resets the chain on the default port.

## For Koda to decide

Answered above, bar these:
- P3–P5 (personhood rules, Scarcity ships, session keys versus AutoSigning) and the product id
  (`orbiter8.dot`?), which fixes the personhood context and the product accounts.
- R10: an index by star in the contracts (or an indexer) once pilots number in the hundreds.
- T7's other half: a real phone's keyboard over the dialogs wasn't checked.
- The HUD profile card on a portrait phone keeps to three rows of goods ("+N more" past five);
  everything else shows every good.
- Minerva's face (section 11): the look of her eyes and expressions (`mockups/minerva-face.png`, or
  the lab in a dev build), M2 (split part 7 or not) and M8 (more motion at HUD size).
- The intro mockup (section 12, `mockups/intro/README.md`, "Open, for you"): the noir look, the size of
  Minerva's face in the console, the corporations' colors and logos, and the phone's pan-and-strip room.
- The built intro (section 13): N8, waking literally over Earth (a camera move, or starting docked at
  the I.S.S.); N10, the Story-scene paths in `backstory.md`.
