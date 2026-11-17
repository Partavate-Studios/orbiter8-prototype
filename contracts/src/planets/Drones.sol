// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {BodyId} from "./BodyId.sol";
import {ModuleBase} from "../core/ModuleBase.sol";
import {Pilots} from "../pilots/Pilots.sol";
import {Claims} from "./Claims.sol";
import {Planets} from "./Planets.sol";
import {Battle} from "../battle/Battle.sol";
import {Repairs} from "../battle/Repairs.sol";
import {Galaxy} from "../galaxy/Galaxy.sol";
import {BeltGen} from "./BeltGen.sol";

/// @title Drones: each body's pool of drones, split between mining and defense
/// @notice Decision 24 (D90) of the expansion plan. The owner lands mining drones from their ship on
/// a body (like colonists) and takes them back aboard; the owner sets how many defend, and the rest
/// mine. Once the body's Mine stands, the mining ones fill its storage with what it yields (Planets
/// works the output out from the time, asking `outputOf`). Defense drones will fight in sieges and can
/// be destroyed; mining drones never are. The split is frozen during a siege. Asteroids only for now:
/// planets keep their fitted defenses (Battle) and produce from their people.
///
/// **Ships mining empty sections (D78, D93, D100):** a ship parks at one of an empty section's six
/// slots and its mining drones (its own, and its built-in ones set to mining) fill its holds, at the
/// rate bodies mine, until they're full; then it no longer holds its slot. The pilot's next move that
/// changes the ship (Pilots tells this module) loads what was mined and ends it. Empty sections never
/// run out. Ships mine only empty sections.
contract Drones is ModuleBase {
    uint8 public constant SLOTS = 6;

    struct Miner {
        uint256 section; // the empty section's body id
        uint8 slot;
        uint40 since;
        uint32 rate; // thousandths of a unit an hour
        uint16 room; // free cargo bays when it started
    }

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
        Repairs repairs; // the built-in drones' jobs
        Galaxy galaxy;
        mapping(address => Miner) miners; // pilot → where it's mining
        mapping(uint256 => address[6]) slots; // empty section → who holds each slot
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.drones")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant DRONES_SLOT = 0xd65aa504b656b11c9a7e12bfc5f917d42de2f155f310deec9db4afedcf06e200;

    event PoolChanged(uint256 indexed body, address indexed pilot, uint32 total, uint32 defense);
    event RatesSet(uint32 perSize, uint32 milliPerHour);
    event MiningStarted(address indexed pilot, uint256 indexed section, uint8 slot, uint32 rate);
    event MiningStopped(address indexed pilot, uint256 indexed section, uint256 units);

    error AsteroidsOnly(uint256 body);
    error NotYours(uint256 body);
    error NotThere(uint256 body);
    error PoolFull(uint256 room);
    error NotEnoughDrones(uint256 have);
    error InSiege(uint256 body);
    error NotEmptySpace(uint256 section);
    error SlotTaken(uint8 slot);
    error AlreadyMining();
    error NotMining();
    error NothingToMineWith();

    function _d() internal pure returns (DronesStorage storage d) {
        assembly {
            d.slot := DRONES_SLOT
        }
    }

    function initialize(
        address admin,
        Pilots pilots_,
        Claims claims_,
        Planets planets_,
        Battle battle_,
        Repairs repairs_,
        Galaxy galaxy_
    ) external initializer {
        __ModuleBase_init(admin);
        DronesStorage storage d = _d();
        (d.pilots, d.claims, d.planets, d.battle, d.repairs, d.galaxy) =
            (pilots_, claims_, planets_, battle_, repairs_, galaxy_);
        // 80 drones on the largest asteroid make what a Sol port restocks an hour (capacity 300 over
        // 2 hours: 150), the top rate the world allows (D89)
        (d.perSize, d.milliPerHour) = (10, 1875);
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

    /// A siege's end (Battle): defense drones destroyed come off the pool. Mining drones never are.
    function loseDefense(uint256 body, uint32 lost) external onlyRole(GAME_MODULE) {
        Pool storage pool = _d().pools[body];
        if (lost > pool.defense) lost = pool.defense;
        _d().planets.settle(body);
        pool.defense -= lost;
        pool.total -= lost;
        emit PoolChanged(body, address(0), pool.total, pool.defense);
    }

    // ── ships mining empty sections ─────────────────────────────────────────────────────────────

    /// Parks the ship at a free slot of an empty section at its star and sets its drones mining.
    function startMining(uint256 section, uint8 slot) external {
        DronesStorage storage d = _d();
        address pilot = d.pilots.actorOf(msg.sender);
        if (d.pilots.isMining(pilot)) revert AlreadyMining();
        Pilots.Ship memory ship = d.pilots.shipOf(pilot);
        uint256 cell = BodyId.cellOf(section);
        if (ship.cell != cell) revert NotThere(section);
        if (!_emptySpace(section)) revert NotEmptySpace(section);
        if (slot >= SLOTS) revert SlotTaken(slot);
        address holder = d.slots[section][slot];
        if (holder != address(0) && holder != pilot && d.pilots.isMining(holder) && !_full(holder)) {
            revert SlotTaken(slot);
        }
        (, uint8 mining) = d.repairs.dronesOf(pilot);
        uint32 rate = uint32((uint256(ship.loadout.miningDrones) + mining) * d.milliPerHour);
        uint256 room = d.pilots.freeBays(pilot);
        if (rate == 0 || room == 0) revert NothingToMineWith();
        d.miners[pilot] = Miner(section, slot, uint40(block.timestamp), rate, uint16(room));
        d.slots[section][slot] = pilot;
        d.pilots.setMining(pilot, true);
        emit MiningStarted(pilot, section, slot, rate);
    }

    /// Ends the pilot's mining, loading what was mined.
    function stopMining() external {
        DronesStorage storage d = _d();
        address pilot = d.pilots.actorOf(msg.sender);
        if (!d.pilots.isMining(pilot)) revert NotMining();
        d.pilots.setMining(pilot, false);
        _stop(pilot);
    }

    /// Pilots: the pilot is changing the ship (its mining flag already cleared).
    function onStop(address pilot) external onlyRole(GAME_MODULE) {
        _stop(pilot);
    }

    function _stop(address pilot) internal {
        DronesStorage storage d = _d();
        Miner memory m = d.miners[pilot];
        uint256 units = _mined(m);
        delete d.miners[pilot];
        if (d.slots[m.section][m.slot] == pilot) delete d.slots[m.section][m.slot];
        if (units > 0) {
            bytes32 seed = _seed();
            uint256 goods = BeltGen.yields(BeltGen.dust(seed, BodyId.cellOf(m.section), BodyId.indexOf(m.section)));
            // half to each of the dust's two goods, the odd unit to the lower-numbered one
            uint256 lower;
            while ((goods >> lower) & 1 == 0) lower++;
            uint256 upper = lower + 1;
            while ((goods >> upper) & 1 == 0) upper++;
            d.pilots.addCargo(pilot, lower, units - units / 2);
            if (units / 2 > 0) d.pilots.addCargo(pilot, upper, units / 2);
        }
        emit MiningStopped(pilot, m.section, units);
    }

    function _mined(Miner memory m) internal view returns (uint256 units) {
        if (m.since == 0) return 0;
        units = (uint256(m.rate) * (block.timestamp - m.since)) / 1 hours / 1000;
        if (units > m.room) units = m.room;
    }

    function _full(address pilot) internal view returns (bool) {
        Miner memory m = _d().miners[pilot];
        return _mined(m) >= m.room;
    }

    function _seed() internal view returns (bytes32 seed) {
        (seed,,,,) = _d().galaxy.universe();
    }

    function _emptySpace(uint256 section) internal view returns (bool) {
        if (BodyId.kindOf(section) != BodyId.ASTEROID || BodyId.indexOf(section) >= BeltGen.SECTIONS) return false;
        uint256 cell = BodyId.cellOf(section);
        bytes32 seed = _seed();
        if (_d().galaxy.stateOf(cell) != 2 || !BeltGen.hasBelt(seed, cell)) return false;
        (bool asteroid,,) = BeltGen.section(seed, cell, BodyId.indexOf(section));
        return !asteroid;
    }

    /// Where the pilot is mining, and what's been mined so far (units, up to the ship's free bays).
    function miningOf(address pilot) external view returns (Miner memory m, uint256 mined) {
        m = _d().miners[pilot];
        mined = _mined(m);
    }

    /// Who holds each of an empty section's six slots, and whether each is full (a full ship's slot
    /// is free to take).
    function slotsOf(uint256 section) external view returns (address[6] memory holders, bool[6] memory full) {
        holders = _d().slots[section];
        for (uint256 i = 0; i < SLOTS; i++) {
            if (holders[i] != address(0)) full[i] = _full(holders[i]);
        }
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
