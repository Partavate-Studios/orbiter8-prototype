// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {PersonhoodGate} from "../src/PersonhoodGate.sol";
import {ShipCollection} from "../src/ShipCollection.sol";
import {MockPersonhood, MockScarcityFactory, MockScarcityCollection} from "./Mocks.sol";

contract PersonhoodGateTest is Test {
    address constant PRECOMPILE = 0x000000000000000000000000000000000a010000;
    bytes32 constant CTX = keccak256("orbiter8 test context");
    MockPersonhood pop;
    PersonhoodGate gate;
    address ada = makeAddr("ada");
    address ada2 = makeAddr("ada's new account");
    address bob = makeAddr("bob");

    function setUp() public {
        vm.etch(PRECOMPILE, address(new MockPersonhood()).code);
        pop = MockPersonhood(PRECOMPILE);
        gate = new PersonhoodGate(CTX, 1);
    }

    function test_aPersonRegistersOnce() public {
        pop.bind(ada, CTX, 2, bytes32("alias-ada"));
        vm.prank(ada);
        assertEq(gate.register(), bytes32("alias-ada"));
        assertEq(gate.pilotOfAlias(bytes32("alias-ada")), ada);
        vm.prank(ada);
        vm.expectRevert(PersonhoodGate.AlreadyRegistered.selector);
        gate.register();
    }

    function test_samePersonOnANewAccountIsRefused() public {
        pop.bind(ada, CTX, 2, bytes32("alias-ada"));
        vm.prank(ada);
        gate.register();
        // Ada moves her binding to a new account: same alias in our context.
        pop.unbind(ada);
        pop.bind(ada2, CTX, 2, bytes32("alias-ada"));
        vm.prank(ada2);
        vm.expectRevert(abi.encodeWithSelector(PersonhoodGate.PersonAlreadyHasAPilot.selector, ada));
        gate.register();
    }

    function test_noStatusOrOtherContextIsRefused() public {
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(PersonhoodGate.NotAPerson.selector, uint8(0)));
        gate.register();
        pop.bind(bob, keccak256("someone else's app"), 2, bytes32("alias-bob"));
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(PersonhoodGate.NotAPerson.selector, uint8(0)));
        gate.register();
    }

    function test_minStatusFull() public {
        PersonhoodGate fullOnly = new PersonhoodGate(CTX, 2);
        pop.bind(bob, CTX, 1, bytes32("alias-bob"));
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(PersonhoodGate.NotAPerson.selector, uint8(1)));
        fullOnly.register();
    }

    function test_unknownTierFailsClosed() public {
        pop.bind(bob, CTX, 3, bytes32("alias-bob"));
        (uint8 status, bytes32 a) = gate.statusOf(bob);
        assertEq(status, 0);
        assertEq(a, bytes32(0));
    }
}

contract ShipCollectionTest is Test {
    address constant FACTORY = 0x0000000000000000000000000000000005210000;
    ShipCollection ships;
    MockScarcityCollection c;

    function setUp() public {
        vm.etch(FACTORY, address(new MockScarcityFactory()).code);
        ships = new ShipCollection();
        address addr = ships.collectionAt(0);
        assertEq(addr, 0x0000000000000000000000000000000005200000);
        assertEq(ships.collectionAt(7), 0x0000000700000000000000000000000005200000);
        vm.etch(addr, address(new MockScarcityCollection()).code);
        c = MockScarcityCollection(addr);
        c.init(MockScarcityFactory(FACTORY), 0);
        ships.setup("Orbiter 8 Ships", "O8SHIP");
    }

    function test_mintsAShipWithItsName() public {
        address purseKey = makeAddr("purse key");
        uint256 token = ships.mintShip(purseKey, 42, "Lantern");
        assertEq(c.ownerOf(token), purseKey);
        assertEq(string(c.instanceMetadata(token, "name")), "Lantern");
        assertEq(string(c.instanceMetadata(token, "shipId")), "42");
        assertEq(c.collectionOwner(), address(ships));
        assertEq(c.name(), "Orbiter 8 Ships");
    }

    function test_aPurseKeyHoldsOneShip() public {
        address purseKey = makeAddr("purse key");
        ships.mintShip(purseKey, 1, "Lantern");
        vm.expectRevert("destination purse already holds an instance");
        ships.mintShip(purseKey, 2, "Kestrel");
    }

    function test_onlyAdminMints() public {
        vm.prank(makeAddr("stranger"));
        vm.expectRevert(ShipCollection.NotAdmin.selector);
        ships.mintShip(address(1), 1, "x");
    }
}
