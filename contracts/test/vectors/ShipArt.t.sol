// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test, console} from "forge-std/Test.sol";
import {GameFixture} from "../market/Market.t.sol";
import {Pilots} from "../../src/pilots/Pilots.sol";
import {ShipArt} from "../../src/art/ShipArt.sol";

/// The ship's picture: the NFT's tokenURI works, and the client's sdk/v4/ship-art.js draws the same
/// string (it pins the hashes printed here).
contract ShipArtTest is GameFixture {
    function _ship(uint16 bays, Pilots.Loadout memory l, uint8 rangeLost) internal pure returns (Pilots.Ship memory s) {
        s.name = "Ledger";
        s.range = 3;
        s.bays = bays;
        s.loadout = l;
        s.rangeLost = rangeLost;
    }

    function test_printVectors() public pure {
        console.logBytes32(keccak256(bytes(ShipArt.svg(_ship(5, Pilots.Loadout(0, 0, 0, 0, 0, 0, 0), 0), false))));
        console.logBytes32(keccak256(bytes(ShipArt.svg(_ship(230, Pilots.Loadout(25, 2, 1, 2, 1, 3, 2), 1), false))));
    }

    function test_tokenURIDescribesTheShip() public view {
        string memory uri = ships.tokenURI(1);
        assertGt(bytes(uri).length, 1000);
        assertEq(_prefix(uri, 29), "data:application/json;base64,");
    }

    function _prefix(string memory s, uint256 n) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        bytes memory out = new bytes(n);
        for (uint256 i = 0; i < n; i++) {
            out[i] = b[i];
        }
        return string(out);
    }
}
