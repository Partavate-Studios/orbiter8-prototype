// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test, console} from "forge-std/Test.sol";
import {SystemGen} from "../../src/planets/SystemGen.sol";

/// Prints values the client's sdk/v4/system.test.js pins, so the two implementations can't drift.
contract SystemVectors is Test {
    function test_printVectors() public pure {
        bytes32 seed = keccak256("orbiter8 demo 4");
        uint256[4] memory cells = [uint256(1), 7, 400, 12345];
        for (uint256 i = 0; i < 4; i++) {
            uint256 n = SystemGen.planetCount(seed, cells[i]);
            (uint8 c0, uint8 s0,) = SystemGen.planet(seed, cells[i], 0);
            (uint8 c1, uint8 s1, bytes32 surface) = SystemGen.planet(seed, cells[i], 1);
            console.log(cells[i], n);
            console.log(c0, s0, c1, s1);
            console.logBytes32(surface);
        }
    }
}
