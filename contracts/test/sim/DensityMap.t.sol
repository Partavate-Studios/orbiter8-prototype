// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test, console2} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Galaxy} from "../../src/galaxy/Galaxy.sol";
import {HexMath} from "../../src/galaxy/HexMath.sol";

/// Galaxy with its scan opened up, for the simulation only.
contract GalaxySim is Galaxy {
    function scanAt(uint256 cell, bytes32 rnd, uint8 originCrowd) external {
        _applyScan(cell, rnd, originCrowd);
    }
}

/// A large region explored with the contracts' own scan rules (ScanRules, Spiral, Galaxy), for judging
/// star density by eye (Koda, 2026-11-19). Skipped unless DENSITY_MAP=1; prints every cell for
/// orbiter-client/dev/sim/density-map.mjs to draw:
///   DENSITY_MAP=1 RINGS=40 forge test --match-contract DensityMap -vv > out.txt
/// Exploration is breadth-first from Sol: every star reached is scanned once (its origin is the star it
/// was reached from), and a black hole's far side is scanned as a traveler coming out of it would.
contract DensityMap is Test {
    function test_densityMap() public {
        if (!vm.envOr("DENSITY_MAP", false)) return;
        vm.pauseGasMetering();
        uint256 rings = vm.envOr("RINGS", uint256(40));
        bytes32 seed = vm.envOr("SEED", keccak256("orbiter8 demo 4"));
        GalaxySim g = GalaxySim(
            address(new ERC1967Proxy(address(new GalaxySim()), abi.encodeCall(Galaxy.initialize, (address(this), seed, 30))))
        );
        uint256 maxCell = 3 * rings * (rings + 1); // the last cell of ring `rings`
        uint256[] memory queue = new uint256[](maxCell + 1);
        uint256[] memory from = new uint256[](maxCell + 1);
        bool[] memory queued = new bool[](maxCell + 1);
        (uint256 head, uint256 tail) = (0, 0);
        // Sol is charted at genesis: start from its neighbors that hold stars
        queued[0] = true;
        uint256[6] memory around = HexMath.neighbors(0);
        for (uint256 i = 0; i < 6; i++) {
            if (!_isStar(g, around[i])) continue;
            queued[around[i]] = true;
            (queue[tail], from[tail]) = (around[i], 0);
            tail++;
        }
        uint256 scans;
        while (head < tail) {
            (uint256 cell, uint256 origin) = (queue[head], from[head]);
            head++;
            g.scanAt(cell, keccak256(abi.encode(seed, "sim", cell)), _crowd(g, origin));
            scans++;
            uint256[6] memory n = HexMath.neighbors(cell);
            for (uint256 i = 0; i < 6; i++) {
                uint256 c = n[i];
                if (c > maxCell || queued[c] || !_isStar(g, c)) continue;
                queued[c] = true;
                (queue[tail], from[tail]) = (c, cell);
                tail++;
                if (g.stateOf(c) == g.BLACK_HOLE()) {
                    uint256 p = g.partnerOf(c);
                    if (p <= maxCell && !queued[p]) {
                        queued[p] = true;
                        (queue[tail], from[tail]) = (p, c);
                        tail++;
                    }
                }
            }
        }
        console2.log("SCANS", scans);
        for (uint256 c = 0; c <= maxCell; c++) {
            console2.log(string.concat("CELL ", vm.toString(c), " ", vm.toString(uint256(g.stateOf(c))), " ", vm.toString(g.densityOf(c))));
        }
    }

    function _isStar(GalaxySim g, uint256 c) private view returns (bool) {
        uint8 s = g.stateOf(c);
        return s == g.STAR() || s == g.BLACK_HOLE();
    }

    function _crowd(GalaxySim g, uint256 origin) private view returns (uint8 n) {
        uint256[6] memory around = HexMath.neighbors(origin);
        for (uint256 i = 0; i < 6; i++) if (_isStar(g, around[i])) n++;
    }
}
