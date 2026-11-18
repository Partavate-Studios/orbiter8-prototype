// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {BodyId} from "./BodyId.sol";
import {BeltGen} from "./BeltGen.sol";

/// @title Sol's Federation stations (D49, D94; expansion plan, "Sol's asteroids fully built")
/// @notice Sol is fully built: a Federation station at each of its nine planets (ids 0–8) and on each
/// asteroid of its belt (Ceres, Vesta, Pallas, Hygiea, Psyche, Juno), every one with a port, a yard and
/// an armory. Nobody claims them and nobody besieges them; their ports restock themselves at the top
/// rate, and their fees go to the Federation's treasury (Market). Sol's two empty sections stay open
/// to mining ships. Fixed, so never stored.
library Sol {
    /// Whether `id` is one of Sol's Federation stations.
    function isStation(uint256 id) internal pure returns (bool) {
        if (id < 9) return true; // Sol's planets
        if (BodyId.cellOf(id) != 0 || BodyId.kindOf(id) != BodyId.ASTEROID) return false;
        uint256 index = BodyId.indexOf(id);
        if (index >= BeltGen.SECTIONS) return false;
        (bool asteroid,,) = BeltGen.section(0, 0, index); // Sol's belt doesn't depend on the seed
        return asteroid;
    }

    /// A Sol station's port class: its planet's (Demo 3's classes; Mars is Ferrous since 2026-11-14),
    /// or an asteroid's, 10 + its composition (Planets.ASTEROID_CLASS).
    function portClass(uint256 id) internal pure returns (uint8) {
        if (id < 9) return [1, 5, 0, 7, 6, 6, 4, 4, 1][id];
        (, uint8 composition,) = BeltGen.section(0, 0, BodyId.indexOf(id));
        return 10 + composition;
    }
}
