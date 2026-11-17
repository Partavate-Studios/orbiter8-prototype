// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ModuleBase} from "../core/ModuleBase.sol";
import {Pilots} from "../pilots/Pilots.sol";
import {Combat} from "./Combat.sol";

/// @title Repairs: what's out of action on each ship, and putting it right
/// @notice Split out of Battle (expansion plan, refactor item 6) so sieges have room to grow, and so a
/// ship's condition has one home: a siege's losses (Battle), a shipyard repair (Armory), and the
/// built-in drones' slow repairs.
///
/// **Built-in drones (D79, D92):** every Orbiter 8 carries four multipurpose drones. They take no
/// bays and can't be bought, sold, traded or lost. The pilot assigns each to repairing or mining.
/// Repairing drones restore the ship slowly, worked out from the time: armor first, then systems
/// out of action, then lost bays, then engine range; once nothing is left to restore, the ship is
/// fit to attack again. (Mining waits for the belts' empty sections.)
contract Repairs is ModuleBase {
    uint8 public constant BUILT_IN_DRONES = 4;

    /// The built-in drones' jobs, and when the repairing ones last had their work counted.
    struct Crew {
        uint8 repairing; // the rest mine
        uint40 since;
        uint32 carried; // hit points of work not yet spent (less than one system's worth)
    }

    /// A ship's state between battles: what's out of action until a shipyard repair.
    struct Condition {
        uint32 armorLost;
        uint16 pointDefenseOff;
        uint16 railgunsOff;
        uint16 missilesOff;
        uint16 dronesOff;
        uint16 botsOff;
        bool retreated; // can't attack again until repaired (D52)
        uint40 dockedUntil; // in the yard after a repair
    }

    /// @custom:storage-location erc7201:orbiter8.repairs
    struct RepairsStorage {
        Pilots pilots;
        mapping(address => Condition) conditions; // pilot → condition
        mapping(address => Crew) crews; // pilot → built-in drones
        uint32 droneHpPerHour; // hit points one repairing drone restores an hour (a tunable)
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.repairs")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant REPAIRS_SLOT = 0x8de551c11947a62b491ca840446ddeb56a34588d66015594ac62a62295ded700;

    event ConditionChanged(address indexed pilot, Condition condition);
    event DronesAssigned(address indexed pilot, uint8 repairing, uint8 mining);
    event DroneRateSet(uint32 hpPerHour);

    error TooManyDrones();

    function _r() internal pure returns (RepairsStorage storage r) {
        assembly {
            r.slot := REPAIRS_SLOT
        }
    }

    function initialize(address admin, Pilots pilots_) external initializer {
        __ModuleBase_init(admin);
        _r().pilots = pilots_;
        _r().droneHpPerHour = 10;
    }

    function setDroneRate(uint32 hpPerHour) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _r().droneHpPerHour = hpPerHour;
        emit DroneRateSet(hpPerHour);
    }

    // ── the built-in drones ─────────────────────────────────────────────────────────────────────

    /// The pilot sets how many of the four built-in drones repair; the rest mine.
    function assignDrones(uint8 repairing) external {
        if (repairing > BUILT_IN_DRONES) revert TooManyDrones();
        address pilot = _r().pilots.actorOf(msg.sender);
        _settle(pilot);
        _r().crews[pilot].repairing = repairing;
        emit DronesAssigned(pilot, repairing, BUILT_IN_DRONES - repairing);
    }

    /// How the built-in drones are working: (repairing, mining).
    function dronesOf(address pilot) external view returns (uint8 repairing, uint8 mining) {
        repairing = _r().crews[pilot].repairing;
        mining = BUILT_IN_DRONES - repairing;
    }

    /// Writes the drones' repairs so far into the ship's condition and damage.
    function _settle(address pilot) internal {
        RepairsStorage storage r = _r();
        Crew storage crew = r.crews[pilot];
        Pilots.Ship memory ship = r.pilots.shipOf(pilot);
        (Condition memory c, uint8 rangeLost, uint16 baysLost, uint256 left) =
            _restored(r.conditions[pilot], ship.rangeLost, ship.baysLost, _work(crew));
        (crew.since, crew.carried) = (uint40(block.timestamp), uint32(left));
        r.conditions[pilot] = c;
        if (rangeLost != ship.rangeLost || baysLost != ship.baysLost) r.pilots.setDamage(pilot, rangeLost, baysLost);
    }

    /// Hit points of repair work due since the crew's work was last counted.
    function _work(Crew memory crew) internal view returns (uint256) {
        if (crew.since == 0) return 0;
        return uint256(crew.carried)
            + (uint256(crew.repairing) * _r().droneHpPerHour * (block.timestamp - crew.since)) / 1 hours;
    }

    /// Spends `work` hit points on the ship: armor, then systems, then bays (ten to BAY_HP), then range.
    function _restored(Condition memory c, uint8 rangeLost, uint16 baysLost, uint256 work)
        internal
        pure
        returns (Condition memory, uint8, uint16, uint256)
    {
        uint256 armor = work < c.armorLost ? work : c.armorLost;
        c.armorLost -= uint32(armor);
        work -= armor;
        (c.pointDefenseOff, work) = _fix(c.pointDefenseOff, Combat.WEAPON_HP, work);
        (c.railgunsOff, work) = _fix(c.railgunsOff, Combat.WEAPON_HP, work);
        (c.missilesOff, work) = _fix(c.missilesOff, Combat.WEAPON_HP, work);
        (c.dronesOff, work) = _fix(c.dronesOff, Combat.DRONE_HP, work);
        (c.botsOff, work) = _fix(c.botsOff, Combat.BOT_HP, work);
        uint16 bays;
        (bays, work) = _fix(baysLost, Combat.BAY_HP / 10, work);
        uint16 range;
        (range, work) = _fix(rangeLost, Combat.ENGINE_HP, work);
        bool whole = c.armorLost == 0 && c.pointDefenseOff == 0 && c.railgunsOff == 0 && c.missilesOff == 0
            && c.dronesOff == 0 && c.botsOff == 0 && bays == 0 && range == 0;
        if (whole) {
            c.retreated = false;
            work = 0; // nothing to carry over to the next damage
        }
        return (c, uint8(range), bays, work);
    }

    function _fix(uint16 broken, uint256 hp, uint256 work) private pure returns (uint16, uint256) {
        uint256 fixed_ = work / hp;
        if (fixed_ > broken) fixed_ = broken;
        return (uint16(broken - fixed_), work - fixed_ * hp);
    }

    // ── for Battle and the Armory (GAME_MODULE) ─────────────────────────────────────────────────

    /// A siege's end (Battle): what the ship lost stays out of action until it's repaired.
    function keepLosses(address pilot, Combat.Side memory side) external onlyRole(GAME_MODULE) {
        _settle(pilot); // the drones' work so far, then the siege's losses on top
        RepairsStorage storage r = _r();
        Pilots.Ship memory ship = r.pilots.shipOf(pilot);
        Pilots.Loadout memory l = ship.loadout;
        Condition storage c = r.conditions[pilot];
        c.armorLost = uint32(uint256(l.armor) * Combat.ARMOR_HP - side.armor);
        c.pointDefenseOff = l.pointDefense - side.pointDefense;
        c.railgunsOff = l.railguns - side.railguns;
        c.missilesOff = l.missiles - side.missiles;
        c.dronesOff = l.drones - side.drones;
        c.botsOff = l.repairBots - side.repairBots;
        c.retreated = c.retreated || side.retreated;
        if (side.rangeLost > 0 || side.baysLost > 0) {
            r.pilots.setDamage(pilot, ship.rangeLost + side.rangeLost, ship.baysLost + side.baysLost);
        }
        emit ConditionChanged(pilot, c);
    }

    /// A shipyard repair (the Armory): everything restored; in the yard until `until`.
    function repaired(address pilot, uint40 until) external onlyRole(GAME_MODULE) {
        Condition storage c = _r().conditions[pilot];
        delete _r().conditions[pilot];
        (_r().crews[pilot].since, _r().crews[pilot].carried) = (uint40(block.timestamp), 0);
        c.dockedUntil = until;
        _r().pilots.setDamage(pilot, 0, 0);
        emit ConditionChanged(pilot, c);
    }

    // ── views ───────────────────────────────────────────────────────────────────────────────────

    /// A ship as it would go into battle now: its loadout less what's out of action.
    function shipSide(address pilot) external view returns (Combat.Side memory side) {
        Pilots.Ship memory ship = _r().pilots.shipOf(pilot);
        Pilots.Loadout memory l = ship.loadout;
        Condition memory c;
        (c, ship.rangeLost, ship.baysLost,) =
            _restored(_r().conditions[pilot], ship.rangeLost, ship.baysLost, _work(_r().crews[pilot]));
        side.shieldMax = uint32(uint256(l.shields) * Combat.SHIELD_HP);
        side.shield = side.shieldMax; // shields regenerate between battles
        side.armorMax = uint32(uint256(l.armor) * Combat.ARMOR_HP);
        side.armor = c.armorLost >= side.armorMax ? 0 : side.armorMax - c.armorLost;
        side.pointDefense = l.pointDefense - c.pointDefenseOff;
        side.railguns = l.railguns - c.railgunsOff;
        side.missiles = l.missiles - c.missilesOff;
        side.drones = l.drones - c.dronesOff;
        side.repairBots = l.repairBots - c.botsOff;
        uint256 range = ship.range > ship.rangeLost ? ship.range - ship.rangeLost : 1;
        side.maxRangeLoss = uint8(range - 1);
        side.maxBaysLoss = ship.bays > ship.baysLost ? ship.bays - ship.baysLost : 0;
        side.retreated = c.retreated || block.timestamp < c.dockedUntil;
    }

    /// The ship's condition now, the drones' repairs counted.
    function conditionOf(address pilot) external view returns (Condition memory c) {
        Pilots.Ship memory ship = _r().pilots.shipOf(pilot);
        (c,,,) = _restored(_r().conditions[pilot], ship.rangeLost, ship.baysLost, _work(_r().crews[pilot]));
    }

    /// The ship's engine and bay damage now (Pilots stores it; the drones' repairs counted).
    function damageOf(address pilot) external view returns (uint8 rangeLost, uint16 baysLost) {
        Pilots.Ship memory ship = _r().pilots.shipOf(pilot);
        (, rangeLost, baysLost,) =
            _restored(_r().conditions[pilot], ship.rangeLost, ship.baysLost, _work(_r().crews[pilot]));
    }
}
