// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ModuleBase} from "../core/ModuleBase.sol";
import {Galaxy} from "../galaxy/Galaxy.sol";

/// @title Pilots and their ships (docs/demo4-plan.md, section 3)
/// @notice One pilot per wallet, with a unique call sign, and one ship (D26). Every move can carry
/// pending scan proofs (drand signatures), so scans get written without a separate approval (D21):
/// the client sends whatever is waiting along with the player's next move.
contract Pilots is ModuleBase {
    uint256 public constant MIN_NAME = 3;
    uint256 public constant MAX_NAME = 24;
    uint8 public constant START_RANGE = 1;
    uint8 public constant MAX_RANGE = 4;

    struct Ship {
        string name;
        uint256 cell; // the star the ship is at
        uint8 range; // jump range, 1–4 (D10, D11)
    }

    struct Pilot {
        string callsign;
        bool registered;
        Ship ship;
    }

    /// A pending scan to resolve along with a move: the star and its drand round's signature.
    struct ScanProof {
        uint256 cell;
        bytes signature;
    }

    /// @custom:storage-location erc7201:orbiter8.pilots
    struct PilotsStorage {
        Galaxy galaxy;
        mapping(address => Pilot) pilots;
        mapping(bytes32 => address) byCallsign; // lowercased call sign → pilot
        uint256 count;
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.pilots")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant PILOTS_SLOT = 0xd9ad3e021ca1c3de06a980ba78a35714e820a62040a40b75c677af42c5438200;

    event Registered(address indexed pilot, string callsign, string shipName);
    event Jumped(address indexed pilot, uint256 from, uint256 to, bool discovered);
    event Traversed(address indexed pilot, uint256 blackHole, uint256 exit, bool discovered);

    error AlreadyRegistered();
    error NotRegistered();
    error BadName(string name);
    error CallsignTaken(string callsign);

    function _p() internal pure returns (PilotsStorage storage p) {
        assembly {
            p.slot := PILOTS_SLOT
        }
    }

    function initialize(address admin, Galaxy galaxy) external initializer {
        __ModuleBase_init(admin);
        _p().galaxy = galaxy;
    }

    /// Who is acting: the wallet itself. (Session keys extend this in milestone 2, D41.)
    function _actor() internal view returns (address) {
        return msg.sender;
    }

    function _pilot(address who) internal view returns (Pilot storage pilot) {
        pilot = _p().pilots[who];
        if (!pilot.registered) revert NotRegistered();
    }

    // ── registering ─────────────────────────────────────────────────────────────────────────────

    /// Registers a call sign and launches the pilot's ship at Sol.
    function register(string calldata callsign, string calldata shipName) external {
        address who = _actor();
        PilotsStorage storage p = _p();
        if (p.pilots[who].registered) revert AlreadyRegistered();
        bytes32 key = _nameKey(callsign);
        if (p.byCallsign[key] != address(0)) revert CallsignTaken(callsign);
        _nameKey(shipName);
        p.byCallsign[key] = who;
        Pilot storage pilot = p.pilots[who];
        pilot.callsign = callsign;
        pilot.registered = true;
        pilot.ship = Ship(shipName, 0, START_RANGE);
        p.count++;
        emit Registered(who, callsign, shipName);
    }

    // ── moving ──────────────────────────────────────────────────────────────────────────────────

    /// Jumps the pilot's ship to a charted star within range, resolving pending scans first.
    function jump(uint256 to, ScanProof[] calldata proofs) external {
        _resolve(proofs);
        address who = _actor();
        Ship storage ship = _pilot(who).ship;
        uint256 from = ship.cell;
        bool discovered = _p().galaxy.arrive(who, from, to, ship.range);
        ship.cell = to;
        emit Jumped(who, from, to, discovered);
    }

    /// Goes through the black hole the ship is at, to its partner.
    function traverse(ScanProof[] calldata proofs) external {
        _resolve(proofs);
        address who = _actor();
        Ship storage ship = _pilot(who).ship;
        uint256 hole = ship.cell;
        (uint256 exit, bool discovered) = _p().galaxy.traverse(who, hole);
        ship.cell = exit;
        emit Traversed(who, hole, exit, discovered);
    }

    /// Names a star the pilot discovered.
    function renameStar(uint256 cell, string calldata name, ScanProof[] calldata proofs) external {
        _resolve(proofs);
        address who = _actor();
        _pilot(who);
        _p().galaxy.rename(who, cell, name);
    }

    /// Resolves pending scans without moving (anyone may, e.g. to see a new neighborhood written).
    function resolveScans(ScanProof[] calldata proofs) external {
        _resolve(proofs);
    }

    function _resolve(ScanProof[] calldata proofs) internal {
        Galaxy galaxy = _p().galaxy;
        for (uint256 i = 0; i < proofs.length; i++) {
            Galaxy.Star memory s = galaxy.star(proofs[i].cell);
            if (s.visited && !s.scanned) galaxy.resolveScan(proofs[i].cell, proofs[i].signature);
        }
    }

    // ── views ───────────────────────────────────────────────────────────────────────────────────

    function pilotOf(address who) external view returns (Pilot memory) {
        return _p().pilots[who];
    }

    /// The pilot flying under a call sign (case doesn't matter), or address(0).
    function byCallsign(string calldata callsign) external view returns (address) {
        return _p().byCallsign[keccak256(bytes(_lower(callsign)))];
    }

    function pilotCount() external view returns (uint256) {
        return _p().count;
    }

    function galaxy() external view returns (Galaxy) {
        return _p().galaxy;
    }

    // ── names ───────────────────────────────────────────────────────────────────────────────────

    /// The lowercased name's hash, after checking the rules: 3–24 characters; letters, digits,
    /// spaces, '-', '_' and '.'; no leading, trailing or double spaces.
    function _nameKey(string calldata name) internal pure returns (bytes32) {
        bytes memory b = bytes(name);
        if (b.length < MIN_NAME || b.length > MAX_NAME) revert BadName(name);
        if (b[0] == " " || b[b.length - 1] == " ") revert BadName(name);
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            bool ok = (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || (c >= "0" && c <= "9") || c == " "
                || c == "-" || c == "_" || c == ".";
            if (!ok || (c == " " && i > 0 && b[i - 1] == " ")) revert BadName(name);
        }
        return keccak256(bytes(_lower(name)));
    }

    function _lower(string calldata name) internal pure returns (string memory) {
        bytes memory b = bytes(name);
        bytes memory out = new bytes(b.length);
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            out[i] = (c >= "A" && c <= "Z") ? bytes1(uint8(c) + 32) : c;
        }
        return string(out);
    }
}
