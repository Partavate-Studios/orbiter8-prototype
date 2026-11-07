// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/// The pattern every Demo 4 module follows (docs/demo4-plan.md, D14): UUPS behind an ERC-1967
/// proxy, storage in an ERC-7201 namespace, upgrades gated by a role.
contract SmokeV1 is UUPSUpgradeable, AccessControlUpgradeable {
    bytes32 public constant UPGRADER = keccak256("UPGRADER");

    /// @custom:storage-location erc7201:orbiter8.smoke
    struct SmokeStorage {
        uint256 value;
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.smoke")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant SMOKE_SLOT = 0xb4ce8ef389e0d44d9c8ac7651b946a1b37f35cba23d42e98474a5da321d0d700;

    function _smoke() internal pure returns (SmokeStorage storage s) {
        assembly {
            s.slot := SMOKE_SLOT
        }
    }

    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) external initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER, admin);
    }

    function setValue(uint256 value) external {
        _smoke().value = value;
    }

    function value() external view returns (uint256) {
        return _smoke().value;
    }

    function _authorizeUpgrade(address) internal override onlyRole(UPGRADER) {}
}

/// V2 keeps V1's namespace and adds one of its own.
contract SmokeV2 is SmokeV1 {
    /// @custom:storage-location erc7201:orbiter8.smoke.v2
    struct SmokeV2Storage {
        string label;
    }

    bytes32 private constant SMOKE_V2_SLOT = 0xb6ce8269fd59b334a38dedb2fde2f6806517a0c7290cc4b3ebf0edd07b848f00;

    function _v2() internal pure returns (SmokeV2Storage storage s) {
        assembly {
            s.slot := SMOKE_V2_SLOT
        }
    }

    function initializeV2(string calldata label_) external reinitializer(2) {
        _v2().label = label_;
    }

    function label() external view returns (string memory) {
        return _v2().label;
    }
}

contract UpgradeSmokeTest is Test {
    address admin = makeAddr("admin");
    address stranger = makeAddr("stranger");

    function test_upgradeKeepsStorageAndAddsANamespace() public {
        SmokeV1 proxied = SmokeV1(
            address(new ERC1967Proxy(address(new SmokeV1()), abi.encodeCall(SmokeV1.initialize, (admin))))
        );
        proxied.setValue(42);

        address v2 = address(new SmokeV2());
        vm.prank(admin);
        proxied.upgradeToAndCall(v2, abi.encodeCall(SmokeV2.initializeV2, ("hex galaxy")));

        assertEq(proxied.value(), 42, "V1 storage survives the upgrade");
        assertEq(SmokeV2(address(proxied)).label(), "hex galaxy", "V2 storage initialized");
    }

    function test_onlyTheUpgraderCanUpgrade() public {
        SmokeV1 proxied = SmokeV1(
            address(new ERC1967Proxy(address(new SmokeV1()), abi.encodeCall(SmokeV1.initialize, (admin))))
        );
        address v2 = address(new SmokeV2());
        vm.prank(stranger);
        vm.expectRevert();
        proxied.upgradeToAndCall(v2, "");
    }
}
