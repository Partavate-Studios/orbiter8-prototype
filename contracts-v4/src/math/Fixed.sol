// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @title Fixed-point math (scale 1e9) for the galaxy's geometry
/// @notice Signed integers scaled by ONE. Every operation truncates toward zero, exactly as JavaScript's
/// BigInt does, so the client reproduces the contracts' results bit for bit (orbiter-client
/// sdk/v4/fixed.js mirrors this file).
library Fixed {
    int256 internal constant ONE = 1e9;
    int256 internal constant PI = 3_141_592_654;
    int256 internal constant TAU = 6_283_185_307;
    int256 internal constant HALF_PI = 1_570_796_327;

    function mul(int256 a, int256 b) internal pure returns (int256) {
        return (a * b) / ONE;
    }

    function div(int256 a, int256 b) internal pure returns (int256) {
        return (a * ONE) / b;
    }

    function abs(int256 a) internal pure returns (int256) {
        return a < 0 ? -a : a;
    }

    function min(int256 a, int256 b) internal pure returns (int256) {
        return a < b ? a : b;
    }

    /// Square root of a non-negative value (floor).
    function sqrt(int256 a) internal pure returns (int256) {
        if (a <= 0) return 0;
        return int256(Math.sqrt(uint256(a) * uint256(ONE)));
    }

    function hypot(int256 a, int256 b) internal pure returns (int256) {
        return sqrt(mul(a, a) + mul(b, b));
    }

    /// `a` modulo TAU, in [0, TAU).
    function modTau(int256 a) internal pure returns (int256) {
        int256 m = a % TAU;
        return m < 0 ? m + TAU : m;
    }

    /// atan(z) for |z| <= 1, by a minimax polynomial (error about 1e-5 rad).
    function _atanUnit(int256 z) private pure returns (int256) {
        int256 z2 = mul(z, z);
        int256 p = 20_835_100; // 0.0208351
        p = -85_133_000 + mul(z2, p); // -0.0851330
        p = 180_141_000 + mul(z2, p); // 0.1801410
        p = -330_299_500 + mul(z2, p); // -0.3302995
        p = 999_866_000 + mul(z2, p); // 0.9998660
        return mul(z, p);
    }

    /// The angle of (x, y) from the +x axis, in (-PI, PI].
    function atan2(int256 y, int256 x) internal pure returns (int256) {
        if (x == 0 && y == 0) return 0;
        int256 angle;
        if (abs(x) >= abs(y)) {
            angle = _atanUnit(div(y, x));
            if (x < 0) angle = y >= 0 ? angle + PI : angle - PI;
        } else {
            angle = _atanUnit(div(x, y));
            angle = (y > 0 ? HALF_PI : -HALF_PI) - angle;
        }
        return angle;
    }

    /// e^(-x) for x >= 0, approximated as 1 / (1 + x + x²/2 + x³/6 + x⁴/24). Monotonic, exact at 0,
    /// within a few percent for x < 1.5 and heading to 0 after; the galaxy only needs its shape.
    function expNeg(int256 x) internal pure returns (int256) {
        if (x <= 0) return ONE;
        int256 x2 = mul(x, x);
        int256 x3 = mul(x2, x);
        int256 x4 = mul(x3, x);
        int256 d = ONE + x + x2 / 2 + x3 / 6 + x4 / 24;
        return (ONE * ONE) / d;
    }

    /// Cosine and sine of an angle, by Taylor series after reducing to [-PI/2, PI/2] (error < 1e-7).
    function cosSin(int256 a) internal pure returns (int256 c, int256 s) {
        a = modTau(a); // [0, TAU)
        int256 sign = ONE;
        if (a > PI) a -= TAU; // (-PI, PI]
        if (a > HALF_PI) {
            a = PI - a;
            sign = -ONE;
        } else if (a < -HALF_PI) {
            a = -PI - a;
            sign = -ONE;
        }
        int256 a2 = mul(a, a);
        // cos = 1 - a²/2 + a⁴/24 - a⁶/720 + a⁸/40320
        int256 cTerm = ONE;
        int256 cSum = ONE;
        // sin = a - a³/6 + a⁵/120 - a⁷/5040 + a⁹/362880
        int256 sTerm = a;
        int256 sSum = a;
        for (int256 k = 1; k <= 4; k++) {
            cTerm = -mul(cTerm, a2) / ((2 * k - 1) * (2 * k));
            cSum += cTerm;
            sTerm = -mul(sTerm, a2) / ((2 * k) * (2 * k + 1));
            sSum += sTerm;
        }
        // Under the reflection a -> ±PI - a, sine keeps its value and only cosine flips.
        c = mul(cSum, sign);
        s = sSum;
    }
}
