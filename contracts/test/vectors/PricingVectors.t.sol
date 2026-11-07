// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test, console} from "forge-std/Test.sol";
import {Pricing} from "../../src/market/Pricing.sol";

/// Prints values the client's sdk/v4/market.test.js pins, so the two implementations can't drift.
contract PricingVectors is Test {
    function test_printVectors() public pure {
        uint256[4] memory d = [uint256(0), 7, 199, 390];
        uint256[4] memory n = [uint256(1), 3, 50, 10];
        for (uint256 i = 0; i < 4; i++) {
            console.log(
                Pricing.buyCost(160, 90, 400, d[i], n[i]),
                Pricing.sellProceeds(160, 90, 400, d[i], n[i]),
                Pricing.restocked(d[i] * 3, 1234, 400, 21600)
            );
        }
        (uint256 a, uint256 b) = Pricing.restock(90, 1000, 1700, 400, 21600);
        console.log(a, b);
        console.log(Pricing.baysCost(200, 4, 17, 33), Pricing.fee(12345, 200), Pricing.fee(50, 200));
    }
}
