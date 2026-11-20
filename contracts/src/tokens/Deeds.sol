// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ModuleBase} from "../core/ModuleBase.sol";
import {Galaxy} from "../galaxy/Galaxy.sol";
import {Planets} from "../planets/Planets.sol";
import {Claims} from "../planets/Claims.sol";
import {SystemGen} from "../planets/SystemGen.sol";
import {BodyId} from "../planets/BodyId.sol";
import {Pilots} from "../pilots/Pilots.sol";
import {DeedArt} from "../art/DeedArt.sol";
import {SafeText} from "../art/SafeText.sol";

/// @title Planet and asteroid deeds, as NFTs (docs/demo4-plan.md, section 1; D107)
/// @notice One ERC-721 per claimed planet, its id the planet's (`BodyId`: `cell << 16 | kind << 8 | index`), minted to whoever
/// claims it. Owners can't trade planets in this run; the game moves a deed when a siege's claim
/// succeeds (milestone 4).
contract Deeds is ERC721Upgradeable, ModuleBase {
    using Strings for uint256;

    /// @custom:storage-location erc7201:orbiter8.deeds
    struct DeedsStorage {
        Galaxy galaxy;
        Planets planets;
        Claims claims;
        Pilots pilots;
        DeedArt art;
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.deeds")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant DEEDS_SLOT = 0x17bfe9b9cb65541ba819b61379ff208689644cb26d34a84067e4ec48e5ab6800;

    uint8 private constant ASTEROID_CLASS = 10;

    error DeedsAreBound();

    function _s() internal pure returns (DeedsStorage storage s) {
        assembly {
            s.slot := DEEDS_SLOT
        }
    }

    /// Where a deed's picture comes from: the universe's seed (Galaxy), the bodies (Planets), their names
    /// (Claims), owners' call signs (Pilots) and the drawing (DeedArt). Admin only.
    function setSources(Galaxy galaxy, Planets planets, Claims claims, Pilots pilots, DeedArt art)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        DeedsStorage storage s = _s();
        (s.galaxy, s.planets, s.claims, s.pilots, s.art) = (galaxy, planets, claims, pilots, art);
    }

    /// The drawing deeds use (DeedArt).
    function art() external view returns (DeedArt) {
        return _s().art;
    }

    /// The deed as an NFT (D107): its picture is drawn by the contracts each time it's asked for, from
    /// the planet or asteroid as it is now (its settlement, its station and what that has, its owner).
    function tokenURI(uint256 id) public view override returns (string memory) {
        _requireOwned(id);
        DeedArt.Deed memory d = deedOf(id);
        string memory about = string.concat(
            '{"name":"',
            d.name,
            '","description":"',
            d.asteroid ? "An asteroid" : "A planet",
            " in Orbiter 8, owned by ",
            d.owner,
            '.","image":"data:image/svg+xml;base64,'
        );
        string memory traits = string.concat(
            '","attributes":[{"trait_type":"Kind","value":"',
            d.kind,
            '"},{"trait_type":"Built","value":"',
            d.built,
            '"},{"trait_type":"Size","value":',
            uint256(d.size).toString(),
            "}]}"
        );
        string memory image = Base64.encode(bytes(_s().art.svg(d)));
        return string.concat("data:application/json;base64,", Base64.encode(bytes(string.concat(about, image, traits))));
    }

    /// What a deed's card shows, from the body as it is now.
    function deedOf(uint256 id) public view returns (DeedArt.Deed memory d) {
        DeedsStorage storage s = _s();
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        Planets.PlanetView memory v = s.planets.views(ids, 0)[0];
        d.asteroid = v.class >= ASTEROID_CLASS;
        d.class = d.asteroid ? v.class - ASTEROID_CLASS : v.class;
        (d.size, d.level, d.autofactory) = (v.size, v.level, v.autofactory);
        string memory given = s.claims.namesOf(id)[0];
        d.name = bytes(given).length > 0 ? SafeText.clean(given) : _unnamed(id, d);
        d.owner = v.owner == address(0) ? "nobody" : SafeText.clean(s.pilots.pilotOf(v.owner).callsign);
        d.kind = string.concat(
            d.asteroid ? _composition(d.class) : _className(d.class),
            d.asteroid ? " asteroid, size " : " planet, size ",
            uint256(d.size).toString()
        );
        d.built = _built(d);
    }

    /// A body nobody has named, as the game calls it (sdk/system-gen.js planetName, belt-gen.js asteroidName).
    function _unnamed(uint256 id, DeedArt.Deed memory d) private view returns (string memory) {
        uint256 index = BodyId.indexOf(id);
        if (d.asteroid) return string.concat("Unnamed ", _composition(d.class), " Asteroid ", (index + 1).toString());
        string memory name = string.concat("Unnamed ", _className(d.class), " Planet");
        (bytes32 seed,,,,) = _s().galaxy.universe();
        uint256 cell = BodyId.cellOf(id);
        uint256 count = SystemGen.planetCount(seed, cell);
        uint256 same;
        for (uint256 body = 0; body < count; body++) {
            (uint8 c,,) = SystemGen.planet(seed, cell, body);
            if (c == d.class) same++;
        }
        return same > 1 ? string.concat(name, " ", (index + 1).toString()) : name;
    }

    function _built(DeedArt.Deed memory d) private pure returns (string memory) {
        uint8 l = d.level;
        string memory b;
        if (d.asteroid) {
            b = l >= 6 ? "Armory" : l >= 4 ? "Port" : l >= 2 ? "Mine" : l >= 1 ? "Platform" : "Claimed";
            return b;
        }
        b = l >= 6 ? "Armory" : l == 5 ? "Yards" : l == 4 ? "Port" : l == 3 ? "Station" : l == 2 ? "Colony" : l == 1
            ? "Citadel"
            : "Claimed";
        return d.autofactory ? string.concat(b, " + Autofactory") : b;
    }

    function _className(uint8 c) private pure returns (string memory) {
        if (c == 0) return "Terrestrial";
        if (c == 1) return "Rocky";
        if (c == 2) return "Oceanic";
        if (c == 3) return "Desert";
        if (c == 4) return "Ice";
        if (c == 5) return "Volcanic";
        if (c == 6) return "Gaseous";
        if (c == 7) return "Ferrous";
        if (c == 8) return "Lava";
        return "Swamp";
    }

    function _composition(uint8 c) private pure returns (string memory) {
        return c == 0 ? "Carbonaceous" : c == 1 ? "Silicate" : "Metallic";
    }

    function initialize(address admin) external initializer {
        __ERC721_init("Orbiter 8 Deeds", "O8D");
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
