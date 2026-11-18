// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ModuleBase} from "../core/ModuleBase.sol";
import {Pilots} from "../pilots/Pilots.sol";
import {Credits} from "../tokens/Credits.sol";
import {Pricing} from "./Pricing.sol";
import {BodyId} from "../planets/BodyId.sol";
import {Sol} from "../planets/Sol.sol";
import {SystemGen} from "../planets/SystemGen.sol";
import {BeltGen} from "../planets/BeltGen.sol";

/// Where a player's port gets what it sells: its body's storage (Planets, D89).
interface IPortSupply {
    function suppliesOf(uint256 body, uint256 goods, uint256 sells) external view returns (uint256[] memory);
    function useStock(uint256 body, uint256 good, uint256 units) external;
}

/// @title Goods, ports, trade and the shipyard (docs/demo4-plan.md, section 4; D27, D29)
/// @notice **Goods are data** (D27): a registry the admin can add to, each with a base price and a
/// spread. **Ports** sell some goods and buy others, by their planet's class; the class mixes are
/// data too. **Trade** needs the ship at the port's star, and every line carries a price limit, so a
/// trade never fills at a price the player didn't see. Stock is kept as a shortfall from full that
/// restocks over time (see `Pricing`).
///
/// A port is named by its body's id (`BodyId`): the star, then the planet's place in its system. In this
/// milestone the ports are the Federation's nine stations at Sol; claimed planets open their own in
/// milestone 3 (`openPort`). The Federation mints what it pays and burns what it's paid; its fee
/// goes to its treasury (an address the admin sets, the deployer to start). A player-owned port's
/// fee goes to its owner. Every Sol station, on its planets and on its belt's asteroids, has a yard
/// (Sol is fully built: `Sol`).
contract Market is ModuleBase {

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

    /// A port opened on a claimed planet (milestone 3): it trades from `opensAt`, when its building
    /// is finished, with no further transaction.
    struct Opened {
        bool open;
        uint8 class;
        address owner;
        uint40 opensAt;
        uint40 yardAt; // 0: no shipyard
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

    /// What every quote in a view shares, read once per call (views stay small: polkadot-direction.md).
    struct Shared {
        uint256 cap;
        uint256 refill;
        uint32[] base;
        uint32[] spread;
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
        address treasury; // the Federation's fees (D85, D94)
        IPortSupply supply; // players' ports sell from their body's storage (D89)
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.market")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant MARKET_SLOT = 0xda4bef9c22c3e87392e39294097c8b24b4e442b12db3c4788c4a825a708a9e00;

    event GoodAdded(uint256 indexed good, string name, uint32 base, uint32 spread);
    event MixSet(uint8 indexed class, uint256 sells, uint256 buys);
    event TuningSet(Tuning tuning);
    event TreasurySet(address treasury);
    event PortOpened(uint256 indexed port, uint8 class, address owner, uint40 opensAt, uint40 yardAt);
    event Traded(address indexed pilot, uint256 indexed port, uint256 indexed good, int256 units, uint256 credits);
    event BaysBought(address indexed pilot, uint256 indexed port, uint16 bays, uint256 credits);
    event DroneBaysBought(address indexed pilot, uint256 indexed port, uint16 bays, uint256 credits);
    event RangeBought(address indexed pilot, uint256 indexed port, uint8 range, uint256 credits);

    error NoSuchPort(uint256 port);
    error NotAtPort(uint256 port);
    error NotTraded(uint256 good);
    error PortFull(uint256 good, uint256 room);
    error PriceLimit(uint256 good, uint256 credits);
    error NoYard(uint256 port);
    error MaxRange();
    error BadGood();
    error NoTreasury();

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
        m.treasury = admin;
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
        // bought somewhere at Sol, whose ports are Rocky, Volcanic, Terrestrial, Ferrous, Gaseous and Ice.
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
        // Asteroids (D76, Planets.ASTEROID_CLASS + composition): they sell what they mine
        _setMix(10, 0x11, 0xC8); // Carbonaceous: water, organics; buys He-3, equipment, electronics
        _setMix(11, 0x22, 0x91); // Silicate: metals, silicon; buys water, organics, electronics
        _setMix(12, 0x06, 0x49); // Metallic: metals, rare; buys water, He-3, equipment
        // From the simulator (orbiter-client/dev/sim/economy.mjs, docs/demo4-tuning.md).
        _setTuning(Tuning(300, 220, 2 hours, 200, 200, 8, [uint64(15_000), 150_000, 600_000]));
    }

    // ── admin: data, not code (D27) ─────────────────────────────────────────────────────────────

    function addGood(string calldata name, uint32 base, uint32 spread) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _addGood(name, base, spread);
    }

    function setMix(uint8 class, uint256 sells, uint256 buys) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setMix(class, sells, buys);
    }

    /// Where the Federation's fees go.
    function setTreasury(address treasury_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (treasury_ == address(0)) revert NoTreasury();
        _m().treasury = treasury_;
        emit TreasurySet(treasury_);
    }

    function setSupply(IPortSupply supply_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _m().supply = supply_;
    }

    function treasury() external view returns (address) {
        return _m().treasury;
    }

    function setTuning(Tuning calldata tuning_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTuning(tuning_);
    }

    /// Opens (or updates) a port on a claimed planet: the Planets module, when a Port or Yards is
    /// built or the planet changes hands. It trades from `opensAt` and has a shipyard from `yardAt`
    /// (0 for none). Zero for either keeps what's there.
    function openPort(uint256 port, uint8 class, address owner, uint40 opensAt, uint40 yardAt)
        external
        onlyRole(GAME_MODULE)
    {
        Opened storage o = _m().opened[port];
        if (o.open && opensAt == 0) opensAt = o.opensAt;
        if (yardAt == 0) yardAt = o.yardAt;
        _m().opened[port] = Opened(true, class, owner, opensAt, yardAt);
        emit PortOpened(port, class, owner, opensAt, yardAt);
    }

    /// Whether a player's port is trading now.
    function _isOpen(uint256 port) internal view returns (bool) {
        Opened storage o = _m().opened[port];
        return o.open && o.opensAt <= block.timestamp;
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

    /// A port's class, whether it has a yard, and its owner (address(0): the Federation).
    function _port(uint256 port) internal view returns (uint8 class, bool yard, address owner) {
        if (Sol.isStation(port)) return (Sol.portClass(port), true, address(0));
        if (!_isOpen(port)) revert NoSuchPort(port);
        Opened storage o = _m().opened[port];
        return (o.class, o.yardAt != 0 && o.yardAt <= block.timestamp, o.owner);
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
        if (ship.cell != BodyId.cellOf(port)) revert NotAtPort(port);
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
        // A player's port sells only what its body has made (D89), and is paid for it; the Federation's
        // restock themselves (at the top rate: Market.sol tuning, D89).
        bool supplied = buying && owner != address(0);
        uint256 shortfall;
        if (supplied) {
            uint256 stored = m.supply.suppliesOf(port, line.good + 1, m.sells[class])[line.good];
            if (units > stored) revert PortFull(line.good, stored);
            shortfall = stored >= cap ? 0 : cap - stored;
        } else {
            uint256 updated;
            (shortfall, updated) = _stock(port, line.good, cap);
            if (shortfall + units > cap) revert PortFull(line.good, cap - shortfall);
            m.stock[port][line.good] = Stock(uint32(shortfall + units), uint40(updated));
        }

        Credits credits_ = m.credits;
        address payee = owner == address(0) ? m.treasury : owner;
        if (buying) {
            uint256 cost = Pricing.buyCost(good.base, good.spread, cap, shortfall, units);
            uint256 cut = Pricing.fee(cost, t.feeBps);
            if (cost + cut > line.limit) revert PriceLimit(line.good, cost + cut);
            m.pilots.addCargo(pilot, line.good, units);
            if (supplied) {
                m.supply.useStock(port, line.good, units);
                credits_.move(pilot, owner, cost + cut);
            } else {
                credits_.burn(pilot, cost);
                credits_.move(pilot, payee, cut);
            }
            emit Traded(pilot, port, line.good, line.units, cost + cut);
        } else {
            uint256 proceeds = Pricing.sellProceeds(good.base, good.spread, cap, shortfall, units);
            uint256 cut = Pricing.fee(proceeds, t.feeBps);
            if (proceeds - cut < line.limit) revert PriceLimit(line.good, proceeds - cut);
            m.pilots.removeCargo(pilot, line.good, units);
            credits_.mint(pilot, proceeds - cut);
            credits_.mint(payee, cut);
            emit Traded(pilot, port, line.good, line.units, proceeds - cut);
        }
    }

    // ── the shipyard ────────────────────────────────────────────────────────────────────────────

    /// Fits `count` more cargo bays, or drone bays (D91), paying at most `maxCost`. Each bay costs a
    /// little more than the last, counting every bay the ship has, of both kinds.
    function buyBays(uint256 port, uint16 count, uint256 maxCost) external {
        _buyBays(port, count, maxCost, false);
    }

    function buyDroneBays(uint256 port, uint16 count, uint256 maxCost) external {
        _buyBays(port, count, maxCost, true);
    }

    function _buyBays(uint256 port, uint16 count, uint256 maxCost, bool drones) internal {
        (address pilot, Pilots.Ship memory ship) = _pilotAt(port);
        _yardOwner(port);
        Tuning storage t = _m().tuning;
        uint256 cost = Pricing.baysCost(t.bayBase, t.bayStep, uint256(ship.bays) + ship.droneBays, count);
        if (cost > maxCost) revert PriceLimit(type(uint256).max, cost);
        _m().credits.burn(pilot, cost);
        if (drones) {
            _m().pilots.addDroneBays(pilot, count);
            emit DroneBaysBought(pilot, port, count, cost);
        } else {
            _m().pilots.addBays(pilot, count);
            emit BaysBought(pilot, port, count, cost);
        }
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
    function portView(uint256 port) public view returns (PortView memory) {
        return _portView(port, _shared());
    }

    /// Several ports' views in one call (count, then fill: `portIds` lists a star's ports; a client
    /// reads them a few at a time, so each call stays under a node's per-call cap). Reverts with
    /// NoSuchPort if any isn't trading.
    function portViews(uint256[] calldata ports) external view returns (PortView[] memory list) {
        Shared memory sh = _shared();
        list = new PortView[](ports.length);
        for (uint256 i = 0; i < ports.length; i++) {
            list[i] = _portView(ports[i], sh);
        }
    }

    /// Every port at a star, by id: its planets' in orbit order, then its belt's (asteroid ports, D88).
    function portIds(uint256 cell) external view returns (uint256[] memory ids) {
        ids = new uint256[](SystemGen.SOL_PLANETS + BeltGen.SECTIONS);
        uint256 n;
        for (uint256 body = 0; body < ids.length; body++) {
            uint256 port = body < SystemGen.SOL_PLANETS // no star has more planets than Sol
                ? BodyId.planet(cell, body)
                : BodyId.make(cell, BodyId.ASTEROID, body - SystemGen.SOL_PLANETS);
            if ((cell == 0 && Sol.isStation(port)) || _isOpen(port)) ids[n++] = port;
        }
        assembly {
            mstore(ids, n)
        }
    }

    function _shared() internal view returns (Shared memory sh) {
        MarketStorage storage m = _m();
        uint256 n = m.goods.length;
        (sh.cap, sh.refill) = (capacity(), m.tuning.refill);
        (sh.base, sh.spread) = (new uint32[](n), new uint32[](n));
        for (uint256 g = 0; g < n; g++) {
            Good storage good = m.goods[g];
            (sh.base[g], sh.spread[g]) = (good.base, good.spread);
        }
    }

    function _portView(uint256 port, Shared memory sh) internal view returns (PortView memory v) {
        (v.class, v.yard, v.owner) = _port(port);
        v.port = port;
        MarketStorage storage m = _m();
        (uint256 sells, uint256 buys) = (m.sells[v.class], m.buys[v.class]);
        uint256 n = sh.base.length;
        v.quotes = new Quote[](n);
        // a player's port sells from its body's storage (D89): one call for all of it
        uint256[] memory stored;
        if (v.owner != address(0) && sells != 0) stored = m.supply.suppliesOf(port, n, sells);
        for (uint256 g = 0; g < n; g++) {
            bool sold = (sells >> g) & 1 == 1;
            if (!sold && (buys >> g) & 1 == 0) continue;
            uint256 shortfall;
            if (sold && v.owner != address(0)) {
                shortfall = stored[g] >= sh.cap ? 0 : sh.cap - stored[g];
            } else {
                Stock memory st = m.stock[port][g];
                (shortfall,) = Pricing.restock(st.shortfall, st.updated, block.timestamp, sh.cap, sh.refill);
            }
            uint256 price = sold
                ? Pricing.buyCost(sh.base[g], sh.spread[g], sh.cap, shortfall, 1)
                : Pricing.sellProceeds(sh.base[g], sh.spread[g], sh.cap, shortfall, 1);
            v.quotes[g] = Quote(sold ? Mode.Sells : Mode.Buys, shortfall, price);
        }
    }

    /// What `count` more bays would cost a ship with `have`.
    function baysQuote(uint256 have, uint256 count) external view returns (uint256) {
        Tuning storage t = _m().tuning;
        return Pricing.baysCost(t.bayBase, t.bayStep, have, count);
    }
}
