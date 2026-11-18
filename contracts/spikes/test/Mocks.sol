// SPDX-License-Identifier: MIT
// Stand-ins for Polkadot Hub's precompiles, etched at their fixed addresses in forge tests.
pragma solidity ^0.8.30;

import {IPersonhood} from "../src/IPersonhood.sol";

contract MockPersonhood is IPersonhood {
    struct Binding {
        bytes32 context;
        uint8 status;
        bytes32 contextAlias;
    }

    mapping(address => Binding) internal bindings;

    /// Binds `account` in `context` (one binding per account, as alias-accounts keeps it).
    function bind(address account, bytes32 context, uint8 status, bytes32 contextAlias) external {
        bindings[account] = Binding(context, status, contextAlias);
    }

    function unbind(address account) external {
        delete bindings[account];
    }

    function personhoodStatus(address account, bytes32 context) external view returns (PersonhoodInfo memory info) {
        Binding memory b = bindings[account];
        if (b.status == 0 || b.context != context) return info;
        return PersonhoodInfo(b.status, b.contextAlias);
    }
}

/// The factory: hands out ids from 0 and records the caller as owner (read by the collection mock).
contract MockScarcityFactory {
    uint32 public next;
    mapping(uint32 => address) public ownerOf;

    function createCollection() external returns (uint32 id) {
        id = next++;
        ownerOf[id] = msg.sender;
    }
}

/// One collection, etched at its precompile address. Checks the owner like the real one.
contract MockScarcityCollection {
    MockScarcityFactory public factory;
    uint32 public id;
    uint32 public items;
    uint256 public nextToken;
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public held;
    mapping(bytes32 => bytes) internal meta;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function init(MockScarcityFactory f, uint32 id_) external {
        factory = f;
        id = id_;
        nextToken = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == factory.ownerOf(id), "caller is not the collection owner");
        _;
    }

    function collectionOwner() external view returns (address) {
        return factory.ownerOf(id);
    }

    function setCollectionMetadata(bytes calldata key, bytes calldata value) external onlyOwner {
        meta[keccak256(abi.encode(0, key))] = value;
    }

    function name() external view returns (string memory) {
        return string(meta[keccak256(abi.encode(0, bytes("name")))]);
    }

    function defineItem(bool, bytes[] calldata, bytes[] calldata) external onlyOwner returns (uint32 item) {
        return items++;
    }

    function mint(uint32 item, address to, bytes[] calldata keys, bytes[] calldata values)
        external
        onlyOwner
        returns (uint256 tokenId)
    {
        require(item < items, "unknown item");
        require(to != address(0), "destination is the zero address");
        require(to.code.length > 0 || held[to] == 0, "destination purse already holds an instance");
        tokenId = nextToken++;
        ownerOf[tokenId] = to;
        held[to]++;
        for (uint256 i = 0; i < keys.length; i++) meta[keccak256(abi.encode(tokenId, keys[i]))] = values[i];
        emit Transfer(address(0), to, tokenId);
    }

    function instanceMetadata(uint256 tokenId, bytes calldata key) external view returns (bytes memory) {
        return meta[keccak256(abi.encode(tokenId, key))];
    }
}
