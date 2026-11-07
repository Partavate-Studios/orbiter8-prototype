// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Fixed} from "../math/Fixed.sol";

/// @title The galaxy's two spiral arms (docs/demo4-plan.md, section 2; D8, D16)
/// @notice Each arm follows r(θ) = core + pitch·θ·(1 + flare·θ), the second half a turn after the
/// first. A cell's density is 1 on an arm and falls off with distance like a Gaussian. The prototype
/// finds the nearest point on each arm by sampling hundreds of points; here it's a closed form: the
/// radial gap to the arm's crossings on the cell's own bearing, scaled by the arm's slope, plus the
/// distance to each arm's starting point (which matters only near Sol). Checked against the
/// prototype's sampling: median error 0.002, worst 0.11, on the 0–1 density scale. All lengths are in
/// cells. orbiter-client sdk/v4/spiral.js mirrors it.
library Spiral {
    struct Params {
        int256 rot; // where arm 0 starts (radians)
        int256 pitch; // outward travel per radian
        int256 flare; // how the gap between turns widens
        int256 core; // radius where the arms start
        int256 width; // the arms' half-width
    }

    /// Settings rolled from the universe's seed, within the prototype's ranges (converted to cells).
    function fromSeed(bytes32 seed) internal pure returns (Params memory p) {
        uint256 h = uint256(keccak256(abi.encode(seed, "spiral")));
        p.rot = int256(h % 1e9) * Fixed.TAU / Fixed.ONE;
        p.pitch = 840_000_000 + int256((h >> 32) % 930_000_000); // 0.84–1.77 cells per radian
        p.flare = 60_000_000 + int256((h >> 64) % 160_000_000); // 0.06–0.22
        p.core = 1_000_000_000 + int256((h >> 96) % 700_000_000); // 1.0–1.7 cells
        p.width = 1_600_000_000 + int256((h >> 128) % 1_400_000_000); // 1.6–3.0 cells
    }

    function radiusAt(Params memory p, int256 theta) internal pure returns (int256) {
        return p.core + Fixed.mul(Fixed.mul(p.pitch, theta), Fixed.ONE + Fixed.mul(p.flare, theta));
    }

    /// The θ at which an arm reaches radius R (0 inside the core).
    function thetaAt(Params memory p, int256 radius) internal pure returns (int256) {
        if (radius <= p.core) return 0;
        int256 a = Fixed.mul(p.pitch, p.flare);
        int256 b = p.pitch;
        int256 c = p.core - radius;
        int256 disc = Fixed.mul(b, b) - 4 * Fixed.mul(a, c);
        return Fixed.div(-b + Fixed.sqrt(disc), 2 * a);
    }

    /// Distance from (x, y) to the nearest arm, in cells.
    function distance(Params memory p, int256 x, int256 y) internal pure returns (int256 best) {
        int256 radius = Fixed.hypot(x, y);
        int256 phi = Fixed.atan2(y, x);
        int256 theta0 = thetaAt(p, radius);
        best = type(int256).max;
        for (int256 arm = 0; arm < 2; arm++) {
            best = Fixed.min(best, _crossingGap(p, radius, theta0, Fixed.modTau(phi - p.rot - arm * Fixed.PI)));
            // The arm's starting point, for cells near Sol where the crossings don't apply.
            (int256 c, int256 s) = Fixed.cosSin(p.rot + arm * Fixed.PI);
            best = Fixed.min(best, Fixed.hypot(x - Fixed.mul(p.core, c), y - Fixed.mul(p.core, s)));
        }
    }

    /// The smallest gap to an arm's crossings of this bearing (at base + 2πk), around radius `radius`.
    function _crossingGap(Params memory p, int256 radius, int256 theta0, int256 base)
        private
        pure
        returns (int256 best)
    {
        best = type(int256).max;
        int256 k = _roundDiv(theta0 - base, Fixed.TAU);
        for (int256 kk = k - 1; kk <= k + 1; kk++) {
            int256 theta = base + Fixed.TAU * kk;
            if (theta < 0) continue;
            int256 r = radiusAt(p, theta);
            int256 slope = Fixed.mul(p.pitch, Fixed.ONE + 2 * Fixed.mul(p.flare, theta));
            best = Fixed.min(best, Fixed.mul(Fixed.abs(radius - r), Fixed.div(r, Fixed.hypot(r, slope))));
        }
    }

    /// 1 on an arm, falling toward 0 in the void between arms: e^(-½(d/width)²).
    function density(Params memory p, int256 x, int256 y) internal pure returns (int256) {
        int256 d = Fixed.div(distance(p, x, y), p.width);
        return Fixed.expNeg(Fixed.mul(d, d) / 2);
    }

    /// a / b rounded to the nearest integer (both fixed point, result a plain integer).
    function _roundDiv(int256 a, int256 b) private pure returns (int256) {
        int256 q = (a * 2 + (a >= 0 ? b : -b)) / (2 * b);
        return q;
    }
}
