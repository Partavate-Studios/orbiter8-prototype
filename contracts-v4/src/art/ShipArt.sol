// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Pilots} from "../pilots/Pilots.sol";

/// @title The Orbiter 8, drawn from what it carries (docs/demo4-plan.md, section 7; D25)
/// @notice Koda's Orbiter 8 hull with its parts drawn over it: railgun barrels, missile racks,
/// point-defense turrets, drone bays, armor plating, a shield shimmer, repair-bot pods, cargo pods and
/// damage marks. The NFT's image and the client's ship are the same drawing: orbiter-client
/// sdk/v4/ship-art.js builds the identical string. Coordinates are the hull's own (about 4,600 across,
/// nose up, centered on 0).
library ShipArt {
    using Strings for uint256;
    using Strings for int256;

    string internal constant HULL =
        "M2303 0c0,0 0,0 0,0 233,0 443,102 598,259 151,152 249,355 249,588 0,332 0,663 0,995l0 100c170,37 340,84 510,138 12,-109 63,-204 137,-279 87,-88 204,-146 335,-146 0,0 0,0 0,0 130,0 247,58 334,146 85,85 140,198 140,328 0,117 0,234 0,351 0,117 0,234 0,351 -67,27 -135,50 -202,68l12 72c4,27 8,53 12,79 9,51 17,101 25,150 -53,27 -106,50 -161,62 -53,13 -107,17 -160,17 -54,0 -108,-4 -161,-17 -54,-12 -107,-35 -161,-62 8,-49 17,-99 25,-151 4,-25 8,-51 13,-78 3,-24 7,-48 11,-72 -67,-18 -134,-41 -201,-68 0,-117 0,-234 0,-351l0 -96c-170,-54 -339,-100 -508,-137l0 589c-135,56 -269,102 -404,136l13 81c6,42 13,84 20,125 13,82 27,163 40,243 -86,42 -171,79 -258,99 -85,20 -172,27 -258,27 -86,0 -173,-7 -258,-27 -87,-20 -173,-57 -258,-99 13,-80 26,-161 40,-243 7,-41 13,-83 20,-125 4,-27 8,-54 13,-81 -135,-34 -269,-81 -404,-136l0 -589c-169,37 -338,83 -508,137l0 96c0,117 0,234 0,351 -67,27 -134,50 -201,68l11 72c4,27 8,53 13,79 8,51 16,101 25,150 -54,27 -107,50 -161,62 -53,13 -107,17 -161,17 -54,0 -108,-4 -161,-17 -54,-12 -107,-35 -161,-62 9,-49 17,-99 26,-151 4,-25 8,-51 12,-78 4,-24 8,-48 11,-72 -67,-18 -134,-41 -201,-68 0,-117 0,-234 0,-351 0,-117 0,-234 0,-351 0,-130 55,-243 139,-328 87,-88 205,-146 335,-146 0,0 0,0 0,0 130,0 248,58 335,146 74,75 125,170 137,279 170,-54 340,-101 510,-138l0 -100c0,-332 0,-663 0,-995 0,-233 97,-436 249,-589 155,-156 365,-258 598,-258z";

    function svg(Pilots.Ship memory ship, bool scarred) internal pure returns (string memory) {
        Pilots.Loadout memory l = ship.loadout;
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2800 -2800 5600 5600">',
            '<rect x="-2800" y="-2800" width="5600" height="5600" fill="#160631"/>',
            _shield(l.shields),
            _cargo(ship.bays),
            string.concat(
                '<path transform="translate(-2300,-2300)" d="',
                HULL,
                '" fill="#e6dcf5" stroke="#8f7fb0" stroke-width="',
                (40 + uint256(l.armor) * 50).toString(),
                '"/>'
            ),
            _railguns(l.railguns),
            _missiles(l.missiles),
            _turrets(l.pointDefense),
            _drones(l.drones),
            _bots(l.repairBots),
            scarred || ship.rangeLost > 0 || ship.baysLost > 0 ? _scars() : "",
            "</svg>"
        );
    }

    function _shield(uint8 levels) private pure returns (string memory) {
        if (levels == 0) return "";
        return string.concat(
            '<ellipse cx="0" cy="200" rx="2700" ry="2650" fill="#7fd4ff" fill-opacity="0.',
            (uint256(levels) * 6).toString(),
            '" stroke="#7fd4ff" stroke-width="',
            (uint256(levels) * 30).toString(),
            '"/>'
        );
    }

    /// One pod under the body for every 50 bays.
    function _cargo(uint16 bays) private pure returns (string memory out) {
        uint256 pods = bays / 50;
        for (uint256 i = 0; i < pods; i++) {
            out = string.concat(
                out, '<rect x="-260" y="', (1700 + i * 170).toString(), '" width="520" height="140" rx="60" fill="#b9a6d6"/>'
            );
        }
    }

    /// Barrels forward of the wing pods, then the nose.
    function _railguns(uint8 count) private pure returns (string memory out) {
        int16[3] memory xs = [int16(-1800), 1800, 0];
        int16[3] memory tops = [int16(-1500), -1500, -2700];
        for (uint256 i = 0; i < count && i < 3; i++) {
            out = string.concat(
                out,
                '<rect x="',
                (int256(xs[i]) - 50).toStringSigned(),
                '" y="',
                int256(tops[i]).toStringSigned(),
                '" width="100" height="900" fill="#ffd65c"/>'
            );
        }
    }

    /// Three tubes a rack, on the wings.
    function _missiles(uint8 count) private pure returns (string memory out) {
        int16[3] memory xs = [int16(-1250), 1050, -100];
        for (uint256 i = 0; i < count && i < 3; i++) {
            out = string.concat(
                out,
                '<g fill="#ff8a5c"><rect x="',
                int256(xs[i]).toStringSigned(),
                '" y="-100" width="60" height="320"/><rect x="',
                (int256(xs[i]) + 70).toStringSigned(),
                '" y="-100" width="60" height="320"/><rect x="',
                (int256(xs[i]) + 140).toStringSigned(),
                '" y="-100" width="60" height="320"/></g>'
            );
        }
    }

    function _turrets(uint8 count) private pure returns (string memory out) {
        int16[6] memory xs = [int16(0), -700, 700, -1800, 1800, 0];
        int16[6] memory ys = [int16(-1300), 300, 300, 500, 500, 900];
        for (uint256 i = 0; i < count && i < 6; i++) {
            out = string.concat(
                out,
                '<circle cx="',
                int256(xs[i]).toStringSigned(),
                '" cy="',
                int256(ys[i]).toStringSigned(),
                '" r="110" fill="#5cffc8"/>'
            );
        }
    }

    /// A chevron for every ten drones (at least one), down the spine.
    function _drones(uint16 count) private pure returns (string memory out) {
        if (count == 0) return "";
        uint256 marks = (uint256(count) + 9) / 10;
        if (marks > 8) marks = 8;
        for (uint256 i = 0; i < marks; i++) {
            uint256 y = 400 + i * 130;
            out = string.concat(
                out,
                '<path d="M-150 ',
                y.toString(),
                "l150 90l150 -90",
                '" fill="none" stroke="#c38bff" stroke-width="50"/>'
            );
        }
    }

    function _bots(uint8 count) private pure returns (string memory out) {
        for (uint256 i = 0; i < count && i < 6; i++) {
            out = string.concat(
                out,
                '<rect x="',
                (i % 2 == 0 ? int256(-520) : int256(400)).toStringSigned(),
                '" y="',
                (1000 + (i / 2) * 200).toString(),
                '" width="120" height="140" rx="40" fill="#9effa0"/>'
            );
        }
    }

    function _scars() private pure returns (string memory) {
        return '<g fill="#1c0838" fill-opacity="0.7"><circle cx="-900" cy="900" r="160"/><circle cx="300" cy="-600" r="120"/><circle cx="1500" cy="1400" r="140"/></g>';
    }
}
