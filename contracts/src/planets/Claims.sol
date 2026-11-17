// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {BodyId} from "./BodyId.sol";
import {ModuleBase} from "../core/ModuleBase.sol";
import {Galaxy} from "../galaxy/Galaxy.sol";
import {Pilots} from "../pilots/Pilots.sol";
import {Credits} from "../tokens/Credits.sol";
import {Deeds} from "../tokens/Deeds.sol";
import {SystemGen} from "./SystemGen.sol";
import {BeltGen} from "./BeltGen.sol";

/// @title Claims: who owns each body, its deed and its names, and who may name a star
/// @notice Split out of Planets (expansion plan, refactor item 2) so every kind of body is owned the
/// same way. Planets keeps what's built on a body (people, production, buildings) and asks here who
/// owns it.
///
/// - **Claims (D40):** the ship must be at the star, and there's a fee. For 10 minutes after a star is
///   discovered, only its discoverer may claim there, unless they've flown on. Sol's bodies belong to
///   the Federation (D49). A claim mints the body's deed (Deeds).
/// - **Names:** the owner names their planet, its station and its moons; until then the client shows
///   derived names. Sol's keep theirs.
/// - **Star names:** see `mayNameStar`. Only planets count toward a star, never asteroids (D72).
/// - **Asteroids** (D72, D96) are claimed, named and deeded like planets; Sol's belong to the Federation.
/// - **Transfers (GAME_MODULE):** a siege's successful claim hands a body over (Planets.seize).
contract Claims is ModuleBase {
    uint256 public constant FIRST_CLAIM = 10 minutes;

    /// The parts of a planet that carry a name: the planet, its station, and moons by orbit.
    uint8 public constant NAME_PLANET = 0;
    uint8 public constant NAME_STATION = 1;
    uint8 public constant NAME_MOON = 2; // + the moon's orbit, 0–7

    struct Tuning {
        uint64 claimFee;
        uint64 starNameFee; // filed with Minerva and burned
    }

    /// @custom:storage-location erc7201:orbiter8.claims
    struct ClaimsStorage {
        Galaxy galaxy;
        Pilots pilots;
        Credits credits;
        Deeds deeds;
        Tuning tuning;
        mapping(uint256 => address) owners; // body → owner
        mapping(uint256 => mapping(uint8 => string)) names; // body → part (NAME_PLANET, NAME_STATION, NAME_MOON + orbit) → name
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.claims")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant CLAIMS_SLOT = 0x87152949b7a6ec149f5e7943a19999140999b71cf1457686fceeea69430f6900;

    event Claimed(uint256 indexed planet, address indexed owner);
    event Transferred(uint256 indexed planet, address indexed from, address indexed to);
    event Named(uint256 indexed planet, uint8 part, string name);
    event TuningSet(Tuning tuning);

    error NoSuchPlanet(uint256 planet);
    error FederationPlanet(uint256 planet);
    error AlreadyClaimed(uint256 planet);
    error FirstClaimWindow(address discoverer);
    error NotYours(uint256 planet);
    error NotThere(uint256 planet);
    error BadName();
    error NoSuchMoon(uint256 planet, uint8 orbit);
    error CannotNameStar(uint256 cell);

    function _c() internal pure returns (ClaimsStorage storage c) {
        assembly {
            c.slot := CLAIMS_SLOT
        }
    }

    function initialize(address admin, Galaxy galaxy_, Pilots pilots_, Credits credits_, Deeds deeds_)
        external
        initializer
    {
        __ModuleBase_init(admin);
        ClaimsStorage storage c = _c();
        (c.galaxy, c.pilots, c.credits, c.deeds) = (galaxy_, pilots_, credits_, deeds_);
        // The claim fee as before; a star's name costs what a Station did (50,000).
        _setTuning(Tuning(2_000, 50_000));
    }

    function setTuning(Tuning calldata tuning_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTuning(tuning_);
    }

    function _setTuning(Tuning memory tuning_) internal {
        _c().tuning = tuning_;
        emit TuningSet(tuning_);
    }

    function tuning() external view returns (Tuning memory) {
        return _c().tuning;
    }

    function _seed() internal view returns (bytes32 seed) {
        (seed,,,,) = _c().galaxy.universe();
    }

    /// Checks the body exists at a charted star: a planet, or a belt section's asteroid (D72, D96).
    function _check(uint256 id) internal view {
        uint256 cell = BodyId.cellOf(id);
        uint256 index = BodyId.indexOf(id);
        bytes32 seed = _seed();
        bool exists;
        if (_c().galaxy.stateOf(cell) == 2) {
            if (BodyId.isPlanet(id)) {
                exists = index < SystemGen.planetCount(seed, cell);
            } else if (BodyId.kindOf(id) == BodyId.ASTEROID && index < BeltGen.SECTIONS && BeltGen.hasBelt(seed, cell)) {
                (exists,,) = BeltGen.section(seed, cell, index);
            }
        }
        if (!exists) revert NoSuchPlanet(id);
    }

    // ── claims (D40) ────────────────────────────────────────────────────────────────────────────

    function claim(uint256 id) external {
        ClaimsStorage storage c = _c();
        address pilot = c.pilots.actorOf(msg.sender);
        uint256 cell = BodyId.cellOf(id);
        if (c.pilots.shipOf(pilot).cell != cell) revert NotThere(id);
        _check(id);
        if (cell == 0) revert FederationPlanet(id);
        if (c.owners[id] != address(0)) revert AlreadyClaimed(id);
        Galaxy.Star memory star = c.galaxy.star(cell);
        if (
            pilot != star.discoverer && block.timestamp < uint256(star.discoveredAt) + FIRST_CLAIM
                && c.pilots.shipOf(star.discoverer).cell == cell
        ) revert FirstClaimWindow(star.discoverer);
        c.credits.burn(pilot, c.tuning.claimFee);
        c.owners[id] = pilot;
        c.deeds.mint(pilot, id);
        emit Claimed(id, pilot);
    }

    /// Hands a body to a new owner, deed and all (a siege's successful claim: Planets.seize).
    function transfer(uint256 id, address to) external onlyRole(GAME_MODULE) {
        ClaimsStorage storage c = _c();
        address from = c.owners[id];
        c.owners[id] = to;
        c.deeds.seize(to, id);
        emit Transferred(id, from, to);
    }

    function ownerOf(uint256 id) external view returns (address) {
        return _c().owners[id];
    }

    // ── star names ──────────────────────────────────────────────────────────────────────────────

    /// Names a star, for a fee filed with Minerva and burned. Who may, and whether naming makes them
    /// the star's owner: see mayNameStar.
    function nameStar(uint256 cell, string calldata name) external {
        ClaimsStorage storage c = _c();
        address pilot = c.pilots.actorOf(msg.sender);
        (bool may, bool owns) = mayNameStar(cell, pilot);
        if (!may) revert CannotNameStar(cell);
        c.credits.burn(pilot, c.tuning.starNameFee);
        c.galaxy.setName(cell, name, owns ? pilot : c.galaxy.keeperOf(cell));
    }

    /// Who may name a star (only its planets count, never its asteroids):
    /// - its owner, any time;
    /// - once it has an owner, a pilot holding a majority of its planets, who becomes the owner;
    /// - while it has none, a pilot holding all its planets, who becomes the owner;
    /// - while it has none, its discoverer;
    /// - while it's unnamed, the pilot holding the most of its planets (not on a tie).
    /// Genesis stars and Sol belong to the Federation (Galaxy itself) from the start.
    function mayNameStar(uint256 cell, address pilot) public view returns (bool may, bool becomesOwner) {
        Galaxy galaxy = _c().galaxy;
        uint8 state = galaxy.stateOf(cell);
        if (state != 2 && state != 3) return (false, false); // stars and black holes only
        uint256 n = state == 2 ? SystemGen.planetCount(_seed(), cell) : 0;
        address[8] memory others;
        uint256[8] memory counts;
        uint256 mine;
        uint256 best;
        for (uint256 body = 0; body < n; body++) {
            address o = _c().owners[BodyId.planet(cell, body)];
            if (o == address(0)) continue;
            if (o == pilot) {
                mine++;
                continue;
            }
            for (uint256 k = 0; k < 8; k++) {
                if (others[k] == o || others[k] == address(0)) {
                    others[k] = o;
                    if (++counts[k] > best) best = counts[k];
                    break;
                }
            }
        }
        address keeper = galaxy.keeperOf(cell);
        if (keeper == pilot) return (true, false);
        if (keeper != address(0)) return (n > 0 && mine * 2 > n, true);
        if (n > 0 && mine == n) return (true, true);
        if (galaxy.star(cell).discoverer == pilot && pilot != address(0)) return (true, false);
        return (bytes(galaxy.nameOf(cell)).length == 0 && mine > 0 && mine > best, false);
    }

    // ── body names ──────────────────────────────────────────────────────────────────────────────

    /// The owner names their planet, its station or one of its moons.
    function rename(uint256 id, uint8 part, string calldata name) external {
        ClaimsStorage storage c = _c();
        address pilot = c.pilots.actorOf(msg.sender);
        _check(id);
        if (BodyId.cellOf(id) == 0) revert FederationPlanet(id);
        if (c.owners[id] != pilot) revert NotYours(id);
        if (part >= NAME_MOON) {
            if (!BodyId.isPlanet(id)) revert NoSuchMoon(id, part - NAME_MOON); // asteroids have no moons
            uint8 orbit = part - NAME_MOON;
            if (orbit >= 8 || (_moonSlots(id) >> orbit) & 1 == 0) revert NoSuchMoon(id, orbit);
        }
        uint256 length = bytes(name).length;
        if (length == 0 || length > 24) revert BadName();
        c.names[id][part] = name;
        emit Named(id, part, name);
    }

    function _moonSlots(uint256 id) internal view returns (uint256) {
        return SystemGen.moonSlots(_seed(), BodyId.cellOf(id), BodyId.indexOf(id));
    }

    /// The names an owner has given: the planet, its station, then moons by orbit ("" where unnamed).
    function namesOf(uint256 id) external view returns (string[10] memory names) {
        for (uint8 part = 0; part < 10; part++) {
            names[part] = _c().names[id][part];
        }
    }
}
