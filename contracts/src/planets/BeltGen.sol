// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

/// @title A star's asteroid belt, derived and never stored (expansion plan, decisions 1–4, 7; D67–D70, D73)
/// @notice From the universe's seed and the star's cell: whether the star has a belt (Sol always,
/// about one star in four), which planet it lies outside, and each of its eight sections: one large
/// asteroid (its composition and size) or, about one section in six, empty space that ships can
/// mine. An asteroid's id is `BodyId.make(cell, BodyId.ASTEROID, section)`. Sol's belt lies between
/// Mars and Jupiter and holds real asteroids; it belongs to the Federation. Mirrored in
/// `sdk/src/belt-gen.js`, pinned by `test/vectors/BeltVectors.t.sol`.
library BeltGen {
    uint256 internal constant SECTIONS = 8;

    /// Compositions, as real asteroids come.
    uint8 internal constant CARBONACEOUS = 0; // water ice, organics
    uint8 internal constant SILICATE = 1; // silicon, metals
    uint8 internal constant METALLIC = 2; // metals, rare elements

    /// Whether the star at `cell` has a belt (the caller checks it's a star).
    function hasBelt(bytes32 seed, uint256 cell) internal pure returns (bool) {
        if (cell == 0) return true;
        return uint256(keccak256(abi.encode(seed, cell, "belt"))) % 4 == 0;
    }

    /// The planet the belt lies just outside of, by orbit (`planets` is the star's planet count).
    function outsidePlanet(bytes32 seed, uint256 cell, uint256 planets) internal pure returns (uint256) {
        if (cell == 0) return 3; // Mars
        return (uint256(keccak256(abi.encode(seed, cell, "belt"))) >> 8) % planets;
    }

    /// A section's asteroid: whether there is one, its composition and its size (1–8; 0 when empty).
    function section(bytes32 seed, uint256 cell, uint256 index)
        internal
        pure
        returns (bool asteroid, uint8 composition, uint8 size)
    {
        if (cell == 0) {
            // Ceres, Vesta, (empty), Pallas, Hygiea, Psyche, (empty), Juno
            size = [8, 6, 0, 6, 5, 5, 0, 3][index];
            composition = [CARBONACEOUS, SILICATE, 0, SILICATE, CARBONACEOUS, METALLIC, 0, SILICATE][index];
            return (size != 0, composition, size);
        }
        uint256 h = uint256(keccak256(abi.encode(seed, cell, index, "asteroid")));
        if (h % 6 == 0) return (false, 0, 0);
        uint256 kind = (h >> 8) % 10;
        composition = kind < 5 ? CARBONACEOUS : kind < 8 ? SILICATE : METALLIC;
        size = uint8(1 + (h >> 16) % 8);
        asteroid = true;
    }

    /// The goods an asteroid of `composition` yields, as bits by good (Market's order: 0 water ice,
    /// 1 metals, 2 rare elements, 4 organics, 5 silicon).
    function yields(uint8 composition) internal pure returns (uint256) {
        if (composition == CARBONACEOUS) return (1 << 0) | (1 << 4);
        if (composition == SILICATE) return (1 << 5) | (1 << 1);
        return (1 << 1) | (1 << 2);
    }
}
