// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test} from "forge-std/Test.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {Deployment} from "../../script/Deploy.s.sol";
import {Galaxy} from "../../src/galaxy/Galaxy.sol";
import {Pilots} from "../../src/pilots/Pilots.sol";
import {Market} from "../../src/market/Market.sol";
import {Armory} from "../../src/battle/Armory.sol";
import {Pricing} from "../../src/market/Pricing.sol";
import {Credits} from "../../src/tokens/Credits.sol";
import {Ships} from "../../src/tokens/Ships.sol";
import {HexMath} from "../../src/galaxy/HexMath.sol";
import {BodyId} from "../../src/planets/BodyId.sol";
import {Battle} from "../../src/battle/Battle.sol";

contract GameFixture is Test {
    Deployment.Game game;
    Galaxy galaxy;
    Pilots pilots;
    Market market;
    Credits credits;
    Ships ships;
    address admin = makeAddr("admin");
    address ada = makeAddr("ada");
    address bo = makeAddr("bo");

    // Goods, by id (D27).
    uint256 constant WATER = 0;
    uint256 constant METALS = 1;
    uint256 constant ORGANICS = 4;
    uint256 constant EQUIPMENT = 6;
    // Sol's ports, by body.
    uint256 constant MERCURY = 0; // Rocky: sells metals, silicon; buys water, He-3, organics
    uint256 constant EARTH = 2; // Terrestrial, with the yard: sells organics, equipment, electronics

    function setUp() public virtual {
        vm.warp(1_800_000_000);
        vm.startPrank(admin);
        game = Deployment.deploy(admin, _universe(), 30);
        Deployment.wire(game);
        Deployment.wireDeeds(game);
        Deployment.wireJoining(game);
        // The tests pay pilots directly.
        game.credits.grantRole(game.credits.GAME_MODULE(), admin);
        game.market.grantRole(game.market.GAME_MODULE(), admin);
        vm.stopPrank();
        (galaxy, pilots, market, credits, ships) = (game.galaxy, game.pilots, game.market, game.credits, game.ships);
        _plainStart();
        _join(ada, "Ada", "Ledger");
    }

    /// Joins the game as the intro does (Koda, 2026-11-19): register the call sign, then accept the job
    /// with a named ship (corporation 1).
    function _join(address who, string memory callsign, string memory shipName) internal {
        vm.startPrank(who);
        pilots.register(callsign);
        pilots.acceptJob(1, shipName);
        vm.stopPrank();
    }

    /// The old start (1,000 credits, no debt, an empty hold), so these tests keep their arithmetic; the
    /// story's starter kit has its own tests.
    function _plainStart() internal {
        vm.prank(admin);
        pilots.setStarterKit(Pilots.StarterKit(1_000, 0, new uint8[](0), new uint16[](0)));
    }

    function _pay(address who, uint256 amount) internal {
        vm.prank(admin);
        credits.mint(who, amount);
    }

    function _line(uint256 good, int256 units, uint256 limit) internal pure returns (Market.Line[] memory lines) {
        lines = new Market.Line[](1);
        lines[0] = Market.Line(good, units, limit);
    }

    function _cargo(address who, uint256 good) internal view returns (uint256) {
        return pilots.cargoOf(who, good + 1)[good];
    }

    /// The universe's seed; a test that needs a particular galaxy overrides it.
    function _universe() internal pure virtual returns (bytes32) {
        return keccak256("test universe");
    }

    function _starAroundSol() internal view returns (uint256) {
        uint256[6] memory around = HexMath.neighbors(0);
        for (uint256 i = 0; i < 6; i++) if (galaxy.stateOf(around[i]) == galaxy.STAR()) return around[i];
        revert("no star next to Sol");
    }
}

contract MarketTest is GameFixture {
    /// Debt is kept beside the balance, which can't go negative; what the game pays clears it first.
    function test_incomePaysDebtFirst() public {
        vm.prank(admin);
        credits.addDebt(bo, 45);
        _pay(bo, 30);
        assertEq(credits.balanceOf(bo), 0);
        assertEq(credits.debtOf(bo), 15);
        _pay(bo, 100);
        assertEq(credits.balanceOf(bo), 85);
        assertEq(credits.debtOf(bo), 0);
    }

    function test_onlyTheAdminCheats() public {
        vm.prank(admin);
        credits.cheat(ada, 10_000_000);
        assertEq(credits.balanceOf(ada), 10_000_000 + 1_000, "a new pilot's 1,000 and the cheat");
        vm.prank(ada);
        vm.expectRevert();
        credits.cheat(ada, 1);
    }

    function test_solHasFifteenPortsAndEveryGoodTrades() public view {
        Market.PortView[] memory ports = market.portViews(market.portIds(0));
        assertEq(ports.length, 15, "nine planets' stations and six asteroids'");
        uint256 sold;
        uint256 bought;
        for (uint256 i = 0; i < ports.length; i++) {
            for (uint256 g = 0; g < ports[i].quotes.length; g++) {
                if (ports[i].quotes[g].mode == Market.Mode.Sells) sold |= 1 << g;
                if (ports[i].quotes[g].mode == Market.Mode.Buys) bought |= 1 << g;
            }
        }
        assertEq(sold, 0xff, "every good is sold at Sol");
        assertEq(bought, 0xff, "every good is bought at Sol");
        assertTrue(ports[EARTH].yard);
        assertEq(market.portViews(market.portIds(_starAroundSol())).length, 0);
    }

    function test_startingCreditsBaysAndShip() public view {
        assertEq(credits.balanceOf(ada), 1_000);
        assertEq(pilots.shipOf(ada).bays, 5);
        assertEq(ships.ownerOf(1), ada);
        assertEq(credits.decimals(), 0);
    }

    function test_buyThenSellAcrossSol() public {
        Market.Good[] memory goods = market.goods();
        Market.Tuning memory t = market.tuning();
        uint256 cap = market.capacity();
        uint256 cost = Pricing.buyCost(goods[ORGANICS].base, goods[ORGANICS].spread, cap, 0, 5);
        uint256 cut = Pricing.fee(cost, t.feeBps);
        cost += cut;
        uint256 supply = credits.totalSupply();
        uint256 treasury = credits.balanceOf(admin);
        assertEq(market.treasury(), admin, "the deployer is the treasury to start");

        vm.prank(ada);
        market.trade(EARTH, _line(ORGANICS, 5, cost));
        assertEq(credits.balanceOf(ada), 1_000 - cost);
        assertEq(credits.totalSupply(), supply - cost + cut, "the Federation burns what it's paid, less its fee");
        assertEq(credits.balanceOf(admin), treasury + cut, "the fee goes to the treasury");
        assertEq(_cargo(ada, ORGANICS), 5);
        assertEq(pilots.shipOf(ada).cargo, 5);
        assertEq(market.portView(EARTH).quotes[ORGANICS].shortfall, 5);

        uint256 proceeds = Pricing.sellProceeds(goods[ORGANICS].base, goods[ORGANICS].spread, cap, 0, 5);
        uint256 sellCut = Pricing.fee(proceeds, t.feeBps);
        proceeds -= sellCut;
        vm.prank(ada);
        market.trade(MERCURY, _line(ORGANICS, -5, proceeds));
        assertEq(credits.balanceOf(ada), 1_000 - cost + proceeds);
        assertEq(credits.balanceOf(admin), treasury + cut + sellCut, "selling's fee is minted to the treasury");
        assertGt(proceeds, cost, "a full port to a needy one pays");
        assertEq(_cargo(ada, ORGANICS), 0);
    }

    function test_theTreasuryIsTheAdminsToSet() public {
        address bank = makeAddr("bank");
        vm.expectRevert();
        vm.prank(ada);
        market.setTreasury(bank);
        vm.startPrank(admin);
        vm.expectRevert(Market.NoTreasury.selector);
        market.setTreasury(address(0));
        market.setTreasury(bank);
        vm.stopPrank();
        assertEq(market.treasury(), bank);
    }

    function test_everySolStationHasAYard() public view {
        for (uint256 body; body < 9; body++) assertTrue(market.portView(body).yard);
    }

    /// Sol is fully built: a Federation station on each of its belt's asteroids (Ceres, Vesta, Pallas,
    /// Hygiea, Psyche, Juno), trading by composition, with a yard and an armory; its empty sections
    /// have none.
    function test_solsAsteroidsAreFederationStations() public {
        uint8[8] memory classes = [10, 11, 0, 11, 10, 12, 0, 11];
        Market.PortView[] memory ports = market.portViews(market.portIds(0));
        for (uint256 i; i < 8; i++) {
            uint256 id = BodyId.make(0, BodyId.ASTEROID, i);
            if (classes[i] == 0) {
                vm.expectRevert(abi.encodeWithSelector(Market.NoSuchPort.selector, id));
                market.portView(id);
                continue;
            }
            Market.PortView memory v = market.portView(id);
            assertEq(v.class, classes[i]);
            assertTrue(v.yard);
            assertEq(v.owner, address(0), "the Federation's");
            bool listed;
            for (uint256 k; k < ports.length; k++) listed = listed || ports[k].port == id;
            assertTrue(listed, "portIds(0) lists it");
        }
        // Not a station: another star's belt, a section past the eighth.
        assertFalse(_isPort(BodyId.make(0, BodyId.ASTEROID, 8)));
        assertFalse(_isPort(BodyId.make(_starAroundSol(), BodyId.ASTEROID, 0)));
    }

    function _isPort(uint256 id) internal view returns (bool) {
        try market.portView(id) returns (Market.PortView memory) {
            return true;
        } catch {
            return false;
        }
    }

    function test_solsAsteroidStationsTradeOutfitAndRepair() public {
        uint256 ceres = BodyId.make(0, BodyId.ASTEROID, 0); // carbonaceous: sells water and organics
        uint256 psyche = BodyId.make(0, BodyId.ASTEROID, 5); // metallic: buys water
        _pay(ada, 10_000_000);
        uint256 treasury = credits.balanceOf(admin);
        vm.startPrank(ada);
        market.trade(ceres, _line(WATER, 5, type(uint256).max));
        assertEq(_cargo(ada, WATER), 5);
        assertGt(credits.balanceOf(admin), treasury, "its fee goes to the treasury");
        assertEq(market.portView(ceres).quotes[WATER].shortfall, 5);
        market.trade(psyche, _line(WATER, -5, 0));
        assertEq(_cargo(ada, WATER), 0);
        // The yard: bays, drone bays and range.
        market.buyBays(psyche, 2, type(uint256).max);
        market.buyDroneBays(psyche, 1, type(uint256).max);
        market.buyRange(ceres, type(uint256).max);
        assertEq(pilots.shipOf(ada).bays, 7);
        assertEq(pilots.shipOf(ada).range, 2);
        // The armory, at the Federation's price (twice the part's cost, burned).
        Armory armory = game.armory;
        uint256 supply = credits.totalSupply();
        uint256 price = game.factory.parts()[0].credits * 2;
        armory.buy(psyche, 0, 1, price);
        assertEq(pilots.shipOf(ada).loadout.drones, 1);
        assertEq(credits.totalSupply(), supply - price);
        // Repairs at its yard.
        armory.repair(ceres);
        assertGt(game.repairs.conditionOf(ada).dockedUntil, block.timestamp);
        vm.stopPrank();
        // Nobody besieges it, or claims it.
        vm.prank(ada);
        vm.expectRevert(Battle.FederationPlanet.selector);
        game.battle.attack(ceres);
    }

    function test_theShipMustBeAtThePort() public {
        uint256 away = _starAroundSol();
        vm.prank(ada);
        pilots.jump(away, new Pilots.ScanProof[](0));
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Market.NotAtPort.selector, EARTH));
        market.trade(EARTH, _line(ORGANICS, 1, 1_000));
    }

    function test_priceLimitsHold() public {
        uint256 price = market.portView(EARTH).quotes[ORGANICS].price;
        vm.prank(ada);
        vm.expectPartialRevert(Market.PriceLimit.selector);
        market.trade(EARTH, _line(ORGANICS, 1, price - 1));
    }

    function test_onlyWhatThePortTrades() public {
        vm.startPrank(ada);
        vm.expectRevert(abi.encodeWithSelector(Market.NotTraded.selector, METALS));
        market.trade(EARTH, _line(METALS, 1, 1_000)); // Earth buys metals; it doesn't sell them
        vm.expectRevert(abi.encodeWithSelector(Market.NotTraded.selector, ORGANICS));
        market.trade(EARTH, _line(ORGANICS, -1, 0)); // and it sells organics
        vm.expectRevert(abi.encodeWithSelector(Market.NotTraded.selector, 99));
        market.trade(EARTH, _line(99, 1, 1_000));
        vm.expectRevert(abi.encodeWithSelector(Market.NoSuchPort.selector, 12));
        market.trade(12, _line(ORGANICS, 1, 1_000));
        vm.stopPrank();
    }

    function test_cargoMustFitAndCreditsCover() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Pilots.NoRoom.selector, 5));
        market.trade(EARTH, _line(ORGANICS, 6, 10_000));
        vm.prank(ada);
        vm.expectPartialRevert(IERC20Errors.ERC20InsufficientBalance.selector);
        market.trade(EARTH, _line(7, 5, 10_000)); // five electronics: over 1,000 credits
    }

    function test_aPurchaseMaySpendTheExactBalance() public {
        Market.Good memory g = market.goods()[ORGANICS];
        Market.Tuning memory t = market.tuning();
        uint256 cost = Pricing.buyCost(g.base, g.spread, market.capacity(), 0, 3);
        cost += Pricing.fee(cost, t.feeBps);
        vm.prank(ada);
        credits.transfer(bo, 1_000 - cost);
        vm.prank(ada);
        market.trade(EARTH, _line(ORGANICS, 3, cost));
        assertEq(credits.balanceOf(ada), 0);
    }

    function test_portsRestockOverTime() public {
        _pay(ada, 100_000);
        vm.startPrank(ada);
        market.buyBays(EARTH, 100, type(uint256).max);
        market.trade(EARTH, _line(ORGANICS, 100, type(uint256).max));
        vm.stopPrank();
        Market.Tuning memory t = market.tuning();
        skip(t.refill / 4); // a quarter of the capacity regrows in a quarter of the refill
        assertEq(market.portView(EARTH).quotes[ORGANICS].shortfall, 100 - market.capacity() / 4);
        skip(t.refill);
        assertEq(market.portView(EARTH).quotes[ORGANICS].shortfall, 0);
    }

    function test_aPortRunsOut() public {
        _pay(ada, 10_000_000);
        vm.startPrank(ada);
        market.buyBays(EARTH, 245, type(uint256).max);
        market.trade(EARTH, _line(ORGANICS, 250, type(uint256).max));
        market.trade(MERCURY, _line(ORGANICS, -250, 0));
        market.trade(EARTH, _line(ORGANICS, int256(market.capacity()) - 250, type(uint256).max));
        vm.expectRevert(abi.encodeWithSelector(Market.PortFull.selector, ORGANICS, 0));
        market.trade(EARTH, _line(ORGANICS, 1, type(uint256).max));
        vm.stopPrank();
    }

    function test_dronesLiveInDroneBays() public {
        _pay(ada, 10_000_000);
        Armory armory = game.armory;
        vm.startPrank(ada);
        // No drone bays: no room for a drone, though the cargo bays are empty.
        vm.expectRevert(abi.encodeWithSelector(Pilots.NoDroneRoom.selector, 0));
        armory.buy(EARTH, 0, 1, type(uint256).max);
        // Drone bays cost what cargo bays do, counting every bay the ship has.
        uint256 quote = market.baysQuote(5, 3);
        market.buyDroneBays(EARTH, 3, quote);
        assertEq(pilots.shipOf(ada).droneBays, 3);
        assertEq(pilots.shipOf(ada).bays, 5, "cargo bays unchanged");
        armory.buy(EARTH, 0, 3, type(uint256).max);
        assertEq(pilots.shipOf(ada).loadout.drones, 3);
        vm.expectRevert(abi.encodeWithSelector(Pilots.NoDroneRoom.selector, 3));
        armory.buy(EARTH, 0, 1, type(uint256).max);
        // Mining drones share the drone bays.
        uint256 miner = armory.MINING_DRONE();
        vm.expectRevert(abi.encodeWithSelector(Pilots.NoDroneRoom.selector, 3));
        armory.buy(EARTH, miner, 1, type(uint256).max);
        market.buyDroneBays(EARTH, 1, type(uint256).max);
        armory.buy(EARTH, miner, 1, type(uint256).max);
        assertEq(pilots.shipOf(ada).loadout.miningDrones, 1);
        // Drones take no cargo bays: all five still hold cargo.
        market.trade(EARTH, _line(ORGANICS, 5, type(uint256).max));
        // The 250 cap counts both kinds.
        market.buyBays(EARTH, 241, type(uint256).max);
        vm.expectRevert(abi.encodeWithSelector(Pilots.TooManyBays.selector, 250));
        market.buyDroneBays(EARTH, 1, type(uint256).max);
        vm.stopPrank();
    }

    function test_theYardSellsBaysAndRange() public {
        _pay(ada, 1_000_000);
        uint256 quote = market.baysQuote(5, 10);
        vm.startPrank(ada);
        vm.expectPartialRevert(Market.PriceLimit.selector);
        market.buyBays(EARTH, 10, quote - 1);
        market.buyBays(EARTH, 10, quote);
        assertEq(pilots.shipOf(ada).bays, 15);
        vm.expectRevert(abi.encodeWithSelector(Pilots.TooManyBays.selector, 250));
        market.buyBays(EARTH, 236, type(uint256).max);

        uint256 price = market.tuning().rangePrices[0];
        market.buyRange(EARTH, price);
        assertEq(pilots.shipOf(ada).range, 2);
        vm.expectPartialRevert(Market.PriceLimit.selector);
        market.buyRange(EARTH, price);
        vm.stopPrank();
    }

    function test_anOwnedPortSellsFromItsStorageAndPaysItsOwner() public {
        uint256 port = 10; // Sol, body 10: not a Federation station, so opened as a player's port
        vm.prank(admin);
        market.openPort(port, 0, bo, uint40(block.timestamp), 0); // Terrestrial
        // Its body's storage (Planets) holds 4 units of organics, then 300 (a full port's worth).
        address store = address(game.planets);
        vm.mockCall(store, abi.encodeWithSignature("suppliesOf(uint256,uint256,uint256)", port, ORGANICS + 1, 0xD0), abi.encode(_supplies(4)));
        vm.mockCall(store, abi.encodeWithSignature("useStock(uint256,uint256,uint256)"), "");
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Market.PortFull.selector, ORGANICS, 4));
        market.trade(port, _line(ORGANICS, 5, type(uint256).max));
        vm.mockCall(store, abi.encodeWithSignature("suppliesOf(uint256,uint256,uint256)", port, ORGANICS + 1, 0xD0), abi.encode(_supplies(300)));
        Market.Good memory g = market.goods()[ORGANICS];
        uint256 cost = Pricing.buyCost(g.base, g.spread, market.capacity(), 0, 5);
        uint256 cut = Pricing.fee(cost, market.tuning().feeBps);
        uint256 supply = credits.totalSupply();
        vm.expectCall(store, abi.encodeWithSignature("useStock(uint256,uint256,uint256)", port, ORGANICS, 5));
        vm.prank(ada);
        market.trade(port, _line(ORGANICS, 5, cost + cut));
        assertEq(credits.balanceOf(bo), cost + cut, "the owner is paid for what the port sold");
        assertEq(credits.balanceOf(ada), 1_000 - cost - cut);
        assertEq(credits.totalSupply(), supply, "nothing burned or minted");
    }

    /// Organics in storage, as Planets.suppliesOf answers for goods 0–4.
    function _supplies(uint256 organics) internal pure returns (uint256[] memory units) {
        units = new uint256[](ORGANICS + 1);
        units[ORGANICS] = organics;
    }

    function test_portsGrowWithThePopulation() public {
        assertEq(market.capacity(), 300);
        for (uint256 i = 0; i < 4; i++) {
            _join(makeAddr(string.concat("pilot", vm.toString(i))), string.concat("Pilot", vm.toString(i)), "Hull");
        }
        assertEq(market.capacity(), 5 * 220);
    }

    function test_onlyTheAdminTunes() public {
        Market.Tuning memory t = market.tuning();
        vm.prank(ada);
        vm.expectRevert();
        market.setTuning(t);
        vm.prank(ada);
        vm.expectRevert();
        market.addGood("Contraband", 10, 10);
        vm.prank(admin);
        market.addGood("Antimatter", 900, 400);
        assertEq(market.goodCount(), 9);
    }
}

contract SessionTest is GameFixture {
    address key = makeAddr("session key");

    function _start(uint64 duration) internal {
        vm.deal(ada, 1 ether);
        vm.prank(ada);
        pilots.startSession{value: 0.01 ether}(key, uint64(block.timestamp) + duration);
    }

    function test_aKeyMovesAndTradesForItsPilot() public {
        _start(4 hours);
        assertEq(key.balance, 0.01 ether, "the gas money reaches the key");
        assertEq(pilots.actorOf(key), ada);
        vm.startPrank(key);
        market.trade(EARTH, _line(ORGANICS, 2, 1_000));
        pilots.jump(_starAroundSol(), new Pilots.ScanProof[](0));
        vm.stopPrank();
        assertEq(_cargo(ada, ORGANICS), 2);
        assertEq(pilots.shipOf(ada).cell, _starAroundSol());
        assertEq(credits.balanceOf(key), 0, "the key never holds credits");
    }

    function test_aKeyCannotTouchTheWallet() public {
        _start(4 hours);
        vm.startPrank(key);
        vm.expectRevert(Pilots.NotRegistered.selector);
        pilots.changeCallsign("Eve");
        vm.expectRevert(Pilots.NotRegistered.selector);
        pilots.startSession(makeAddr("another"), uint64(block.timestamp + 1 hours));
        vm.expectRevert(Pilots.AlreadyRegistered.selector);
        pilots.register("Eve");
        vm.stopPrank();
    }

    function test_keysExpireAndEnd() public {
        _start(1 hours);
        skip(1 hours);
        vm.expectRevert(Pilots.NotRegistered.selector);
        pilots.actorOf(key);

        _start(1 hours);
        vm.prank(key);
        pilots.endSession();
        vm.expectRevert(Pilots.NotRegistered.selector);
        pilots.actorOf(key);
    }

    function test_aNewKeyReplacesTheOld() public {
        _start(1 hours);
        address next = makeAddr("next key");
        vm.prank(ada);
        pilots.startSession(next, uint64(block.timestamp + 1 hours));
        vm.expectRevert(Pilots.NotRegistered.selector);
        pilots.actorOf(key);
        assertEq(pilots.actorOf(next), ada);
        assertEq(pilots.pilotOf(ada).sessionKey, next);
    }

    function test_badSessions() public {
        _join(bo, "Bodo", "Barge");
        vm.startPrank(ada);
        vm.expectRevert(Pilots.BadSession.selector);
        pilots.startSession(key, uint64(block.timestamp + 13 hours));
        vm.expectRevert(Pilots.BadSession.selector);
        pilots.startSession(bo, uint64(block.timestamp + 1 hours)); // a pilot can't be a key
        vm.expectRevert(Pilots.BadSession.selector);
        pilots.startSession(ada, uint64(block.timestamp + 1 hours));
        pilots.startSession(key, uint64(block.timestamp + 1 hours));
        vm.stopPrank();
        vm.prank(bo);
        vm.expectRevert(Pilots.BadSession.selector);
        pilots.startSession(key, uint64(block.timestamp + 1 hours)); // someone else's live key
    }
}

contract NamesAndShipsTest is GameFixture {
    function test_changingCallsignCostsAndFreesTheOld() public {
        _pay(ada, 5_000);
        uint256 supply = credits.totalSupply();
        vm.prank(ada);
        pilots.changeCallsign("Countess");
        assertEq(credits.totalSupply(), supply - pilots.CALLSIGN_FEE());
        assertEq(pilots.byCallsign("countess"), ada);
        assertEq(pilots.byCallsign("ada"), address(0));
        _join(bo, "Ada", "Barge");
        assertEq(pilots.byCallsign("ADA"), bo);
    }

    function test_renamingTheShipCosts() public {
        vm.prank(ada);
        pilots.renameShip("Engine");
        assertEq(pilots.shipOf(ada).name, "Engine");
        assertEq(credits.balanceOf(ada), 1_000 - pilots.SHIP_NAME_FEE());
    }

    function test_pilotsBroadcastToTheGalaxy() public {
        vm.expectEmit(address(pilots));
        emit Pilots.Broadcast(ada, "Hello from Sol");
        vm.prank(ada);
        pilots.broadcast("Hello from Sol");

        vm.prank(bo); // not registered
        vm.expectRevert(Pilots.NotRegistered.selector);
        pilots.broadcast("Hi");
    }

    function test_shipsCannotChangeHands() public {
        vm.prank(ada);
        vm.expectRevert(Ships.ShipsAreBound.selector);
        ships.transferFrom(ada, bo, 1);
    }
}

contract PricingTest is Test {
    /// Splitting a purchase never costs less, and splitting a sale never pays more.
    function testFuzz_splittingNeverGains(uint16 cap, uint16 d, uint16 a, uint16 b) public pure {
        uint256 capacity = bound(cap, 1, 5_000);
        uint256 shortfall = bound(d, 0, capacity);
        uint256 first = bound(a, 0, capacity - shortfall);
        uint256 second = bound(b, 0, capacity - shortfall - first);
        uint256 whole = Pricing.buyCost(160, 90, capacity, shortfall, first + second);
        uint256 split = Pricing.buyCost(160, 90, capacity, shortfall, first)
            + Pricing.buyCost(160, 90, capacity, shortfall + first, second);
        assertGe(split, whole);
        whole = Pricing.sellProceeds(160, 90, capacity, shortfall, first + second);
        split = Pricing.sellProceeds(160, 90, capacity, shortfall, first)
            + Pricing.sellProceeds(160, 90, capacity, shortfall + first, second);
        assertLe(split, whole);
    }

    /// Prices move the right way as stock is taken: dearer to buy, cheaper to sell.
    function testFuzz_pricesMoveWithStock(uint16 cap, uint16 d) public pure {
        uint256 capacity = bound(cap, 2, 5_000);
        uint256 shortfall = bound(d, 0, capacity - 2);
        assertLe(Pricing.buyCost(70, 45, capacity, shortfall, 1), Pricing.buyCost(70, 45, capacity, shortfall + 1, 1));
        assertGe(
            Pricing.sellProceeds(70, 45, capacity, shortfall, 1), Pricing.sellProceeds(70, 45, capacity, shortfall + 1, 1)
        );
    }

    function test_marginIsASpreadAndAFifth() public pure {
        // A full selling port to a needy buying port, one unit: (base + bias + spread) - (base - bias).
        assertEq(Pricing.sellProceeds(60, 40, 400, 0, 1) - Pricing.buyCost(60, 40, 400, 0, 1), 48);
    }

    /// Trading every few seconds doesn't stop a port restocking.
    function test_restockKeepsPartialUnits() public pure {
        (uint256 shortfall, uint256 updated) = (100, 0);
        for (uint256 t = 15; t <= 3600; t += 15) {
            (shortfall, updated) = Pricing.restock(shortfall, updated, t, 400, 21600);
        }
        assertEq(shortfall, 100 - 66); // 400 an hour over 6 hours: 66 and two thirds in an hour
    }

    function test_restocking() public pure {
        assertEq(Pricing.restocked(100, 0, 400, 3600), 100);
        assertEq(Pricing.restocked(100, 450, 400, 3600), 50);
        assertEq(Pricing.restocked(100, 3600, 400, 3600), 0);
    }

    function test_bays() public pure {
        assertEq(Pricing.baysCost(200, 4, 5, 1), 220);
        assertEq(Pricing.baysCost(200, 4, 5, 2), 220 + 224);
    }
}
