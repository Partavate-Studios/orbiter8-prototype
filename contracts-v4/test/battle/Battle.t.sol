// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test} from "forge-std/Test.sol";
import {PlanetsFixture} from "../planets/Planets.t.sol";
import {Pilots} from "../../src/pilots/Pilots.sol";
import {Planets} from "../../src/planets/Planets.sol";
import {Battle} from "../../src/battle/Battle.sol";
import {Armory} from "../../src/battle/Armory.sol";
import {Combat} from "../../src/battle/Combat.sol";

contract BattleFixture is PlanetsFixture {
    Battle battle;
    Armory armory;

    uint256 constant RAILGUN = 3;
    uint256 constant MISSILE_RACK = 4;
    uint256 constant ARMOR = 5;
    uint256 constant POINT_DEFENSE = 2;

    function setUp() public virtual override {
        super.setUp();
        (battle, armory) = (game.battle, game.armory);
        vm.startPrank(admin);
        battle.grantRole(battle.GAME_MODULE(), admin); // the tests set planet defenses directly
        vm.stopPrank();
        vm.prank(bo);
        pilots.register("Bodo", "Raider");
    }

    /// Bo armed at Sol's armory: two railguns, a missile rack and armor, `plates` of it.
    function _armBo(uint8 plates) internal {
        _pay(bo, 1_000_000);
        vm.startPrank(bo);
        market.buyBays(EARTH, 95, type(uint256).max);
        armory.buy(EARTH, RAILGUN, 2, type(uint256).max);
        armory.buy(EARTH, MISSILE_RACK, 1, type(uint256).max);
        if (plates > 0) armory.buy(EARTH, ARMOR, plates, type(uint256).max);
        vm.stopPrank();
    }

    function _defend(Battle.Defenses memory d) internal {
        vm.prank(admin);
        battle.setDefenses(home, d);
    }
}

contract BattleTest is BattleFixture {
    function test_solCannotBeAttacked() public {
        _armBo(0);
        vm.prank(bo);
        vm.expectRevert(Battle.FederationPlanet.selector);
        battle.attack(EARTH);
    }

    function test_anUnarmedShipCannotAttack() public {
        _citadel();
        _go(bo, star);
        vm.prank(bo);
        vm.expectRevert(Battle.CannotAttack.selector);
        battle.attack(home);
    }

    function test_anUndefendedPlanetFallsInAboutAnHourThenTheClaimWaitsADay() public {
        _citadel();
        _go(ada, 0); // the owner is away
        _armBo(0);
        _go(bo, star);
        vm.prank(bo);
        battle.attack(home);
        planets.settle(home);
        uint256[] memory before = planets.planetView(home, 8).stock;

        skip(1 hours);
        battle.advance(home);
        (Battle.Siege memory s,) = battle.siegeOf(home);
        assertGt(s.wornAt, 0, "worn down within the hour");
        assertEq(planets.planetView(home, 8).stock, before, "a besieged planet makes nothing");

        vm.prank(bo);
        battle.fileClaim(home);
        skip(23 hours);
        vm.expectPartialRevert(Battle.NotYet.selector);
        battle.completeClaim(home);
        skip(1 hours);
        for (uint256 i = 0; i < 2; i++) battle.advance(home);
        battle.completeClaim(home);
        assertEq(planets.ownerOf(home), bo);
        assertEq(deeds.ownerOf(home), bo);
        assertEq(planets.planetView(home, 0).level, 1, "a Citadel stays a Citadel");
    }

    function test_defensesDriveAnAttackerOffAndTheShipNeedsRepair() public {
        _citadel();
        _defend(Battle.Defenses(0, 6, 0, 0, 0, 4, 0, 0, 0)); // six railguns, four armor plates
        _armBo(2);
        _go(bo, star);
        vm.prank(bo);
        battle.attack(home);
        skip(3 hours);
        battle.advance(home);
        (Battle.Siege memory s,) = battle.siegeOf(home);
        assertEq(s.attacker, address(0), "the siege ended");
        assertEq(planets.ownerOf(home), ada);
        Battle.Condition memory c = battle.conditionOf(bo);
        assertTrue(c.retreated);
        assertEq(c.armorLost, 100);

        vm.prank(bo);
        vm.expectRevert(Battle.CannotAttack.selector);
        battle.attack(home);

        _go(bo, 0);
        vm.prank(bo);
        armory.repair(EARTH);
        assertFalse(battle.conditionOf(bo).retreated);
        _go(bo, star);
        vm.prank(bo);
        vm.expectRevert(Battle.CannotAttack.selector); // still in the yard
        battle.attack(home);
        skip(3 hours);
        vm.prank(bo);
        battle.attack(home);
    }

    function test_theOwnersShipDefendsWhenItsThere() public {
        _citadel();
        _defend(Battle.Defenses(0, 0, 0, 0, 0, 10, 0, 0, 0)); // armor only: the planet can't shoot
        _pay(ada, 1_000_000);
        _go(ada, 0);
        vm.startPrank(ada);
        armory.buy(EARTH, RAILGUN, 3, type(uint256).max);
        vm.stopPrank();
        _go(ada, star);
        _armBo(1);
        _go(bo, star);
        vm.prank(bo);
        battle.attack(home);
        skip(2 hours);
        battle.advance(home);
        (Battle.Siege memory s,) = battle.siegeOf(home);
        assertEq(s.attacker, address(0), "Ada's railguns drove Bo off");
        assertTrue(battle.conditionOf(bo).retreated);
    }

    function test_leavingEndsTheSiege() public {
        _citadel();
        _defend(Battle.Defenses(0, 0, 0, 0, 0, 20, 0, 0, 0));
        _armBo(0);
        _go(bo, star);
        vm.prank(bo);
        battle.attack(home);
        skip(1 hours);
        _go(bo, 0);
        (Battle.Siege memory s,) = battle.siegeOf(home);
        assertEq(s.attacker, address(0));
        assertLt(battle.defensesOf(home).armor, 20, "the planet kept its losses");
        assertFalse(battle.conditionOf(bo).retreated);
    }

    function test_reinforcingMidSiegeJoinsAtOnce() public {
        _citadel();
        _go(ada, 0);
        _armBo(0);
        _go(bo, star);
        vm.prank(bo);
        battle.attack(home);
        _defend(Battle.Defenses(0, 0, 0, 0, 0, 20, 0, 3, 0)); // armor and platforms, right away
        skip(1 hours);
        battle.advance(home);
        (Battle.Siege memory s,) = battle.siegeOf(home);
        assertEq(s.wornAt, 0, "the reinforcements held");
        assertGt(s.planet.platforms + s.planet.armor, 0);
    }

    function test_shipsHaveSixMounts() public {
        _pay(bo, 1_000_000);
        vm.startPrank(bo);
        armory.buy(EARTH, RAILGUN, 3, type(uint256).max);
        vm.expectRevert(Pilots.BadLoadout.selector);
        armory.buy(EARTH, POINT_DEFENSE, 1, type(uint256).max);
        vm.stopPrank();
        assertEq(pilots.shipOf(bo).loadout.railguns, 3);
    }

    function test_armorTakesBays() public {
        _pay(bo, 1_000_000);
        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(Pilots.NoRoom.selector, 5));
        armory.buy(EARTH, ARMOR, 1, type(uint256).max); // 10 bays; the ship has 5
    }
}

contract CombatTest is Test {
    function _ship(uint16 rails, uint16 missiles, uint16 drones, uint8 armor, uint8 shields)
        internal
        pure
        returns (Combat.Side memory s)
    {
        s.railguns = rails;
        s.missiles = missiles;
        s.drones = drones;
        s.armorMax = s.armor = uint32(armor) * 50;
        s.shieldMax = s.shield = uint32(shields) * 60;
        s.maxRangeLoss = 3;
        s.maxBaysLoss = 250;
    }

    /// Whatever the loadouts, rounds never add weapons, and a spent attacker does no more harm.
    function testFuzz_roundsOnlyWearDown(uint8 r, uint8 m, uint8 d, uint8 pd, uint8 a, uint8 sh, uint8 rounds)
        public
        pure
    {
        Combat.Side memory ship = _ship(uint16(r % 4), uint16(m % 4), uint16(d % 40), a % 6, sh % 4);
        Combat.Side memory planet;
        planet.pointDefense = pd % 8;
        planet.railguns = uint16(r % 7);
        planet.armorMax = planet.armor = uint32(a % 21) * 50;
        planet.platforms = uint32(sh % 4) * 150;
        planet.hull = 120;
        uint256 systems = uint256(planet.pointDefense) + planet.railguns;
        for (uint256 i = 0; i < rounds % 50; i++) {
            // (Memory structs alias on assignment, so take the values first.)
            bool wasSpent = Combat.spent(ship);
            uint16 railguns = ship.railguns;
            uint32 planetArmor = planet.armor;
            Combat.round(ship, planet, Combat.Fire(0, 0, 0));
            assertLe(uint256(planet.pointDefense) + planet.railguns, systems);
            assertLe(ship.railguns, railguns);
            assertLe(ship.armor, ship.armorMax);
            if (wasSpent) assertLe(planetArmor, planet.armor); // no harm once spent
        }
    }

    function test_countersHold() public pure {
        // Railguns do double against armor; missiles double against platforms, unless point
        // defense stops them.
        Combat.Side memory armored;
        armored.armorMax = armored.armor = 1_000;
        Combat.round(_ship(3, 0, 0, 5, 3), armored, Combat.Fire(0, 0, 0));
        assertEq(1_000 - armored.armor, 72); // 3 × 12 × 2

        Combat.Side memory platforms;
        platforms.platforms = 1_000;
        Combat.round(_ship(0, 3, 0, 5, 3), platforms, Combat.Fire(0, 0, 0));
        assertEq(1_000 - platforms.platforms, 72);

        Combat.Side memory guarded;
        guarded.platforms = 1_000;
        guarded.pointDefense = 2; // stops 30 of the 36
        Combat.round(_ship(0, 3, 0, 5, 3), guarded, Combat.Fire(0, 0, 0));
        assertEq(1_000 - guarded.platforms, 12);
    }
}
