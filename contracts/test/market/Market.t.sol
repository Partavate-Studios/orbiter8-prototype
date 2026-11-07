// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test} from "forge-std/Test.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {Deployment} from "../../script/Deploy.s.sol";
import {Galaxy} from "../../src/galaxy/Galaxy.sol";
import {Pilots} from "../../src/pilots/Pilots.sol";
import {Market} from "../../src/market/Market.sol";
import {Pricing} from "../../src/market/Pricing.sol";
import {Credits} from "../../src/tokens/Credits.sol";
import {Ships} from "../../src/tokens/Ships.sol";
import {HexMath} from "../../src/galaxy/HexMath.sol";

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
        game = Deployment.deploy(admin, keccak256("test universe"), 30);
        Deployment.wire(game);
        // The tests pay pilots directly.
        game.credits.grantRole(game.credits.GAME_MODULE(), admin);
        game.market.grantRole(game.market.GAME_MODULE(), admin);
        vm.stopPrank();
        (galaxy, pilots, market, credits, ships) = (game.galaxy, game.pilots, game.market, game.credits, game.ships);
        vm.prank(ada);
        pilots.register("Ada", "Ledger");
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

    function _starAroundSol() internal view returns (uint256) {
        uint256[6] memory around = HexMath.neighbors(0);
        for (uint256 i = 0; i < 6; i++) if (galaxy.stateOf(around[i]) == galaxy.STAR()) return around[i];
        revert("no star next to Sol");
    }
}

contract MarketTest is GameFixture {
    function test_solHasNinePortsAndEveryGoodTrades() public view {
        Market.PortView[] memory ports = market.portsAt(0);
        assertEq(ports.length, 9);
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
        assertEq(market.portsAt(_starAroundSol()).length, 0);
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
        cost += Pricing.fee(cost, t.feeBps);
        uint256 supply = credits.totalSupply();

        vm.prank(ada);
        market.trade(EARTH, _line(ORGANICS, 5, cost));
        assertEq(credits.balanceOf(ada), 1_000 - cost);
        assertEq(credits.totalSupply(), supply - cost, "the Federation burns what it's paid, fee included");
        assertEq(_cargo(ada, ORGANICS), 5);
        assertEq(pilots.shipOf(ada).cargo, 5);
        assertEq(market.portView(EARTH).quotes[ORGANICS].shortfall, 5);

        uint256 proceeds = Pricing.sellProceeds(goods[ORGANICS].base, goods[ORGANICS].spread, cap, 0, 5);
        proceeds -= Pricing.fee(proceeds, t.feeBps);
        vm.prank(ada);
        market.trade(MERCURY, _line(ORGANICS, -5, proceeds));
        assertEq(credits.balanceOf(ada), 1_000 - cost + proceeds);
        assertGt(proceeds, cost, "a full port to a needy one pays");
        assertEq(_cargo(ada, ORGANICS), 0);
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

    function test_theYardSellsBaysAndRange() public {
        _pay(ada, 1_000_000);
        uint256 quote = market.baysQuote(5, 10);
        vm.startPrank(ada);
        vm.expectRevert(abi.encodeWithSelector(Market.NoYard.selector, MERCURY));
        market.buyBays(MERCURY, 10, quote);
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

    function test_anOwnedPortPaysItsOwnerTheFee() public {
        uint256 port = 10; // Sol, body 10: not a Federation station, so opened as a player's port
        vm.prank(admin);
        market.openPort(port, 0, bo, uint40(block.timestamp), 0); // Terrestrial
        Market.Good memory g = market.goods()[ORGANICS];
        Market.Tuning memory t = market.tuning();
        uint256 cost = Pricing.buyCost(g.base, g.spread, market.capacity(), 0, 5);
        uint256 cut = Pricing.fee(cost, t.feeBps);
        vm.prank(ada);
        market.trade(port, _line(ORGANICS, 5, cost + cut));
        assertEq(credits.balanceOf(bo), cut);
        assertEq(credits.balanceOf(ada), 1_000 - cost - cut);
    }

    function test_portsGrowWithThePopulation() public {
        assertEq(market.capacity(), 300);
        for (uint256 i = 0; i < 4; i++) {
            vm.prank(makeAddr(string.concat("pilot", vm.toString(i))));
            pilots.register(string.concat("Pilot", vm.toString(i)), "Hull");
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
        pilots.register("Eve", "Stolen");
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
        vm.prank(bo);
        pilots.register("Bodo", "Barge");
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
        vm.prank(bo);
        pilots.register("Ada", "Barge");
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
