// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Pilots} from "../pilots/Pilots.sol";

/// @title The Orbiter 8, drawn from what it carries (docs/demo4-plan.md, section 7; D25)
/// @notice Koda's Orbiter 8 as it flies, with what changes its shape (redrawn 2026-11-22,
/// docs/mockups/ship-upgrades/): railguns beside the fuselage's shoulders, missile ports set into the
/// fuselage, point-defense dots on its edge, armor plating cut to the hull, a shield that is the ship's
/// own outline in blue, longer pods for longer range, and damage in pink. What's fitted inside (cargo
/// holds, drone bays, repair bots) doesn't show on a ship flying by, so it isn't drawn here. The NFT's
/// image and the client's ship are the same drawing: sdk/src/ship-art.js builds the identical string.
/// Coordinates are the hull's own (about 4,600 across, nose up, centered on 0).
library ShipArt {
    using Strings for uint256;
    using Strings for int256;

    string internal constant HULL =
        "M2303 0c0,0 0,0 0,0 233,0 443,102 598,259 151,152 249,355 249,588 0,332 0,663 0,995l0 100c170,37 340,84 510,138 12,-109 63,-204 137,-279 87,-88 204,-146 335,-146 0,0 0,0 0,0 130,0 247,58 334,146 85,85 140,198 140,328 0,117 0,234 0,351 0,117 0,234 0,351 -67,27 -135,50 -202,68l12 72c4,27 8,53 12,79 9,51 17,101 25,150 -53,27 -106,50 -161,62 -53,13 -107,17 -160,17 -54,0 -108,-4 -161,-17 -54,-12 -107,-35 -161,-62 8,-49 17,-99 25,-151 4,-25 8,-51 13,-78 3,-24 7,-48 11,-72 -67,-18 -134,-41 -201,-68 0,-117 0,-234 0,-351l0 -96c-170,-54 -339,-100 -508,-137l0 589c-135,56 -269,102 -404,136l13 81c6,42 13,84 20,125 13,82 27,163 40,243 -86,42 -171,79 -258,99 -85,20 -172,27 -258,27 -86,0 -173,-7 -258,-27 -87,-20 -173,-57 -258,-99 13,-80 26,-161 40,-243 7,-41 13,-83 20,-125 4,-27 8,-54 13,-81 -135,-34 -269,-81 -404,-136l0 -589c-169,37 -338,83 -508,137l0 96c0,117 0,234 0,351 -67,27 -134,50 -201,68l11 72c4,27 8,53 13,79 8,51 16,101 25,150 -54,27 -107,50 -161,62 -53,13 -107,17 -161,17 -54,0 -108,-4 -161,-17 -54,-12 -107,-35 -161,-62 9,-49 17,-99 26,-151 4,-25 8,-51 12,-78 4,-24 8,-48 11,-72 -67,-18 -134,-41 -201,-68 0,-117 0,-234 0,-351 0,-117 0,-234 0,-351 0,-130 55,-243 139,-328 87,-88 205,-146 335,-146 0,0 0,0 0,0 130,0 248,58 335,146 74,75 125,170 137,279 170,-54 340,-101 510,-138l0 -100c0,-332 0,-663 0,-995 0,-233 97,-436 249,-589 155,-156 365,-258 598,-258z";

    function svg(Pilots.Ship memory ship, bool scarred) internal pure returns (string memory) {
        Pilots.Loadout memory l = ship.loadout;
        string memory long = _pods(ship.range);
        bool isLong = bytes(long).length > 0;
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2800 -2800 5600 5600">',
            '<rect x="-2800" y="-2800" width="5600" height="5600" fill="#160631"/>',
            string.concat(
                '<defs><path id="h" transform="translate(-2300,-2300)" d="',
                HULL,
                '"/>',
                isLong ? string.concat('<path id="p" d="', long, '"/>') : "",
                '<clipPath id="c"><use href="#h"/></clipPath></defs>'
            ),
            _shield(l.shields, isLong),
            _railguns(l.railguns),
            '<use href="#h" fill="#e6dcf5" stroke="#8f7fb0" stroke-width="40"/>',
            isLong
                ? '<use href="#p" fill="#e6dcf5" stroke="#8f7fb0" stroke-width="40" stroke-linejoin="round"/><rect x="-2278" y="300" width="916" height="60" fill="#e6dcf5"/><rect x="1362" y="300" width="916" height="60" fill="#e6dcf5"/>'
                : "",
            _armor(l.armor),
            _missiles(l.missiles),
            _turrets(l.pointDefense),
            scarred || ship.rangeLost > 0 || ship.baysLost > 0 ? _scars() : "",
            "</svg>"
        );
    }

    /// One longer pod: the pod's lower end again, `len` further down.
    function _pod(int256[6] memory x, uint256 len) private pure returns (string memory) {
        return string.concat(
            string.concat("M", x[0].toStringSigned(), " 330V", (640 + len).toString(), "L", x[1].toStringSigned(), " "),
            string.concat((700 + len).toString(), "V", (800 + len).toString(), "L", x[2].toStringSigned(), " "),
            string.concat((950 + len).toString(), "H", x[3].toStringSigned(), "L", x[4].toStringSigned(), " "),
            string.concat((800 + len).toString(), "V", (700 + len).toString(), "L", x[5].toStringSigned(), " "),
            string.concat((640 + len).toString(), "V330z")
        );
    }

    /// Longer range: the pods themselves are longer, 170 a step (they hold the capacitor bank). Empty at range 1.
    function _pods(uint8 range) private pure returns (string memory) {
        uint256 r = range > 4 ? 4 : range < 1 ? 1 : range;
        uint256 len = (r - 1) * 170;
        if (len == 0) return "";
        return string.concat(
            _pod([int256(-2298), -2130, -2200, -1440, -1510, -1342], len),
            _pod([int256(1342), 1510, 1440, 2200, 2130, 2298], len)
        );
    }

    /// The ship's own outline, fat and blue, behind it; fatter each level; it breathes.
    function _shield(uint8 levels, bool isLong) private pure returns (string memory) {
        if (levels == 0) return "";
        return string.concat(
            '<g fill="none" stroke="#7fd4ff" stroke-width="',
            (180 + uint256(levels) * 130).toString(),
            '" stroke-linejoin="round"><use href="#h"/>',
            isLong ? '<use href="#p"/>' : "",
            '<animate attributeName="stroke-opacity" values="0.9;0.45;0.9" dur="5s" repeatCount="indefinite"/></g>'
        );
    }

    /// Twin rails with a breech: one beside each shoulder of the fuselage, the third down the spine.
    function _railguns(uint8 count) private pure returns (string memory out) {
        int16[3] memory xs = [int16(-960), 960, 0];
        int16[3] memory tops = [int16(-1950), -1950, -2600];
        uint16[3] memory lengths = [uint16(1250), 1250, 760];
        for (uint256 i = 0; i < count && i < 3; i++) {
            int256 x = xs[i];
            int256 t = tops[i];
            string memory len = uint256(lengths[i]).toString();
            out = string.concat(
                out,
                string.concat(
                    '<g fill="#e6dcf5" stroke="#8f7fb0" stroke-width="26"><rect x="',
                    (x - 78).toStringSigned(),
                    '" y="',
                    t.toStringSigned(),
                    '" width="52" height="',
                    len,
                    '"/>'
                ),
                string.concat('<rect x="', (x + 26).toStringSigned(), '" y="', t.toStringSigned(), '" width="52" height="', len, '"/>'),
                string.concat(
                    '<rect x="',
                    (x - 105).toStringSigned(),
                    '" y="',
                    (t + int256(uint256(lengths[i])) - 360).toStringSigned(),
                    '" width="210" height="320" rx="44"/>'
                ),
                string.concat('<rect x="', (x - 92).toStringSigned(), '" y="', (t + 220).toStringSigned(), '" width="184" height="64"/></g>')
            );
        }
    }

    /// Plating cut to the hull's shape, growing back from the nose and the pods' fronts, further each level.
    function _armor(uint8 levels) private pure returns (string memory) {
        if (levels == 0) return "";
        int256 n = levels > 5 ? int256(5) : int256(uint256(levels));
        int256 fy = -1820 + n * 290;
        int256 py = -430 + n * 190;
        return string.concat(
            string.concat(
                '<g clip-path="url(#c)" fill="#b9a6d6"><rect x="-900" y="-2400" width="1800" height="',
                (fy + 2400).toStringSigned(),
                '"/>'
            ),
            string.concat(
                '<rect x="-2400" y="-800" width="1160" height="',
                (py + 800).toStringSigned(),
                '"/><rect x="1240" y="-800" width="1160" height="',
                (py + 800).toStringSigned(),
                '"/>'
            ),
            string.concat(
                '<path d="M-900 ',
                fy.toStringSigned(),
                "h1800M-2400 ",
                py.toStringSigned(),
                "h1160M1240 ",
                py.toStringSigned(),
                'h1160" stroke="#8f7fb0" stroke-width="50"/></g>'
            )
        );
    }

    /// Six round ports a rack, set into the fuselage, a rack below a rack. Never on the pods: those are engines.
    function _missiles(uint8 count) private pure returns (string memory out) {
        for (uint256 i = 0; i < count && i < 3; i++) {
            for (uint256 k = 0; k < 6; k++) {
                out = string.concat(
                    out,
                    '<circle cx="',
                    (int256(-240) + int256(k % 3) * 240).toStringSigned(),
                    '" cy="',
                    (int256(-1150) + int256(i) * 560 + int256(k / 3) * 240).toStringSigned(),
                    '" r="80" fill="#2a1a4a"/>'
                );
            }
        }
    }

    /// Dots in the hull's own color on its edge, in pairs: the nose, then down the fuselage's sides.
    function _turrets(uint8 count) private pure returns (string memory out) {
        int16[6] memory xs = [int16(-600), 600, -847, 847, -847, 847];
        int16[6] memory ys = [int16(-2051), -2051, -40, -40, 300, 300];
        for (uint256 i = 0; i < count && i < 6; i++) {
            out = string.concat(
                out,
                '<circle cx="',
                int256(xs[i]).toStringSigned(),
                '" cy="',
                int256(ys[i]).toStringSigned(),
                '" r="125" fill="#e6dcf5"/>'
            );
        }
    }

    /// Cracks in pink (it needs you).
    function _scars() private pure returns (string memory) {
        return '<g fill="none" stroke="#ff6fb0" stroke-width="56" stroke-linecap="round" stroke-linejoin="round"><path d="M-1050 620l190 150l-130 170l250 130"/><path d="M180 -1020l-150 140l170 120"/><path d="M1620 550l150 170l-190 120"/></g>';
    }
}
