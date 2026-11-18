// SPDX-License-Identifier: Apache-2.0
// From Parity's individuality-community repo, precompiles/scarcity/sol/IScarcityFactory.sol and
// IScarcityCollection.sol (https://github.com/paritytech/individuality-community, Apache-2.0,
// Copyright Parity Technologies (UK) Ltd.), trimmed to what the spike uses. Milestone 7 spike:
// docs/polkadot-direction.md.
pragma solidity ^0.8.30;

/// Creates Scarcity collections (pallet-scarcity, the Polkadot App's NFT system). Fixed address
/// 0x0000000000000000000000000000000005210000. The caller owns the new collection and pays its
/// storage deposit.
interface IScarcityFactory {
    event CollectionCreated(uint32 indexed collection, address indexed owner);

    function createCollection() external returns (uint32 collection);
}

/// One Scarcity collection as an ERC-721 precompile, at
/// address((uint160(id) << 128) | 0x05200000). No approvals; a "purse key" holds one NFT, a
/// contract any number.
interface IScarcityCollection {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function ownerOf(uint256 tokenId) external view returns (address owner);
    function balanceOf(address owner) external view returns (uint256 balance);
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory uri);
    function locked(uint256 tokenId) external view returns (bool isLocked);
    function collectionOwner() external view returns (address owner);
    function transferFrom(address from, address to, uint256 tokenId) external;

    /// Owner only. `keys`/`values` are the item's metadata defaults.
    function defineItem(bool soulbound, bytes[] calldata keys, bytes[] calldata values) external returns (uint32 item);
    /// Owner only. Mints into an empty purse key or a contract.
    function mint(uint32 item, address to, bytes[] calldata keys, bytes[] calldata values)
        external
        returns (uint256 tokenId);
    function forceTransfer(uint256 tokenId, address to) external;
    function forceBurn(uint256 tokenId) external;
    function setCollectionMetadata(bytes calldata key, bytes calldata value) external;
    function setInstanceMetadata(uint256 tokenId, bytes calldata key, bytes calldata value) external;
    function instanceMetadata(uint256 tokenId, bytes calldata key) external view returns (bytes memory value);
}
