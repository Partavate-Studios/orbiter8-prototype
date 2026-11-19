// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title A deed's picture: the planet or asteroid as a playing card (D107)
/// @notice Drawn on demand from the body as it is now: its class colors, its settlement (the Citadel's
/// gun, the Colony's lights), its station and what the station has (the port's docking collars, the
/// yards' cradle, the armory's guns, the autofactory), as the game draws them (Koda's station design,
/// docs/mockups/stages/, system E). Its own contract, so Deeds stays small and the art can be redrawn.
contract DeedArt {
    using Strings for uint256;

    struct Deed {
        bool asteroid;
        uint8 class; // a planet's class (0-9), or an asteroid's composition (0-2)
        uint8 size;
        uint8 level;
        bool autofactory;
        string name; // already safe (SafeText)
        string kind; // e.g. "Rocky planet, size 5"
        string built; // e.g. "Colony"
        string owner; // the owner's call sign, already safe
    }

    /// The space station's hull (orbiter-client sprites/station.svg.vue), 580 units across.
    string internal constant STATION =
        "M291 0l61 35 15 -25 139 80 -15 25 61 36 0 71 28 0 0 160 -28 0 0 70 -63 36 14 24 -139 80 -14 -24 -59 34 -63 -37 -15 26 -139 -80 15 -26 -59 -33 0 -73 -30 0 0 -160 30 0 0 -68 62 -36 -15 -26 139 -81 15 27 60 -35zm83 196c47,36 64,100 42,155l-98 -57 56 -98zm22 188c-36,47 -99,63 -154,42l56 -99 98 57zm-188 22c-46,-36 -63,-100 -41,-154l98 56 -57 98zm-22 -188c37,-46 100,-63 155,-41l-57 98 -98 -57z";

    function svg(Deed memory d) external pure returns (string memory) {
        string memory frame = _frame(d);
        return string.concat(_head(d, frame), d.asteroid ? _asteroid(d) : _planet(d), _footer(d, frame), "</svg>");
    }

    /// The card: the gradient for the body, the frame, the dark inside, and the name on the title band.
    function _head(Deed memory d, string memory frame) private pure returns (string memory) {
        (string memory light, string memory mid, string memory dark) = _shades(d);
        string memory defs = string.concat(
            '<defs><radialGradient id="b" cx="30%" cy="50%" r="80%" fx="15%" fy="50%"><stop offset="0" stop-color="#',
            light,
            '"/><stop offset=".55" stop-color="#',
            mid,
            '"/><stop offset="1" stop-color="#',
            dark,
            '"/></radialGradient></defs>'
        );
        string memory card = string.concat(
            '<rect width="600" height="840" rx="36" fill="#',
            frame,
            '"/><rect x="16" y="16" width="568" height="808" rx="26" fill="#1a1030"/><rect x="40" y="40" width="520" height="66" rx="33" fill="#',
            frame,
            '"/>'
        );
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 840" font-family="Ubuntu,sans-serif">',
            defs,
            card,
            '<text x="300" y="84" text-anchor="middle" font-size="30" font-weight="700" fill="#160631">',
            d.name,
            "</text>"
        );
    }

    // ── the picture ─────────────────────────────────────────────────────────────────────────────

    /// The planet (lit from the left), its settlement, and its station up and to the right.
    function _planet(Deed memory d) private pure returns (string memory out) {
        uint256 r = 100 + uint256(d.size) * 5; // 105 to 160
        out = string.concat('<circle cx="245" cy="430" r="', r.toString(), '" fill="url(#b)"/>');
        if (d.level >= 1) {
            // the Citadel's gun, on the limb, up and to the right
            out = string.concat(
                out,
                '<g transform="translate(245 430) rotate(-50) translate(',
                r.toString(),
                ' 0)" fill="#f4eefc"><circle r="16"/><rect y="-6" width="38" height="12" rx="6"/></g>'
            );
        }
        if (d.level >= 2) out = string.concat(out, _lights(r));
        if (d.level >= 3) out = string.concat(out, _station(466, 210, 2.2e3, d.level, d.autofactory, false));
    }

    /// A colony's lights, on the night side (right).
    function _lights(uint256 r) private pure returns (string memory out) {
        out = '<g fill="#fbf6ff">';
        uint16[14] memory p = [uint16(52), 40, 64, 24, 40, 62, 74, 52, 26, 80, 56, 82, 82, 14];
        for (uint256 i = 0; i < 14; i += 2) {
            out = string.concat(
                out,
                '<circle cx="',
                (245 + (uint256(p[i]) * r) / 100).toString(),
                '" cy="',
                (430 + (uint256(p[i + 1]) * r) / 100 - (r * 30) / 100).toString(),
                '" r="4"/>'
            );
        }
        out = string.concat(out, "</g>");
    }

    /// The asteroid, its works (the Platform's footing, the Mine's derrick and drones) and its station.
    function _asteroid(Deed memory d) private pure returns (string memory out) {
        out = string.concat(
            '<g transform="translate(300 420) scale(',
            (14 + uint256(d.size)).toString(),
            ')"><path d="M-7 -7Q-3 -10 1 -9Q6 -10 8 -6Q10 -2 9 2Q9 6 5 8Q2 10 -3 9Q-8 9 -9 5Q-11 1 -9 -3Q-9 -6 -7 -7Z" fill="url(#b)"/>',
            '<g fill="#000" opacity=".25"><ellipse cx="2" cy="-2" rx="2" ry="1.6"/><ellipse cx="-4.4" cy="-3.6" rx="1.2" ry="1"/><ellipse cx="-3.2" cy="4.8" rx="1" ry=".8"/></g></g>'
        );
        if (d.level >= 1) out = string.concat(out, '<ellipse cx="300" cy="420" rx="96" ry="80" fill="#000" opacity=".3"/>');
        if (d.level >= 2) {
            // the derrick, down and to the left, and its drones
            out = string.concat(
                out,
                '<g transform="translate(205 510) rotate(130) scale(.8)" fill="#f4eefc"><rect x="-8" y="-35" width="17" height="70" rx="8"/><path d="M8 -27L75 -13L75 13L8 27Z"/><path d="M20 -15L42 -10L42 10L20 15Z" fill="#2a2140"/><rect x="70" y="-7" width="30" height="14" rx="7"/></g>',
                '<g fill="#f4eefc"><path d="M138 566l-18 -16 6 16 -6 16z"/><path d="M118 506l-18 -16 6 16 -6 16z"/><path d="M190 600l-18 -16 6 16 -6 16z"/></g>'
            );
        }
        // the station at the rock's middle: the bare core until the Port (4), then its parts
        if (d.level >= 1) out = string.concat(out, _station(300, 410, 2.3e3, d.level >= 4 ? d.level : 3, false, true));
    }

    /// The station: the hull and, from the Port on, the port's collars (three pads), then the yards
    /// (planets only), the armory's guns and the autofactory. `scaleMilli`: the 120-unit art's scale × 1000.
    function _station(uint256 x, uint256 y, uint256 scaleMilli, uint8 level, bool autofactory, bool asteroid)
        private
        pure
        returns (string memory out)
    {
        string memory at = string.concat(x.toString(), " ", y.toString());
        out = string.concat('<g transform="translate(', at, ") scale(", _milli(scaleMilli), ')" fill="#f4eefc">');
        if (level >= 4) {
            out = string.concat(
                out, _part(0, _COLLAR), _part(120, _COLLAR), _part(240, _COLLAR)
            );
        }
        if (level >= 5 && !asteroid) out = string.concat(out, _part(180, _YARDS));
        if (level >= 6) out = string.concat(out, _part(300, _GUNS));
        if (autofactory) out = string.concat(out, _part(60, _FACTORY));
        out = string.concat(out, '<g transform="scale(.075) translate(-290 -301)"><path fill-rule="evenodd" d="', STATION, '"/></g></g>');
    }

    // The parts, each drawn pointing out along +x from the hull's face (22 units out).
    string private constant _COLLAR =
        '<rect x="-1" y="-1.7" width="4" height="3.4" rx="1.7" fill="#c9b8e6"/><rect x="2.5" y="-5" width="3" height="10" rx="1.5"/><rect x="-5" y="-11.6" width="7" height="4.2" rx="2.1" transform="rotate(90 -1.5 -9.5)"/><rect x="-5" y="7.4" width="7" height="4.2" rx="2.1" transform="rotate(90 -1.5 9.5)"/>';
    string private constant _YARDS =
        '<rect x="-1" y="-1.7" width="4" height="3.4" rx="1.7" fill="#c9b8e6"/><path d="M2.5 -10H21a1.6 1.6 0 0 1 0 3.2H5.7V6.8H21a1.6 1.6 0 0 1 0 3.2H2.5Z"/><path d="M8 -3L20 0L8 3L10.5 0Z" fill="#c9b8e6"/>';
    string private constant _GUNS =
        '<rect x="-1" y="-1.7" width="4" height="3.4" rx="1.7" fill="#c9b8e6"/><rect x="2.5" y="-9" width="3" height="18" rx="1.5"/><circle cx="8.5" cy="-4.6" r="4.2"/><rect x="8.5" y="-6" width="11" height="2.8" rx="1.4"/><circle cx="8.5" cy="4.6" r="4.2"/><rect x="8.5" y="3.2" width="11" height="2.8" rx="1.4"/>';
    string private constant _FACTORY =
        '<rect x="-1" y="-1.7" width="4" height="3.4" rx="1.7" fill="#c9b8e6"/><rect x="2.5" y="-7" width="13" height="14" rx="2.5"/><rect x="15.5" y="-2.5" width="3.5" height="5" rx="1.5"/><g fill="#2a2140"><rect x="5" y="-4" width="1.7" height="8"/><rect x="8.3" y="-4" width="1.7" height="8"/><rect x="11.6" y="-4" width="1.7" height="8"/></g>';

    function _part(uint256 angle, string memory part) private pure returns (string memory) {
        return string.concat('<g transform="rotate(', angle.toString(), ') translate(22 0)">', part, "</g>");
    }

    function _milli(uint256 m) private pure returns (string memory) {
        string memory frac = (m % 1000).toString();
        if (m % 1000 < 10) frac = string.concat("00", frac);
        else if (m % 1000 < 100) frac = string.concat("0", frac);
        return string.concat((m / 1000).toString(), ".", frac);
    }

    // ── the card's text ─────────────────────────────────────────────────────────────────────────

    function _footer(Deed memory d, string memory frame) private pure returns (string memory) {
        string memory labels = string.concat(
            '<rect x="40" y="640" width="520" height="160" rx="18" fill="#241a3d"/>',
            '<g font-size="24" fill="#a99bc4"><text x="64" y="684">Kind</text><text x="64" y="728">Built</text><text x="64" y="772">Owner</text></g>',
            '<g font-size="24" font-weight="700" text-anchor="end" fill="#',
            frame,
            '">'
        );
        string memory values = string.concat(
            '<text x="536" y="684">', d.kind, '</text><text x="536" y="728">', d.built, "</text>"
        );
        return string.concat(labels, values, '<text x="536" y="772">', d.owner, "</text></g>");
    }

    /// The card's frame color (orbiter-client libs/palette.js PLANET_COLORS card; the asteroids' art).
    function _frame(Deed memory d) private pure returns (string memory) {
        if (d.asteroid) return d.class == 0 ? "9a8478" : d.class == 1 ? "a5917c" : "8f98a6";
        string[10] memory f =
            ["2f7fd9", "8a80a3", "1e8fd8", "e5823e", "5fb8e8", "c2413a", "d97aa8", "b0623f", "ff6a1f", "3fae6a"];
        return f[d.class < 10 ? d.class : 1];
    }

    /// The body's light, mid and dark shades (PLANET_COLORS; the asteroids' art).
    function _shades(Deed memory d) private pure returns (string memory, string memory, string memory) {
        if (d.asteroid) {
            if (d.class == 0) return ("4c3f39", "3b302d", "241c1e");
            if (d.class == 1) return ("bfab92", "a5917c", "786a60");
            return ("a7b0be", "8f98a6", "7d8592");
        }
        string[10] memory l =
            ["a8e6ff", "efe8f7", "9ff0ff", "ffe0b0", "f2fdff", "b0566a", "ffe4c4", "f0c2ac", "fff0a0", "d6f7a6"];
        string[10] memory m =
            ["2f7fd9", "9a8fb2", "1e8fd8", "e5823e", "9adfff", "5a1424", "e58fb5", "a5583c", "ff6a1f", "3fae6a"];
        string[10] memory k =
            ["1a2a6e", "352d4f", "122a6e", "5e2440", "33569e", "1c0618", "5e2a78", "3e1a32", "7a1230", "163f4a"];
        uint8 c = d.class < 10 ? d.class : 1;
        return (l[c], m[c], k[c]);
    }
}
