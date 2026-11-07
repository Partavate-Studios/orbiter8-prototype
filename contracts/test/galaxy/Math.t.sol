// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test} from "forge-std/Test.sol";
import {HexMath} from "../../src/galaxy/HexMath.sol";
import {Fixed} from "../../src/math/Fixed.sol";
import {Spiral} from "../../src/galaxy/Spiral.sol";

contract HexMathTest is Test {
    function testFuzz_indexRoundTrips(uint256 n) public pure {
        n = bound(n, 0, 1e12);
        (int256 q, int256 r) = HexMath.toAxial(n);
        assertEq(HexMath.toIndex(q, r), n);
    }

    function test_ringsStartWhereExpected() public pure {
        assertEq(HexMath.ringOf(0), 0);
        assertEq(HexMath.ringOf(1), 1);
        assertEq(HexMath.ringOf(6), 1);
        assertEq(HexMath.ringOf(7), 2);
        assertEq(HexMath.ringOf(18), 2);
        assertEq(HexMath.ringOf(19), 3);
    }

    function testFuzz_neighborsAreOneStepAway(uint256 n) public pure {
        n = bound(n, 0, 1e9);
        uint256[6] memory around = HexMath.neighbors(n);
        for (uint256 i = 0; i < 6; i++) {
            assertEq(HexMath.distance(n, around[i]), 1);
            for (uint256 j = i + 1; j < 6; j++) assertTrue(around[i] != around[j]);
        }
    }

    function test_solsNeighborsAreRingOne() public pure {
        uint256[6] memory around = HexMath.neighbors(0);
        for (uint256 i = 0; i < 6; i++) assertEq(HexMath.ringOf(around[i]), 1);
    }
}

contract FixedTest is Test {
    int256 constant ONE = Fixed.ONE;

    function _near(int256 a, int256 b, int256 tolerance) internal pure {
        assertLe(Fixed.abs(a - b), tolerance);
    }

    function test_atan2KnownAngles() public pure {
        _near(Fixed.atan2(ONE, ONE), Fixed.PI / 4, 20_000);
        _near(Fixed.atan2(ONE, -ONE), 3 * Fixed.PI / 4, 20_000);
        _near(Fixed.atan2(-ONE, -ONE), -3 * Fixed.PI / 4, 20_000);
        _near(Fixed.atan2(ONE, 0), Fixed.HALF_PI, 20_000);
        _near(Fixed.atan2(0, -ONE), Fixed.PI, 20_000);
        _near(Fixed.atan2(866_025_404, 500_000_000), Fixed.PI / 3, 20_000);
    }

    function test_cosSinKnownAngles() public pure {
        (int256 c, int256 s) = Fixed.cosSin(0);
        _near(c, ONE, 100);
        _near(s, 0, 100);
        (c, s) = Fixed.cosSin(Fixed.PI / 3);
        _near(c, ONE / 2, 1000);
        _near(s, 866_025_404, 1000);
        (c, s) = Fixed.cosSin(Fixed.PI);
        _near(c, -ONE, 1000);
        _near(s, 0, 1000);
        (c, s) = Fixed.cosSin(-2 * Fixed.PI / 3);
        _near(c, -ONE / 2, 1000);
        _near(s, -866_025_404, 1000);
        (c, s) = Fixed.cosSin(7 * Fixed.PI / 4);
        _near(c, 707_106_781, 1000);
        _near(s, -707_106_781, 1000);
    }

    function test_sqrtAndExp() public pure {
        assertEq(Fixed.sqrt(4 * ONE), 2 * ONE);
        _near(Fixed.sqrt(2 * ONE), 1_414_213_562, 2);
        assertEq(Fixed.expNeg(0), ONE);
        assertLt(Fixed.expNeg(5 * ONE), ONE / 50);
    }
}

contract SpiralTest is Test {
    /// Points sampled on the arm itself have full density; points in the void between turns have little.
    function testFuzz_onTheArmIsDense(bytes32 seed, uint256 thetaSeed) public pure {
        Spiral.Params memory p = Spiral.fromSeed(seed);
        int256 theta = int256(bound(thetaSeed, 0, 12 * uint256(Fixed.ONE)));
        int256 r = Spiral.radiusAt(p, theta);
        (int256 c, int256 s) = Fixed.cosSin(p.rot + theta);
        int256 d = Spiral.density(p, Fixed.mul(r, c), Fixed.mul(r, s));
        assertGt(d, 950_000_000);
    }

    function test_densityFallsAwayFromTheArms() public pure {
        Spiral.Params memory p = Spiral.fromSeed(keccak256("test universe"));
        // Halfway between arm 0's crossing and the next arm's, on the same bearing, far out.
        int256 theta = 10 * Fixed.ONE;
        int256 r0 = Spiral.radiusAt(p, theta);
        int256 r1 = Spiral.radiusAt(p, theta + Fixed.PI);
        int256 rMid = (r0 + r1) / 2;
        (int256 c, int256 s) = Fixed.cosSin(p.rot + theta);
        int256 mid = Spiral.density(p, Fixed.mul(rMid, c), Fixed.mul(rMid, s));
        int256 on = Spiral.density(p, Fixed.mul(r0, c), Fixed.mul(r0, s));
        assertLt(mid, on / 2);
    }
}
