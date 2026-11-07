// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ModuleBase} from "../core/ModuleBase.sol";

/// @title Ships, as NFTs (docs/demo4-plan.md, sections 1 and 3; D26)
/// @notice Each Orbiter 8 is an ERC-721, minted to its pilot at registration. The ship's data (where
/// it is, its bays, cargo and range) lives in `Pilots`; this contract is the ownership record, and in
/// milestone 5 it draws the ship as an on-chain SVG. **Ships can't change hands in this run:** a pilot
/// flies exactly one, and fleets and ship trading come later (D26).
contract Ships is ERC721Upgradeable, ModuleBase {
    error ShipsAreBound();

    function initialize(address admin) external initializer {
        __ERC721_init("Orbiter 8", "ORB8");
        __ModuleBase_init(admin);
    }

    function mint(address to, uint256 shipId) external onlyRole(GAME_MODULE) {
        _mint(to, shipId);
    }

    /// Only minting goes through; transfers wait for fleets (D26).
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (_ownerOf(tokenId) != address(0)) revert ShipsAreBound();
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 id)
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(id);
    }
}
