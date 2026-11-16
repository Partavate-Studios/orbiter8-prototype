// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice A body's id: its star's cell, its kind and its index there, `cell << 16 | kind << 8 | index`.
/// Every body at a star (planets now, asteroids by belt section next, dwarf planets later) is derived
/// from the universe seed, never stored. A planet's id is its kind (0) and its place in orbit order, so
/// Sol's planets (and their Federation ports) are ids 0–8. Moons stay part of their planet. Mirrored in
/// `sdk/src/body-id.js`.
library BodyId {
    uint256 internal constant PLANET = 0;
    uint256 internal constant ASTEROID = 1;

    function make(uint256 cell, uint256 kind, uint256 index) internal pure returns (uint256) {
        return (cell << 16) | (kind << 8) | index;
    }

    function planet(uint256 cell, uint256 index) internal pure returns (uint256) {
        return cell << 16 | index;
    }

    function cellOf(uint256 id) internal pure returns (uint256) {
        return id >> 16;
    }

    function kindOf(uint256 id) internal pure returns (uint256) {
        return (id >> 8) & 0xff;
    }

    function indexOf(uint256 id) internal pure returns (uint256) {
        return id & 0xff;
    }

    function isPlanet(uint256 id) internal pure returns (bool) {
        return kindOf(id) == PLANET;
    }
}
