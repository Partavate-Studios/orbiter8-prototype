// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ModuleBase} from "../core/ModuleBase.sol";
import {Galaxy} from "../galaxy/Galaxy.sol";
import {Pilots} from "../pilots/Pilots.sol";
import {Market} from "../market/Market.sol";
import {Credits} from "../tokens/Credits.sol";
import {Deeds} from "../tokens/Deeds.sol";
import {Fixed} from "../math/Fixed.sol";
import {SystemGen} from "./SystemGen.sol";

/// @title Planets: claims, people, production and buildings (docs/demo4-plan.md, section 5)
/// @notice A star's planets are derived (`SystemGen`); this stores only what players change.
///
/// - **Claims (D40):** the ship must be at the star, and there's a fee. For 10 minutes after a star is
///   discovered, only its discoverer may claim there, unless they've flown on. Sol's planets belong
///   to the Federation (D49).
/// - **People (D57):** colonists are recruited at Earth and carried 100 to a bay. Landed on a planet
///   with a Citadel, they grow toward the planet's cap, worked out lazily from the time.
/// - **Production:** a settled planet makes the goods its class sells, faster with more people, into
///   its storage. Owners load them onto their ship, and unload goods for building.
/// - **Buildings:** Citadel, Colony, Station, Port, Yards, Armory in a line, and the Autofactory after
///   Colony (D58). Each costs credits (burned), goods from the planet's storage and build time; a
///   building counts once its time is up, with no further transaction. A Port opens a market port
///   whose fee goes to the owner; Yards add a shipyard to it.
contract Planets is ModuleBase {
    uint8 public constant CITADEL = 1;
    uint8 public constant COLONY = 2;
    uint8 public constant STATION = 3;
    uint8 public constant PORT = 4;
    uint8 public constant YARDS = 5;
    uint8 public constant ARMORY = 6;
    uint8 public constant AUTOFACTORY = 7;
    uint256 public constant FIRST_CLAIM = 10 minutes;
    uint256 public constant EARTH = 2;

    struct Cost {
        uint64 credits;
        uint32 time; // seconds to build
        uint32 people; // the population it needs (Citadel: colonists landed; Colony: a share of the cap)
        uint8[3] goods;
        uint32[3] amounts;
    }

    struct Tuning {
        uint64 claimFee;
        uint32 colonistPrice; // credits per person recruited at Earth
        uint32 growthTime; // seconds for the gap to the cap to shrink by e (about 63%)
        uint32 producePerHour; // units of each good at a full population
        uint32 storageCap; // units of each good a planet can hold
        uint16 colonyShare; // percent of the cap a Colony needs
    }

    struct Planet {
        address owner;
        uint8 level; // finished buildings in the line, 0–6
        bool autofactory;
        uint8 building; // under construction (0: none)
        uint40 readyAt;
        uint32 population;
        uint40 settledAt;
        uint16 producedMilli; // thousandths of a unit carried between settlements
        bool besieged; // under siege: no production (D47)
    }

    struct PlanetView {
        uint256 id;
        uint8 class;
        uint8 size;
        bytes32 surface;
        uint256 cap;
        address owner;
        uint8 level;
        bool autofactory;
        uint8 building;
        uint40 readyAt;
        uint256 population;
        uint256[] stock;
    }

    /// @custom:storage-location erc7201:orbiter8.planets
    struct PlanetsStorage {
        Galaxy galaxy;
        Pilots pilots;
        Market market;
        Credits credits;
        Deeds deeds;
        mapping(uint256 => Planet) planets;
        mapping(uint256 => mapping(uint256 => uint256)) stock; // planet → good → units
        mapping(uint8 => Cost) costs; // building → cost
        Tuning tuning;
        mapping(uint256 => mapping(uint8 => string)) names; // planet → part (NAME_PLANET, NAME_STATION, NAME_MOON + orbit) → name
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.planets")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant PLANETS_SLOT = 0xf621d9cb25ea9a656959194bb7a2b456d42c293144ad14e6211624427211cb00;

    event Claimed(uint256 indexed planet, address indexed owner);
    event Recruited(address indexed pilot, uint256 colonists, uint256 credits);
    event PeopleMoved(uint256 indexed planet, address indexed pilot, int256 people, uint256 population);
    event StockMoved(uint256 indexed planet, uint256 indexed good, int256 units, uint256 stock);
    event BuildingStarted(uint256 indexed planet, uint8 building, uint40 readyAt);
    event CostSet(uint8 indexed building, Cost cost);
    event TuningSet(Tuning tuning);
    event Named(uint256 indexed planet, uint8 part, string name);
    event PlanetSeized(uint256 indexed planet, address indexed from, address indexed to, uint8 level);

    error NoSuchPlanet(uint256 planet);
    error FederationPlanet(uint256 planet);
    error AlreadyClaimed(uint256 planet);
    error FirstClaimWindow(address discoverer);
    error NotYours(uint256 planet);
    error NotThere(uint256 planet);
    error NotAtSol();
    error Busy(uint40 readyAt);
    error CannotBuild(uint8 building);
    error NeedsPeople(uint256 needed);
    error NotEnoughStock(uint256 good, uint256 have);
    error StorageFull(uint256 good, uint256 room);
    error BadName();
    error NoSuchMoon(uint256 planet, uint8 orbit);

    function _s() internal pure returns (PlanetsStorage storage s) {
        assembly {
            s.slot := PLANETS_SLOT
        }
    }

    function initialize(
        address admin,
        Galaxy galaxy_,
        Pilots pilots_,
        Market market_,
        Credits credits_,
        Deeds deeds_
    ) external initializer {
        __ModuleBase_init(admin);
        PlanetsStorage storage s = _s();
        (s.galaxy, s.pilots, s.market, s.credits, s.deeds) = (galaxy_, pilots_, market_, credits_, deeds_);
        // Goods: 0 water ice, 1 metals, 2 rare elements, 3 helium-3, 4 organics, 5 silicon, 6 equipment,
        // 7 electronics. Starting values; to be tuned by simulation with the rest of the economy.
        _setCost(CITADEL, Cost(5_000, 10 minutes, 100, [6, 4, 0], [uint32(40), 40, 0]));
        _setCost(COLONY, Cost(20_000, 30 minutes, 90, [6, 7, 0], [uint32(80), 40, 0]));
        _setCost(STATION, Cost(50_000, 1 hours, 0, [1, 7, 0], [uint32(150), 80, 0]));
        _setCost(PORT, Cost(80_000, 2 hours, 0, [6, 7, 0], [uint32(100), 100, 0]));
        _setCost(YARDS, Cost(150_000, 4 hours, 0, [1, 6, 0], [uint32(200), 100, 0]));
        _setCost(ARMORY, Cost(250_000, 6 hours, 0, [2, 7, 0], [uint32(150), 100, 0]));
        _setCost(AUTOFACTORY, Cost(60_000, 2 hours, 0, [6, 7, 5], [uint32(100), 100, 50]));
        _setTuning(Tuning(2_000, 10, 8 hours, 20, 5_000, 90));
    }

    // ── admin ───────────────────────────────────────────────────────────────────────────────────

    function setCost(uint8 building, Cost calldata cost) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setCost(building, cost);
    }

    function setTuning(Tuning calldata tuning_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTuning(tuning_);
    }

    function _setCost(uint8 building, Cost memory cost) internal {
        _s().costs[building] = cost;
        emit CostSet(building, cost);
    }

    function _setTuning(Tuning memory tuning_) internal {
        _s().tuning = tuning_;
        emit TuningSet(tuning_);
    }

    // ── where things are ────────────────────────────────────────────────────────────────────────

    /// The planet's class and size, after checking it exists around a charted star.
    function _derive(uint256 id) internal view returns (uint8 class, uint8 size) {
        uint256 cell = id >> 8;
        uint256 body = id & 0xff;
        PlanetsStorage storage s = _s();
        bytes32 seed = _seed();
        if (s.galaxy.stateOf(cell) != 2 || body >= SystemGen.planetCount(seed, cell)) revert NoSuchPlanet(id);
        (class, size,) = SystemGen.planet(seed, cell, body);
    }

    function _seed() internal view returns (bytes32 seed) {
        (seed,,,,) = _s().galaxy.universe();
    }

    /// The pilot acting (wallet or session key), after checking their ship is at the planet's star.
    function _pilotAt(uint256 id) internal view returns (address pilot) {
        Pilots p = _s().pilots;
        pilot = p.actorOf(msg.sender);
        if (p.shipOf(pilot).cell != id >> 8) revert NotThere(id);
    }

    /// The owner acting, at the planet.
    function _ownerAt(uint256 id) internal view returns (address pilot) {
        pilot = _pilotAt(id);
        if (_s().planets[id].owner != pilot) revert NotYours(id);
    }

    // ── claims (D40) ────────────────────────────────────────────────────────────────────────────

    function claim(uint256 id) external {
        address pilot = _pilotAt(id);
        _derive(id);
        uint256 cell = id >> 8;
        if (cell == 0) revert FederationPlanet(id);
        PlanetsStorage storage s = _s();
        Planet storage planet = s.planets[id];
        if (planet.owner != address(0)) revert AlreadyClaimed(id);
        Galaxy.Star memory star = s.galaxy.star(cell);
        if (
            pilot != star.discoverer && block.timestamp < uint256(star.discoveredAt) + FIRST_CLAIM
                && s.pilots.shipOf(star.discoverer).cell == cell
        ) revert FirstClaimWindow(star.discoverer);
        s.credits.burn(pilot, s.tuning.claimFee);
        planet.owner = pilot;
        planet.settledAt = uint40(block.timestamp);
        s.deeds.mint(pilot, id);
        emit Claimed(id, pilot);
    }

    // ── names (Demo 3's renames) ────────────────────────────────────────────────────────────────

    /// The parts of a planet that carry a name: the planet, its station, and moons by orbit.
    uint8 public constant NAME_PLANET = 0;
    uint8 public constant NAME_STATION = 1;
    uint8 public constant NAME_MOON = 2; // + the moon's orbit, 0–7

    /// The owner names their planet, its station or one of its moons. Until then the client shows
    /// derived names. Sol's keep theirs.
    function rename(uint256 id, uint8 part, string calldata name) external {
        PlanetsStorage storage s = _s();
        address pilot = s.pilots.actorOf(msg.sender);
        _derive(id);
        if (id >> 8 == 0) revert FederationPlanet(id);
        if (s.planets[id].owner != pilot) revert NotYours(id);
        if (part >= NAME_MOON) {
            uint8 orbit = part - NAME_MOON;
            if (orbit >= 8 || (SystemGen.moonSlots(_seed(), id >> 8, id & 0xff) >> orbit) & 1 == 0) {
                revert NoSuchMoon(id, orbit);
            }
        }
        uint256 length = bytes(name).length;
        if (length == 0 || length > 24) revert BadName();
        s.names[id][part] = name;
        emit Named(id, part, name);
    }

    /// The names an owner has given: the planet, its station, then moons by orbit ("" where unnamed).
    function namesOf(uint256 id) external view returns (string[10] memory names) {
        for (uint8 part = 0; part < 10; part++) {
            names[part] = _s().names[id][part];
        }
    }

    // ── people (D57) ────────────────────────────────────────────────────────────────────────────

    /// Recruits colonists at Earth onto the ship.
    function recruit(uint256 count) external {
        PlanetsStorage storage s = _s();
        address pilot = s.pilots.actorOf(msg.sender);
        if (s.pilots.shipOf(pilot).cell != 0) revert NotAtSol();
        uint256 price = count * s.tuning.colonistPrice;
        s.credits.burn(pilot, price);
        s.pilots.addColonists(pilot, count);
        emit Recruited(pilot, count, price);
    }

    /// Lands colonists from the ship on the owner's planet.
    function land(uint256 id, uint256 count) external {
        address pilot = _ownerAt(id);
        Planet storage planet = _settle(id);
        _s().pilots.removeColonists(pilot, count);
        planet.population += uint32(count);
        emit PeopleMoved(id, pilot, int256(count), planet.population);
    }

    /// Takes people from the owner's planet aboard the ship.
    function board(uint256 id, uint256 count) external {
        address pilot = _ownerAt(id);
        Planet storage planet = _settle(id);
        if (count > planet.population) revert NeedsPeople(count);
        planet.population -= uint32(count);
        _s().pilots.addColonists(pilot, count);
        emit PeopleMoved(id, pilot, -int256(count), planet.population);
    }

    // ── storage ─────────────────────────────────────────────────────────────────────────────────

    /// Unloads goods from the ship into the owner's planet's storage.
    function deliver(uint256 id, uint256 good, uint256 units) external {
        address pilot = _ownerAt(id);
        _settle(id);
        _s().pilots.removeCargo(pilot, good, units);
        _addStock(id, good, units);
    }

    /// Loads goods from the owner's planet's storage onto the ship.
    function collect(uint256 id, uint256 good, uint256 units) external {
        address pilot = _ownerAt(id);
        _settle(id);
        _takeStock(id, good, units);
        _s().pilots.addCargo(pilot, good, units);
    }

    function _addStock(uint256 id, uint256 good, uint256 units) internal {
        uint256 have = _s().stock[id][good];
        uint256 room = _s().tuning.storageCap - (have > _s().tuning.storageCap ? _s().tuning.storageCap : have);
        if (units > room) revert StorageFull(good, room);
        _s().stock[id][good] = have + units;
        emit StockMoved(id, good, int256(units), have + units);
    }

    function _takeStock(uint256 id, uint256 good, uint256 units) internal {
        uint256 have = _s().stock[id][good];
        if (units > have) revert NotEnoughStock(good, have);
        _s().stock[id][good] = have - units;
        emit StockMoved(id, good, -int256(units), have - units);
    }

    // ── buildings ───────────────────────────────────────────────────────────────────────────────

    /// Starts the next building in the line (or the Autofactory), paying credits and goods from the
    /// planet's storage. The owner can order it from anywhere; the goods must already be there.
    function build(uint256 id, uint8 building) external {
        PlanetsStorage storage s = _s();
        address pilot = s.pilots.actorOf(msg.sender);
        Planet storage planet = _settle(id);
        if (planet.owner != pilot) revert NotYours(id);
        if (planet.building != 0) revert Busy(planet.readyAt);
        bool next = building == planet.level + 1 && building <= ARMORY;
        bool factory = building == AUTOFACTORY && planet.level >= COLONY && !planet.autofactory;
        if (!next && !factory) revert CannotBuild(building);

        Cost memory cost = s.costs[building];
        (uint8 class, uint8 size) = _derive(id);
        uint256 needed = building == COLONY
            ? (SystemGen.populationCap(class, size) * cost.people) / 100
            : cost.people;
        if (planet.population < needed) revert NeedsPeople(needed);
        for (uint256 i = 0; i < 3; i++) {
            if (cost.amounts[i] > 0) _takeStock(id, cost.goods[i], cost.amounts[i]);
        }
        s.credits.burn(pilot, cost.credits);
        uint40 readyAt = uint40(block.timestamp + cost.time);
        planet.building = building;
        planet.readyAt = readyAt;
        if (building == CITADEL) planet.settledAt = readyAt;
        if (building == PORT) s.market.openPort(id, class, pilot, readyAt, 0);
        if (building == YARDS) s.market.openPort(id, class, pilot, 0, readyAt);
        emit BuildingStarted(id, building, readyAt);
    }

    // ── settling: what time has done ────────────────────────────────────────────────────────────

    /// Brings a planet up to now: a finished building, people grown, goods produced. Anyone may call it.
    function settle(uint256 id) external {
        _settle(id);
    }

    function _settle(uint256 id) internal returns (Planet storage planet) {
        planet = _s().planets[id];
        if (planet.building != 0 && block.timestamp >= planet.readyAt) {
            if (planet.building == AUTOFACTORY) planet.autofactory = true;
            else planet.level = planet.building;
            planet.building = 0;
        }
        // A Citadel under construction sets the clock to its finish: nothing grows before it.
        if (planet.owner == address(0) || block.timestamp <= planet.settledAt) return planet;
        (uint8 class, uint8 size) = _derive(id);
        uint256 cap = SystemGen.populationCap(class, size);
        uint256 before = planet.population;
        uint256 elapsed = block.timestamp - planet.settledAt;
        planet.settledAt = uint40(block.timestamp);
        if (planet.level < CITADEL) return planet; // nobody grows or works before a Citadel
        uint256 grown = _grow(before, cap, elapsed);
        planet.population = uint32(grown);
        if (!planet.besieged) _produce(id, planet, class, cap, (before + grown) / 2, elapsed);
    }

    /// People after `elapsed` seconds: the gap to the cap shrinks by e every growth time.
    function _grow(uint256 people, uint256 cap, uint256 elapsed) internal view returns (uint256) {
        int256 decay = Fixed.expNeg(int256((elapsed * uint256(Fixed.ONE)) / _s().tuning.growthTime));
        int256 gap = int256(cap) - int256(people);
        return uint256(int256(cap) - (gap * decay) / Fixed.ONE);
    }

    function _produce(uint256 id, Planet storage planet, uint8 class, uint256 cap, uint256 people, uint256 elapsed)
        internal
    {
        if (cap == 0) return;
        Tuning storage t = _s().tuning;
        uint256 milli = (uint256(t.producePerHour) * 1000 * elapsed * (people > cap ? cap : people)) / (3600 * cap)
            + planet.producedMilli;
        planet.producedMilli = uint16(milli % 1000);
        uint256 units = milli / 1000;
        if (units == 0) return;
        (uint256 sells,) = _s().market.mix(class);
        for (uint256 g = 0; sells >> g != 0; g++) {
            if ((sells >> g) & 1 == 0) continue;
            uint256 have = _s().stock[id][g];
            uint256 room = have >= t.storageCap ? 0 : t.storageCap - have;
            _s().stock[id][g] = have + (units < room ? units : room);
        }
    }

    // ── for other modules (GAME_MODULE): the Autofactory and sieges ─────────────────────────────

    /// Settles and takes goods from a planet's storage (the Autofactory paying for an order).
    function useStock(uint256 id, uint256 good, uint256 units) external onlyRole(GAME_MODULE) {
        _settle(id);
        _takeStock(id, good, units);
    }

    /// Starts or ends a siege's hold on production (Battle).
    function setBesieged(uint256 id, bool on) external onlyRole(GAME_MODULE) {
        _settle(id).besieged = on;
    }

    /// Hands a planet to a new owner a tech level down (a siege's successful claim, D47).
    function seize(uint256 id, address to) external onlyRole(GAME_MODULE) {
        Planet storage planet = _settle(id);
        address from = planet.owner;
        uint8 had = planet.level;
        planet.owner = to;
        if (had > CITADEL) planet.level = had - 1;
        planet.building = 0;
        _s().deeds.seize(to, id);
        if (had >= PORT) {
            // The port and its yard follow the level that's left; "never" closes them.
            (uint8 class,) = _derive(id);
            uint40 never = type(uint40).max;
            _s().market.openPort(id, class, to, planet.level >= PORT ? 1 : never, planet.level >= YARDS ? 1 : never);
        }
        emit PlanetSeized(id, from, to, planet.level);
    }

    // ── views ───────────────────────────────────────────────────────────────────────────────────

    function costOf(uint8 building) external view returns (Cost memory) {
        return _s().costs[building];
    }

    function tuning() external view returns (Tuning memory) {
        return _s().tuning;
    }

    /// The owner of a planet, or address(0).
    function ownerOf(uint256 id) external view returns (address) {
        return _s().planets[id].owner;
    }

    /// Whether a planet's Autofactory is running.
    function hasAutofactory(uint256 id) external view returns (bool) {
        Planet storage p = _s().planets[id];
        return p.autofactory || (p.building == AUTOFACTORY && block.timestamp >= p.readyAt);
    }

    /// A planet as it stands now (time's effects worked out, nothing written), with `goods` stock entries.
    function planetView(uint256 id, uint256 goods) public view returns (PlanetView memory v) {
        (v.class, v.size) = _derive(id);
        (,, v.surface) = SystemGen.planet(_seed(), id >> 8, id & 0xff);
        v.id = id;
        v.cap = SystemGen.populationCap(v.class, v.size);
        Planet memory p = _s().planets[id];
        if (p.building != 0 && block.timestamp >= p.readyAt) {
            if (p.building == AUTOFACTORY) p.autofactory = true;
            else p.level = p.building;
            p.building = 0;
        }
        (v.owner, v.level, v.autofactory, v.building, v.readyAt) =
            (p.owner, p.level, p.autofactory, p.building, p.readyAt);
        v.population = p.population;
        v.stock = new uint256[](goods);
        for (uint256 g = 0; g < goods; g++) {
            v.stock[g] = _s().stock[id][g];
        }
        if (p.owner == address(0) || p.level < CITADEL || block.timestamp <= p.settledAt) return v;
        if (p.besieged) {
            v.population = _grow(p.population, v.cap, block.timestamp - p.settledAt);
            return v;
        }
        uint256 elapsed = block.timestamp - p.settledAt;
        v.population = _grow(p.population, v.cap, elapsed);
        uint256 people = (p.population + v.population) / 2;
        uint256 units =
            ((uint256(_s().tuning.producePerHour) * 1000 * elapsed * (people > v.cap ? v.cap : people)) / (3600 * v.cap)
                    + p.producedMilli) / 1000;
        (uint256 sells,) = _s().market.mix(v.class);
        for (uint256 g = 0; g < goods; g++) {
            if ((sells >> g) & 1 == 1) {
                uint256 total = v.stock[g] + units;
                v.stock[g] = total > _s().tuning.storageCap ? _s().tuning.storageCap : total;
            }
        }
    }

    /// Every planet at a star (none around black holes or uncharted cells).
    function system(uint256 cell, uint256 goods) external view returns (PlanetView[] memory list) {
        if (_s().galaxy.stateOf(cell) != 2) return list;
        uint256 n = SystemGen.planetCount(_seed(), cell);
        list = new PlanetView[](n);
        for (uint256 body = 0; body < n; body++) {
            list[body] = planetView((cell << 8) | body, goods);
        }
    }
}
