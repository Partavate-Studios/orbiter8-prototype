// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Fixed} from "../math/Fixed.sol";

/// @title The galaxy's hex grid (docs/demo4-plan.md, section 2)
/// @notice Every cell has one index, counted outward from Sol (0) ring by ring: ring k starts at
/// 3k(k-1)+1 and walks the ring's six sides. Index <-> axial (q, r) is an exact bijection (the
/// hexagon-galaxy prototype's scheme, in integers only). orbiter-client sdk/v4/hex.js mirrors it.
library HexMath {
    error NotAHexDirection();

    /// Ring k's six sides walk these directions; PRE is where each side starts, in units of k.
    function _dir(uint256 side) private pure returns (int256 dq, int256 dr) {
        if (side == 0) return (1, 0);
        if (side == 1) return (1, -1);
        if (side == 2) return (0, -1);
        if (side == 3) return (-1, 0);
        if (side == 4) return (-1, 1);
        return (0, 1);
    }

    function _pre(uint256 side) private pure returns (int256 pq, int256 pr) {
        if (side == 0) return (0, 0);
        if (side == 1) return (1, 0);
        if (side == 2) return (2, -1);
        if (side == 3) return (2, -2);
        if (side == 4) return (1, -2);
        return (0, -1);
    }

    /// The ring a cell is on (Sol is ring 0).
    function ringOf(uint256 n) internal pure returns (uint256 k) {
        if (n == 0) return 0;
        k = (3 + Math.sqrt(12 * n - 3)) / 6;
        while (3 * k * (k + 1) + 1 <= n) k++;
        while (3 * k * (k - 1) + 1 > n) k--;
    }

    function toAxial(uint256 n) internal pure returns (int256 q, int256 r) {
        if (n == 0) return (0, 0);
        uint256 k = ringOf(n);
        uint256 m = n - (3 * k * (k - 1) + 1);
        uint256 side = m / k;
        int256 pos = int256(m % k);
        int256 ki = int256(k);
        (int256 pq, int256 pr) = _pre(side);
        (int256 dq, int256 dr) = _dir(side);
        q = -ki + pq * ki + dq * pos;
        r = ki + pr * ki + dr * pos;
    }

    function toIndex(int256 q, int256 r) internal pure returns (uint256) {
        int256 k = (Fixed.abs(q) + Fixed.abs(r) + Fixed.abs(q + r)) / 2;
        if (k == 0) return 0;
        int256 dq = q + k;
        int256 dr = r - k;
        for (uint256 s = 0; s < 6; s++) {
            (int256 pq, int256 pr) = _pre(s);
            (int256 d0, int256 d1) = _dir(s);
            int256 rq = dq - pq * k;
            int256 rr = dr - pr * k;
            int256 pos = d0 != 0 ? rq / d0 : rr / d1;
            if (pos >= 0 && pos < k && rq == d0 * pos && rr == d1 * pos) {
                return uint256(3 * k * (k - 1) + 1) + s * uint256(k) + uint256(pos);
            }
        }
        revert NotAHexDirection(); // unreachable for valid coordinates
    }

    /// Steps between two cells.
    function distance(uint256 a, uint256 b) internal pure returns (uint256) {
        (int256 aq, int256 ar) = toAxial(a);
        (int256 bq, int256 br) = toAxial(b);
        int256 dq = aq - bq;
        int256 dr = ar - br;
        return uint256((Fixed.abs(dq) + Fixed.abs(dr) + Fixed.abs(dq + dr)) / 2);
    }

    /// The six cells around `n`, in direction order.
    function neighbors(uint256 n) internal pure returns (uint256[6] memory out) {
        (int256 q, int256 r) = toAxial(n);
        for (uint256 s = 0; s < 6; s++) {
            (int256 dq, int256 dr) = _dir(s);
            out[s] = toIndex(q + dq, r + dr);
        }
    }

    /// The cell's center in the galaxy's plane, one unit between neighbors (fixed point):
    /// x = q + r/2, y = r·√3/2. The client squashes this for its isometric look; the galaxy's
    /// shape (the spiral) is defined here, independent of how it's drawn.
    function position(uint256 n) internal pure returns (int256 x, int256 y) {
        (int256 q, int256 r) = toAxial(n);
        x = q * Fixed.ONE + (r * Fixed.ONE) / 2;
        y = r * 866_025_404; // √3/2 · ONE
    }
}
