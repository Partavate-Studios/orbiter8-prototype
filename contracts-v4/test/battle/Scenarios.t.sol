// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test, console} from "forge-std/Test.sol";
import {Combat} from "../../src/battle/Combat.sol";

/// The battle simulator (docs/demo4-tuning.md): sieges between typical loadouts, played with the
/// contracts' own rounds, printing how long each takes against D30's targets.
/// forge test --match-contract Scenarios -vv
contract Scenarios is Test {
    struct Ship {
        uint16 pd;
        uint16 rails;
        uint16 missiles;
        uint16 drones;
        uint16 bots;
        uint8 armor;
        uint8 shields;
    }

    function _ship(Ship memory l) internal pure returns (Combat.Side memory s) {
        (s.pointDefense, s.railguns, s.missiles, s.drones, s.repairBots) = (l.pd, l.rails, l.missiles, l.drones, l.bots);
        s.armorMax = s.armor = uint32(l.armor) * uint32(Combat.ARMOR_HP);
        s.shieldMax = s.shield = uint32(l.shields) * uint32(Combat.SHIELD_HP);
        s.maxRangeLoss = 3;
        s.maxBaysLoss = 250;
    }

    function _planet(uint8 level, Ship memory l, uint8 platforms, uint8 bfg) internal pure returns (Combat.Side memory p) {
        p = _ship(l);
        p.platforms = uint32(platforms) * uint32(Combat.PLATFORM_HP);
        p.hull = uint32(level) * uint32(Combat.HULL_PER_LEVEL);
        p.bfg = bfg;
        p.maxRangeLoss = 0;
        p.maxBaysLoss = 0;
    }

    function _run(string memory name, Combat.Side memory ship, Combat.Side memory planet, Combat.Fire memory allies)
        internal
        pure
    {
        (Combat.Side memory s, Combat.Side memory p, uint256 played, uint256 worn) =
            Combat.play(ship, planet, allies, 14 * 48);
        if (worn != 0) {
            console.log(string.concat(name, ": worn down after (hours x10)"), worn * 5);
        } else {
            console.log(string.concat(name, ": held; attacker spent after (hours x10)"), played * 5);
        }
        console.log("   planet left: platforms, armor, hull", p.platforms, p.armor, p.hull);
        console.log("   attacker left: armor, railguns, drones", s.armor, s.railguns, s.drones);
    }

    function test_scenarios() public pure {
        Combat.Fire memory none;
        // Attackers. A starter: 2 railguns, a missile rack, no armor. A raider: 3 railguns, 5 armor,
        // 3 shields, 60 drones (110 + 50 + 60 + 120 bays = 230 of 250). A brawler: 3 missile racks,
        // 5 armor, 3 shields, 4 repair bots, 50 drones.
        Combat.Side memory starter = _ship(Ship(0, 2, 1, 0, 0, 0, 0));
        Combat.Side memory raider = _ship(Ship(0, 3, 0, 60, 0, 5, 3));
        Combat.Side memory brawler = _ship(Ship(0, 0, 3, 50, 4, 5, 3));

        // Planets. Undefended Citadel; a Station with a few defenses; a fully built Armory at the caps.
        Ship memory none_ = Ship(0, 0, 0, 0, 0, 0, 0);
        Ship memory some = Ship(2, 2, 1, 10, 2, 6, 1);
        Ship memory full = Ship(4, 5, 5, 60, 20, 20, 5);

        _run("starter vs undefended Citadel", _copy(starter), _planet(1, none_, 0, 0), none);
        _run("starter vs defended Station", _copy(starter), _planet(3, some, 0, 0), none);
        _run("raider vs defended Station", _copy(raider), _planet(3, some, 1, 0), none);
        _run("raider vs full Armory", _copy(raider), _planet(6, full, 3, 1), none);
        _run("brawler vs full Armory", _copy(brawler), _planet(6, full, 3, 1), none);
    }

    function _copy(Combat.Side memory s) internal pure returns (Combat.Side memory c) {
        c = s;
        Combat.Side memory fresh;
        fresh = c;
        return abi.decode(abi.encode(s), (Combat.Side));
    }
}
