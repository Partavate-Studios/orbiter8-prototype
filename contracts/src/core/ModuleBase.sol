// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/// @title What every game module shares (docs/demo4-plan.md, section 1)
/// @notice Each module sits behind its own UUPS proxy (ERC-1967) and keeps its data in its own
/// ERC-7201 namespace, so upgrades never clash. Roles:
/// - DEFAULT_ADMIN_ROLE (a multisig): grants roles and sets module addresses;
/// - UPGRADER (a multisig): upgrades the module;
/// - GAME_MODULE: the other game modules, for calls between modules. Players never hold it.
abstract contract ModuleBase is UUPSUpgradeable, AccessControlUpgradeable {
    bytes32 public constant UPGRADER = keccak256("UPGRADER");
    bytes32 public constant GAME_MODULE = keccak256("GAME_MODULE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __ModuleBase_init(address admin) internal onlyInitializing {
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER, admin);
    }

    function _authorizeUpgrade(address) internal override onlyRole(UPGRADER) {}
}
