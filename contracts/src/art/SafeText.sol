// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

/// @title Player-given text, made safe to put in an NFT's JSON and SVG
/// @notice Names and call signs may hold any bytes; a quote, backslash, angle bracket, ampersand or
/// control character would break the metadata's JSON or the picture's SVG. Each becomes a space.
library SafeText {
    function clean(string memory text) internal pure returns (string memory) {
        bytes memory b = bytes(text);
        bytes memory out = new bytes(b.length);
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            out[i] = (c < 0x20 || c == '"' || c == "\\" || c == "<" || c == ">" || c == "&") ? bytes1(" ") : c;
        }
        return string(out);
    }
}
