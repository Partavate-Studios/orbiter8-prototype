// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {BodyId} from "./BodyId.sol";
import {ModuleBase} from "../core/ModuleBase.sol";
import {Pilots} from "../pilots/Pilots.sol";
import {Claims} from "./Claims.sol";
import {Planets} from "./Planets.sol";
import {Battle} from "../battle/Battle.sol";

/// @title Drones: each body's pool of drones, split between mining and defense
/// @notice Decision 24 (D90) of the expansion plan. The owner lands mining drones from their ship on
/// a body (like colonists) and takes them back aboard; the owner sets how many defend, and the rest
/// mine. Once the body's Mine stands, the mining ones fill its storage with what it yields (Planets
/// works the output out from the time, asking `outputOf`). Defense drones will fight in sieges and can
/// be destroyed; mining drones never are. The split is frozen during a siege. Asteroids only for now:
/// planets keep their fitted defenses (Battle) and produce from their people.
contract Drones is ModuleBase {
    struct Pool {
        uint32 total;
        uint32 defense; // the rest mine
    }

    /// @custom:storage-location erc7201:orbiter8.drones
    struct DronesStorage {
        Pilots pilots;
        Claims claims;
        Planets planets;
        Battle battle;
        mapping(uint256 => Pool) pools; // body → its drones
        uint32 perSize; // drones a body holds per unit of its size (a tunable)
        uint32 milliPerHour; // thousandths of a unit of each yielded good a mining drone makes an hour
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.drones")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant DRONES_SLOT = 0xd65aa504b656b11c9a7e12bfc5f917d42de2f155f310deec9db4afedcf06e200;

    event PoolChanged(uint256 indexed body, address indexed pilot, uint32 total, uint32 defense);
    event RatesSet(uint32 perSize, uint32 milliPerHour);

    error AsteroidsOnly(uint256 body);
    error NotYours(uint256 body);
    error NotThere(uint256 body);
    error PoolFull(uint256 room);
    error NotEnoughDrones(uint256 have);
    error InSiege(uint256 body);

    function _d() internal pure returns (DronesStorage storage d) {
        assembly {
            d.slot := DRONES_SLOT
        }
    }

    function initialize(address admin, Pilots pilots_, Claims claims_, Planets planets_, Battle battle_)
        external
        initializer
    {
        __ModuleBase_init(admin);
        DronesStorage storage d = _d();
        (d.pilots, d.claims, d.planets, d.battle) = (pilots_, claims_, planets_, battle_);
        (d.perSize, d.milliPerHour) = (10, 250);
    }

    function setRates(uint32 perSize, uint32 milliPerHour) external onlyRole(DEFAULT_ADMIN_ROLE) {
        (_d().perSize, _d().milliPerHour) = (perSize, milliPerHour);
        emit RatesSet(perSize, milliPerHour);
    }

    /// The owner, at the body's star, after the body is brought up to now (its output so far counted).
    function _ownerAt(uint256 body) internal returns (address pilot) {
        DronesStorage storage d = _d();
        if (BodyId.kindOf(body) != BodyId.ASTEROID) revert AsteroidsOnly(body);
        pilot = d.pilots.actorOf(msg.sender);
        if (d.claims.ownerOf(body) != pilot) revert NotYours(body);
        if (d.pilots.shipOf(pilot).cell != BodyId.cellOf(body)) revert NotThere(body);
        d.planets.settle(body);
    }

    /// Lands mining drones from the ship into the body's pool (they mine until set to defend).
    function land(uint256 body, uint32 count) external {
        DronesStorage storage d = _d();
        address pilot = _ownerAt(body);
        Pool storage pool = d.pools[body];
        uint256 room = _room(body) - pool.total;
        if (count > room) revert PoolFull(room);
        Pilots.Loadout memory l = d.pilots.shipOf(pilot).loadout;
        if (count > l.miningDrones) revert NotEnoughDrones(l.miningDrones);
        l.miningDrones -= uint16(count);
        d.pilots.setLoadout(pilot, l);
        pool.total += count;
        emit PoolChanged(body, pilot, pool.total, pool.defense);
    }

    /// Takes drones from the body's pool aboard the ship as mining drones (not during a siege).
    function board(uint256 body, uint32 count) external {
        DronesStorage storage d = _d();
        address pilot = _ownerAt(body);
        _notBesieged(body);
        Pool storage pool = d.pools[body];
        if (count > pool.total) revert NotEnoughDrones(pool.total);
        Pilots.Loadout memory l = d.pilots.shipOf(pilot).loadout;
        l.miningDrones += uint16(count);
        d.pilots.setLoadout(pilot, l); // checks the ship's drone bays
        pool.total -= count;
        if (pool.defense > pool.total) pool.defense = pool.total;
        emit PoolChanged(body, pilot, pool.total, pool.defense);
    }

    /// How many of the body's drones defend; the rest mine. Frozen during a siege. From anywhere.
    function setDefense(uint256 body, uint32 defense) external {
        DronesStorage storage d = _d();
        address pilot = d.pilots.actorOf(msg.sender);
        if (d.claims.ownerOf(body) != pilot) revert NotYours(body);
        _notBesieged(body);
        Pool storage pool = d.pools[body];
        if (defense > pool.total) revert NotEnoughDrones(pool.total);
        d.planets.settle(body);
        pool.defense = defense;
        emit PoolChanged(body, pilot, pool.total, pool.defense);
    }

    function _notBesieged(uint256 body) internal view {
        (Battle.Siege memory s,) = _d().battle.siegeOf(body);
        if (s.attacker != address(0)) revert InSiege(body);
    }

    function _room(uint256 body) internal view returns (uint256) {
        return uint256(_d().planets.planetView(body, 0).size) * _d().perSize;
    }

    // ── views ───────────────────────────────────────────────────────────────────────────────────

    function poolOf(uint256 body) external view returns (uint32 total, uint32 defense, uint256 room) {
        Pool memory pool = _d().pools[body];
        return (pool.total, pool.defense, BodyId.kindOf(body) == BodyId.ASTEROID ? _room(body) : 0);
    }

    /// Thousandths of a unit of each yielded good the body's mining drones make an hour (Planets).
    function outputOf(uint256 body) external view returns (uint256) {
        Pool memory pool = _d().pools[body];
        return uint256(pool.total - pool.defense) * _d().milliPerHour;
    }
}
