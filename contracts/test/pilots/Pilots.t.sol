// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test} from "forge-std/Test.sol";
import {Deployment} from "../../script/Deploy.s.sol";
import {Galaxy} from "../../src/galaxy/Galaxy.sol";
import {Credits} from "../../src/tokens/Credits.sol";
import {Pilots} from "../../src/pilots/Pilots.sol";
import {HexMath} from "../../src/galaxy/HexMath.sol";
import {Drand} from "../../src/randomness/Drand.sol";

contract PilotsTest is Test {
    Galaxy galaxy;
    Pilots pilots;
    address admin = makeAddr("admin");
    address ada = makeAddr("ada");
    address bo = makeAddr("bo");
    uint64 constant SCAN_DELAY = 30;

    uint32 constant ROUND = 22169011;
    bytes constant ROUND_SIG =
        hex"015ea72210cffd3bf58856b16d9ed69103ce7fd6ea5f3afa2e7c6f2d9bdbcd5a15e003164b444a8a550ace76cd7c39db9c81c682d4f208fd3017b7b38a51077e";

    Deployment.Game game;

    function setUp() public {
        vm.warp(Drand.timeOf(ROUND) - SCAN_DELAY);
        vm.startPrank(admin);
        game = Deployment.deploy(admin, keccak256("test universe"), SCAN_DELAY);
        Deployment.wire(game);
        Deployment.wireJoining(game);
        vm.stopPrank();
        galaxy = game.galaxy;
        pilots = game.pilots;
        _plainStart();
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

    function _none() internal pure returns (Pilots.ScanProof[] memory) {
        return new Pilots.ScanProof[](0);
    }

    function _starAroundSol() internal view returns (uint256) {
        uint256[6] memory around = HexMath.neighbors(0);
        for (uint256 i = 0; i < 6; i++) if (galaxy.stateOf(around[i]) == galaxy.STAR()) return around[i];
        revert("no star next to Sol");
    }

    /// The intro's two transactions (Koda, 2026-11-19): the ID card registers the call sign; accepting the
    /// job names the ship, mints it in Earth's orbit, joins the corporation and loads the advance.
    function test_registerThenAcceptTheJob() public {
        uint8[] memory goods = new uint8[](2);
        uint16[] memory units = new uint16[](2);
        (goods[0], units[0], goods[1], units[1]) = (3, 3, 7, 2);
        vm.prank(admin);
        pilots.setStarterKit(Pilots.StarterKit(0, 45, goods, units));

        vm.prank(ada);
        pilots.register("Ada");
        Pilots.PilotView memory p = pilots.pilotOf(ada);
        assertEq(p.shipId, 0, "no ship yet");
        assertEq(p.corporation, 0, "a non-citizen");
        uint256 next = _starAroundSol();
        vm.prank(ada);
        vm.expectRevert(Pilots.NoShip.selector);
        pilots.jump(next, _none());

        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Pilots.NoSuchCorporation.selector, 4));
        pilots.acceptJob(4, "Ledger");
        vm.prank(ada);
        pilots.acceptJob(2, "Ledger");
        p = pilots.pilotOf(ada);
        assertGt(p.shipId, 0);
        assertEq(p.ship.cell, 0, "in Earth's orbit, at Sol");
        assertEq(p.corporation, 2);
        uint256[] memory held = pilots.cargoOf(ada, 8);
        assertEq(held[3], 3, "Helium-3");
        assertEq(held[7], 2, "Electronics");
        assertEq(pilots.freeBays(ada), 0, "the hold is full");
        Credits credits = pilots.credits();
        assertEq(credits.balanceOf(ada), 0);
        assertEq(credits.debtOf(ada), 45, "carried over from Earth");
        vm.prank(ada);
        vm.expectRevert(Pilots.HasShip.selector);
        pilots.acceptJob(1, "Another");
    }

    function test_switchingCorporation() public {
        _join(ada, "Ada", "Ledger");
        (string[] memory names, uint256 fee,) = pilots.corporations();
        assertEq(names[0], "Corp X");
        assertEq(names[2], "Corp Z");
        assertEq(fee, 5_000);
        vm.prank(ada);
        vm.expectRevert(); // 1,000 credits: can't pay the fee
        pilots.switchCorporation(3);
        vm.prank(admin);
        pilots.setCorporations(names, 0);
        vm.prank(ada);
        pilots.switchCorporation(3);
        assertEq(pilots.corporationOf(ada), 3);
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(Pilots.NoSuchCorporation.selector, 3));
        pilots.switchCorporation(3);
    }

    function test_registerStartsAtSol() public {
        _join(ada, "Ada", "Ledger");
        Pilots.PilotView memory p = pilots.pilotOf(ada);
        assertEq(p.callsign, "Ada");
        assertEq(p.ship.cell, 0);
        assertEq(p.ship.range, 1);
        assertEq(pilots.byCallsign("ADA"), ada);
    }

    function test_callsignsAreUniqueRegardlessOfCase() public {
        _join(ada, "Ada", "Ledger");
        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(Pilots.CallsignTaken.selector, "aDA"));
        pilots.register("aDA");
    }

    function test_nameRules() public {
        string[5] memory bad = ["ab", "this name is far too long!", " Ada", "Ada  Lovelace", "Ada!"];
        for (uint256 i = 0; i < bad.length; i++) {
            vm.prank(ada);
            vm.expectRevert();
            pilots.register(bad[i]);
        }
        _join(ada, "Ada Lovelace-8", "Ledger II");
    }

    function test_aJumpCarriesTheLastScanWithIt() public {
        uint256 first = _starAroundSol();
        _join(ada, "Ada", "Ledger");
        vm.prank(ada);
        pilots.jump(first, _none());
        assertEq(pilots.pilotOf(ada).ship.cell, first);
        assertFalse(galaxy.star(first).scanned);

        // The next move (here, back to Sol) carries the first star's scan proof along.
        Pilots.ScanProof[] memory proofs = new Pilots.ScanProof[](1);
        proofs[0] = Pilots.ScanProof(first, ROUND_SIG);
        vm.prank(ada);
        pilots.jump(0, proofs);
        assertTrue(galaxy.star(first).scanned, "written along with the jump, no separate approval");
    }

    function test_unregisteredCantFly() public {
        uint256 target = _starAroundSol();
        vm.prank(bo);
        vm.expectRevert(Pilots.NotRegistered.selector);
        pilots.jump(target, _none());
    }

    function test_gasOfAFirstArrivalAndItsScan() public {
        uint256 first = _starAroundSol();
        _join(ada, "Ada", "Ledger");
        uint256 g0 = gasleft();
        vm.prank(ada);
        pilots.jump(first, _none());
        uint256 jumpGas = g0 - gasleft();
        Pilots.ScanProof[] memory proofs = new Pilots.ScanProof[](1);
        proofs[0] = Pilots.ScanProof(first, ROUND_SIG);
        g0 = gasleft();
        pilots.resolveScans(proofs);
        uint256 scanGas = g0 - gasleft();
        emit log_named_uint("first arrival (jump)", jumpGas);
        emit log_named_uint("its scan, resolved later", scanGas);
        emit log_named_uint("total (vs 2,494,254 in Demo 3)", jumpGas + scanGas);
    }
}
