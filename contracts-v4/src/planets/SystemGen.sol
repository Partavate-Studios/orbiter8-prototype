// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

/// @title A star's planets, derived and never stored (docs/demo4-plan.md, section 2; D9, D19)
/// @notice From the universe's seed and the star's cell: how many planets, and each one's class,
/// size and surface seed (kept for terraforming, D19). Sol's nine are Demo 3's. Only what players
/// change (owners, buildings, people, storage) is stored, by `Planets`.
/// orbiter-client sdk/v4/system.js mirrors it.
library SystemGen {
    uint256 internal constant SOL_PLANETS = 9;

    /// Classes, as Demo 3 numbered them.
    uint8 internal constant TERRESTRIAL = 0;
    uint8 internal constant GASEOUS = 6;

    /// How many planets circle the star at `cell` (2 to 8; Sol has 9).
    function planetCount(bytes32 seed, uint256 cell) internal pure returns (uint256) {
        if (cell == 0) return SOL_PLANETS;
        return 2 + uint256(keccak256(abi.encode(seed, cell, "planets"))) % 7;
    }

    /// The planet's class (0–9), size (1–16, gas giants 16–63) and surface seed.
    function planet(bytes32 seed, uint256 cell, uint256 body)
        internal
        pure
        returns (uint8 class, uint8 size, bytes32 surface)
    {
        surface = keccak256(abi.encode(seed, cell, body, "surface"));
        if (cell == 0) {
            class = [1, 5, 0, 1, 6, 6, 4, 4, 1][body];
            size = [3, 12, 12, 6, 54, 36, 24, 24, 1][body];
            return (class, size, surface);
        }
        uint256 h = uint256(keccak256(abi.encode(seed, cell, body, "planet")));
        class = uint8(h % 10);
        uint256 x = (h >> 16) % 1000;
        size = class == GASEOUS ? uint8(16 + x % 48) : uint8(1 + x % 16);
    }

    /// People per unit of size, by class: Terrestrial worlds are the most livable, gas giants hold
    /// only floating cities.
    function habitability(uint8 class) internal pure returns (uint256) {
        // Terrestrial, Rocky, Oceanic, Desert, Ice, Volcanic, Gaseous, Ferrous, Lava, Swamp
        return [uint256(1000), 300, 800, 300, 200, 100, 100, 200, 100, 600][class];
    }

    /// The most people the planet holds.
    function populationCap(uint8 class, uint8 size) internal pure returns (uint256) {
        return uint256(size) * habitability(class);
    }
}
