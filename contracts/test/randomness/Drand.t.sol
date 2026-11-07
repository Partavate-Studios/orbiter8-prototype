// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Test} from "forge-std/Test.sol";
import {Drand} from "../../src/randomness/Drand.sol";

contract DrandHarness {
    function verify(uint64 round, bytes calldata signature) external view returns (bytes32) {
        return Drand.verify(round, signature);
    }
}

/// Real evmnet rounds, fetched from https://api.drand.sh/v2/beacons/evmnet/rounds/<n> on 2026-11-06.
contract DrandTest is Test {
    DrandHarness drand = new DrandHarness();

    bytes constant ROUND_1000 =
        hex"06fd5996329504d3a56b482d9222bf7205857d0a9559ddd216ca31a286f6a8cc0a120f021aac2f13553fb164f62bc3a5ca32c76dea88a777b39bcf3cac5fdbd6";
    bytes constant ROUND_2000000 =
        hex"2347adff80e7c61af10cfeed4784924c52b0c030f3ab83c5da53c3ffd40bff4715090c588995a444892e15f0d0dc0fb7d726538fd39800433e7218c8964c6ef2";
    bytes constant ROUND_22169011 =
        hex"015ea72210cffd3bf58856b16d9ed69103ce7fd6ea5f3afa2e7c6f2d9bdbcd5a15e003164b444a8a550ace76cd7c39db9c81c682d4f208fd3017b7b38a51077e";

    function test_realRoundsVerify() public view {
        assertEq(drand.verify(1000, ROUND_1000), keccak256(ROUND_1000));
        assertEq(drand.verify(2000000, ROUND_2000000), keccak256(ROUND_2000000));
        assertEq(drand.verify(22169011, ROUND_22169011), keccak256(ROUND_22169011));
    }

    function test_aRoundsSignatureDoesntProveAnother() public {
        vm.expectRevert(abi.encodeWithSelector(Drand.BadRoundSignature.selector, uint64(1001)));
        drand.verify(1001, ROUND_1000);
    }

    function test_forgedSignatureFails() public {
        bytes memory forged = ROUND_1000;
        forged[63] = bytes1(uint8(forged[63]) ^ 1);
        vm.expectRevert();
        drand.verify(1000, forged);
    }

    function test_wrongLengthFails() public {
        vm.expectRevert(abi.encodeWithSelector(Drand.BadRoundSignature.selector, uint64(1000)));
        drand.verify(1000, hex"0102");
    }

    function test_roundTiming() public pure {
        assertEq(Drand.roundAt(Drand.GENESIS_TIME), 1);
        assertEq(Drand.roundAt(Drand.GENESIS_TIME + 2), 1);
        assertEq(Drand.roundAt(Drand.GENESIS_TIME + 3), 2);
        assertEq(Drand.timeOf(1000), Drand.GENESIS_TIME + 999 * 3);
        assertEq(Drand.roundAt(Drand.timeOf(22169011)), 22169011);
    }

    function test_gasOfAVerification() public {
        uint256 before = gasleft();
        drand.verify(2000000, ROUND_2000000);
        emit log_named_uint("gas for one drand verification", before - gasleft());
    }
}
