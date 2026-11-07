// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {BLS} from "bls-solidity/libraries/BLS.sol";

/// @title drand's evmnet beacon, verified on chain (docs/demo4-plan.md, D35)
/// @notice The League of Entropy publishes a new random value every 3 seconds, signed on the BN254
/// curve ("bls-bn254-unchained-on-g1"). A round's randomness can't be known before it's published, and
/// a forged value fails the signature check, so no one needs to be trusted. The game names a future
/// round when it needs dice; whoever completes the action later passes that round's signature in.
library Drand {
    /// evmnet's first round was published at this Unix time, and a new one every PERIOD seconds.
    uint64 internal constant GENESIS_TIME = 1727521075;
    uint64 internal constant PERIOD = 3;

    string internal constant DST = "BLS_SIG_BN254G1_XMD:KECCAK-256_SVDW_RO_NUL_";

    error BadRoundSignature(uint64 round);

    /// evmnet's public key (from https://api.drand.sh/v2/beacons/evmnet/info).
    function publicKey() internal pure returns (BLS.PointG2 memory) {
        return BLS.PointG2(
            [
                0x557ec32c2ad488e4d4f6008f89a346f18492092ccc0d594610de2732c8b808f,
                0x7e1d1d335df83fa98462005690372c643340060d205306a9aa8106b6bd0b382
            ],
            [
                0x297d3a4f9749b33eb2d904c9d9ebf17224150ddd7abd7567a9bec6c74480ee0b,
                0x95685ae3a85ba243747b1b2f426049010f6b73a0cf1d389351d5aaaa1047f6
            ]
        );
    }

    /// The round being published at `timestamp` (round 1 at genesis).
    function roundAt(uint256 timestamp) internal pure returns (uint64) {
        if (timestamp < GENESIS_TIME) return 0;
        return uint64((timestamp - GENESIS_TIME) / PERIOD + 1);
    }

    /// When `round` is published.
    function timeOf(uint64 round) internal pure returns (uint256) {
        return GENESIS_TIME + uint256(round - 1) * PERIOD;
    }

    /// The randomness of `round`, after checking `signature` (64 bytes, the G1 point) is drand's.
    /// Reverts with BadRoundSignature if it isn't.
    function verify(uint64 round, bytes memory signature) internal view returns (bytes32) {
        if (signature.length != 64) revert BadRoundSignature(round);
        BLS.PointG1 memory sig = BLS.g1Unmarshal(signature);
        if (!BLS.isValidPointG1(sig)) revert BadRoundSignature(round);
        (bool callSuccess, bool pairingSuccess) = BLS.verifySingle(
            sig, publicKey(), BLS.hashToPoint(bytes(DST), abi.encodePacked(keccak256(abi.encodePacked(round))))
        );
        if (!callSuccess || !pairingSuccess) revert BadRoundSignature(round);
        return keccak256(signature);
    }
}
