// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ModuleBase} from "../core/ModuleBase.sol";
import {Pilots} from "../pilots/Pilots.sol";
import {Credits} from "../tokens/Credits.sol";
import {Planets} from "./Planets.sol";

/// @title The Autofactory (docs/demo4-plan.md, section 5; D58)
/// @notice A planet with an Autofactory builds parts in a queue of up to five orders. Each order's
/// credits and goods are paid when it's queued (the goods from the planet's storage); orders are built
/// one after another, worked out lazily from the time, into the planet's parts store. **Parts are
/// data:** a catalog the admin can add to, so crafting can add recipes later. Battle (milestone 4)
/// gives the parts their use: fitting them to the planet or loading them onto the ship.
contract Factory is ModuleBase {
    uint256 public constant QUEUE = 5;

    struct Part {
        string name;
        uint64 credits;
        uint32 time; // seconds per part
        bool planetOnly; // the BFG and orbital platforms can't go aboard a ship (D56)
        uint8[2] goods;
        uint32[2] amounts;
    }

    struct Order {
        uint16 part;
        uint16 count;
        uint40 readyAt;
    }

    /// @custom:storage-location erc7201:orbiter8.factory
    struct FactoryStorage {
        Pilots pilots;
        Planets planets;
        Credits credits;
        Part[] parts;
        mapping(uint256 => Order[]) queues; // planet → orders not yet delivered
        mapping(uint256 => mapping(uint256 => uint256)) stored; // planet → part → finished parts
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.factory")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant FACTORY_SLOT = 0x7876fc7e7dfa80949afc16d8ecba4b8a2542bc8d3d86778c12de722c49dae400;

    event PartAdded(uint256 indexed part, string name);
    event Ordered(uint256 indexed planet, uint256 indexed part, uint256 count, uint40 readyAt);
    event PartsMoved(uint256 indexed planet, uint256 indexed part, int256 count, uint256 stored);

    error NoAutofactory(uint256 planet);
    error NotYours(uint256 planet);
    error QueueFull();
    error NoSuchPart(uint256 part);
    error NotEnoughParts(uint256 part, uint256 have);

    function _f() internal pure returns (FactoryStorage storage f) {
        assembly {
            f.slot := FACTORY_SLOT
        }
    }

    function initialize(address admin, Pilots pilots_, Planets planets_, Credits credits_) external initializer {
        __ModuleBase_init(admin);
        (_f().pilots, _f().planets, _f().credits) = (pilots_, planets_, credits_);
        // Goods: 1 metals, 2 rare elements, 3 helium-3, 6 equipment, 7 electronics. Starting values.
        _addPart(Part("Drone", 500, 5 minutes, false, [1, 7], [uint32(5), 3]));
        _addPart(Part("Repair bot", 2_000, 15 minutes, false, [6, 7], [uint32(10), 10]));
        _addPart(Part("Point defense", 3_000, 20 minutes, false, [1, 7], [uint32(20), 10]));
        _addPart(Part("Railgun", 6_000, 40 minutes, false, [1, 6], [uint32(40), 20]));
        _addPart(Part("Missile rack", 6_000, 40 minutes, false, [3, 7], [uint32(30), 20]));
        _addPart(Part("Armor plating", 2_500, 20 minutes, false, [1, 1], [uint32(50), 0]));
        _addPart(Part("Shield generator", 8_000, 1 hours, false, [2, 7], [uint32(20), 30]));
        _addPart(Part("Orbital platform", 40_000, 3 hours, true, [1, 6], [uint32(200), 100]));
        _addPart(Part("BFG", 150_000, 8 hours, true, [2, 7], [uint32(150), 150]));
    }

    function addPart(Part calldata part) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _addPart(part);
    }

    function _addPart(Part memory part) internal {
        _f().parts.push(part);
        emit PartAdded(_f().parts.length - 1, part.name);
    }

    /// Queues `count` of a part at the owner's planet (from anywhere), paying now.
    function order(uint256 planet, uint256 part, uint16 count) external {
        FactoryStorage storage f = _f();
        address pilot = f.pilots.actorOf(msg.sender);
        if (f.planets.ownerOf(planet) != pilot) revert NotYours(planet);
        if (!f.planets.hasAutofactory(planet)) revert NoAutofactory(planet);
        if (part >= f.parts.length || count == 0) revert NoSuchPart(part);
        Order[] storage queue = _deliver(planet);
        if (queue.length >= QUEUE) revert QueueFull();
        Part memory p = f.parts[part];
        for (uint256 i = 0; i < 2; i++) {
            if (p.amounts[i] > 0) f.planets.useStock(planet, p.goods[i], uint256(p.amounts[i]) * count);
        }
        f.credits.burn(pilot, uint256(p.credits) * count);
        uint256 start = queue.length > 0 ? queue[queue.length - 1].readyAt : block.timestamp;
        uint40 readyAt = uint40(start + uint256(p.time) * count);
        queue.push(Order(uint16(part), count, readyAt));
        emit Ordered(planet, part, count, readyAt);
    }

    /// Moves finished orders into the planet's parts store; returns the orders still building.
    function _deliver(uint256 planet) internal returns (Order[] storage queue) {
        queue = _f().queues[planet];
        uint256 done;
        while (done < queue.length && queue[done].readyAt <= block.timestamp) {
            Order memory o = queue[done];
            uint256 stored = _f().stored[planet][o.part] += o.count;
            emit PartsMoved(planet, o.part, int256(uint256(o.count)), stored);
            done++;
        }
        if (done == 0) return queue;
        uint256 left = queue.length - done;
        for (uint256 i = 0; i < left; i++) {
            queue[i] = queue[i + done];
        }
        for (uint256 i = 0; i < done; i++) {
            queue.pop();
        }
    }

    /// Anyone may bring a planet's deliveries up to date.
    function deliver(uint256 planet) external {
        _deliver(planet);
    }

    // ── for other modules (GAME_MODULE): battle fits and moves parts ────────────────────────────

    function takeParts(uint256 planet, uint256 part, uint256 count) external onlyRole(GAME_MODULE) {
        _deliver(planet);
        uint256 have = _f().stored[planet][part];
        if (count > have) revert NotEnoughParts(part, have);
        _f().stored[planet][part] = have - count;
        emit PartsMoved(planet, part, -int256(count), have - count);
    }

    function addParts(uint256 planet, uint256 part, uint256 count) external onlyRole(GAME_MODULE) {
        _deliver(planet);
        uint256 stored = _f().stored[planet][part] += count;
        emit PartsMoved(planet, part, int256(count), stored);
    }

    // ── views ───────────────────────────────────────────────────────────────────────────────────

    function parts() external view returns (Part[] memory) {
        return _f().parts;
    }

    /// The orders still building at `planet`, as of now.
    function queueOf(uint256 planet) external view returns (Order[] memory pending) {
        Order[] storage queue = _f().queues[planet];
        uint256 done;
        while (done < queue.length && queue[done].readyAt <= block.timestamp) done++;
        pending = new Order[](queue.length - done);
        for (uint256 i = done; i < queue.length; i++) {
            pending[i - done] = queue[i];
        }
    }

    /// Finished parts at `planet`, as of now (deliveries included).
    function storedAt(uint256 planet) external view returns (uint256[] memory counts) {
        FactoryStorage storage f = _f();
        counts = new uint256[](f.parts.length);
        for (uint256 p = 0; p < counts.length; p++) {
            counts[p] = f.stored[planet][p];
        }
        Order[] storage queue = f.queues[planet];
        for (uint256 i = 0; i < queue.length && queue[i].readyAt <= block.timestamp; i++) {
            counts[queue[i].part] += queue[i].count;
        }
    }
}
