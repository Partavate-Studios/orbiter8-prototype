// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ModuleBase} from "../core/ModuleBase.sol";
import {Pilots} from "../pilots/Pilots.sol";
import {Combat} from "./Combat.sol";

/// @title Repairs: what's out of action on each ship, and putting it right
/// @notice Split out of Battle (expansion plan, refactor item 6) so sieges have room to grow, and so a
/// ship's condition has one home: a siege's losses (Battle), a shipyard repair (Armory), and next the
/// built-in drones' slow repairs (decision 26).
contract Repairs is ModuleBase {
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
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.repairs")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant REPAIRS_SLOT = 0x8de551c11947a62b491ca840446ddeb56a34588d66015594ac62a62295ded700;

    event ConditionChanged(address indexed pilot, Condition condition);

    function _r() internal pure returns (RepairsStorage storage r) {
        assembly {
            r.slot := REPAIRS_SLOT
        }
    }

    function initialize(address admin, Pilots pilots_) external initializer {
        __ModuleBase_init(admin);
        _r().pilots = pilots_;
    }

    // ── for Battle and the Armory (GAME_MODULE) ─────────────────────────────────────────────────

    /// A siege's end (Battle): what the ship lost stays out of action until it's repaired.
    function keepLosses(address pilot, Combat.Side memory side) external onlyRole(GAME_MODULE) {
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
        c.dockedUntil = until;
        _r().pilots.setDamage(pilot, 0, 0);
        emit ConditionChanged(pilot, c);
    }

    // ── views ───────────────────────────────────────────────────────────────────────────────────

    /// A ship as it would go into battle now: its loadout less what's out of action.
    function shipSide(address pilot) external view returns (Combat.Side memory side) {
        Pilots.Ship memory ship = _r().pilots.shipOf(pilot);
        Pilots.Loadout memory l = ship.loadout;
        Condition memory c = _r().conditions[pilot];
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

    function conditionOf(address pilot) external view returns (Condition memory) {
        return _r().conditions[pilot];
    }
}
