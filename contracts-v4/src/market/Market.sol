// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ModuleBase} from "../core/ModuleBase.sol";
import {Pilots} from "../pilots/Pilots.sol";
import {Credits} from "../tokens/Credits.sol";
import {Pricing} from "./Pricing.sol";

/// @title Goods, ports, trade and the shipyard (docs/demo4-plan.md, section 4; D27, D29)
/// @notice **Goods are data** (D27): a registry the admin can add to, each with a base price and a
/// spread. **Ports** sell some goods and buy others, by their planet's class; the class mixes are
/// data too. **Trade** needs the ship at the port's star, and every line carries a price limit, so a
/// trade never fills at a price the player didn't see. Stock is kept as a shortfall from full that
/// restocks over time (see `Pricing`).
///
/// A port is named by `cell << 8 | body`: the star, then the planet's place in its system. In this
/// milestone the ports are the Federation's nine stations at Sol; claimed planets open their own in
/// milestone 3 (`openPort`). The Federation mints what it pays and burns what it's paid, and burns
/// its fee; a player-owned port's fee goes to its owner instead.
contract Market is ModuleBase {
    uint256 public constant SOL_PORTS = 9;
    uint256 public constant SOL_YARD = 2; // Earth's station, the I.S.S.
    uint256 public constant MAX_BODIES = 16;

    enum Mode {
        None,
        Sells,
        Buys
    }

    struct Good {
        string name;
        uint32 base;
        uint32 spread;
    }

    struct Stock {
        uint32 shortfall;
        uint40 updated;
    }

    /// Numbers the simulator tunes (D29); the admin sets them.
    struct Tuning {
        uint32 capacity; // units of each good a port holds (or wants) when full, at least
        uint32 capacityPerPilot; // and this many more per registered pilot, so shares hold as Sol fills
        uint32 refill; // seconds to restock from empty
        uint16 feeBps; // the fee on trades, in hundredths of a percent
        uint32 bayBase; // the first bay's price
        uint32 bayStep; // each bay already fitted adds this
        uint64[3] rangePrices; // to reach range 2, 3 and 4
    }

    /// A port opened on a claimed planet (milestone 3).
    struct Opened {
        bool open;
        uint8 class;
        bool yard;
        address owner;
    }

    /// One line of a trade: units > 0 buys from the port, units < 0 sells to it. `limit` is the
    /// most the player will pay (buying) or the least they'll accept (selling), in credits.
    struct Line {
        uint256 good;
        int256 units;
        uint256 limit;
    }

    struct Quote {
        Mode mode;
        uint256 shortfall;
        uint256 price; // the next unit's price
    }

    struct PortView {
        uint256 port;
        uint8 class;
        bool yard;
        address owner;
        Quote[] quotes;
    }

    /// @custom:storage-location erc7201:orbiter8.market
    struct MarketStorage {
        Pilots pilots;
        Credits credits;
        Good[] goods;
        mapping(uint8 => uint256) sells; // class → bitmask of goods its ports sell
        mapping(uint8 => uint256) buys; // class → bitmask of goods its ports buy
        mapping(uint256 => mapping(uint256 => Stock)) stock; // port → good → stock
        mapping(uint256 => Opened) opened;
        Tuning tuning;
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.market")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant MARKET_SLOT = 0xda4bef9c22c3e87392e39294097c8b24b4e442b12db3c4788c4a825a708a9e00;

    event GoodAdded(uint256 indexed good, string name, uint32 base, uint32 spread);
    event MixSet(uint8 indexed class, uint256 sells, uint256 buys);
    event TuningSet(Tuning tuning);
    event PortOpened(uint256 indexed port, uint8 class, bool yard, address owner);
    event Traded(address indexed pilot, uint256 indexed port, uint256 indexed good, int256 units, uint256 credits);
    event BaysBought(address indexed pilot, uint256 indexed port, uint16 bays, uint256 credits);
    event RangeBought(address indexed pilot, uint256 indexed port, uint8 range, uint256 credits);

    error NoSuchPort(uint256 port);
    error NotAtPort(uint256 port);
    error NotTraded(uint256 good);
    error PortFull(uint256 good, uint256 room);
    error PriceLimit(uint256 good, uint256 credits);
    error NoYard(uint256 port);
    error MaxRange();
    error BadGood();

    function _m() internal pure returns (MarketStorage storage m) {
        assembly {
            m.slot := MARKET_SLOT
        }
    }

    function initialize(address admin, Pilots pilots_, Credits credits_) external initializer {
        __ModuleBase_init(admin);
        MarketStorage storage m = _m();
        m.pilots = pilots_;
        m.credits = credits_;
        // The eight goods (D27). Margins differ, so routes matter (the play session found every
        // good paid the same). Starting values; the simulator tunes them.
        _addGood("Water ice", 40, 30);
        _addGood("Metals", 70, 45);
        _addGood("Rare elements", 160, 90);
        _addGood("Helium-3", 120, 70);
        _addGood("Organics", 60, 40);
        _addGood("Silicon", 50, 35);
        _addGood("Equipment", 200, 100);
        _addGood("Electronics", 260, 130);
        // What each planet class sells and buys (bit g = good g). Every good is both sold and
        // bought somewhere at Sol, whose ports are Rocky, Volcanic, Terrestrial, Gaseous and Ice.
        _setMix(0, 0xD0, 0x2E); // Terrestrial: sells organics, equipment, electronics; buys metals, rare, He-3, silicon
        _setMix(1, 0x22, 0x19); // Rocky: metals, silicon; buys water, He-3, organics
        _setMix(2, 0x11, 0xC2); // Oceanic: water, organics; buys metals, equipment, electronics
        _setMix(3, 0x24, 0x51); // Desert: rare, silicon; buys water, organics, equipment
        _setMix(4, 0x01, 0x94); // Ice: water; buys rare, organics, electronics
        _setMix(5, 0x06, 0xA1); // Volcanic: metals, rare; buys water, silicon, electronics
        _setMix(6, 0x08, 0x52); // Gaseous: He-3; buys metals, organics, equipment
        _setMix(7, 0x42, 0x19); // Ferrous: metals, equipment; buys water, He-3, organics
        _setMix(8, 0x24, 0xC1); // Lava: rare, silicon; buys water, equipment, electronics
        _setMix(9, 0x10, 0xC2); // Swamp: organics; buys metals, equipment, electronics
        // From the simulator (orbiter-client/dev/sim4/economy.mjs, docs/demo4-tuning.md).
        _setTuning(Tuning(300, 220, 2 hours, 200, 200, 8, [uint64(15_000), 150_000, 600_000]));
    }

    // ── admin: data, not code (D27) ─────────────────────────────────────────────────────────────

    function addGood(string calldata name, uint32 base, uint32 spread) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _addGood(name, base, spread);
    }

    function setMix(uint8 class, uint256 sells, uint256 buys) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setMix(class, sells, buys);
    }

    function setTuning(Tuning calldata tuning_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTuning(tuning_);
    }

    /// Opens a port on a claimed planet (the Planets module, milestone 3).
    function openPort(uint256 port, uint8 class, bool yard, address owner) external onlyRole(GAME_MODULE) {
        _m().opened[port] = Opened(true, class, yard, owner);
        emit PortOpened(port, class, yard, owner);
    }

    function _addGood(string memory name, uint32 base, uint32 spread) internal {
        if (spread / 10 > base) revert BadGood();
        _m().goods.push(Good(name, base, spread));
        emit GoodAdded(_m().goods.length - 1, name, base, spread);
    }

    function _setMix(uint8 class, uint256 sells, uint256 buys) internal {
        if (sells & buys != 0) revert BadGood();
        _m().sells[class] = sells;
        _m().buys[class] = buys;
        emit MixSet(class, sells, buys);
    }

    function _setTuning(Tuning memory tuning_) internal {
        _m().tuning = tuning_;
        emit TuningSet(tuning_);
    }

    // ── ports ───────────────────────────────────────────────────────────────────────────────────

    /// Sol's nine Federation stations, by planet: Mercury, Venus, Earth, Mars, Jupiter, Saturn,
    /// Uranus, Neptune, Pluto (Demo 3's classes).
    function _solClass(uint256 body) internal pure returns (uint8) {
        return [1, 5, 0, 1, 6, 6, 4, 4, 1][body];
    }

    /// A port's class, whether it has a yard, and its owner (address(0): the Federation).
    function _port(uint256 port) internal view returns (uint8 class, bool yard, address owner) {
        uint256 cell = port >> 8;
        uint256 body = port & 0xff;
        if (cell == 0 && body < SOL_PORTS) return (_solClass(body), body == SOL_YARD, address(0));
        Opened storage o = _m().opened[port];
        if (!o.open) revert NoSuchPort(port);
        return (o.class, o.yard, o.owner);
    }

    function _mode(uint8 class, uint256 good) internal view returns (Mode) {
        if ((_m().sells[class] >> good) & 1 == 1) return Mode.Sells;
        if ((_m().buys[class] >> good) & 1 == 1) return Mode.Buys;
        return Mode.None;
    }

    /// How much of each good a port holds (or wants) when full: more as more pilots register.
    function capacity() public view returns (uint256) {
        Tuning storage t = _m().tuning;
        uint256 scaled = uint256(t.capacityPerPilot) * _m().pilots.pilotCount();
        return scaled > t.capacity ? scaled : t.capacity;
    }

    /// The good's stock at the port now, restocked, and the time to store with it.
    function _stock(uint256 port, uint256 good, uint256 cap) internal view returns (uint256 shortfall, uint256 updated) {
        Stock memory s = _m().stock[port][good];
        return Pricing.restock(s.shortfall, s.updated, block.timestamp, cap, _m().tuning.refill);
    }

    /// The pilot acting (wallet or session key), after checking their ship is at the port's star.
    function _pilotAt(uint256 port) internal view returns (address pilot, Pilots.Ship memory ship) {
        Pilots p = _m().pilots;
        pilot = p.actorOf(msg.sender);
        ship = p.shipOf(pilot);
        if (ship.cell != port >> 8) revert NotAtPort(port);
    }

    // ── trade ───────────────────────────────────────────────────────────────────────────────────

    /// Trades at a port the ship is at. Lines run in order, so put sales first to free bays for
    /// purchases. Reverts if any line breaks its price limit, so nothing fills at a surprise price.
    function trade(uint256 port, Line[] calldata lines) external {
        (address pilot,) = _pilotAt(port);
        (uint8 class,, address owner) = _port(port);
        uint256 cap = capacity();
        for (uint256 i = 0; i < lines.length; i++) {
            _tradeLine(pilot, port, class, owner, cap, lines[i]);
        }
    }

    function _tradeLine(address pilot, uint256 port, uint8 class, address owner, uint256 cap, Line calldata line)
        internal
    {
        MarketStorage storage m = _m();
        if (line.good >= m.goods.length) revert NotTraded(line.good);
        Good storage good = m.goods[line.good];
        Mode mode = _mode(class, line.good);
        bool buying = line.units > 0;
        uint256 units = uint256(buying ? line.units : -line.units);
        if (units == 0) return;
        if (mode != (buying ? Mode.Sells : Mode.Buys)) revert NotTraded(line.good);

        Tuning storage t = m.tuning;
        (uint256 shortfall, uint256 updated) = _stock(port, line.good, cap);
        if (shortfall + units > cap) revert PortFull(line.good, cap - shortfall);
        m.stock[port][line.good] = Stock(uint32(shortfall + units), uint40(updated));

        Credits credits_ = m.credits;
        if (buying) {
            uint256 cost = Pricing.buyCost(good.base, good.spread, cap, shortfall, units);
            uint256 cut = Pricing.fee(cost, t.feeBps);
            if (cost + cut > line.limit) revert PriceLimit(line.good, cost + cut);
            m.pilots.addCargo(pilot, line.good, units);
            credits_.burn(pilot, cost);
            if (owner == address(0)) credits_.burn(pilot, cut);
            else credits_.move(pilot, owner, cut);
            emit Traded(pilot, port, line.good, line.units, cost + cut);
        } else {
            uint256 proceeds = Pricing.sellProceeds(good.base, good.spread, cap, shortfall, units);
            uint256 cut = Pricing.fee(proceeds, t.feeBps);
            if (proceeds - cut < line.limit) revert PriceLimit(line.good, proceeds - cut);
            m.pilots.removeCargo(pilot, line.good, units);
            credits_.mint(pilot, proceeds - cut);
            if (owner != address(0)) credits_.mint(owner, cut);
            emit Traded(pilot, port, line.good, line.units, proceeds - cut);
        }
    }

    // ── the shipyard ────────────────────────────────────────────────────────────────────────────

    /// Fits `count` more bays (each costs a little more than the last), paying at most `maxCost`.
    function buyBays(uint256 port, uint16 count, uint256 maxCost) external {
        (address pilot, Pilots.Ship memory ship) = _pilotAt(port);
        _yardOwner(port);
        Tuning storage t = _m().tuning;
        uint256 cost = Pricing.baysCost(t.bayBase, t.bayStep, ship.bays, count);
        if (cost > maxCost) revert PriceLimit(type(uint256).max, cost);
        _m().credits.burn(pilot, cost);
        _m().pilots.addBays(pilot, count);
        emit BaysBought(pilot, port, count, cost);
    }

    /// Upgrades the engines by one range level (D1, D11), paying at most `maxCost`.
    function buyRange(uint256 port, uint256 maxCost) external {
        (address pilot, Pilots.Ship memory ship) = _pilotAt(port);
        _yardOwner(port);
        if (ship.range >= 4) revert MaxRange();
        uint256 cost = _m().tuning.rangePrices[ship.range - 1];
        if (cost > maxCost) revert PriceLimit(type(uint256).max, cost);
        _m().credits.burn(pilot, cost);
        _m().pilots.setRange(pilot, ship.range + 1);
        emit RangeBought(pilot, port, ship.range + 1, cost);
    }

    function _yardOwner(uint256 port) internal view returns (address owner) {
        bool yard;
        (, yard, owner) = _port(port);
        if (!yard) revert NoYard(port);
    }

    // ── views ───────────────────────────────────────────────────────────────────────────────────

    function goodCount() external view returns (uint256) {
        return _m().goods.length;
    }

    function goods() external view returns (Good[] memory) {
        return _m().goods;
    }

    function tuning() external view returns (Tuning memory) {
        return _m().tuning;
    }

    function mix(uint8 class) external view returns (uint256 sells, uint256 buys) {
        return (_m().sells[class], _m().buys[class]);
    }

    /// A port's goods, stock and next-unit prices. Reverts with NoSuchPort.
    function portView(uint256 port) public view returns (PortView memory v) {
        (v.class, v.yard, v.owner) = _port(port);
        v.port = port;
        MarketStorage storage m = _m();
        uint256 cap = capacity();
        v.quotes = new Quote[](m.goods.length);
        for (uint256 g = 0; g < m.goods.length; g++) {
            Mode mode = _mode(v.class, g);
            if (mode == Mode.None) continue;
            (uint256 shortfall,) = _stock(port, g, cap);
            Good storage good = m.goods[g];
            uint256 price = mode == Mode.Sells
                ? Pricing.buyCost(good.base, good.spread, cap, shortfall, 1)
                : Pricing.sellProceeds(good.base, good.spread, cap, shortfall, 1);
            v.quotes[g] = Quote(mode, shortfall, price);
        }
    }

    /// Every port at a star, in one call.
    function portsAt(uint256 cell) external view returns (PortView[] memory list) {
        PortView[] memory found = new PortView[](MAX_BODIES);
        uint256 n;
        for (uint256 body = 0; body < MAX_BODIES; body++) {
            uint256 port = (cell << 8) | body;
            bool isSol = cell == 0 && body < SOL_PORTS;
            if (isSol || _m().opened[port].open) found[n++] = portView(port);
        }
        list = new PortView[](n);
        for (uint256 i = 0; i < n; i++) {
            list[i] = found[i];
        }
    }

    /// What `count` more bays would cost a ship with `have`.
    function baysQuote(uint256 have, uint256 count) external view returns (uint256) {
        Tuning storage t = _m().tuning;
        return Pricing.baysCost(t.bayBase, t.bayStep, have, count);
    }
}
