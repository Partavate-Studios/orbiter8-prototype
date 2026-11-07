// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

/// @title What goods cost at a port (docs/demo4-plan.md, section 4)
/// @notice Demo 3's price rule, per unit instead of per trade. orbiter-client sdk/v4/market.js mirrors it.
///
/// A port either **sells** a good or **buys** it. Its stock is kept as a **shortfall**, the units
/// players have taken (or delivered) since it was full, so an untouched port needs no storage. The
/// shortfall shrinks back to zero over time (restocking).
///
/// - Selling port: a unit costs `base - bias + spread × shortfall / capacity`. Cheapest when full.
/// - Buying port: a unit fetches `base + bias + spread × (capacity - shortfall) / capacity`. Best when
///   it needs the most.
///
/// `bias` is a tenth of the spread, so a full selling port and a needy buying port are
/// `spread × 1.2` apart. Every unit moves the price, so a big trade pays the average over its units
/// (and splitting a trade never gains: costs round up, proceeds round down).
library Pricing {
    /// Credits for buying `units` from a selling port whose shortfall is `shortfall`. Rounds up.
    function buyCost(uint256 base, uint256 spread, uint256 capacity, uint256 shortfall, uint256 units)
        internal
        pure
        returns (uint256)
    {
        if (units == 0) return 0;
        uint256 bias = spread / 10;
        // Σ over k = shortfall … shortfall + units - 1 of k
        uint256 steps = units * shortfall + (units * (units - 1)) / 2;
        return units * (base - bias) + _ceilDiv(spread * steps, capacity);
    }

    /// Credits for selling `units` to a buying port whose shortfall is `shortfall`. Rounds down.
    function sellProceeds(uint256 base, uint256 spread, uint256 capacity, uint256 shortfall, uint256 units)
        internal
        pure
        returns (uint256)
    {
        if (units == 0) return 0;
        uint256 bias = spread / 10;
        // Σ over k = shortfall … shortfall + units - 1 of (capacity - k)
        uint256 steps = units * capacity - units * shortfall - (units * (units - 1)) / 2;
        return units * (base + bias) + (spread * steps) / capacity;
    }

    /// The shortfall after `elapsed` seconds of restocking at `capacity` units per `refill` seconds.
    function restocked(uint256 shortfall, uint256 elapsed, uint256 capacity, uint256 refill)
        internal
        pure
        returns (uint256)
    {
        uint256 regrown = (elapsed * capacity) / refill;
        return regrown >= shortfall ? 0 : shortfall - regrown;
    }

    /// Restocks a stored shortfall up to `now`, and the time to store with it. The clock moves on only
    /// by the time the regrown whole units took, so a port traded every few seconds still restocks
    /// (rounding down at each trade would otherwise lose every partial unit).
    function restock(uint256 shortfall, uint256 updated, uint256 now_, uint256 capacity, uint256 refill)
        internal
        pure
        returns (uint256 newShortfall, uint256 newUpdated)
    {
        uint256 regrown = ((now_ - updated) * capacity) / refill;
        if (regrown >= shortfall) return (0, now_);
        return (shortfall - regrown, updated + (regrown * refill) / capacity);
    }

    /// Credits for `count` bays when the ship has `have`: bay i costs `base + step × i`.
    function baysCost(uint256 base, uint256 step, uint256 have, uint256 count) internal pure returns (uint256) {
        return count * base + step * (count * have + (count * (count - 1)) / 2);
    }

    /// A fee of `bps` hundredths of a percent on `amount`, rounded up.
    function fee(uint256 amount, uint256 bps) internal pure returns (uint256) {
        return _ceilDiv(amount * bps, 10_000);
    }

    function _ceilDiv(uint256 a, uint256 b) private pure returns (uint256) {
        return a == 0 ? 0 : (a - 1) / b + 1;
    }
}
