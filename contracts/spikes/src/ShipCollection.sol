// SPDX-License-Identifier: MIT
// Milestone 7 spike (docs/polkadot-direction.md, "Ships in the App's NFT system"): a contract that
// owns a Scarcity collection (pallet-scarcity, the Polkadot App's NFT system) and mints ships into
// it from Solidity, through the Scarcity precompiles. Not part of the game.
pragma solidity ^0.8.30;

import {IScarcityFactory, IScarcityCollection} from "./IScarcity.sol";

contract ShipCollection {
    IScarcityFactory public constant FACTORY = IScarcityFactory(0x0000000000000000000000000000000005210000);
    uint160 internal constant COLLECTION_SUFFIX = 0x05200000;

    address public immutable admin;
    uint32 public collectionId;
    uint32 public shipItem;
    bool public ready;

    event Ready(uint32 collectionId, address collection, uint32 shipItem);
    event ShipMinted(uint256 indexed tokenId, address indexed to, uint256 indexed shipId);

    error NotAdmin();
    error NotReady();

    constructor() payable {
        admin = msg.sender;
    }

    /// The contract pays the collection's and each item's storage deposits from its own balance.
    receive() external payable {}

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    function collectionAt(uint32 id) public pure returns (address) {
        return address((uint160(id) << 128) | COLLECTION_SUFFIX);
    }

    function collection() public view returns (IScarcityCollection) {
        return IScarcityCollection(collectionAt(collectionId));
    }

    /// Creates the collection (owned by this contract), names it, and defines one transferable item,
    /// "Ship", that every ship is minted from.
    function setup(string calldata name_, string calldata symbol_) external onlyAdmin {
        collectionId = FACTORY.createCollection();
        IScarcityCollection c = collection();
        c.setCollectionMetadata("name", bytes(name_));
        c.setCollectionMetadata("symbol", bytes(symbol_));
        bytes[] memory keys = new bytes[](1);
        bytes[] memory values = new bytes[](1);
        keys[0] = "kind";
        values[0] = "ship";
        shipItem = c.defineItem(false, keys, values);
        ready = true;
        emit Ready(collectionId, address(c), shipItem);
    }

    /// Mints a ship into `to`: an empty purse key (one NFT per key) or a contract.
    /// The game would do this behind its own rules (buying a ship at a shipyard).
    function mintShip(address to, uint256 shipId, string calldata shipName) external onlyAdmin returns (uint256 tokenId) {
        if (!ready) revert NotReady();
        bytes[] memory keys = new bytes[](2);
        bytes[] memory values = new bytes[](2);
        keys[0] = "name";
        values[0] = bytes(shipName);
        keys[1] = "shipId";
        values[1] = bytes(_decimal(shipId));
        tokenId = collection().mint(shipItem, to, keys, values);
        emit ShipMinted(tokenId, to, shipId);
    }

    function _decimal(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        bytes memory out = new bytes(78);
        uint256 i = out.length;
        while (v != 0) {
            out[--i] = bytes1(uint8(48 + (v % 10)));
            v /= 10;
        }
        bytes memory trimmed = new bytes(out.length - i);
        for (uint256 j = 0; j < trimmed.length; j++) trimmed[j] = out[i + j];
        return string(trimmed);
    }
}
