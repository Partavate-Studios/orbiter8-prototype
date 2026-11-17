// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test, console} from "forge-std/Test.sol";
import {BeltGen} from "../../src/planets/BeltGen.sol";

/// Prints values sdk/src/belt-gen.test.js pins, so the two implementations can't drift; and checks
/// the odds come out near the plan's (a belt at one star in four, one section in six empty).
contract BeltVectors is Test {
    bytes32 constant SEED = keccak256("orbiter8 demo 4");

    function test_printVectors() public pure {
        uint256[5] memory cells = [uint256(1), 7, 400, 12345, 3];
        for (uint256 i = 0; i < 5; i++) {
            bool has = BeltGen.hasBelt(SEED, cells[i]);
            console.log(cells[i], has ? 1 : 0, BeltGen.outsidePlanet(SEED, cells[i], 5));
            uint256 packed;
            for (uint256 s = 0; s < BeltGen.SECTIONS; s++) {
                (bool a, uint8 c, uint8 z) = BeltGen.section(SEED, cells[i], s);
                packed = packed * 1000 + (a ? 100 : 0) + uint256(c) * 10 + z;
            }
            console.log(packed);
        }
    }

    function test_printDust() public pure {
        uint256 packed;
        for (uint256 s = 0; s < BeltGen.SECTIONS; s++) packed = packed * 10 + BeltGen.dust(SEED, 400, s);
        console.log(packed);
    }

    function test_odds() public pure {
        uint256 belts;
        uint256 empty;
        uint256 sections;
        for (uint256 cell = 1; cell <= 400; cell++) {
            if (!BeltGen.hasBelt(SEED, cell)) continue;
            belts++;
            for (uint256 s = 0; s < BeltGen.SECTIONS; s++) {
                (bool a,,) = BeltGen.section(SEED, cell, s);
                sections++;
                if (!a) empty++;
            }
        }
        assertGt(belts, 70);
        assertLt(belts, 130); // about 100 in 400
        assertGt(empty * 100 / sections, 10);
        assertLt(empty * 100 / sections, 24); // about 17%
    }

    function test_solsBelt() public pure {
        assertTrue(BeltGen.hasBelt(SEED, 0));
        assertEq(BeltGen.outsidePlanet(SEED, 0, 9), 3, "between Mars and Jupiter");
        (bool ceres, uint8 c, uint8 size) = BeltGen.section(SEED, 0, 0);
        assertTrue(ceres);
        assertEq(c, BeltGen.CARBONACEOUS);
        assertEq(size, 8);
        (bool a,,) = BeltGen.section(SEED, 0, 2);
        assertFalse(a, "room to mine near home");
    }
}
