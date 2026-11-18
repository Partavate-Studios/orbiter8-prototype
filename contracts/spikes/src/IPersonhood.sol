// SPDX-License-Identifier: Apache-2.0
// From Parity's individuality-community repo, precompiles/personhood/sol/IPersonhood.sol
// (https://github.com/paritytech/individuality-community, Apache-2.0, Copyright Parity Technologies
// (UK) Ltd.), trimmed to what the spike uses. Milestone 7 spike: docs/polkadot-direction.md.
pragma solidity ^0.8.30;

/// The proof-of-personhood precompile on Polkadot Hub (and its testnets).
/// Live at 0x000000000000000000000000000000000a010000 on Polkadot Hub TestNet and Polkadot Hub
/// (checked 2026-11-18). It reads the alias-accounts pallet: an account bound, with a ring-VRF proof,
/// to a per-context alias of a person in the People (Full) or People Lite collection.
interface IPersonhood {
    /// status: 0 None, 1 Lite, 2 Full. contextAlias: the person's pseudonym in `context`, the same
    /// for every account the person ever binds there, unlinkable across contexts. Zero for None.
    struct PersonhoodInfo {
        uint8 status;
        bytes32 contextAlias;
    }

    /// Personhood of `account` in `context`. All zero unless the account is bound in exactly that
    /// context (an account holds one binding, in one context).
    function personhoodStatus(address account, bytes32 context) external view returns (PersonhoodInfo memory info);
}
