// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test, console} from "forge-std/Test.sol";
import {HexMath} from "../../src/galaxy/HexMath.sol";

/// Prints values the client's sdk/v4/hex.test.js pins, so the two implementations can't drift.
contract HexVectors is Test {
    function test_printVectors() public pure {
        uint256[6] memory ns = [uint256(1), 7, 19, 400, 12345, 987654];
        for (uint256 i = 0; i < 6; i++) {
            (int256 q, int256 r) = HexMath.toAxial(ns[i]);
            console.log(ns[i], vm.toString(q), vm.toString(r));
        }
        console.log("index(3,0)", HexMath.toIndex(3, 0), "index(-5,2)", HexMath.toIndex(-5, 2));
    }
}
