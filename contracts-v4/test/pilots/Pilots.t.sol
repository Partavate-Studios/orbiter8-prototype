// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test} from "forge-std/Test.sol";
import {Deployment} from "../../script/Deploy.s.sol";
import {Galaxy} from "../../src/galaxy/Galaxy.sol";
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

    function setUp() public {
        vm.warp(Drand.timeOf(ROUND) - SCAN_DELAY);
        vm.startPrank(admin);
        Deployment.Game memory game = Deployment.deploy(admin, keccak256("test universe"), SCAN_DELAY);
        Deployment.wire(game);
        vm.stopPrank();
        galaxy = game.galaxy;
        pilots = game.pilots;
    }

    function _none() internal pure returns (Pilots.ScanProof[] memory) {
        return new Pilots.ScanProof[](0);
    }

    function _starAroundSol() internal view returns (uint256) {
        uint256[6] memory around = HexMath.neighbors(0);
        for (uint256 i = 0; i < 6; i++) if (galaxy.stateOf(around[i]) == galaxy.STAR()) return around[i];
        revert("no star next to Sol");
    }

    function test_registerStartsAtSol() public {
        vm.prank(ada);
        pilots.register("Ada", "Ledger");
        Pilots.Pilot memory p = pilots.pilotOf(ada);
        assertEq(p.callsign, "Ada");
        assertEq(p.ship.cell, 0);
        assertEq(p.ship.range, 1);
        assertEq(pilots.byCallsign("ADA"), ada);
    }

    function test_callsignsAreUniqueRegardlessOfCase() public {
        vm.prank(ada);
        pilots.register("Ada", "Ledger");
        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(Pilots.CallsignTaken.selector, "aDA"));
        pilots.register("aDA", "Other");
    }

    function test_nameRules() public {
        string[5] memory bad = ["ab", "this name is far too long!", " Ada", "Ada  Lovelace", "Ada!"];
        for (uint256 i = 0; i < bad.length; i++) {
            vm.prank(ada);
            vm.expectRevert();
            pilots.register(bad[i], "Ledger");
        }
        vm.prank(ada);
        pilots.register("Ada Lovelace-8", "Ledger II");
    }

    function test_aJumpCarriesTheLastScanWithIt() public {
        uint256 first = _starAroundSol();
        vm.prank(ada);
        pilots.register("Ada", "Ledger");
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
        vm.prank(ada);
        pilots.register("Ada", "Ledger");
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
