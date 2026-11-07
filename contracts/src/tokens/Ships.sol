// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ModuleBase} from "../core/ModuleBase.sol";
import {Pilots} from "../pilots/Pilots.sol";
import {ShipArt} from "../art/ShipArt.sol";

/// @title Ships, as NFTs (docs/demo4-plan.md, sections 1 and 3; D26)
/// @notice Each Orbiter 8 is an ERC-721, minted to its pilot at registration. The ship's data (where
/// it is, its bays, cargo and range) lives in `Pilots`; this contract is the ownership record, and in
/// draws the ship as an on-chain SVG from what it carries (`ShipArt`). **Ships can't change hands in this run:** a pilot
/// flies exactly one, and fleets and ship trading come later (D26).
contract Ships is ERC721Upgradeable, ModuleBase {
    using Strings for uint256;

    /// @custom:storage-location erc7201:orbiter8.ships
    struct ShipsStorage {
        Pilots pilots;
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.ships")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant SHIPS_SLOT = 0x0d55b410c5a1c75389702b09d0f3dbb3d2a3bd019efad90ba2d57f60a0c81900;

    error ShipsAreBound();

    function _s() internal pure returns (ShipsStorage storage s) {
        assembly {
            s.slot := SHIPS_SLOT
        }
    }

    /// Where ships' records live (set once Pilots is deployed). Admin only.
    function setPilots(Pilots pilots) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _s().pilots = pilots;
    }

    /// The ship as an NFT: its name, its pilot, and its picture drawn from what it carries.
    function tokenURI(uint256 shipId) public view override returns (string memory) {
        address pilot = _requireOwned(shipId);
        Pilots pilots = _s().pilots;
        Pilots.Ship memory ship = pilots.shipOf(pilot);
        Pilots.Loadout memory l = ship.loadout;
        string memory json = string.concat(
            '{"name":"',
            ship.name,
            '","description":"An Orbiter 8 flown by ',
            pilots.pilotOf(pilot).callsign,
            '.","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(ShipArt.svg(ship, false))),
            '","attributes":[{"trait_type":"Range","value":',
            uint256(ship.range).toString(),
            '},{"trait_type":"Bays","value":',
            uint256(ship.bays).toString(),
            '},{"trait_type":"Railguns","value":',
            uint256(l.railguns).toString(),
            '},{"trait_type":"Missile racks","value":',
            uint256(l.missiles).toString(),
            '},{"trait_type":"Drones","value":',
            uint256(l.drones).toString(),
            '},{"trait_type":"Armor","value":',
            uint256(l.armor).toString(),
            '},{"trait_type":"Shields","value":',
            uint256(l.shields).toString(),
            "}]}"
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

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
