# Orbiter 8: Story & Lore Decisions

**Compiled:** 2026-11-18, from design chats between Koda and Claude (Oct 31 – Nov 17, 2026).

**For Claude Code:** the codebase already has an updated story. This file lists everything we've discussed or decided about the story since the published backstory, so the local story docs can be updated. Merge it in; don't replace what's there. Where this file conflicts with the local story, flag it for Koda rather than silently choosing.

**Status tags**

- **Decided:** Koda stated it as part of the world.
- **Leaning:** Koda's current direction, not locked.
- **Exploring:** discussed and still open.
- **Suggestion:** proposed by Claude; Koda hasn't confirmed.
- **Superseded:** an earlier idea that has been replaced. It's kept here so it isn't accidentally reintroduced.
- **Parked:** deliberately saved for later.

---

## 1. Tone and guiding rules

- **Grounded, not fantasy (Decided).** The sci-fi should feel concrete and plausible. The model is the Bobiverse books: use standard, well-known sci-fi ideas (von Neumann probes, mind uploading, autofactories, 3D printing) and play them straight and consistently. That consistency is what makes a future feel real.
- **Every game limit needs an in-world reason (Decided).** Cooldowns, lag, costs, and caps should come from logistics, physics, law, or infrastructure, never "because the game says so."
- **Hopeful frontier, not post-collapse (Suggestion, consistent with the published backstory).** Orbiter 8's universe is about expansion and opportunity: "Liberta Galactica!" This sets it apart from darker games like EVE Frontier.
- **Borrow concepts, not signatures (Decided in spirit).** Generic sci-fi concepts are fair game. Ideas that are recognizably one work's signature are not. Koda dropped the consciousness "cube" for exactly this reason (section 6).
- **Speculative is OK; magic is not (Suggestion).** Tech that real physics technically allows but we can't build yet (FTL, space-compressing cargo holds, Alcubierre-style warping) is acceptable at the same level as the Orbiter 8's own interstellar drive. Hand-waved magic isn't.

---

## 2. Timeline (published backstory, unchanged)

The published backstory stands. Key beats:

- **2140:** "now." It's chosen because it's about when the last bitcoin will be mined (the block reward reaches zero around 2140).
- **About a century of off-world colonization** before 2140.
- **The first Mars colony** suffered: bones crumbling, muscles weakening. Later generations adapted faster than anyone predicted.
- **Expansion:** the Moon, Jupiter's moons, Venus, the larger asteroids. Genetic engineering let humans redesign bodies for space.
- **The Great Regrettion:** decades of vicious trade wars stalled progress, leaving a lingering regret no one could quite name.
- **Early 2090s land rush:** gravity-assist ships called **Orbiters** opened routes to the outer worlds, all the way to the edge of the solar system.
- **The second plateau:** fear that humanity couldn't leave its sun.
- **Now:** rapid Orbiter improvements culminate in the **successful interstellar test of the Orbiter 8**. The first interstellar Orbiters are being assembled and will be on sale soon. **"Liberta Galactica!"**

The Story scene storyboard follows panels 1–3 ("By the year 2140…", "Still bound to our sun…", "That was until today!"). Panels 4–6 of the old Portals demo storyboard were hackathon pitch material and aren't part of the story.

**Timeline gaps to fill** (Exploring): when governments failed relative to the Regrettion; when Minerva was founded; when and why people moved onto Minerva (sections 3, 5, 6).

---

## 3. Society: the corporatocracy (Decided)

- **All governments failed.** Nothing collapsed, because corporations had long since privatized every service people relied on.
- **People felt uneasy without government**, so corporations built government-like systems around themselves.
- **Citizenship belongs to corporations, not countries.** Citizens get a **vote**, **services**, and **protections**, the things a government would otherwise provide.
- It reads as a dystopian corporatocracy, but it functions, and it's the normal order of the world.

**Corporations as governments in gameplay (Leaning):**

- **Shared law plus local law.** There's a common layer of inter-corporate law (handled through Minerva, section 4), and **each corporation also has its own laws** that allow or punish different activities, especially in battle.
- **Protection.** Corporations can aid citizens in conflict, e.g. by sending a corporate ship. Koda likes the TradeWars idea of protected zones (FedSpace).
- Suggestion: large corporations patrol their home systems, which makes those systems safe places for new players to start. Joining a corporation means accepting its rules in exchange for protection.
- Suggestion: **the frontier between corporate territories is lawless**, and that's where pirates live.
- **Open question (Exploring):** whose law applies in a fight? The attacker's corporation, the defender's, or whoever controls the star system? If it's the system controller, territory becomes central.
- Suggestion: corporations hold **patents on recipes** (crafting) and license them to citizens. See pirates (section 7) for the contrast.
- From the design doc: corporate accounts, co-owned assets, and corporate taxes all fit the "corporation as state" framing.

---

## 4. Minerva (Decided core, Leaning extensions)

**Decided:**

- The **Minerva Galactic Network** was **established before the corporations took over**. It predates the corporatocracy.
- It is **the single point of collaboration** between corporations. **Inter-corporate law runs through Minerva**: registration, claims, disputes.
- Minerva is **not just a network but a special kind of artificial intelligence**.
- **For gameplay, Minerva is neutral.**

**Parked:** a twist where Minerva has its own hidden agenda. Koda wants to consider it in the future. It isn't part of the game now.

**Leaning (Koda, Nov 17):** **Minerva is where people's minds live** (section 6). That makes Minerva vastly more important: it hosts everyone's identity, so its neutrality is what everyone depends on, and the parked hidden-agenda twist would carry enormous stakes if it's ever used.

**What Minerva does in the game** (from the design doc and our discussions):

- Pilot registration. Pilot names are unique in Minerva's database.
- Planet claims and claim fees, and siege takeover claims and disputes. Minerva acts like a court.
- Suggestion: Minerva enforces waiting periods on claims and treats repeated claims against the same planet as harassment, with rising fees.
- Sponsorship and registration of new minds (section 6).
- In the design doc, the cross-universe credit bridge is called the "interdimensional Minerva link."

**Meta-layer (Suggestion):** Minerva maps neatly onto the blockchain itself: neutral, owned by no one, enforcing rules everyone agreed to. **In-fiction, the smart contracts are Minerva.** The name fits too, since Minerva is the Roman goddess of wisdom.

---

## 5. The Orbiter 8 and pilots

- The **Orbiter 8** is the first Orbiter capable of interstellar travel: the first true starship (Decided, published).
- The ship's silhouette is the brand. Ships evolve visually as upgrades attach, but the base shape stays recognizable (Decided).
- **Explorers** who jump into unexplored space write new star systems into existence. In-fiction, they're the first to chart them. They get first chance to claim planets and the right to rename the star they discovered (Decided; already in the contracts as `discoveredBy`).
- **New ship types** from competing corporations, and eventually **alien ships**, are planned (design doc). The name "Orbiter 8" refers to the ship, which makes per-network or per-corporation ships awkward for the game's name (Exploring; see section 10).
- **Origin beat needed (Exploring):** how did pilots become minds on Minerva? The published backstory leans on genetic engineering, not uploading. Suggestion: make it the Orbiter 8 breakthrough itself. Interstellar distances and conditions are beyond even engineered bodies, so pilots fly as minds.

---

## 6. The player: mind, fleet, and body

### Current direction (Leaning, Koda Nov 17)

- **The player's mind ("soul") is stored within the Minerva network, replicated everywhere like BitTorrent.** It's backed up across the whole network, so there's no single physical location to destroy.
- **The mind can focus on controlling only one thing on the network at a time: one of its ships.**
- **One player = one account = one address = one mind** (Decided). A new identity requires a new account.
- **Ships are bodies the mind takes turns inhabiting.** A player can own a **fleet** and switch focus between ships (Leaning). This solves the NFT problem: selling a ship shrinks your fleet, buying one grows it, and there's never confusion about which ship you're flying.
- It also explains the design doc's "one avatar per account" rule: the avatar *is* the mind.

**Why this replaced the cube:** a mind in a physical cube is the Bobiverse's signature. A mind distributed across a neutral network is Orbiter 8's own idea. It's also different from EVE Frontier's "Self + Shell clone bodies + Keeper" system. And it matches the technology: your identity literally is a record replicated across thousands of nodes.

### Consequences to work through (Suggestion unless noted)

- **Death and penalty.** If your focused ship is destroyed, your mind is safe on Minerva and the link just breaks. The game still needs a cost for that. Candidates: a reconnection cooldown ("link shock"), losing the ship's cargo, the ship becoming a salvageable wreck, damage to systems.
- **Signal lag (Koda's idea, Exploring).** Controlling a ship far from Minerva's reach lags. Actions take longer to complete, e.g. a trade takes several blocks instead of one.
- **Subspace relays (Koda's idea, Leaning).** Paired relays: near one relay, actions at the other happen fast, and lag grows the farther you are from your relays. Under the new model, **relays literally extend Minerva's coverage**, so the frontier is wherever Minerva barely reaches.
- Suggestion: cutting someone's link (jamming or destroying the relay they depend on) drops their ship to autopilot mid-fight. This replaces the old "hunt the cube" mechanic.
- **Unattended ships** run on basic AMI autopilot (the design doc's Artificial Machine Intelligence).

### Joining the game: sponsorship (Leaning, adapted)

- Koda's original idea: you can only join if an existing player creates your consciousness and gives it to you (invite-only).
- Under the Minerva model, a new mind can't simply appear. **An existing citizen or corporation must sponsor its registration with Minerva** (Suggestion for how the idea carries over).
- What this does: bots and fake accounts become expensive, players become recruiters, there's an in-world family tree of who sponsored whom, and joining becomes an in-world event.
- Issues to solve: founding minds to start the chain; a path in for newcomers with no friends in the game (corporations as recruiting offices); preventing sponsorship farming (sponsorship binds permanently and costs real time or resources).
- Each new mind is a **new person**, never a copy of its sponsor. Copies are the Bobiverse's signature.

### Superseded (don't reintroduce)

- **Consciousness cube built by an existing player and given to the new account.** Dropped because it's too directly borrowed from the Bobiverse.
- **The cube as the indestructible thing, with an escape pod carrying it home when a ship is destroyed.** Replaced by the mind living on Minerva.
- **Hunting which ship carries someone's cube** (decoys, bounties, ransom). There's no physical cube anymore, so this needs a replacement, e.g. link cutting.

---

## 7. Pirates (Decided core)

- Pirates aren't just raiders. **They're people who refuse to be part of any corporation**, a counterculture. To become one, you denounce any corporate alliance (design doc).
- They are meant to **mirror the open source community against software corporations, or the Bitcoin community against banks** (Decided).
- Pirate groups are called **bands** and, like corporations, can share accounts and assets (design doc).
- Suggestions for their identity in play:
  - **Freedom, not just theft.** Bands share tech and recipes openly (vs. corporate patents), pool resources without corporate taxes, and govern themselves by consensus.
  - **No corporation protects them**, so they defend each other.
  - They live on the **lawless frontier** between corporate territories.
  - Raiding (supply routes, bounties) can be part of it, just not the whole identity.
  - **No livery.** Pirate ships fly unmarked or scratched-out hulls, an absence of corporate color.
  - Possible twist (Exploring): some pirates run their minds on a **fork of Minerva**. That's the Bitcoin and open-source parallel made literal: less coverage, but no one can switch them off.

---

## 8. Conflict in the fiction

- **Sieges are slow, public, castle-style events (Decided).** They're slow so absent players don't lose everything quickly. They're public so everyone knows a siege is underway, like attacking a castle with horses and catapults.
- Suggestion: a galaxy-wide **news feed** of active sieges, word spreading that a world is under attack.
- **Takeovers go through Minerva** as a claim, which the defender can dispute. Minerva acts as a court.
- **Repairs (Decided):** after a siege, ships must return to a shipyard for repairs. That's the grounded cooldown on repeat attacks.
- **Damage, not reset (Leaning):** defeated ships take damage to specific systems that limits their abilities until repaired at a port, instead of reverting to a base ship.
- **Overheating weapons (Koda's idea, Leaning):** firing heats the weapons. Past a threshold, an explosion risk starts low and climbs, so pilots push their luck. Grounded: shedding heat in a vacuum is a real engineering problem.
- **Booby traps (Koda's idea, Exploring):** a hidden self-destruct an original owner can trigger after losing a planet, e.g. once the attacker starts building their citadel.
- **Weapon counters (Leaning):** the right mix of weapons beats brute force (railguns vs. armor, point defense vs. missiles, and so on).
- **Asteroid redirection** as a siege weapon (design doc).

---

## 9. Setting details

- **Stars** are colored by real spectral class, with Sol yellow (implemented). Unbuilt idea: star class affects how fast the jump drive charges.
- **Planets** come in ten classes (contract): Terrestrial, Rocky, Oceanic, Desert, Ice, Volcanic, Gaseous, Ferrous, Lava, Swamp.
- **The galaxy expands at its edges** as explorers jump into the unknown (Decided). The core is developed and protected, and the frontier is cheap, slow, and lawless (Suggestion; ties to relays and pirates).
- **Building:** AMI, roamers (small construction robots with manipulator limbs and 3D printing), and auto factories that build bigger things like ships (design doc; Bobiverse-style concepts used straight).
- **Resources (Suggestion, grounded list):** water ice, metals, rare elements, helium-3, organics, silicon, plus manufactured equipment and electronics.
- **Terraforming** (design doc): a slow, SimEarth-like path that gives environmentally minded players a "green" counterpoint to war.
- **Aliens** (design doc): alien technology arrives as a new ship line with a home system far away. Eventually a treaty builds a portal between Sol and the alien home. Players can become expats and claim the other side as home.

---

## 10. Naming and the multiverse (Parked)

- The name **"Orbiter 8" refers to the ship.** If other networks or corporations get their own ships, the game's name becomes ambiguous.
- Options discussed: name the game after something above the ships (e.g. the Minerva Galactic Network, with Orbiter 8 as the first ship), or keep Orbiter 8 as the hero ship everywhere.
- **Parallel universes:** separate chains as separate universes (design doc), and the consortium idea of launching across networks whose communities cross over. Koda is about 80/20 in favor, but it has to feel right. Parked.
- If universes exist, each could have its own galaxy shape (spiral seed) as in-world flavor.

---

## 11. Ideas to borrow from other games

- **Resets in the fiction (Suggestion, from EVE Frontier).** EVE Frontier presents its server wipes as story events (the Keeper reactivating clone banks for a fixed cycle). Orbiter 8 is meant to be persistent, with no resets (Decided). But if seasons or events are ever needed, they should be wrapped in the story the same way.
- **TradeWars 2002:** port trading, citadels, corporations, FedSpace-style protected zones, alignment.
- **Bobiverse:** von Neumann probes and autofactories played straight. Avoid its signatures: minds in cubes, every probe a copy of one person.

**Overlaps to keep distinct from EVE Frontier:**

- Their "Self" (immortal consciousness) is close to our mind on Minerva.
- Their Keeper (a commanding AI) is close to Minerva.
- Their crafted clone "Shells" are close to our ship-bodies.

Keep our differences sharp: hopeful vs. grim tone, a neutral network vs. a mysterious commander, new people sponsored by players vs. revived remnants.

---

## 12. Open story questions

- [ ] How and when did people move onto Minerva? (Origin beat; tie it to the Orbiter 8 breakthrough?)
- [ ] When did governments fail, relative to the Regrettion and Minerva's founding?
- [ ] Who built Minerva, and why does it predate the corporations?
- [ ] What happens to a mind whose last ship is destroyed, and what's the in-world cost?
- [ ] Whose law applies in a fight?
- [ ] How do sponsorship and the first "founding" minds work in-fiction?
- [ ] Do pirates fork Minerva, or just live at its edges?
- [ ] The game's name vs. the ship's name, if other ship lines arrive.
- [ ] Minerva's hidden agenda (Parked).
