// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Fixed} from "../math/Fixed.sol";

/// @title How many new stars a scan finds (docs/demo4-plan.md, section 2; D6)
/// @notice The hexagon-galaxy prototype's rule, in integers: mostly about 4 stars in total around a
/// star, all of them more often on a spiral arm, none of them more often in the void, nudged by how
/// crowded the star the explorer came from was. orbiter-client sdk/v4/scan.js mirrors it.
library ScanRules {
    /// A fair draw in [0, ONE) from the scan's randomness and a label.
    function draw(bytes32 rnd, bytes32 label) internal pure returns (int256) {
        return int256(uint256(keccak256(abi.encode(rnd, label))) % uint256(Fixed.ONE));
    }

    /// How many of `open` undecided neighbors become stars.
    /// @param density 0–ONE, the scanned star's spiral density
    /// @param open undecided neighbors
    /// @param have neighbors that already hold a star or black hole
    /// @param originCrowd how many of the origin's neighbors held stars (7: no origin, e.g. Sol)
    function newStars(bytes32 rnd, int256 density, uint256 open, uint256 have, uint256 originCrowd)
        internal
        pure
        returns (uint256)
    {
        if (open == 0) return 0;
        int256 one = Fixed.ONE;

        // Every open slot fills: rare off the arms (3%), common on them (58%).
        int256 pFull = 30_000_000 + Fixed.mul(density, 550_000_000);
        if (draw(rnd, "full") < pFull) return open;

        // None fill: rare on the arms, common in the void; likelier with fewer open slots.
        int256 zeroNear = open >= 3 ? int256(10_000_000) : open == 2 ? int256(40_000_000) : int256(100_000_000);
        int256 zeroFar = open >= 3 ? int256(400_000_000) : open == 2 ? int256(320_000_000) : int256(420_000_000);
        int256 pZero = zeroNear + Fixed.mul(one - density, zeroFar - zeroNear);
        if (draw(rnd, "zero") < pZero) return 0;

        // Otherwise aim for about 4 around the star, richer on an arm, nudged by the origin's crowd.
        int256 mode = _clamp(4 - int256(have), 1, int256(open));
        mode = _clamp((mode * one + Fixed.mul(density, 1_500_000_000) + one / 2) / one, 1, int256(open));
        if (originCrowd <= 6) {
            int256 shift = _clamp(int256(originCrowd) - 4, -2, 2);
            int256 half = shift >= 0 ? (shift + 1) / 2 : -((-shift) / 2);
            mode = _clamp(mode + half, 1, int256(open));
        }

        // Weights 0.55^|k - mode| for k = 1..open.
        int256[6] memory falloff =
            [int256(1_000_000_000), 550_000_000, 302_500_000, 166_375_000, 91_506_250, 50_328_437];
        int256 total;
        for (uint256 k = 1; k <= open; k++) {
            total += falloff[uint256(Fixed.abs(int256(k) - mode))];
        }
        int256 t = Fixed.mul(draw(rnd, "count"), total);
        for (uint256 k = 1; k <= open; k++) {
            t -= falloff[uint256(Fixed.abs(int256(k) - mode))];
            if (t <= 0) return k;
        }
        return open;
    }

    function _clamp(int256 v, int256 lo, int256 hi) private pure returns (int256) {
        return v < lo ? lo : v > hi ? hi : v;
    }
}
