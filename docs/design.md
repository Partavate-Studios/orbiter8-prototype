# Orbiter 8 Design Doc

**Post Demo 3:** This design doc is written to expand on the existing features in Demo 3. Therefore, this document does not discuss the details of features which are already implemented including dynamic galaxy generation and basic trade mechanics.

> The working copy, converted from the PDF "O8 Design - Post D3" on 2026-10-31. Edit it here.

- [Trade System](#trade-system)
- [Build System](#build-system)
- [Planets](#planets)
- [Ships](#ships)
- [Battle](#battle)
- [Avatars](#avatars)
- [Corporations](#corporations)
- [Space Pirates](#space-pirates)
- [Network Mobility](#network-mobility)
- [Snazzy Client Features](#snazzy-client-features)
- [Macro / Micro Games](#macro--micro-games)
- [Vanity Upgrades](#vanity-upgrades)

## Trade System

**Expand Goods Types:** There are three current types of goods. These goods are hard coded. Once refactored and generalized, Orbiter 8 should have more options for goods. Too few goods and the system is boring. Too many goods and the system is too complex. We will need to experiment to find the optimal number. I suspect this number may fall within the 5 to 12 range.

**(Optional) Complex Goods:** We may want to introduce rudimentary crafting that allows the gamer to combine basic goods and for more complex goods. This process should usually result in the cheaper production of complex goods than the in-game cost of buying the complex goods.

**Supply and Demand:** The price of goods changes as the supply/demand of space ports change. This model needs improvement. As more users play, this could lead to failed transactions. If a gamer’s trade request lands behind several others, the change in inventory could change the price and lead to unexpected price results. One solution would be to include the price of goods in the submitted transaction. The contract will have an algorithm that determines if the price is “acceptable” at current market rates, allowing some flexibility to still accept delayed transactions.

**Negotiating:** With the above improvement allowing some flexibility in price, we can then allow a “bargaining” interface where a user can offer less than the current market price and possibly have the offer accepted. The risk is that the offer will be rejected.

**(Optional) Tokenized Goods:** We may want to tokenize goods as ERC20s. This will allow the goods to be traded outside of the game world which may or may not be desirable. It will increase the cost of trades, so it should only be considered if it yields a significant benefit.

## Build System

AMI: Artificial Machine Intelligence

Probe/Roamer: Small construction robot capable of building low level objects with manipulating and 3D printing limbs.

Auto Factories: Built by roamers, bigger things like ships.

## Planets

**Claiming Planets:** Currently, it is free to claim a planet. This creates a land rush scenario where gamers claim as many planets as they can without focusing on improving those planets. To slow the land rush and give more gamers the opportunity to have planets, claiming a planet should require paying a fee to the Minerva Galactic Network database for registration.

**Upgrade Tech Tree:** Planets can currently be upgraded with a Space Station that contains both a Ship Yards and a Space Port. Planets will have a much more complex upgrade tree that will involve many steps before reaching a fully developed planet. Each upgrade requires some amount of time / number of blocks to complete. A simple tech tree for Demo 4 can be linear. A more complex tech tree could branch out with multiple options.

1. <u>Basic Planet</u>: A planet, as you found it.
2. <u>Citadel</u>: Establishes a “base” to populate the planet.
   Requires: Equipment, fuel, organics, and colonists.
   Provides: Produces additional colonists until population cap is hit.
3. <u>Colony</u>: Base is strong enough to be considered established
   Requires: Automatic when population at cap for X number of blocks.
   Provides: Produces goods based on planet type.
4. <u>Station</u>: Planet has an orbiting space platform.
   Requires: Equipment & Fuel. (may have already been produced by planet)
   Provides: A platform upon which to build.
5. <u>Port</u>: Space station contains a Port of Trade
   Requires: Equipment & Fuel
   Provides: Visiting crafts can trade goods, based on planet type.
6. <u>Yards</u>: Space station contains Shipyards
   Requires: Equipment & Fuel
   Provides: Basic upgrades for ships (cargo holds, engine enhancements)
7. <u>Armory</u>: Shipyards can deal in weapons
   Requires: Equipment & Fuel
   Provides: Weapons upgrades for ships (fighters, railguns, missiles, armor)

**Planet Defenses:** A planet without defenses is vulnerable to attack. [shield generators] A planet can be upgraded with the same rail guns, fighters, and missiles as used on ships. Upgrading a planet’s defenses can be done one of two ways. Either the planet owner can buy weapons at the Armory on the orbiting space station - or - the owner can remove weapons from their ship and install them on the planet. Planets have a cap on how many weapons can be installed. Additional weapons can be installed on moons, making planets with more moons more defensible.

**Planets Produce Goods & Colonists:** Once a colony is established, a planet will begin to produce goods. The types of goods produced are dependent on the type of planet. This already exists in Demo 3 in so much as ports trade goods based on planet type. The rate at which goods are produced depends on how close the planet is to the population cap. Remove 50% of the population and goods production will be reduced to half. Colonists can be removed by the planet owner in order to populate other planets. When the planet’s population is below cap, the population will slowly increase until the cap is reached.

**[optional] Maintenance:** Planets require certain “maintenance” activities to keep producing goods. The frequency of this maintenance should be relatively long (weekly?). I.E. scrub the air purifies so settlers don’t die.

(mehbe only require maintenance until self sufficiency is reached, then the planet is “stable” and can self sustain)

**Terraforming & Scientific Development:**
A path in the tech-tree map could be terraforming a planet from being lifeless or resource-scarce to rich in a specialized or complex set of resources. The type of the planet largely dictates the path and possibilities, but credit-expenditure can overcome most limitations (e.g. lack of water)

The typical approach to terraforming is gaining a corporate edge in a related technology or having an abundant supply of a needed resource.

This can also act as a mini-game, e.g. SimEarth, with a scientific/biological aspect to it. This also plays to environmentally-minded players, and green “appeal” to contrast war.

## Ships

**Launching Ships:** Currently ships are minted for free (cost of gas) with only one ship being allowed per account. The intention is to allow the ownership of multiple ships. We will need to constrain the minting of too many new ships, possibly by bots. We can do this with some combination of the following:

- **Cost Per Ship:** Some basic cost associated with minting a ship. We have discussed requiring P8 tokens to mint a ship. Alternatively, we may wish to consider other methods, such as simply accepting the network’s native coin.
- **Ship Inventory:** Constrain the rate at which ships can be minted by having an inventory that works like goods at a space station. If the inventory max is 10 and there are currently 10 ships, no more ships would be produced until some are sold. If gamers buy 5 of them, then 5 new ones will slowly be created and made available.
- **Blacklists:** If an account buys a ship, that same account can not buy another ship for a certain number of blocks.

**Managing Ships:** Despite the current possibility for multiple ships, the current game client doesn’t recognize more than one. With multiple ships, users will need a way of determining which ship they are currently piloting. Gamers should only be able to board another ship if it is in the same system as the ship they are currently on.

**Trading Ships:** Ships can be traded as NFTs on open marketplaces. However, if a ship currently has a pilot in it or if a ship is currently being towed, it should be locked so that it can not be traded. If a third party, such as OpenSea, has permission to manage the ship, it should not be boardable until it is released.

**Ships Upgrades:** Ships can be upgraded at shipyards found at various ports. Ships should be upgradable with the following:

- **Cargo Holds:** Holds are used for moving goods and colonists around. A cargo hold is the basic unit of any good and can contain a consistent number of colonists (i.e. 100). Cargo holds have a consistent price.
- **(Optional) Life Support:** Perhaps too complex, but we could require that cargo holds are upgraded with a life support system or cryo chambers in order to carry colonists.
- **Cargo Multiplier:** Using advanced technology, the cargo area of an Orbiter 8 can be “compressed” by altering the fabric space. This will need a fancy pants name. The result is a 2x increase in cargo capacity. This can only be done once per ship and is rather expensive.
- **Engine Upgrade:** Normally, an Orbiter 8 can only jump from one star to another per transaction. With this upgrade, a ship can jump multiple stars in a single transaction. This would likely provide for 1 additional star per upgrade with a cap such as 3. A ship upgraded to level 3 would be able to jump 4 stars in a single transaction. Each subsequent engine upgrade should cost significantly more than the previous.
- **Tractor Beam:** With a tractor beam, an Orbiter 8 can lock on to another Orbiter 8 owned by the same user and drag it around. A tractor beam can remain engaged while the pilot is off the ship, allowing the pilot to create a “train” of ships (up to a max).
- **Armor/Shielding:** Armor upgrades improve the durability of an Orbiter 8 in a battle scenario. Armor upgrades are stackable and are reduced during battle. If a ship has 10 armor and is reduced to 5 during battle, the next upgrade is considered a repair. Armor above any previous max is considered an upgrade. Repairs are cheaper than upgrades. Upgrades become more expensive the higher they get.
- **Weapons:** Ships can be equipped with several types of weapons. These weapons will be used when engaged in battle. Details to be worked out, but something like:
  - rail guns: effectively infinite ammo
  - drone fighters: can be reused, but may be destroyed in battle
  - nuclear/proton missiles: used up every time they’re fired, must be replenished

**New Ship Types:** The “Orbiter 8” ship is the first ship capable of traveling to new stars. It won’t take long, however, for other corporations to produce competing ships. We will introduce those ships to our user base one at a time. Each new ship will provide the following:

- A new ship “shape” that is identifiable and unique.
- A new art “style” that fits with the ship. Existing art assets will be reused but rendered to match the new style. This may include things like color themes, line art vs silhouette art, and anything else we can think of.
- A branding swap in the client. Within the same game client, all of the “Orbiter 8” branding will be replaced with the new ship name. This will ultimately leave the name of our game completely ambiguous unless we come up with an overarching name.
- New ships may have different base stats and possible configurations. For example, different ships may have different: max cargo holds, max shield capacity, max weapon capacity, max engine upgrades, etc.

**Aliens:** Similar to a new ship, only instead of being created by an Earth corporation, it’s alien technology. All of the same changes that come along with a new ship apply plus:

- Once the upgrade is live, one of the next “newly explored” systems will generate a fully populated start system just like Sol.
- Players buying ships in the alien universe will spawn in the alien system.
- After X number of blocks, Earth and the Aliens will form a treaty and build a “portal” that jumps any spacecrafts between the two systems (which will be far apart) for the same cost of a single star jump.
- Players who are human or alien can become “expats” and claim the other location as their “home.” This will affect game play such as the destination when you have one of your ships “towed” home.

## Battle

**Planet Siege:** A planet can be attacked by a ship. This will lead to the ship being locked into battle as it lays siege to the panet. During the attack, which could last a very long time, the ship is unusable in any other way. If the pilot leaves, the siege ends. A planet under siege can not be traded on an NFT market.

- **Planet Regression Under Siege:** While under siege, a planet will no longer produce goods nor colonists. Rather, the population will be reduced and infrastructure will begin to revert. Eventually, the planet will be turned back into the original state of being lifeless.
- **Financial Resolutions:** The attacker has the choice of offering the planet owner credits to yield the planet. At any point, the planet owner can accept the credits and turn over ownership. Additionally, the attacker can offer a cost of tribute. If the planet owner pays the tribute, the attacker is forced to end the siege and can not attack again for a long time.
- **Ship Damage:** If the planet has defenses, the attacking ship will also take damage during the siege. Like the planet itself, a ship will not be destroyed, but rather, reduced down to its original form with no upgrades. Once a ship is defeated in this way, the siege ends and the pilot is penalized with a drastic reduction in experience points.
- **Multiplayer:** More than one ship can join in on a siege. Furthermore, additional ships can join to defend the planet. If the planet owner’s ship is orbiting the planet, it will automatically participate in the defense even if it is not currently piloted. Ships that do not belong to the owner, however, require the pilot to be on-board to engage in battle. All ships involved in battle are subject to the same risks.
- **Successful Takeover:** Once a planet has been reverted to its most basic level, the initiator of the siege can file a claim in the Minerva galactic database to request reassignment of ownership. The original owner can pay a small fee to dispute this claim. If the original owner does not dispute the claim with a certain time frame, ownership will automatically transfer to the attacker. If the original owner disputes the claim, the planet remains “locked” in siege until the attacker ends the siege. However, the attacker can simply re-engage in a new siege and start the process over, forcing the owner to pay a dispute fee over and over until giving up.
- **Easy Targets:** Unimproved planets make easy targets because they are already in their original state. In this case, things move immediately into a “Successful Takeover” state.

**Asteroid Attack:** As part of an attack on a planet, if a system has an asteroid belt, it should be possible to redirect an asteroid at a planet.

**Level of Engagement:** The calculated result of a battle should take into account how many “targets” a defense system can handle. Example 1: Strong shields may recharge fast enough to fend off a single ship with a single weapon indefinitely. Hundreds of those ships would weaken the shields too quickly. Example 2: An asteroid attack, if successful, would do a lot of damage. A planet with rail guns or lasers would easily prevent an asteroid attack by blowing the asteroid up before it arrives. However, a planet overwhelmed with attacking forces might not have the available weaponry to shoot the asteroid down.

**Ship Battle:** Uncertain… perhaps not even useful.

## Avatars

**One Per Account:** Avatars are created when a pilot “registers” in the Minerva galactic database. Avatars are strictly linked to addresses and can not be transferred. Avatars are required to fly an Orbiter 8. A player wishing to create a new identity must use a whole new account to do so.

**Pilot Names:** Pilot names are unique and can not be duplicated in the database. Pilot names can be changed, but require a fee paid in credits.

**Avatar Images:** Pilots should have some form of image to represent them. The client should allow avatar images to be turned off as they could be annoying. Possibilities for managing images include:

- Avatars can link image urls for a valid image format.
- Avatars can be linked to an NFT owned by the same address.
- We could generate our own avatar images, perhap something customizable.
- If we allow our own avatar images, maybe they should be NFT based?

**Experience:** Avatars will have an “experience” value. This will slowly go up as the user plays the game. Trade probably will not result in changing experience as it will be a very frequent activity and will increase the cost of transactions. Upgrading planets and engaging in battle should definitely contribute to experience. An avatar’s experience points will influence how successful they can be in battle situations (and perhaps other ways).

**(optional) Alignment:** Avatars could also have an “alignment” to suggest how good/bad they are. Attacking an innocent planet would lower the gamers alignment. Doing something good, I donno what yet, would raise it. In some space trading games, a positive or negative alignment allows access to certain features.

## Corporations

**Groups of Players:** Groups of players can join together in “corporations” to aid in their mutual success. Corporations will have access to mutual resources and will be identifiable when viewing a member’s profile.

**Corporate Accounts:** Corporations can have a “mutual” credits account that allow any members to add or remove funds.

**Co-Owned Assets:** Members of a corporation can assign their assets (ships / planets) as a corporate resource. These assets can then be used by anyone in the corporation. Anyone in the corporation can use a corporate ship or operate a planet as the owner.

**Corporate Taxes:** Corporations above a certain size holding a corporate credit balance above a certain level will be taxed when adding or removing funds from the corporate account.

**Idea No Governments:** maybe, in our future, there are no governments - just corporations.. And people are citizens of corporations rather than counties.?

## Space Pirates

**Yar:** The underground world of those who refuse to play by the rules of the system. To become a pirate, you must denounce any corporate alliance.

**Groups of Players:** As a mirror to Corporations, pirates also provide collaborative groups of players called “bands.” As per corporations above, bands can also share accounts and assets.

## Network Mobility

**Parallel Universes:** Orbiter 8 will be playable across a variety of EVM networks. Within the Orbiter 8 game world, these various instances will be considered “parallel universes”

**Cross-Universe Credits:** Using an ERC20 bridge, aka the interdimensional Minerva link, a gamers pan galactic credits can be transferable to any other “universe.” This will create an interesting dynamic as some universes will be more/less expensive to play in than others.

**Wormholes:** If we can properly bridge ship NFTs, we can treat these bridges as “wormholes” that allow the player to transfer from one universe to another. After researching bridges, this seems optimistic. However, the ability to improve a ship in an inexpensive universe and move it to an expensive one sounds very interesting.

**Idea: Wormhole Multinetwork Campaign:** We could create unique instances of the game across multiple EVM networks and bridge them later with Wormholes in a big “event.”

## Snazzy Client Features

**Custom Audio:** Orbiter 8’s audio will be stored in a directory structure representing how it will be used by the client. I.e. (/title, /jump, /menu, /new-system, /existing-system, etc) The user will be able to add/remove MP3s from those directories to change the soundtrack of the game. If multiple files exist in one directly, the client will cycle through those songs.

**Reskinnable:** Client can be re-skins and re-themed.

**ENS support:** Look up player info via address and render it in the client view.

## Macro / Micro Games

“Macro game” refers to gameplay mechanics that are considered at the level of “solar systems” rather than the level of an individual system. “Micro game” refers to gameplay mechanics that are considered at the level of something within a solar system, such as an individual planet.

**Star System Weapons:** The player can have a defense system such that, if someone unauthorized enters the system, the weapon will automatically attack them upon entering. This will require the owner of the weapon owning the entire system - and perhaps the neighboring systems.

**Planet Terraforming:** Player can play a micro game to drastically improve the evolution of their planet through upgrade trees.

## Vanity Upgrades

Some things should be expensive and serve no purpose but showing off.
