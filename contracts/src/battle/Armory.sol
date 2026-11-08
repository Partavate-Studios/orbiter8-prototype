// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ModuleBase} from "../core/ModuleBase.sol";
import {Pilots} from "../pilots/Pilots.sol";
import {Planets} from "../planets/Planets.sol";
import {Factory} from "../planets/Factory.sol";
import {Market} from "../market/Market.sol";
import {Credits} from "../tokens/Credits.sol";
import {Battle} from "./Battle.sol";

/// @title Fitting, buying and repairing (docs/demo4-plan.md, sections 5 and 6; D55, D56, D58)
/// @notice Parts come from a planet's Autofactory (its parts store) or an Armory:
/// - **Ships** fit parts at their owner's planet, and can drop them off again (D55, D56); the BFG and
///   orbital platforms stay planet-side.
/// - **Planets** fit parts from their own store, from anywhere, even mid-siege (D45).
/// - **Armories** sell parts to any visiting pilot: Sol's I.S.S. sells the ship parts at twice their
///   cost (burned), and a player's planet with an Armory sells from its store at one and a half
///   times, paid to the owner (D58).
/// - **Repairs** at any shipyard restore a ship completely; it then spends a few hours in the yard
///   before it can attack again (D46).
///
/// Parts, by id (Factory): 0 drone, 1 repair bot, 2 point defense, 3 railgun, 4 missile rack,
/// 5 armor plating, 6 shield generator, 7 orbital platform, 8 BFG.
contract Armory is ModuleBase {
    uint256 public constant SOL_ARMORY = 2; // the I.S.S.
    uint256 public constant REPAIR_COST = 3_000;
    uint256 public constant REPAIR_TIME = 3 hours;

    // A planet's capacities (D59: much larger than a ship's).
    uint256 public constant PLANET_MOUNTS = 12; // plus 4 for each orbital platform (D51)
    uint256 public constant PLATFORM_MOUNTS = 4;
    uint256 public constant PLANET_DRONES = 60;
    uint256 public constant PLANET_BOTS = 20;
    uint256 public constant PLANET_ARMOR = 20;
    uint256 public constant PLANET_SHIELDS = 5;
    uint256 public constant PLANET_PLATFORMS = 3;
    uint256 public constant MOON_MOUNTS = 6; // per moon; moons can't be destroyed (D61)

    /// @custom:storage-location erc7201:orbiter8.armory
    struct ArmoryStorage {
        Pilots pilots;
        Planets planets;
        Factory factory;
        Market market;
        Credits credits;
        Battle battle;
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.armory")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant ARMORY_SLOT = 0x133e3108c151f99076f1e3b8ca6c8d24ab8fbb831c6d64fbaf0f35560cd0b500;

    event PartsBought(address indexed pilot, uint256 indexed port, uint256 indexed part, uint256 count, uint256 credits);
    event Repaired(address indexed pilot, uint256 indexed port, uint40 until);

    error NotYours();
    error NotThere();
    error PlanetOnly(uint256 part);
    error TooMany(uint256 part);
    error InBattle();
    error NoArmory();
    error NoYard();
    error PriceLimit(uint256 credits);
    error NotEnough();
    error WeaponsOnly(uint256 part);

    function _a() internal pure returns (ArmoryStorage storage a) {
        assembly {
            a.slot := ARMORY_SLOT
        }
    }

    function initialize(
        address admin,
        Pilots pilots_,
        Planets planets_,
        Factory factory_,
        Market market_,
        Credits credits_,
        Battle battle_
    ) external initializer {
        __ModuleBase_init(admin);
        ArmoryStorage storage a = _a();
        (a.pilots, a.planets, a.factory, a.market, a.credits, a.battle) =
            (pilots_, planets_, factory_, market_, credits_, battle_);
    }

    // ── ships ───────────────────────────────────────────────────────────────────────────────────

    /// Fits parts from the owner's planet's store to the ship, at the planet (D55, D56).
    function fitShip(uint256 planet, uint256 part, uint256 count) external {
        address pilot = _ownerAt(planet);
        _a().factory.takeParts(planet, part, count);
        _changeShip(pilot, part, int256(count));
    }

    /// Drops parts off from the ship into the owner's planet's store.
    function unloadShip(uint256 planet, uint256 part, uint256 count) external {
        address pilot = _ownerAt(planet);
        _changeShip(pilot, part, -int256(count));
        _a().factory.addParts(planet, part, count);
    }

    function _changeShip(address pilot, uint256 part, int256 delta) internal {
        if (part >= 7) revert PlanetOnly(part);
        if (_a().battle.attackingOf(pilot) != 0) revert InBattle();
        Pilots.Loadout memory l = _a().pilots.shipOf(pilot).loadout;
        if (part == 0) l.drones = uint16(_add(l.drones, delta));
        else if (part == 1) l.repairBots = uint8(_add(l.repairBots, delta));
        else if (part == 2) l.pointDefense = uint8(_add(l.pointDefense, delta));
        else if (part == 3) l.railguns = uint8(_add(l.railguns, delta));
        else if (part == 4) l.missiles = uint8(_add(l.missiles, delta));
        else if (part == 5) l.armor = uint8(_add(l.armor, delta));
        else l.shields = uint8(_add(l.shields, delta));
        _a().pilots.setLoadout(pilot, l); // checks mounts, limits and bays
    }

    // ── planets ─────────────────────────────────────────────────────────────────────────────────

    /// Fits parts from a planet's store to its defenses, from anywhere, mid-siege included (D45).
    function fitPlanet(uint256 planet, uint256 part, uint256 count) external {
        _owner(planet);
        _a().factory.takeParts(planet, part, count);
        _changePlanet(planet, part, int256(count));
    }

    /// Takes parts off a planet's defenses back into its store (not during a siege).
    function unfitPlanet(uint256 planet, uint256 part, uint256 count) external {
        _owner(planet);
        (Battle.Siege memory s,) = _a().battle.siegeOf(planet);
        if (s.attacker != address(0)) revert InBattle();
        _changePlanet(planet, part, -int256(count));
        _a().factory.addParts(planet, part, count);
    }

    /// Fits weapons (point defense, railguns, missile racks) from a planet's store to its moons:
    /// six mounts a moon, outside the planet's shield in a siege (D61). From anywhere, mid-siege included.
    function fitMoons(uint256 planet, uint256 part, uint256 count) external {
        _owner(planet);
        _a().factory.takeParts(planet, part, count);
        _changeMoons(planet, part, int256(count));
    }

    /// Takes weapons off a planet's moons back into its store (not during a siege).
    function unfitMoons(uint256 planet, uint256 part, uint256 count) external {
        _owner(planet);
        (Battle.Siege memory s,) = _a().battle.siegeOf(planet);
        if (s.attacker != address(0)) revert InBattle();
        _changeMoons(planet, part, -int256(count));
        _a().factory.addParts(planet, part, count);
    }

    function _changeMoons(uint256 planet, uint256 part, int256 delta) internal {
        Battle.Defenses memory d = _a().battle.defensesOf(planet);
        if (part == 2) d.moonPointDefense = uint16(_add(d.moonPointDefense, delta));
        else if (part == 3) d.moonRailguns = uint16(_add(d.moonRailguns, delta));
        else if (part == 4) d.moonMissiles = uint16(_add(d.moonMissiles, delta));
        else revert WeaponsOnly(part);
        uint256 mounts = uint256(d.moonPointDefense) + 2 * uint256(d.moonRailguns) + 2 * uint256(d.moonMissiles);
        if (mounts > MOON_MOUNTS * _a().planets.moonCount(planet)) revert TooMany(part);
        _a().battle.setDefenses(planet, d);
    }

    function _changePlanet(uint256 planet, uint256 part, int256 delta) internal {
        Battle.Defenses memory d = _a().battle.defensesOf(planet);
        if (part == 0) d.drones = uint16(_add(d.drones, delta));
        else if (part == 1) d.repairBots = uint16(_add(d.repairBots, delta));
        else if (part == 2) d.pointDefense = uint16(_add(d.pointDefense, delta));
        else if (part == 3) d.railguns = uint16(_add(d.railguns, delta));
        else if (part == 4) d.missiles = uint16(_add(d.missiles, delta));
        else if (part == 5) d.armor = uint8(_add(d.armor, delta));
        else if (part == 6) d.shields = uint8(_add(d.shields, delta));
        else if (part == 7) d.platforms = uint8(_add(d.platforms, delta));
        else d.bfg = uint8(_add(d.bfg, delta));
        uint256 mounts = uint256(d.pointDefense) + 2 * uint256(d.railguns) + 2 * uint256(d.missiles);
        if (
            mounts > PLANET_MOUNTS + PLATFORM_MOUNTS * d.platforms || d.drones > PLANET_DRONES
                || d.repairBots > PLANET_BOTS || d.armor > PLANET_ARMOR || d.shields > PLANET_SHIELDS
                || d.platforms > PLANET_PLATFORMS || d.bfg > 1
        ) revert TooMany(part);
        _a().battle.setDefenses(planet, d);
    }

    // ── armories ────────────────────────────────────────────────────────────────────────────────

    /// Buys parts at an armory at the ship's star and fits them at once, paying at most `maxCost`.
    function buy(uint256 port, uint256 part, uint256 count, uint256 maxCost) external {
        ArmoryStorage storage a = _a();
        address pilot = a.pilots.actorOf(msg.sender);
        if (a.pilots.shipOf(pilot).cell != port >> 8) revert NotThere();
        uint256 unit = a.factory.parts()[part].credits;
        uint256 cost;
        if (port == SOL_ARMORY) {
            cost = unit * 2 * count;
            if (cost > maxCost) revert PriceLimit(cost);
            a.credits.burn(pilot, cost);
        } else {
            Planets.PlanetView memory p = a.planets.planetView(port, 0);
            if (p.level < 6 || p.owner == address(0)) revert NoArmory();
            cost = (unit * 3 * count) / 2;
            if (cost > maxCost) revert PriceLimit(cost);
            a.factory.takeParts(port, part, count);
            a.credits.move(pilot, p.owner, cost);
        }
        _changeShip(pilot, part, int256(count));
        emit PartsBought(pilot, port, part, count, cost);
    }

    /// Repairs the ship at a shipyard at its star: everything restored, then a few hours in the yard.
    function repair(uint256 port) external {
        ArmoryStorage storage a = _a();
        address pilot = a.pilots.actorOf(msg.sender);
        if (a.pilots.shipOf(pilot).cell != port >> 8) revert NotThere();
        if (a.battle.attackingOf(pilot) != 0) revert InBattle();
        Market.PortView memory v = a.market.portView(port);
        if (!v.yard) revert NoYard();
        if (v.owner == address(0)) a.credits.burn(pilot, REPAIR_COST);
        else a.credits.move(pilot, v.owner, REPAIR_COST);
        uint40 until = uint40(block.timestamp + REPAIR_TIME);
        a.battle.repaired(pilot, until);
        emit Repaired(pilot, port, until);
    }

    // ── helpers ─────────────────────────────────────────────────────────────────────────────────

    function _owner(uint256 planet) internal view returns (address pilot) {
        pilot = _a().pilots.actorOf(msg.sender);
        if (_a().planets.ownerOf(planet) != pilot) revert NotYours();
    }

    function _ownerAt(uint256 planet) internal view returns (address pilot) {
        pilot = _owner(planet);
        if (_a().pilots.shipOf(pilot).cell != planet >> 8) revert NotThere();
    }

    function _add(uint256 value, int256 delta) internal pure returns (uint256) {
        int256 next = int256(value) + delta;
        if (next < 0) revert NotEnough();
        return uint256(next);
    }
}
