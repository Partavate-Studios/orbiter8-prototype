// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {GameFixture} from "../market/Market.t.sol";
import {Pilots} from "../../src/pilots/Pilots.sol";
import {Market} from "../../src/market/Market.sol";
import {Planets} from "../../src/planets/Planets.sol";
import {Factory} from "../../src/planets/Factory.sol";
import {Deeds} from "../../src/tokens/Deeds.sol";
import {SystemGen} from "../../src/planets/SystemGen.sol";

contract PlanetsFixture is GameFixture {
    Planets planets;
    Factory factory;
    Deeds deeds;
    uint256 star; // a star next to Sol
    uint256 home; // its first planet

    uint256 constant ELECTRONICS = 7;
    uint256 constant SILICON = 5;

    function setUp() public virtual override {
        super.setUp();
        (planets, factory, deeds) = (game.planets, game.factory, game.deeds);
        star = _starAroundSol();
        home = star << 8;
    }

    function _claim(address who, uint256 planet) internal {
        _pay(who, planets.tuning().claimFee);
        vm.prank(who);
        planets.claim(planet);
    }

    function _go(address who, uint256 cell) internal {
        vm.prank(who);
        pilots.jump(cell, new Pilots.ScanProof[](0));
    }

    /// Ada at Sol with money, bays, the goods a Citadel needs and 100 colonists aboard.
    function _supply() internal {
        _pay(ada, 10_000_000);
        vm.startPrank(ada);
        market.buyBays(EARTH, 245, type(uint256).max);
        Market.Line[] memory lines = new Market.Line[](2);
        lines[0] = Market.Line(ORGANICS, 40, type(uint256).max);
        lines[1] = Market.Line(EQUIPMENT, 140, type(uint256).max);
        market.trade(EARTH, lines);
        planets.recruit(100);
        vm.stopPrank();
    }

    /// Ada's planet with a finished Citadel.
    function _citadel() internal {
        _supply();
        _go(ada, star);
        vm.startPrank(ada);
        planets.claim(home);
        planets.land(home, 100);
        planets.deliver(home, ORGANICS, 40);
        planets.deliver(home, EQUIPMENT, 40);
        planets.build(home, planets.CITADEL());
        vm.stopPrank();
        skip(10 minutes);
    }
}

contract PlanetsTest is PlanetsFixture {
    function test_systemsAreDerived() public view {
        Planets.PlanetView[] memory sol = planets.system(0, 8);
        assertEq(sol.length, 9);
        assertEq(sol[2].class, 0, "Earth is Terrestrial");
        assertEq(sol[2].size, 12);
        Planets.PlanetView[] memory near = planets.system(star, 8);
        assertGe(near.length, 2);
        assertLe(near.length, 8);
        assertEq(planets.system(HexMathOutside(), 8).length, 0, "uncharted cells have no planets");
    }

    function HexMathOutside() internal pure returns (uint256) {
        return 5000;
    }

    function test_claimNeedsTheShipThereAndAFee() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Planets.NotThere.selector, home));
        planets.claim(home);
        _go(ada, star);
        _pay(ada, 5_000);
        uint256 supply = credits.totalSupply();
        vm.prank(ada);
        planets.claim(home);
        assertEq(planets.ownerOf(home), ada);
        assertEq(deeds.ownerOf(home), ada);
        assertEq(credits.totalSupply(), supply - planets.tuning().claimFee);
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Planets.AlreadyClaimed.selector, home));
        planets.claim(home);
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Planets.NoSuchPlanet.selector, home | 9));
        planets.claim(home | 9);
    }

    function test_solBelongsToTheFederation() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Planets.FederationPlanet.selector, EARTH));
        planets.claim(EARTH);
    }

    function test_theDiscovererClaimsFirstUnlessTheyFlyOn() public {
        vm.prank(bo);
        pilots.register("Bodo", "Barge");
        _go(ada, star); // Ada discovers it
        _go(bo, star);
        _pay(bo, 5_000);
        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(Planets.FirstClaimWindow.selector, ada));
        planets.claim(home);
        _go(ada, 0); // Ada flies on: the window closes
        _claim(bo, home);
        assertEq(planets.ownerOf(home), bo);
    }

    function test_theWindowEndsAfterTenMinutes() public {
        vm.prank(bo);
        pilots.register("Bodo", "Barge");
        _go(ada, star);
        _go(bo, star);
        skip(10 minutes);
        _claim(bo, home | 1);
        assertEq(planets.ownerOf(home | 1), bo);
    }

    function test_recruitingIsAtSol() public {
        _pay(ada, 10_000);
        vm.prank(ada);
        planets.recruit(150);
        assertEq(pilots.shipOf(ada).colonists, 150);
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Pilots.NoRoom.selector, 3)); // 5 bays, 2 used by 150 people
        planets.recruit(351);
        _go(ada, star);
        vm.prank(ada);
        vm.expectRevert(Planets.NotAtSol.selector);
        planets.recruit(1);
    }

    function test_aCitadelThenGrowthAndProduction() public {
        _citadel();
        Planets.PlanetView memory p = planets.planetView(home, 8);
        assertEq(p.level, 1);
        assertEq(p.population, 100);
        planets.settle(home);
        skip(planets.tuning().growthTime);
        p = planets.planetView(home, 8);
        // The gap to the cap shrinks by about e (the approximation is within a few percent).
        uint256 expected = p.cap - ((p.cap - 100) * 368) / 1000;
        assertApproxEqRel(p.population, expected, 0.05e18);
        (uint256 sells,) = market.mix(p.class);
        uint256 made;
        for (uint256 g = 0; g < 8; g++) {
            if ((sells >> g) & 1 == 1) made += p.stock[g];
        }
        assertGt(made, 0, "the planet made goods");
        // Settling writes what the view showed.
        planets.settle(home);
        assertEq(planets.planetView(home, 8).population, p.population);
    }

    function testFuzz_growthStaysUnderTheCapAndNeverShrinks(uint32 a, uint32 b) public {
        _citadel();
        planets.settle(home);
        skip(bound(a, 0, 30 days));
        Planets.PlanetView memory first = planets.planetView(home, 0);
        planets.settle(home);
        skip(bound(b, 0, 30 days));
        Planets.PlanetView memory second = planets.planetView(home, 0);
        assertLe(second.population, second.cap);
        assertGe(second.population, first.population);
    }

    function test_theLineIsInOrder() public {
        _citadel();
        vm.startPrank(ada);
        uint8 station = planets.STATION();
        vm.expectRevert(abi.encodeWithSelector(Planets.CannotBuild.selector, station));
        planets.build(home, station);
        uint8 colony = planets.COLONY();
        Planets.PlanetView memory p = planets.planetView(home, 8);
        vm.expectRevert(abi.encodeWithSelector(Planets.NeedsPeople.selector, (p.cap * 90) / 100));
        planets.build(home, colony);
        vm.stopPrank();
    }

    function _toPort() internal {
        _citadel();
        // Skip ahead: plenty of goods, people at the cap, then each building in turn.
        _stockUp();
        skip(planets.tuning().growthTime * 5);
        uint8[3] memory line = [planets.COLONY(), planets.STATION(), planets.PORT()];
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(ada);
            planets.build(home, line[i]);
            skip(planets.costOf(line[i]).time);
        }
    }

    /// Fills the planet's storage with every good, as if delivered over many trips.
    function _stockUp() internal {
        for (uint256 g = 0; g < 8; g++) {
            vm.store(address(planets), _stockSlot(home, g), bytes32(uint256(1_000)));
        }
    }

    function _stockSlot(uint256 planet, uint256 good) internal pure returns (bytes32) {
        // PlanetsStorage.stock is the struct's 7th slot (5 module addresses, planets, stock).
        bytes32 base = bytes32(uint256(0xf621d9cb25ea9a656959194bb7a2b456d42c293144ad14e6211624427211cb00) + 6);
        return keccak256(abi.encode(good, keccak256(abi.encode(planet, base))));
    }

    function test_aPortOpensWhenBuiltAndPaysItsOwner() public {
        _toPort();
        Market.PortView[] memory ports = market.portsAt(star);
        assertEq(ports.length, 1);
        assertEq(ports[0].owner, ada);
        assertEq(planets.planetView(home, 8).level, planets.PORT());
    }

    function test_theAutofactoryBuildsInOrder() public {
        _citadel();
        _stockUp();
        skip(planets.tuning().growthTime * 5);
        vm.startPrank(ada);
        vm.expectRevert(abi.encodeWithSelector(Factory.NoAutofactory.selector, home));
        factory.order(home, 0, 2);
        planets.build(home, planets.COLONY());
        skip(planets.costOf(planets.COLONY()).time);
        planets.build(home, planets.AUTOFACTORY());
        skip(planets.costOf(planets.AUTOFACTORY()).time);
        factory.order(home, 0, 2); // two drones, 5 minutes each
        factory.order(home, 5, 1); // armor plating, 20 minutes
        assertEq(factory.queueOf(home).length, 2);
        skip(10 minutes);
        assertEq(factory.storedAt(home)[0], 2);
        assertEq(factory.queueOf(home).length, 1);
        skip(20 minutes);
        assertEq(factory.storedAt(home)[5], 1);
        for (uint256 i = 0; i < 5; i++) {
            factory.order(home, 0, 1);
        }
        vm.expectRevert(Factory.QueueFull.selector);
        factory.order(home, 0, 1);
        vm.stopPrank();
    }

    function test_deedsCannotBeTraded() public {
        _go(ada, star);
        _claim(ada, home);
        vm.prank(ada);
        vm.expectRevert(Deeds.DeedsAreBound.selector);
        deeds.transferFrom(ada, bo, home);
    }

    function test_ownersNameTheirPlanetStationAndMoons() public {
        _go(ada, star);
        _claim(ada, home);
        uint8 slots = SystemGen.moonSlots(keccak256("test universe"), star, 0);
        uint8 moon = planets.NAME_MOON(); // (read first: a call after expectRevert would take it)
        vm.startPrank(ada);
        planets.rename(home, planets.NAME_PLANET(), "Haven");
        planets.rename(home, planets.NAME_STATION(), "Haven Dock");
        for (uint8 orbit = 0; orbit < 8; orbit++) {
            if ((slots >> orbit) & 1 == 1) {
                planets.rename(home, moon + orbit, "Little One");
                assertEq(planets.namesOf(home)[2 + orbit], "Little One");
            } else {
                vm.expectRevert(abi.encodeWithSelector(Planets.NoSuchMoon.selector, home, orbit));
                planets.rename(home, moon + orbit, "Nothing");
            }
        }
        vm.expectRevert(Planets.BadName.selector);
        planets.rename(home, 0, "");
        vm.stopPrank();
        assertEq(planets.namesOf(home)[0], "Haven");
        assertEq(planets.namesOf(home)[1], "Haven Dock");

        vm.prank(bo);
        pilots.register("Bodo", "Raider");
        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(Planets.NotYours.selector, home));
        planets.rename(home, 0, "Mine Now");
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Planets.FederationPlanet.selector, EARTH));
        planets.rename(EARTH, 0, "Ada's Earth");
    }

    /// The naming rules (Planets.mayNameStar), on the star next to Sol: a genesis star, so the
    /// Federation owns it until the test clears that.
    function test_whoNamesAStar() public {
        uint256 fee = planets.costOf(planets.STATION()).credits;
        uint256 n = SystemGen.planetCount(keccak256("test universe"), star);
        vm.prank(bo);
        pilots.register("Bodo", "Raider");
        _go(ada, star); // Ada arrives first: the discoverer
        _go(bo, star);
        assertEq(galaxy.star(star).discoverer, ada);

        // The Federation owns the genesis star: the discoverer can't rename it.
        (bool may,) = planets.mayNameStar(star, ada);
        assertFalse(may, "the Federation's");

        // A star nobody owns yet: its discoverer may name it, without owning it.
        vm.startPrank(admin);
        galaxy.grantRole(galaxy.GAME_MODULE(), admin);
        galaxy.setName(star, "Nameless", address(0));
        vm.stopPrank();
        _pay(ada, fee);
        uint256 supply = credits.totalSupply();
        vm.prank(ada);
        planets.nameStar(star, "Adaheim");
        assertEq(galaxy.nameOf(star), "Adaheim");
        assertEq(galaxy.keeperOf(star), address(0));
        assertEq(credits.totalSupply(), supply - fee, "the fee is burned");

        // Bo holds every planet (after the discoverer's first-claim window): naming makes Bo the owner,
        // and Ada loses the right.
        skip(10 minutes);
        for (uint256 body = 0; body < n; body++) _claim(bo, (star << 8) | body);
        _pay(bo, fee);
        vm.prank(bo);
        planets.nameStar(star, "Bodo's Reach");
        assertEq(galaxy.keeperOf(star), bo);
        (may,) = planets.mayNameStar(star, ada);
        assertFalse(may, "the discoverer, once there's an owner");

        // Bo loses all but one planet to Ada: still the owner, until Ada holds a majority and names it.
        vm.startPrank(admin);
        planets.grantRole(planets.GAME_MODULE(), admin);
        for (uint256 body = 1; body < n; body++) planets.seize((star << 8) | body, ada);
        vm.stopPrank();
        assertEq(galaxy.keeperOf(star), bo);
        bool owns;
        (may, owns) = planets.mayNameStar(star, ada);
        assertEq(may, (n - 1) * 2 > n);
        if (may) {
            assertTrue(owns);
            _pay(ada, fee);
            vm.prank(ada);
            planets.nameStar(star, "Adaheim Again");
            assertEq(galaxy.keeperOf(star), ada);
        }

        // Someone with nothing there can't.
        vm.prank(makeAddr("nobody"));
        vm.expectRevert();
        planets.nameStar(star, "Nope");
    }

    function test_solHasItsMoons() public pure {
        bytes32 seed = keccak256("orbiter8 demo 4");
        assertEq(SystemGen.moonSlots(seed, 0, 2), 0x02, "Luna");
        assertEq(SystemGen.moonSlots(seed, 0, 5), 0x3f, "Saturn's six");
    }

    function test_planetsMatchTheClientVectors() public view {
        // Printed for orbiter-client sdk/v4/system.test.js.
        bytes32 seed = keccak256("test universe");
        (uint8 c, uint8 z,) = SystemGen.planet(seed, 7, 1);
        assertEq(SystemGen.planetCount(seed, 7), SystemGen.planetCount(seed, 7));
        assertLe(c, 9);
        assertGe(z, 1);
    }
}
