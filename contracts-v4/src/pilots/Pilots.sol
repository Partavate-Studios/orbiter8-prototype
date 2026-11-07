// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ModuleBase} from "../core/ModuleBase.sol";
import {Galaxy} from "../galaxy/Galaxy.sol";
import {Credits} from "../tokens/Credits.sol";
import {Ships} from "../tokens/Ships.sol";

/// @title Pilots and their ships (docs/demo4-plan.md, section 3)
/// @notice One pilot per wallet, with a unique call sign, flying one ship (D26), an NFT in `Ships`.
/// The ship's record lives here: where it is, its range, its bays and the cargo in them.
///
/// Every move can carry pending scan proofs (drand signatures), so scans get written without a
/// separate approval (D21): the client sends whatever is waiting along with the player's next move.
///
/// **Session keys (D41):** the wallet approves once per play session, naming a key the browser made
/// and sending it a little gas money. Until it expires, that key can make game moves for the pilot
/// (jumps, trades, purchases), but never anything that touches the wallet itself: registering,
/// changing the call sign or starting sessions stay with the wallet, and a key holds no credits.
contract Pilots is ModuleBase {
    uint256 public constant MIN_NAME = 3;
    uint256 public constant MAX_NAME = 24;
    uint8 public constant START_RANGE = 1;
    uint8 public constant MAX_RANGE = 4;
    uint16 public constant START_BAYS = 5;
    uint16 public constant MAX_BAYS = 250;
    uint256 public constant START_CREDITS = 1_000;
    uint256 public constant CALLSIGN_FEE = 2_000;
    uint256 public constant SHIP_NAME_FEE = 500;
    uint256 public constant MAX_SESSION = 12 hours;

    struct Ship {
        string name;
        uint256 cell; // the star the ship is at
        uint8 range; // jump range, 1–4 (D10, D11)
        uint16 bays; // internal space bought, up to 250 (D59)
        uint16 cargo; // bays holding cargo, one unit each
    }

    struct Pilot {
        string callsign;
        bool registered;
        uint256 shipId; // the active ship (one per pilot in this run, D26)
    }

    struct Session {
        address pilot;
        uint64 expiry;
    }

    /// A pilot as the client reads it, in one call.
    struct PilotView {
        string callsign;
        bool registered;
        uint256 shipId;
        Ship ship;
        address sessionKey;
        uint64 sessionExpiry;
    }

    /// A pending scan to resolve along with a move: the star and its drand round's signature.
    struct ScanProof {
        uint256 cell;
        bytes signature;
    }

    /// @custom:storage-location erc7201:orbiter8.pilots
    struct PilotsStorage {
        Galaxy galaxy;
        Credits credits;
        Ships shipTokens;
        mapping(address => Pilot) pilots;
        mapping(uint256 => Ship) ships;
        mapping(uint256 => mapping(uint256 => uint256)) cargo; // ship → good → units
        mapping(bytes32 => address) byCallsign; // lowercased call sign → pilot
        mapping(address => Session) sessions; // session key → its pilot and expiry
        mapping(address => address) sessionKeyOf; // pilot → current session key
        uint256 count;
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.pilots")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant PILOTS_SLOT = 0xd9ad3e021ca1c3de06a980ba78a35714e820a62040a40b75c677af42c5438200;

    event Registered(address indexed pilot, uint256 indexed shipId, string callsign, string shipName);
    event CallsignChanged(address indexed pilot, string callsign);
    event ShipRenamed(address indexed pilot, uint256 indexed shipId, string name);
    event Jumped(address indexed pilot, uint256 from, uint256 to, bool discovered);
    event Traversed(address indexed pilot, uint256 blackHole, uint256 exit, bool discovered);
    event CargoChanged(address indexed pilot, uint256 indexed good, uint256 units);
    event BaysAdded(address indexed pilot, uint16 bays);
    event RangeChanged(address indexed pilot, uint8 range);
    event SessionStarted(address indexed pilot, address indexed key, uint64 expiry);
    event SessionEnded(address indexed pilot, address indexed key);

    error AlreadyRegistered();
    error NotRegistered();
    error BadName(string name);
    error CallsignTaken(string callsign);
    error NoRoom(uint256 free);
    error NotEnoughCargo(uint256 good, uint256 have);
    error TooManyBays(uint256 max);
    error BadRange(uint8 range);
    error BadSession();
    error SendFailed();

    function _p() internal pure returns (PilotsStorage storage p) {
        assembly {
            p.slot := PILOTS_SLOT
        }
    }

    function initialize(address admin, Galaxy galaxy_, Credits credits_, Ships ships_) external initializer {
        __ModuleBase_init(admin);
        PilotsStorage storage p = _p();
        p.galaxy = galaxy_;
        p.credits = credits_;
        p.shipTokens = ships_;
    }

    // ── who is acting ───────────────────────────────────────────────────────────────────────────

    /// The pilot `sender` acts for: the pilot whose live session key it is, or the pilot's own
    /// wallet. Other modules call this to accept session keys too. Reverts if neither.
    function actorOf(address sender) public view returns (address) {
        PilotsStorage storage p = _p();
        Session memory s = p.sessions[sender];
        if (s.pilot != address(0) && s.expiry > block.timestamp && p.sessionKeyOf[s.pilot] == sender) {
            return s.pilot;
        }
        if (p.pilots[sender].registered) return sender;
        revert NotRegistered();
    }

    function _ship(address pilot) internal view returns (Ship storage) {
        PilotsStorage storage p = _p();
        Pilot storage record = p.pilots[pilot];
        if (!record.registered) revert NotRegistered();
        return p.ships[record.shipId];
    }

    // ── registering and names ───────────────────────────────────────────────────────────────────

    /// Registers a call sign and launches the pilot's ship at Sol, with starting credits. Wallets
    /// only: a session key can't register.
    function register(string calldata callsign, string calldata shipName) external {
        address who = msg.sender;
        PilotsStorage storage p = _p();
        if (p.pilots[who].registered || p.sessions[who].pilot != address(0)) revert AlreadyRegistered();
        bytes32 key = _nameKey(callsign);
        if (p.byCallsign[key] != address(0)) revert CallsignTaken(callsign);
        _nameKey(shipName);
        p.byCallsign[key] = who;
        uint256 shipId = ++p.count;
        Pilot storage pilot = p.pilots[who];
        pilot.callsign = callsign;
        pilot.registered = true;
        pilot.shipId = shipId;
        p.ships[shipId] = Ship(shipName, 0, START_RANGE, START_BAYS, 0);
        p.shipTokens.mint(who, shipId);
        p.credits.mint(who, START_CREDITS);
        emit Registered(who, shipId, callsign, shipName);
    }

    /// A new call sign, for a fee (burned). Wallets only.
    function changeCallsign(string calldata callsign) external {
        address who = msg.sender;
        PilotsStorage storage p = _p();
        Pilot storage pilot = p.pilots[who];
        if (!pilot.registered) revert NotRegistered();
        bytes32 key = _nameKey(callsign);
        address holder = p.byCallsign[key];
        if (holder != address(0) && holder != who) revert CallsignTaken(callsign);
        p.credits.burn(who, CALLSIGN_FEE);
        delete p.byCallsign[keccak256(bytes(_lower(pilot.callsign)))];
        p.byCallsign[key] = who;
        pilot.callsign = callsign;
        emit CallsignChanged(who, callsign);
    }

    /// A new name for the pilot's ship, for a fee (burned).
    function renameShip(string calldata name) external {
        address who = actorOf(msg.sender);
        _nameKey(name);
        PilotsStorage storage p = _p();
        p.credits.burn(who, SHIP_NAME_FEE);
        uint256 shipId = p.pilots[who].shipId;
        p.ships[shipId].name = name;
        emit ShipRenamed(who, shipId, name);
    }

    // ── session keys (D41) ──────────────────────────────────────────────────────────────────────

    /// Lets `key` make game moves for the caller until `expiry` (at most 12 hours away), replacing
    /// any earlier key, and forwards whatever value is sent to the key as its gas money.
    function startSession(address key, uint64 expiry) external payable {
        address who = msg.sender;
        PilotsStorage storage p = _p();
        if (!p.pilots[who].registered) revert NotRegistered();
        Session memory taken = p.sessions[key];
        bool keyBusy = taken.pilot != address(0) && taken.pilot != who && taken.expiry > block.timestamp;
        if (
            key == address(0) || key == who || p.pilots[key].registered || keyBusy || expiry <= block.timestamp
                || expiry > block.timestamp + MAX_SESSION
        ) revert BadSession();
        address previous = p.sessionKeyOf[who];
        if (previous != address(0)) {
            delete p.sessions[previous];
            emit SessionEnded(who, previous);
        }
        p.sessions[key] = Session(who, expiry);
        p.sessionKeyOf[who] = key;
        emit SessionStarted(who, key, expiry);
        if (msg.value > 0) {
            (bool sent,) = key.call{value: msg.value}("");
            if (!sent) revert SendFailed();
        }
    }

    /// Ends the session, from the wallet or the key itself. (The key sends its leftover gas money
    /// back on its own; the client does that right after.)
    function endSession() external {
        PilotsStorage storage p = _p();
        address pilot = p.pilots[msg.sender].registered ? msg.sender : p.sessions[msg.sender].pilot;
        address key = p.sessionKeyOf[pilot];
        if (pilot == address(0) || key == address(0)) revert BadSession();
        delete p.sessions[key];
        delete p.sessionKeyOf[pilot];
        emit SessionEnded(pilot, key);
    }

    // ── moving ──────────────────────────────────────────────────────────────────────────────────

    /// Jumps the pilot's ship to a charted star within range, resolving pending scans first.
    function jump(uint256 to, ScanProof[] calldata proofs) external {
        _resolve(proofs);
        address who = actorOf(msg.sender);
        Ship storage ship = _ship(who);
        uint256 from = ship.cell;
        bool discovered = _p().galaxy.arrive(who, from, to, ship.range);
        ship.cell = to;
        emit Jumped(who, from, to, discovered);
    }

    /// Goes through the black hole the ship is at, to its partner.
    function traverse(ScanProof[] calldata proofs) external {
        _resolve(proofs);
        address who = actorOf(msg.sender);
        Ship storage ship = _ship(who);
        uint256 hole = ship.cell;
        (uint256 exit, bool discovered) = _p().galaxy.traverse(who, hole);
        ship.cell = exit;
        emit Traversed(who, hole, exit, discovered);
    }

    /// Names a star the pilot discovered.
    function renameStar(uint256 cell, string calldata name, ScanProof[] calldata proofs) external {
        _resolve(proofs);
        _p().galaxy.rename(actorOf(msg.sender), cell, name);
    }

    /// Resolves pending scans without moving (anyone may, e.g. to see a new neighborhood written).
    function resolveScans(ScanProof[] calldata proofs) external {
        _resolve(proofs);
    }

    function _resolve(ScanProof[] calldata proofs) internal {
        Galaxy galaxy_ = _p().galaxy;
        for (uint256 i = 0; i < proofs.length; i++) {
            Galaxy.Star memory s = galaxy_.star(proofs[i].cell);
            if (s.visited && !s.scanned) galaxy_.resolveScan(proofs[i].cell, proofs[i].signature);
        }
    }

    // ── for other modules (GAME_MODULE) ─────────────────────────────────────────────────────────

    /// Loads `units` of a good into the pilot's bays. Reverts with NoRoom if they don't fit.
    function addCargo(address pilot, uint256 good, uint256 units) external onlyRole(GAME_MODULE) {
        Ship storage ship = _ship(pilot);
        uint256 free = ship.bays - ship.cargo;
        if (units > free) revert NoRoom(free);
        ship.cargo += uint16(units);
        uint256 shipId = _p().pilots[pilot].shipId;
        uint256 held = _p().cargo[shipId][good] += units;
        emit CargoChanged(pilot, good, held);
    }

    /// Unloads `units` of a good. Reverts with NotEnoughCargo if the ship holds fewer.
    function removeCargo(address pilot, uint256 good, uint256 units) external onlyRole(GAME_MODULE) {
        Ship storage ship = _ship(pilot);
        uint256 shipId = _p().pilots[pilot].shipId;
        uint256 have = _p().cargo[shipId][good];
        if (units > have) revert NotEnoughCargo(good, have);
        ship.cargo -= uint16(units);
        _p().cargo[shipId][good] = have - units;
        emit CargoChanged(pilot, good, have - units);
    }

    function addBays(address pilot, uint16 bays) external onlyRole(GAME_MODULE) {
        Ship storage ship = _ship(pilot);
        if (uint256(ship.bays) + bays > MAX_BAYS) revert TooManyBays(MAX_BAYS);
        ship.bays += bays;
        emit BaysAdded(pilot, ship.bays);
    }

    function setRange(address pilot, uint8 range) external onlyRole(GAME_MODULE) {
        if (range < START_RANGE || range > MAX_RANGE) revert BadRange(range);
        _ship(pilot).range = range;
        emit RangeChanged(pilot, range);
    }

    // ── views ───────────────────────────────────────────────────────────────────────────────────

    function pilotOf(address who) external view returns (PilotView memory v) {
        PilotsStorage storage p = _p();
        Pilot storage record = p.pilots[who];
        v.callsign = record.callsign;
        v.registered = record.registered;
        v.shipId = record.shipId;
        v.ship = p.ships[record.shipId];
        address key = p.sessionKeyOf[who];
        v.sessionKey = key;
        v.sessionExpiry = p.sessions[key].expiry;
    }

    /// The ship's record (location, range, bays). Reverts if `pilot` isn't registered.
    function shipOf(address pilot) external view returns (Ship memory) {
        return _ship(pilot);
    }

    /// Units of goods 0 to `goods` - 1 aboard the pilot's ship.
    function cargoOf(address pilot, uint256 goods) external view returns (uint256[] memory units) {
        uint256 shipId = _p().pilots[pilot].shipId;
        units = new uint256[](goods);
        for (uint256 g = 0; g < goods; g++) {
            units[g] = _p().cargo[shipId][g];
        }
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

    function credits() external view returns (Credits) {
        return _p().credits;
    }

    function shipTokens() external view returns (Ships) {
        return _p().shipTokens;
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

    function _lower(string memory name) internal pure returns (string memory) {
        bytes memory b = bytes(name);
        bytes memory out = new bytes(b.length);
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            out[i] = (c >= "A" && c <= "Z") ? bytes1(uint8(c) + 32) : c;
        }
        return string(out);
    }
}
