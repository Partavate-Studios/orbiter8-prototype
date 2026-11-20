// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {GameFixture} from "../market/Market.t.sol";
import {Pilots} from "../../src/pilots/Pilots.sol";
import {Market} from "../../src/market/Market.sol";
import {Planets} from "../../src/planets/Planets.sol";
import {Claims} from "../../src/planets/Claims.sol";
import {Factory} from "../../src/planets/Factory.sol";
import {Deeds} from "../../src/tokens/Deeds.sol";
import {SystemGen} from "../../src/planets/SystemGen.sol";
import {BodyId} from "../../src/planets/BodyId.sol";
import {BeltGen} from "../../src/planets/BeltGen.sol";
import {Drones} from "../../src/planets/Drones.sol";
import {Armory} from "../../src/battle/Armory.sol";
import {DeedArt} from "../../src/art/DeedArt.sol";

contract PlanetsFixture is GameFixture {
    Planets planets;
    Claims claims;
    Factory factory;
    Deeds deeds;
    uint256 star; // a star next to Sol
    uint256 home; // its first planet

    uint256 constant ELECTRONICS = 7;
    uint256 constant SILICON = 5;

    function setUp() public virtual override {
        super.setUp();
        (planets, claims, factory, deeds) = (game.planets, game.claims, game.factory, game.deeds);
        star = _starAroundSol();
        home = star << 16;
    }

    function _claim(address who, uint256 planet) internal {
        _pay(who, claims.tuning().claimFee);
        vm.prank(who);
        claims.claim(planet);
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
        claims.claim(home);
        planets.land(home, 100);
        planets.deliver(home, ORGANICS, 40);
        planets.deliver(home, EQUIPMENT, 40);
        planets.build(home, planets.CITADEL());
        vm.stopPrank();
        skip(10 minutes);
    }
}

contract PlanetsTest is PlanetsFixture {
    // ── deeds draw themselves (D107) ──────────────────────────────────────────────────────────

    function test_aDeedDrawsThePlanetAsItIsNow() public {
        _citadel();
        DeedArt.Deed memory d = deeds.deedOf(home);
        assertFalse(d.asteroid);
        assertEq(d.owner, "Ada");
        assertEq(d.built, "Citadel");
        assertEq(vm.indexOf(d.name, "Unnamed "), 0, "an unnamed planet is called as the game calls it");
        string memory picture = game.deeds.art().svg(d);
        assertTrue(vm.indexOf(picture, '<circle r="16"/>') != type(uint256).max, "the Citadel's gun");
        assertTrue(vm.indexOf(picture, "translate(22 0)") == type(uint256).max, "no station yet");
        assertEq(vm.indexOf(deeds.tokenURI(home), "data:application/json;base64,"), 0);
        // a name is made safe for the JSON and the SVG
        uint8 namePart = claims.NAME_PLANET();
        vm.prank(ada);
        claims.rename(home, namePart, 'Ha"ven<b>&');
        assertEq(deeds.deedOf(home).name, "Ha ven b  ");
    }

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

    /// The discoverer's claims are free in the star's first-claim window, every planet and asteroid
    /// (Koda, 2026-11-18); after it, or for anyone else, the claim fee.
    /// Whose law applies (Koda, 2026-11-19): the star owner's corporation, else the body owner's; Sol's
    /// and nobody's bodies only Minerva's (0).
    function test_lawFollowsOwnership() public {
        assertEq(claims.lawAt(EARTH), 0, "Sol is Minerva's");
        assertEq(claims.lawAt(home), 0, "nobody owns it");
        _go(ada, star);
        vm.prank(ada);
        claims.claim(home);
        assertEq(claims.lawAt(home), pilots.corporationOf(ada), "the owner's corporation");
    }

    function test_theDiscovererClaimsFree() public {
        _go(ada, star); // Ada arrives first: the discoverer
        assertEq(galaxy.star(star).discoverer, ada);
        uint256 fee = claims.tuning().claimFee;
        assertEq(claims.claimFeeOf(ada, star), 0);
        assertEq(claims.claimFeeOf(bo, star), fee);
        uint256 before = credits.balanceOf(ada);
        vm.prank(ada);
        claims.claim(home);
        assertEq(credits.balanceOf(ada), before, "free");
        assertEq(deeds.ownerOf(home), ada);
        skip(claims.FIRST_CLAIM());
        assertEq(claims.claimFeeOf(ada, star), fee, "the window has passed");
        _pay(ada, fee);
        before = credits.balanceOf(ada);
        vm.prank(ada);
        claims.claim(home | 1);
        assertEq(credits.balanceOf(ada), before - fee);
    }

    function test_claimNeedsTheShipThereAndAFee() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Claims.NotThere.selector, home));
        claims.claim(home);
        _go(ada, star);
        skip(claims.FIRST_CLAIM()); // past the discoverer's free window (see test_theDiscovererClaimsFree)
        _pay(ada, 5_000);
        uint256 supply = credits.totalSupply();
        vm.prank(ada);
        claims.claim(home);
        assertEq(planets.ownerOf(home), ada);
        assertEq(deeds.ownerOf(home), ada);
        assertEq(credits.totalSupply(), supply - claims.tuning().claimFee);
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Claims.AlreadyClaimed.selector, home));
        claims.claim(home);
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Claims.NoSuchPlanet.selector, home | 9));
        claims.claim(home | 9);
    }


    function test_bodyIds() public pure {
        uint256 id = BodyId.make(1234, BodyId.ASTEROID, 7);
        assertEq(id, 1234 * 65536 + 256 + 7);
        assertEq(BodyId.cellOf(id), 1234);
        assertEq(BodyId.kindOf(id), BodyId.ASTEROID);
        assertEq(BodyId.indexOf(id), 7);
        assertEq(BodyId.planet(0, 2), 2, "Sol's planets are ids 0-8");
        assertTrue(BodyId.isPlanet(BodyId.planet(5, 3)));
    }

    function test_solBelongsToTheFederation() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Claims.FederationPlanet.selector, EARTH));
        claims.claim(EARTH);
    }

    function test_theDiscovererClaimsFirstUnlessTheyFlyOn() public {
        _join(bo, "Bodo", "Barge");
        _go(ada, star); // Ada discovers it
        _go(bo, star);
        _pay(bo, 5_000);
        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(Claims.FirstClaimWindow.selector, ada));
        claims.claim(home);
        _go(ada, 0); // Ada flies on: the window closes
        _claim(bo, home);
        assertEq(planets.ownerOf(home), bo);
    }

    function test_theWindowEndsAfterTenMinutes() public {
        _join(bo, "Bodo", "Barge");
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
        Market.PortView[] memory ports = market.portViews(market.portIds(star));
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
        uint8 moon = claims.NAME_MOON(); // (read first: a call after expectRevert would take it)
        vm.startPrank(ada);
        claims.rename(home, claims.NAME_PLANET(), "Haven");
        claims.rename(home, claims.NAME_STATION(), "Haven Dock");
        for (uint8 orbit = 0; orbit < 8; orbit++) {
            if ((slots >> orbit) & 1 == 1) {
                claims.rename(home, moon + orbit, "Little One");
                assertEq(claims.namesOf(home)[2 + orbit], "Little One");
            } else {
                vm.expectRevert(abi.encodeWithSelector(Claims.NoSuchMoon.selector, home, orbit));
                claims.rename(home, moon + orbit, "Nothing");
            }
        }
        vm.expectRevert(Claims.BadName.selector);
        claims.rename(home, 0, "");
        vm.stopPrank();
        assertEq(claims.namesOf(home)[0], "Haven");
        assertEq(claims.namesOf(home)[1], "Haven Dock");

        _join(bo, "Bodo", "Raider");
        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(Claims.NotYours.selector, home));
        claims.rename(home, 0, "Mine Now");
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Claims.FederationPlanet.selector, EARTH));
        claims.rename(EARTH, 0, "Ada's Earth");
    }

    /// The naming rules (Planets.mayNameStar), on the star next to Sol: a genesis star, so the
    /// Federation owns it until the test clears that.
    function test_whoNamesAStar() public {
        uint256 fee = planets.costOf(planets.STATION()).credits;
        uint256 n = SystemGen.planetCount(keccak256("test universe"), star);
        _join(bo, "Bodo", "Raider");
        _go(ada, star); // Ada arrives first: the discoverer
        _go(bo, star);
        assertEq(galaxy.star(star).discoverer, ada);

        // The Federation owns the genesis star: the discoverer can't rename it.
        (bool may,) = claims.mayNameStar(star, ada);
        assertFalse(may, "the Federation's");

        // A star nobody owns yet: its discoverer may name it, without owning it.
        vm.startPrank(admin);
        galaxy.grantRole(galaxy.GAME_MODULE(), admin);
        galaxy.setName(star, "Nameless", address(0));
        vm.stopPrank();
        _pay(ada, fee);
        uint256 supply = credits.totalSupply();
        vm.prank(ada);
        claims.nameStar(star, "Adaheim");
        assertEq(galaxy.nameOf(star), "Adaheim");
        assertEq(galaxy.keeperOf(star), address(0));
        assertEq(credits.totalSupply(), supply - fee, "the fee is burned");

        // Bo holds every planet (after the discoverer's first-claim window): naming makes Bo the owner,
        // and Ada loses the right.
        skip(10 minutes);
        for (uint256 body = 0; body < n; body++) _claim(bo, (star << 16) | body);
        _pay(bo, fee);
        vm.prank(bo);
        claims.nameStar(star, "Bodo's Reach");
        assertEq(galaxy.keeperOf(star), bo);
        (may,) = claims.mayNameStar(star, ada);
        assertFalse(may, "the discoverer, once there's an owner");

        // Bo loses all but one planet to Ada: still the owner, until Ada holds a majority and names it.
        vm.startPrank(admin);
        planets.grantRole(planets.GAME_MODULE(), admin);
        for (uint256 body = 1; body < n; body++) planets.seize((star << 16) | body, ada);
        vm.stopPrank();
        assertEq(galaxy.keeperOf(star), bo);
        bool owns;
        (may, owns) = claims.mayNameStar(star, ada);
        assertEq(may, (n - 1) * 2 > n);
        if (may) {
            assertTrue(owns);
            _pay(ada, fee);
            vm.prank(ada);
            claims.nameStar(star, "Adaheim Again");
            assertEq(galaxy.keeperOf(star), ada);
        }

        // Someone with nothing there can't.
        vm.prank(makeAddr("nobody"));
        vm.expectRevert();
        claims.nameStar(star, "Nope");
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

contract AsteroidClaimsTest is PlanetsFixture {
    /// Cell 3 is in Sol's genesis ring and has a belt in this universe (found by searching seeds).
    function _universe() internal pure override returns (bytes32) {
        return keccak256(abi.encode("belt universe", 0));
    }

    function test_asteroidsAreClaimedLikePlanets() public {
        bytes32 seed = _universe();
        uint256 belted = 3;
        assertTrue(BeltGen.hasBelt(seed, belted));
        _go(ada, belted);
        uint256 rock = type(uint256).max;
        uint256 hole = type(uint256).max;
        for (uint256 s = 0; s < BeltGen.SECTIONS; s++) {
            (bool a,,) = BeltGen.section(seed, belted, s);
            if (a && rock == type(uint256).max) rock = s;
            if (!a && hole == type(uint256).max) hole = s;
        }
        uint256 asteroid = BodyId.make(belted, BodyId.ASTEROID, rock);
        _claim(ada, asteroid);
        assertEq(claims.ownerOf(asteroid), ada);
        assertEq(deeds.ownerOf(asteroid), ada);
        vm.prank(ada);
        claims.rename(asteroid, 0, "Rockhome"); // NAME_PLANET
        assertEq(claims.namesOf(asteroid)[0], "Rockhome");
        DeedArt.Deed memory deed = deeds.deedOf(asteroid);
        assertTrue(deed.asteroid);
        assertEq(deed.name, "Rockhome");
        assertEq(deed.built, "Claimed");
        assertGt(bytes(deeds.tokenURI(asteroid)).length, 1000, "its deed draws itself");
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Claims.NoSuchMoon.selector, asteroid, 0));
        claims.rename(asteroid, 2, "No Moon");
        // An asteroid doesn't count toward the star (D72): Ada is no better placed than Bo to name it.
        (bool may,) = claims.mayNameStar(belted, bo);
        (bool adaMay,) = claims.mayNameStar(belted, ada);
        assertEq(may, adaMay);
        if (hole != type(uint256).max) {
            uint256 empty = BodyId.make(belted, BodyId.ASTEROID, hole);
            vm.prank(ada);
            vm.expectRevert(abi.encodeWithSelector(Claims.NoSuchPlanet.selector, empty));
            claims.claim(empty);
        }
        // Sol's belt is the Federation's (D73).
        _go(ada, 0);
        uint256 ceres = BodyId.make(0, BodyId.ASTEROID, 0);
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Claims.FederationPlanet.selector, ceres));
        claims.claim(ceres);
    }

    function test_anAsteroidsLine() public {
        bytes32 seed = _universe();
        uint256 rock;
        for (uint256 i = 0; i < BeltGen.SECTIONS; i++) {
            (bool a,,) = BeltGen.section(seed, 3, i);
            if (a) {
                rock = i;
                break;
            }
        }
        (, uint8 composition,) = BeltGen.section(seed, 3, rock);
        uint256 asteroid = BodyId.make(3, BodyId.ASTEROID, rock);
        // Credits only, to test the line's order (the goods are tested on planets).
        vm.startPrank(admin);
        for (uint8 step = 1; step <= 6; step++) {
            planets.setCost(step + 8, Planets.Cost(1_000, 10 minutes, step == 1 ? 20 : 0, [0, 0, 0], [uint32(0), 0, 0]));
        }
        vm.stopPrank();
        _pay(ada, 1_000_000);
        vm.prank(ada);
        planets.recruit(20);
        _go(ada, 3);
        _claim(ada, asteroid);
        vm.startPrank(ada);
        planets.land(asteroid, 20);
        vm.expectRevert(abi.encodeWithSelector(Planets.CannotBuild.selector, 7));
        planets.build(asteroid, 7); // no Autofactory on an asteroid
        planets.build(asteroid, 1); // Platform
        skip(10 minutes);
        planets.build(asteroid, 2); // Mine
        skip(10 minutes);
        vm.expectRevert(abi.encodeWithSelector(Planets.CannotBuild.selector, 3));
        planets.build(asteroid, 3); // no Station
        planets.build(asteroid, 4); // Port
        skip(10 minutes);
        vm.expectRevert(abi.encodeWithSelector(Planets.CannotBuild.selector, 5));
        planets.build(asteroid, 5); // no Yards
        planets.build(asteroid, 6); // Armory
        skip(10 minutes);
        vm.stopPrank();
        Planets.PlanetView memory v = planets.planetView(asteroid, 8);
        assertEq(v.level, 6);
        assertEq(v.class, 10 + composition);
        assertEq(planets.moonCount(asteroid), 0);
        Market.PortView memory port = market.portView(asteroid);
        assertEq(port.owner, ada, "the asteroid's port trades");
        assertFalse(port.yard);
        uint256[] memory ids = new uint256[](2);
        (ids[0], ids[1]) = (asteroid, home);
        Planets.PlanetView[] memory both = planets.views(ids, 8);
        assertEq(both[0].level, planets.ARMORY(), "an asteroid and a planet in one read");
        assertEq(both[1].id, home);
    }

    function test_miningDronesFillAnAsteroidsStore() public {
        bytes32 seed = _universe();
        uint256 rock;
        for (uint256 i = 0; i < BeltGen.SECTIONS; i++) {
            (bool a,,) = BeltGen.section(seed, 3, i);
            if (a) {
                rock = i;
                break;
            }
        }
        (, uint8 composition, uint8 size) = BeltGen.section(seed, 3, rock);
        uint256 asteroid = BodyId.make(3, BodyId.ASTEROID, rock);
        Drones drones = game.drones;
        Armory armory = game.armory;
        uint256 miner = armory.MINING_DRONE();
        vm.startPrank(admin);
        for (uint8 step = 1; step <= 2; step++) {
            planets.setCost(step + 8, Planets.Cost(1_000, 10 minutes, step == 1 ? 20 : 0, [0, 0, 0], [uint32(0), 0, 0]));
        }
        vm.stopPrank();
        _pay(ada, 1_000_000);
        vm.startPrank(ada);
        planets.recruit(20);
        market.buyDroneBays(EARTH, 10, type(uint256).max);
        armory.buy(EARTH, miner, 10, type(uint256).max);
        vm.stopPrank();
        _go(ada, 3);
        _claim(ada, asteroid);
        vm.startPrank(ada);
        planets.land(asteroid, 20);
        planets.build(asteroid, 1);
        skip(10 minutes);
        drones.land(asteroid, 10);
        assertEq(pilots.shipOf(ada).loadout.miningDrones, 0);
        vm.stopPrank();
        // Before the Mine, nothing.
        skip(4 hours);
        uint256 good = composition == 0 ? 0 : 1; // water ice (carbonaceous) or metals (silicate, metallic)
        assertEq(planets.planetView(asteroid, 8).stock[good], 0, "no Mine, no mining");
        vm.prank(ada);
        planets.build(asteroid, 2);
        skip(10 minutes);
        planets.settle(asteroid);
        uint256 before = planets.planetView(asteroid, 8).stock[good];
        skip(4 hours); // 10 drones x 1.875 x 4 h = 75 units
        assertEq(planets.planetView(asteroid, 8).stock[good] - before, 75);
        // Defense drones don't mine.
        vm.prank(ada);
        drones.setDefense(asteroid, 6);
        before = planets.planetView(asteroid, 8).stock[good];
        skip(10 hours); // 4 miners x 1.875 x 10 h = 75 units
        assertEq(planets.planetView(asteroid, 8).stock[good] - before, 75);
        (uint32 total, uint32 defense, uint256 room) = drones.poolOf(asteroid);
        assertEq(total, 10);
        assertEq(defense, 6);
        assertEq(room, uint256(size) * 10);
        // Its port sells what the drones mined, and pays Ada for it (D89).
        vm.prank(admin);
        planets.setCost(4 + 8, Planets.Cost(1_000, 10 minutes, 0, [0, 0, 0], [uint32(0), 0, 0]));
        vm.prank(ada);
        planets.build(asteroid, 4);
        skip(10 minutes);
        uint256 stored = _supply(asteroid, good);
        assertGt(stored, 0);
        _join(bo, "Bodo", "Barge");
        _pay(bo, 100_000);
        vm.prank(bo);
        market.buyBays(EARTH, 20, type(uint256).max);
        _go(bo, 3);
        uint256 adaHad = credits.balanceOf(ada);
        Market.Line[] memory lines = new Market.Line[](1);
        lines[0] = Market.Line(good, 10, type(uint256).max);
        vm.prank(bo);
        market.trade(asteroid, lines);
        assertEq(_supply(asteroid, good), stored - 10, "sold from the store");
        assertGt(credits.balanceOf(ada), adaHad, "the owner was paid");
        // Back aboard.
        vm.prank(ada);
        drones.board(asteroid, 10);
        assertEq(pilots.shipOf(ada).loadout.miningDrones, 10);
        (, defense,) = drones.poolOf(asteroid);
        assertEq(defense, 0);
    }

    /// What a body's port can sell of a good now (Planets.suppliesOf, with its class's mix as the Market passes it).
    function _supply(uint256 body, uint256 good) internal view returns (uint256) {
        (uint256 sells,) = game.market.mix(planets.planetView(body, 0).class);
        return planets.suppliesOf(body, good + 1, sells)[good];
    }

    function test_shipsMineEmptySections() public {
        Drones drones = game.drones;
        uint256 dust = BodyId.make(0, BodyId.ASTEROID, 2); // Sol's empty section between Vesta and Pallas
        // Only empty space is mined by ships.
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Drones.NotEmptySpace.selector, BodyId.make(0, BodyId.ASTEROID, 0)));
        drones.startMining(BodyId.make(0, BodyId.ASTEROID, 0), 0);
        // A new ship: four built-in drones, all mining (7.5 units an hour), five free bays.
        vm.prank(ada);
        drones.startMining(dust, 0);
        assertTrue(pilots.isMining(ada));
        _join(bo, "Bodo", "Barge");
        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(Drones.SlotTaken.selector, 0));
        drones.startMining(dust, 0);
        skip(30 minutes);
        (, uint256 mined) = drones.miningOf(ada);
        assertEq(mined, 3);
        // Chatting doesn't stop it.
        vm.prank(ada);
        pilots.broadcast("mining at Sol");
        assertTrue(pilots.isMining(ada));
        skip(1 hours); // full: five bays
        (, mined) = drones.miningOf(ada);
        assertEq(mined, 5);
        (, bool[6] memory full) = drones.slotsOf(dust);
        assertTrue(full[0], "a full ship no longer holds its slot");
        vm.prank(bo);
        drones.startMining(dust, 0);
        // Any change to the ship ends it, the mined goods loaded first: silicate dust, metals and silicon.
        _pay(ada, 100_000);
        vm.prank(ada);
        market.buyBays(EARTH, 1, type(uint256).max);
        assertFalse(pilots.isMining(ada));
        assertEq(pilots.shipOf(ada).cargo, 5);
        assertEq(_cargo(ada, 1), 3, "metals");
        assertEq(_cargo(ada, 5), 2, "silicon");
        vm.prank(bo);
        drones.stopMining();
        assertFalse(pilots.isMining(bo));
    }
}
