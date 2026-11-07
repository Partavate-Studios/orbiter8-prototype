// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Galaxy} from "../../src/galaxy/Galaxy.sol";
import {HexMath} from "../../src/galaxy/HexMath.sol";
import {Drand} from "../../src/randomness/Drand.sol";

/// Exposes the scan internals so tests can drive many scans with made-up randomness.
contract GalaxyHarness is Galaxy {
    function scanWith(uint256 cell, bytes32 rnd) external {
        _setState(cell, STAR);
        _applyScan(cell, rnd, 7);
    }
}

contract GalaxyTest is Test {
    Galaxy galaxy;
    GalaxyHarness harness;
    address admin = makeAddr("admin");
    address pilots = makeAddr("pilots module");
    address explorer = makeAddr("explorer");
    uint64 constant SCAN_DELAY = 30;

    // A real evmnet round (https://api.drand.sh/v2/beacons/evmnet/rounds/22169011).
    uint32 constant ROUND = 22169011;
    bytes constant ROUND_SIG =
        hex"015ea72210cffd3bf58856b16d9ed69103ce7fd6ea5f3afa2e7c6f2d9bdbcd5a15e003164b444a8a550ace76cd7c39db9c81c682d4f208fd3017b7b38a51077e";

    function _deploy(address implementation) internal returns (address) {
        return address(
            new ERC1967Proxy(
                implementation, abi.encodeCall(Galaxy.initialize, (admin, keccak256("test universe"), SCAN_DELAY))
            )
        );
    }

    function setUp() public {
        // Arrivals in these tests name ROUND for their scan.
        vm.warp(Drand.timeOf(ROUND) - SCAN_DELAY);
        galaxy = Galaxy(_deploy(address(new Galaxy())));
        harness = GalaxyHarness(_deploy(address(new GalaxyHarness())));
        bytes32 role = galaxy.GAME_MODULE();
        vm.prank(admin);
        galaxy.grantRole(role, pilots);
    }

    function _firstStarAroundSol() internal view returns (uint256) {
        uint256[6] memory around = HexMath.neighbors(0);
        for (uint256 i = 0; i < 6; i++) {
            if (galaxy.stateOf(around[i]) == galaxy.STAR()) return around[i];
        }
        revert("Sol has no star neighbors in this universe");
    }

    function test_solIsChartedFromTheStart() public view {
        assertEq(galaxy.stateOf(0), galaxy.STAR());
        Galaxy.Star memory sol = galaxy.star(0);
        assertTrue(sol.visited && sol.scanned);
        uint256[6] memory around = HexMath.neighbors(0);
        for (uint256 i = 0; i < 6; i++) assertTrue(galaxy.stateOf(around[i]) != galaxy.UNDECIDED());
    }

    function test_arrivalNamesAFutureRoundAndTheScanResolvesWithIt() public {
        uint256 target = _firstStarAroundSol();
        vm.prank(pilots);
        assertTrue(galaxy.arrive(explorer, 0, target, 1));
        Galaxy.Star memory s = galaxy.star(target);
        assertEq(s.discoverer, explorer);
        assertEq(s.scanRound, ROUND);
        assertFalse(s.scanned);

        (uint8[6] memory preview,) = galaxy.previewScan(target, ROUND_SIG);
        galaxy.resolveScan(target, ROUND_SIG); // anyone may
        uint256[6] memory around = HexMath.neighbors(target);
        for (uint256 i = 0; i < 6; i++) {
            assertEq(galaxy.stateOf(around[i]), preview[i], "the preview matches what's written");
            assertTrue(galaxy.stateOf(around[i]) != galaxy.UNDECIDED());
        }
        assertTrue(galaxy.star(target).scanned);
    }

    function test_aScanCantBeResolvedTwiceOrWithTheWrongRound() public {
        uint256 target = _firstStarAroundSol();
        vm.prank(pilots);
        galaxy.arrive(explorer, 0, target, 1);
        bytes memory wrong = ROUND_SIG;
        wrong[10] = bytes1(uint8(wrong[10]) ^ 1);
        vm.expectRevert();
        galaxy.resolveScan(target, wrong);
        galaxy.resolveScan(target, ROUND_SIG);
        vm.expectRevert(abi.encodeWithSelector(Galaxy.NotScannable.selector, target));
        galaxy.resolveScan(target, ROUND_SIG);
    }

    function test_arrivalRules() public {
        uint256 target = _firstStarAroundSol();
        // Only the game's modules move ships.
        vm.expectRevert();
        galaxy.arrive(explorer, 0, target, 1);
        // Undecided cells (ring 3 here) can't be reached; nor anything beyond range.
        uint256 far = HexMath.toIndex(3, 0);
        vm.prank(pilots);
        vm.expectRevert(abi.encodeWithSelector(Galaxy.NotAStar.selector, far));
        galaxy.arrive(explorer, 0, far, 4);
        // A second visit isn't a discovery.
        vm.prank(pilots);
        galaxy.arrive(explorer, 0, target, 1);
        vm.prank(pilots);
        assertFalse(galaxy.arrive(makeAddr("someone else"), target, target, 1));
        assertEq(galaxy.star(target).discoverer, explorer);
    }

    function test_regionListsDecidedCells() public view {
        Galaxy.CellView[] memory cells = galaxy.region(0, 2);
        assertEq(cells.length, 7, "Sol and its ring are decided; ring 2 isn't yet");
        vm.assertTrue(cells[0].state != 0);
    }

    function test_regionIsCapped() public {
        vm.expectRevert(abi.encodeWithSelector(Galaxy.RegionTooLarge.selector, uint256(11)));
        galaxy.region(0, 11);
    }

    function test_genesisNamesSolAndItsRingForTheFederation() public view {
        assertEq(galaxy.nameOf(0), "Sol");
        assertEq(galaxy.keeperOf(0), address(galaxy));
        uint256 target = _firstStarAroundSol();
        assertEq(galaxy.nameOf(target), "Alpha Centauri");
        assertEq(galaxy.keeperOf(target), address(galaxy));
    }

    function test_onlyTheGameSetsNames() public {
        uint256 target = _firstStarAroundSol();
        vm.prank(explorer);
        vm.expectRevert();
        galaxy.setName(target, "Mine", explorer);
        vm.prank(pilots);
        galaxy.setName(target, "Prospect", explorer);
        assertEq(galaxy.nameOf(target), "Prospect");
        assertEq(galaxy.keeperOf(target), explorer);
    }

    /// Thousands of scans with made-up randomness: black holes always come in symmetric pairs 8–24
    /// steps apart, and neighbor counts look like the prototype's (about 4 around a star on average).
    function test_manyScansKeepTheRules() public {
        uint256 scanned;
        uint256 stars;
        uint256 holes;
        for (uint256 i = 0; i < 400; i++) {
            uint256 cell = 10_000 + i * 97; // spread over rings 57–200
            harness.scanWith(cell, keccak256(abi.encode("scan", i)));
            scanned++;
            uint256[6] memory around = HexMath.neighbors(cell);
            for (uint256 j = 0; j < 6; j++) {
                uint8 st = harness.stateOf(around[j]);
                if (st == harness.STAR()) stars++;
                if (st == harness.BLACK_HOLE()) {
                    holes++;
                    uint256 partner = harness.partnerOf(around[j]);
                    assertEq(harness.partnerOf(partner), around[j], "pairs are symmetric");
                    assertEq(harness.stateOf(partner), harness.BLACK_HOLE());
                    uint256 steps = HexMath.distance(around[j], partner);
                    assertGe(steps, 8);
                    assertLe(steps, 24);
                }
            }
        }
        emit log_named_uint("scans", scanned);
        emit log_named_uint("stars around them (x100 per scan)", (stars * 100) / scanned);
        emit log_named_uint("black holes", holes);
        // With every neighbor open, the prototype averages about 3.5–4.5 stars per scan.
        assertGt((stars + holes) * 100 / scanned, 250);
        assertLt((stars + holes) * 100 / scanned, 550);
    }
}

contract SlotsTest is Test {
    function _erc7201(string memory id) internal pure returns (bytes32) {
        return keccak256(abi.encode(uint256(keccak256(bytes(id))) - 1)) & ~bytes32(uint256(0xff));
    }

    function test_galaxyNamespace() public pure {
        assertEq(_erc7201("orbiter8.galaxy"), 0xfb2123573455c53eeac60d78329ceb2d58aace100441ceacb3bb05dcb327fe00);
    }
}
