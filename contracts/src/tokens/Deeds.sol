// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ModuleBase} from "../core/ModuleBase.sol";

/// @title Planet deeds, as NFTs (docs/demo4-plan.md, section 1)
/// @notice One ERC-721 per claimed planet, its id the planet's (`cell << 8 | body`), minted to whoever
/// claims it. Owners can't trade planets in this run; the game moves a deed when a siege's claim
/// succeeds (milestone 4).
contract Deeds is ERC721Upgradeable, ModuleBase {
    error DeedsAreBound();

    function initialize(address admin) external initializer {
        __ERC721_init("Orbiter 8 Planets", "O8P");
        __ModuleBase_init(admin);
    }

    function mint(address to, uint256 planet) external onlyRole(GAME_MODULE) {
        _mint(to, planet);
    }

    /// Hands a planet to a new owner (a successful siege claim).
    function seize(address to, uint256 planet) external onlyRole(GAME_MODULE) {
        _transfer(_requireOwned(planet), to, planet);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (auth != address(0)) revert DeedsAreBound(); // players' transfers; the game's pass auth = 0
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
