// SPDX-License-Identifier: MIT
// Milestone 7 spike (docs/polkadot-direction.md, "Personhood from our contracts"): one pilot per
// person, checked against Polkadot's proof-of-personhood precompile. Not part of the game.
pragma solidity ^0.8.30;

import {IPersonhood} from "./IPersonhood.sol";

/// Registers at most one pilot per person. The person is known only by their alias in our context:
/// the same alias for every account they bind in that context, unlinkable to their other apps.
///
/// Keying by alias, not by account, matters: a person can move their binding to a new account
/// (alias-accounts drops the old mapping), and the new account must not get a second pilot.
contract PersonhoodGate {
    IPersonhood public constant PERSONHOOD = IPersonhood(0x000000000000000000000000000000000a010000);

    /// Our personhood context. For a Product it must be the context the host binds its product
    /// accounts in: blake2b-256("product/" ++ productId ++ "/" ++ suffixBytes(Index 0)), see
    /// productContext() in the Product SDK individuality package. Any other value reads as "no status".
    bytes32 public immutable context;
    /// The lowest status that may register: 1 Lite (device + username), 2 Full (proven person).
    uint8 public immutable minStatus;

    mapping(bytes32 contextAlias => address pilot) public pilotOfAlias;
    mapping(address pilot => bytes32 contextAlias) public aliasOfPilot;

    event Registered(address indexed pilot, bytes32 indexed contextAlias, uint8 status);

    error NotAPerson(uint8 status);
    error PersonAlreadyHasAPilot(address pilot);
    error AlreadyRegistered();

    constructor(bytes32 context_, uint8 minStatus_) {
        context = context_;
        minStatus = minStatus_;
    }

    /// What the precompile says about `account` in our context.
    function statusOf(address account) public view returns (uint8 status, bytes32 contextAlias) {
        IPersonhood.PersonhoodInfo memory info = PERSONHOOD.personhoodStatus(account, context);
        // Fail closed on tiers added later: anything above Full counts as nothing until reviewed.
        if (info.status > 2) return (0, bytes32(0));
        return (info.status, info.contextAlias);
    }

    /// Registers the caller as the pilot of the person behind it.
    function register() external returns (bytes32 contextAlias) {
        if (aliasOfPilot[msg.sender] != bytes32(0)) revert AlreadyRegistered();
        uint8 status;
        (status, contextAlias) = statusOf(msg.sender);
        if (status == 0 || status < minStatus) revert NotAPerson(status);
        address existing = pilotOfAlias[contextAlias];
        if (existing != address(0)) revert PersonAlreadyHasAPilot(existing);
        pilotOfAlias[contextAlias] = msg.sender;
        aliasOfPilot[msg.sender] = contextAlias;
        emit Registered(msg.sender, contextAlias, status);
    }
}
