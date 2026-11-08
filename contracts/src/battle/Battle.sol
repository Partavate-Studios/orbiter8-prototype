// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ModuleBase} from "../core/ModuleBase.sol";
import {Pilots, IMoveHook} from "../pilots/Pilots.sol";
import {Planets} from "../planets/Planets.sol";
import {Combat} from "./Combat.sol";

/// @title Sieges (docs/demo4-plan.md, section 6; D44–D54)
/// @notice An armed ship at a claimed planet outside Sol starts a siege with one transaction (D44,
/// D49). It's public: every map and the siege feed (these events) show it. The rounds (`Combat`) are
/// worked out lazily from the time; any move at the star, any change to the defenses and any call
/// to `advance` brings them up to date first, so each stretch is played with who was really there.
///
/// Defending (D45): the planet's own defenses, the owner's ship if it's at the star, and up to four
/// armed ships that join. In this run, attackers fire at the planet, not at the ships defending it.
///
/// The end: the attacker retreats or leaves, or the planet is worn down (D47) and stops producing.
/// Then the attacker can file a claim through Minerva; 24 hours later it succeeds unless the planet's
/// defenses are back above zero or the attacker has been driven off. A successful claim takes the
/// planet and its buildings, a tech level down.
contract Battle is ModuleBase, IMoveHook {
    uint256 public constant MAX_ALLIES = 4;
    uint256 public constant CLAIM_WAIT = 24 hours;
    uint256 public constant MAX_ROUNDS = 64; // per call; `advance` again for more

    /// A planet's fitted defenses (the Armory fits them from its Autofactory's parts).
    struct Defenses {
        uint16 pointDefense;
        uint16 railguns;
        uint16 missiles;
        uint16 drones;
        uint16 repairBots;
        uint8 armor; // plates
        uint8 shields; // levels
        uint8 platforms;
        uint8 bfg;
        // weapons on the planet's moons (D61): six mounts a moon, hit before the planet's shield
        uint16 moonPointDefense;
        uint16 moonRailguns;
        uint16 moonMissiles;
    }

    /// A ship's state between battles: what's out of action until a shipyard repair.
    struct Condition {
        uint32 armorLost;
        uint16 pointDefenseOff;
        uint16 railgunsOff;
        uint16 missilesOff;
        uint16 dronesOff;
        uint16 botsOff;
        bool retreated; // can't attack again until repaired (D52)
        uint40 dockedUntil; // in the yard after a repair
    }

    struct Siege {
        address attacker;
        uint40 started;
        uint40 checkpoint; // rounds are played up to here
        uint40 wornAt; // when the planet was worn down (0: not yet)
        uint40 claimAt; // when a filed claim completes (0: none filed)
        Combat.Side ship;
        Combat.Side planet;
    }

    /// @custom:storage-location erc7201:orbiter8.battle
    struct BattleStorage {
        Pilots pilots;
        Planets planets;
        mapping(uint256 => Defenses) defenses; // planet → defenses
        mapping(address => Condition) conditions; // pilot → condition
        mapping(uint256 => Siege) sieges; // planet → its siege (attacker 0: none)
        mapping(uint256 => address[]) allies; // planet → ships that joined its defense
        mapping(uint256 => uint256[]) siegesAt; // star → planets under siege there
        mapping(address => uint256) attacking; // pilot → planet + 1 (0: none)
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.battle")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant BATTLE_SLOT = 0x9db34cba530ab498b35b495b14942926f9b8766a395f38e53c9a6ab2ab2d2900;

    event SiegeStarted(uint256 indexed planet, address indexed attacker, address indexed owner);
    event DefenderJoined(uint256 indexed planet, address indexed pilot);
    event WornDown(uint256 indexed planet, uint40 at);
    event ClaimFiled(uint256 indexed planet, address indexed attacker, uint40 completesAt);
    event ClaimFailed(uint256 indexed planet, address indexed attacker);
    event SiegeEnded(uint256 indexed planet, address indexed attacker, bool captured, bool attackerRetreated);
    event DefensesChanged(uint256 indexed planet, Defenses defenses);
    event ConditionChanged(address indexed pilot, Condition condition);

    error NotThere();
    error CannotAttack();
    error FederationPlanet();
    error AlreadyBesieged();
    error NoSiege();
    error NotWornDown();
    error NotYet(uint40 at);
    error TooManyAllies();
    error Behind(uint40 checkpoint);

    function _b() internal pure returns (BattleStorage storage b) {
        assembly {
            b.slot := BATTLE_SLOT
        }
    }

    function initialize(address admin, Pilots pilots_, Planets planets_) external initializer {
        __ModuleBase_init(admin);
        (_b().pilots, _b().planets) = (pilots_, planets_);
    }

    // ── starting and joining ────────────────────────────────────────────────────────────────────

    function attack(uint256 planet) external {
        BattleStorage storage b = _b();
        address pilot = b.pilots.actorOf(msg.sender);
        uint256 cell = planet >> 8;
        if (cell == 0) revert FederationPlanet(); // D49
        if (b.pilots.shipOf(pilot).cell != cell) revert NotThere();
        address owner = b.planets.ownerOf(planet);
        if (owner == address(0) || owner == pilot || b.attacking[pilot] != 0) revert CannotAttack();
        if (b.sieges[planet].attacker != address(0)) revert AlreadyBesieged();
        Combat.Side memory ship = shipSide(pilot);
        if (Combat.spent(ship)) revert CannotAttack();
        Siege storage s = b.sieges[planet];
        s.attacker = pilot;
        s.started = s.checkpoint = uint40(block.timestamp);
        s.ship = ship;
        s.planet = planetSide(planet);
        b.attacking[pilot] = planet + 1;
        b.siegesAt[cell].push(planet);
        b.planets.setBesieged(planet, true);
        emit SiegeStarted(planet, pilot, owner);
    }

    /// An armed ship at the star joins the planet's defense (the owner's own ship needn't).
    function joinDefense(uint256 planet) external {
        BattleStorage storage b = _b();
        address pilot = b.pilots.actorOf(msg.sender);
        Siege storage s = b.sieges[planet];
        if (s.attacker == address(0)) revert NoSiege();
        if (b.pilots.shipOf(pilot).cell != planet >> 8) revert NotThere();
        if (pilot == s.attacker || b.attacking[pilot] != 0) revert CannotAttack();
        if (b.allies[planet].length >= MAX_ALLIES) revert TooManyAllies();
        _advance(planet, type(uint256).max);
        b.allies[planet].push(pilot);
        emit DefenderJoined(planet, pilot);
    }

    // ── time passing ────────────────────────────────────────────────────────────────────────────

    /// Plays the rounds due (up to 64 per call). Anyone may call it.
    function advance(uint256 planet) external {
        _advance(planet, MAX_ROUNDS);
    }

    function _advance(uint256 planet, uint256 maxRounds) internal {
        Siege storage s = _b().sieges[planet];
        if (s.attacker == address(0)) return;
        uint256 due = (block.timestamp - s.checkpoint) / Combat.ROUND;
        if (due == 0) return;
        if (due > maxRounds) due = maxRounds;
        (Combat.Side memory ship, Combat.Side memory side, uint256 played, uint256 wornRound) =
            Combat.play(s.ship, s.planet, _allyFire(planet), due);
        if (wornRound != 0 && s.wornAt == 0) {
            s.wornAt = uint40(s.checkpoint + wornRound * Combat.ROUND);
            emit WornDown(planet, s.wornAt);
        }
        s.ship = ship;
        s.planet = side;
        s.checkpoint = uint40(s.checkpoint + played * Combat.ROUND);
        if (Combat.spent(ship)) _end(planet, false);
    }

    /// The fire of the owner's ship (if it's at the star) and the ships that joined, as they stand.
    function _allyFire(uint256 planet) internal view returns (Combat.Fire memory fire) {
        BattleStorage storage b = _b();
        address owner = b.planets.ownerOf(planet);
        address[] storage allies = b.allies[planet];
        for (uint256 i = 0; i <= allies.length; i++) {
            address pilot = i == allies.length ? owner : allies[i];
            if (b.pilots.shipOf(pilot).cell != planet >> 8 || b.conditions[pilot].retreated) continue;
            Combat.Side memory side = shipSide(pilot);
            fire.railguns += side.railguns;
            fire.missiles += side.missiles;
            fire.drones += side.drones;
        }
    }

    /// Pilots tells Battle of every move before the ship goes: sieges at both stars are played up to
    /// now with the ship where it was. An attacker leaving ends its siege.
    function onMove(address pilot, uint256 from, uint256 to) external onlyRole(GAME_MODULE) {
        BattleStorage storage b = _b();
        uint256[2] memory cells = [from, to];
        for (uint256 c = 0; c < 2; c++) {
            uint256[] storage list = b.siegesAt[cells[c]];
            for (uint256 i = 0; i < list.length; i++) {
                _advance(list[i], type(uint256).max);
            }
        }
        uint256 target = b.attacking[pilot];
        if (target != 0 && from != to) _end(target - 1, false);
    }

    // ── claims ──────────────────────────────────────────────────────────────────────────────────

    /// The attacker files a claim through Minerva once the planet is worn down.
    function fileClaim(uint256 planet) external {
        BattleStorage storage b = _b();
        _advance(planet, type(uint256).max);
        Siege storage s = b.sieges[planet];
        if (s.attacker == address(0) || b.pilots.actorOf(msg.sender) != s.attacker) revert NoSiege();
        if (s.wornAt == 0 || !Combat.wornDown(s.planet)) revert NotWornDown();
        if (s.claimAt != 0) revert NotYet(s.claimAt);
        s.claimAt = uint40(block.timestamp + CLAIM_WAIT);
        emit ClaimFiled(planet, s.attacker, s.claimAt);
    }

    /// Completes a filed claim after its wait: the planet changes hands if it's still worn down and
    /// the attacker is still there. Anyone may call it.
    function completeClaim(uint256 planet) external {
        _advance(planet, MAX_ROUNDS);
        Siege storage s = _b().sieges[planet];
        if (s.attacker == address(0) || s.claimAt == 0) revert NoSiege();
        if (block.timestamp < s.claimAt) revert NotYet(s.claimAt);
        if ((block.timestamp - s.checkpoint) >= Combat.ROUND) revert Behind(s.checkpoint);
        if (Combat.wornDown(s.planet)) {
            _end(planet, true);
        } else {
            s.claimAt = 0;
            emit ClaimFailed(planet, s.attacker);
        }
    }

    /// The attacker calls the siege off.
    function withdraw(uint256 planet) external {
        _advance(planet, type(uint256).max);
        Siege storage s = _b().sieges[planet];
        if (s.attacker == address(0) || _b().pilots.actorOf(msg.sender) != s.attacker) revert NoSiege();
        _end(planet, false);
    }

    /// Ends a siege: losses carried over to the planet and the attacker's ship.
    function _end(uint256 planet, bool captured) internal {
        BattleStorage storage b = _b();
        Siege memory s = b.sieges[planet];
        if (s.attacker == address(0)) return;
        _keepPlanetLosses(planet, s.planet);
        _keepShipLosses(s.attacker, s.ship);
        uint256[] storage list = b.siegesAt[planet >> 8];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == planet) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }
        delete b.sieges[planet];
        delete b.allies[planet];
        delete b.attacking[s.attacker];
        b.planets.setBesieged(planet, false);
        if (captured) b.planets.seize(planet, s.attacker);
        emit SiegeEnded(planet, s.attacker, captured, s.ship.retreated);
    }

    function _keepPlanetLosses(uint256 planet, Combat.Side memory side) internal {
        Defenses storage d = _b().defenses[planet];
        d.platforms = uint8((side.platforms + Combat.PLATFORM_HP - 1) / Combat.PLATFORM_HP);
        d.armor = uint8((side.armor + Combat.ARMOR_HP - 1) / Combat.ARMOR_HP);
        (d.pointDefense, d.railguns, d.missiles, d.drones, d.repairBots, d.bfg) =
            (side.pointDefense, side.railguns, side.missiles, side.drones, side.repairBots, uint8(side.bfg));
        (d.moonPointDefense, d.moonRailguns, d.moonMissiles) = (side.moonPointDefense, side.moonRailguns, side.moonMissiles);
        emit DefensesChanged(planet, d);
    }

    function _keepShipLosses(address pilot, Combat.Side memory side) internal {
        BattleStorage storage b = _b();
        Pilots.Ship memory ship = b.pilots.shipOf(pilot);
        Pilots.Loadout memory l = ship.loadout;
        Condition storage c = b.conditions[pilot];
        c.armorLost = uint32(uint256(l.armor) * Combat.ARMOR_HP - side.armor);
        c.pointDefenseOff = l.pointDefense - side.pointDefense;
        c.railgunsOff = l.railguns - side.railguns;
        c.missilesOff = l.missiles - side.missiles;
        c.dronesOff = l.drones - side.drones;
        c.botsOff = l.repairBots - side.repairBots;
        c.retreated = c.retreated || side.retreated;
        if (side.rangeLost > 0 || side.baysLost > 0) {
            b.pilots.setDamage(pilot, ship.rangeLost + side.rangeLost, ship.baysLost + side.baysLost);
        }
        emit ConditionChanged(pilot, c);
    }

    // ── for the Armory (GAME_MODULE) ────────────────────────────────────────────────────────────

    /// New defenses for a planet. Mid-siege (D45), the rounds so far are played first and what's
    /// added joins the fight at once.
    function setDefenses(uint256 planet, Defenses calldata next) external onlyRole(GAME_MODULE) {
        BattleStorage storage b = _b();
        Siege storage s = b.sieges[planet];
        if (s.attacker != address(0)) {
            _advance(planet, type(uint256).max);
            Defenses memory had = b.defenses[planet];
            Combat.Side memory side = s.planet;
            side.platforms += uint32(_more(next.platforms, had.platforms) * Combat.PLATFORM_HP);
            side.armor += uint32(_more(next.armor, had.armor) * Combat.ARMOR_HP);
            side.armorMax += uint32(_more(next.armor, had.armor) * Combat.ARMOR_HP);
            side.shieldMax += uint32(_more(next.shields, had.shields) * Combat.SHIELD_HP);
            side.pointDefense += uint16(_more(next.pointDefense, had.pointDefense));
            side.railguns += uint16(_more(next.railguns, had.railguns));
            side.missiles += uint16(_more(next.missiles, had.missiles));
            side.drones += uint16(_more(next.drones, had.drones));
            side.repairBots += uint16(_more(next.repairBots, had.repairBots));
            side.bfg += uint16(_more(next.bfg, had.bfg));
            side.moonPointDefense += uint16(_more(next.moonPointDefense, had.moonPointDefense));
            side.moonRailguns += uint16(_more(next.moonRailguns, had.moonRailguns));
            side.moonMissiles += uint16(_more(next.moonMissiles, had.moonMissiles));
            s.planet = side;
        }
        b.defenses[planet] = next;
        emit DefensesChanged(planet, next);
    }

    function _more(uint256 next, uint256 had) private pure returns (uint256) {
        return next > had ? next - had : 0;
    }

    /// A shipyard repair (the Armory): everything restored; in the yard until `until`.
    function repaired(address pilot, uint40 until) external onlyRole(GAME_MODULE) {
        Condition storage c = _b().conditions[pilot];
        delete _b().conditions[pilot];
        c.dockedUntil = until;
        _b().pilots.setDamage(pilot, 0, 0);
        emit ConditionChanged(pilot, c);
    }

    // ── views ───────────────────────────────────────────────────────────────────────────────────

    /// A ship as it would go into battle now: its loadout less what's out of action.
    function shipSide(address pilot) public view returns (Combat.Side memory side) {
        BattleStorage storage b = _b();
        Pilots.Ship memory ship = b.pilots.shipOf(pilot);
        Pilots.Loadout memory l = ship.loadout;
        Condition memory c = b.conditions[pilot];
        side.shieldMax = uint32(uint256(l.shields) * Combat.SHIELD_HP);
        side.shield = side.shieldMax; // shields regenerate between battles
        side.armorMax = uint32(uint256(l.armor) * Combat.ARMOR_HP);
        side.armor = c.armorLost >= side.armorMax ? 0 : side.armorMax - c.armorLost;
        side.pointDefense = l.pointDefense - c.pointDefenseOff;
        side.railguns = l.railguns - c.railgunsOff;
        side.missiles = l.missiles - c.missilesOff;
        side.drones = l.drones - c.dronesOff;
        side.repairBots = l.repairBots - c.botsOff;
        uint256 range = ship.range > ship.rangeLost ? ship.range - ship.rangeLost : 1;
        side.maxRangeLoss = uint8(range - 1);
        side.maxBaysLoss = ship.bays > ship.baysLost ? ship.bays - ship.baysLost : 0;
        side.retreated = c.retreated || block.timestamp < c.dockedUntil;
    }

    /// A planet's defenses as a fresh side: its hull is its tech level's defense grid.
    function planetSide(uint256 planet) public view returns (Combat.Side memory side) {
        Defenses memory d = _b().defenses[planet];
        uint8 level = _b().planets.planetView(planet, 0).level;
        side.platforms = uint32(uint256(d.platforms) * Combat.PLATFORM_HP);
        side.shieldMax = side.shield = uint32(uint256(d.shields) * Combat.SHIELD_HP);
        side.armorMax = side.armor = uint32(uint256(d.armor) * Combat.ARMOR_HP);
        side.hull = uint32(uint256(level) * Combat.HULL_PER_LEVEL);
        (side.pointDefense, side.railguns, side.missiles, side.drones, side.repairBots, side.bfg) =
            (d.pointDefense, d.railguns, d.missiles, d.drones, d.repairBots, d.bfg);
        (side.moonPointDefense, side.moonRailguns, side.moonMissiles) =
            (d.moonPointDefense, d.moonRailguns, d.moonMissiles);
    }

    function defensesOf(uint256 planet) external view returns (Defenses memory) {
        return _b().defenses[planet];
    }

    function conditionOf(address pilot) external view returns (Condition memory) {
        return _b().conditions[pilot];
    }

    /// The siege at a planet as stored (call `preview` for it played up to now).
    function siegeOf(uint256 planet) external view returns (Siege memory, address[] memory allies) {
        return (_b().sieges[planet], _b().allies[planet]);
    }

    /// The planets under siege at a star.
    function siegesAt(uint256 cell) external view returns (uint256[] memory) {
        return _b().siegesAt[cell];
    }

    /// The siege played up to now without writing (the client's view of a running battle).
    function preview(uint256 planet) external view returns (Siege memory s) {
        s = _b().sieges[planet];
        if (s.attacker == address(0)) return s;
        uint256 due = (block.timestamp - s.checkpoint) / Combat.ROUND;
        uint256 played;
        uint256 wornRound;
        (s.ship, s.planet, played, wornRound) = Combat.play(s.ship, s.planet, _allyFire(planet), due);
        if (wornRound != 0 && s.wornAt == 0) s.wornAt = uint40(s.checkpoint + wornRound * Combat.ROUND);
        s.checkpoint = uint40(s.checkpoint + played * Combat.ROUND);
    }

    /// Which pilot a planet's siege is against, or 0, and whether a pilot is attacking.
    function attackingOf(address pilot) external view returns (uint256 planetPlusOne) {
        return _b().attacking[pilot];
    }
}
