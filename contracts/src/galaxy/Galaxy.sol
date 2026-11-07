// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ModuleBase} from "../core/ModuleBase.sol";
import {HexMath} from "./HexMath.sol";
import {Spiral} from "./Spiral.sol";
import {ScanRules} from "./ScanRules.sol";
import {Fixed} from "../math/Fixed.sol";
import {Drand} from "../randomness/Drand.sol";

/// @title The galaxy: a hex grid of stars, charted by the pilots who arrive (docs/demo4-plan.md, section 2)
/// @notice Every cell is undecided until a scan decides it: empty, a star, or a black hole. A pilot's
/// first arrival at a star names a future drand round; once that round is published, anyone holding
/// its signature can resolve the star's long-range scan, which decides the star's undecided neighbors.
/// Nobody can know the outcome when jumping, and reverting can't re-roll it (D21, D35).
///
/// Only what players change is stored (D9): cell states (2 bits each), the stars someone has visited,
/// black hole pairs, and new names. Everything else about a star is derived from the universe's seed.
contract Galaxy is ModuleBase {
    uint8 public constant UNDECIDED = 0;
    uint8 public constant EMPTY = 1;
    uint8 public constant STAR = 2;
    uint8 public constant BLACK_HOLE = 3;

    /// Region views cover at most this many steps around their center (331 cells).
    uint256 public constant MAX_REGION_RADIUS = 10;
    /// About 2% of new stars are black holes.
    int256 internal constant BLACK_HOLE_CHANCE = 20_000_000;
    /// A black hole's partner is this many steps away (D22, D28).
    uint256 internal constant PARTNER_MIN = 8;
    uint256 internal constant PARTNER_MAX = 24;
    /// Candidate cells sampled for a partner; the one deepest in the void wins.
    uint256 internal constant PARTNER_CANDIDATES = 4;
    /// No charted star may be this close to a new partner.
    uint256 internal constant PARTNER_CLEARANCE = 2;
    /// An origin crowd value meaning "no origin" (Sol, black hole exits).
    uint8 internal constant NO_ORIGIN = 7;

    struct Star {
        address discoverer;
        uint40 discoveredAt;
        uint32 scanRound; // the drand round that decides this star's scan
        uint8 originCrowd; // the origin's star count when the explorer arrived (NO_ORIGIN: none)
        bool visited;
        bool scanned;
    }

    struct CellView {
        uint256 cell;
        uint8 state;
        bool visited;
        bool scanned;
        uint32 scanRound;
        address discoverer;
        uint40 discoveredAt;
        uint256 partner; // a black hole's partner cell, or 0
        bool named;
    }

    /// @custom:storage-location erc7201:orbiter8.galaxy
    struct GalaxyStorage {
        bytes32 seed;
        Spiral.Params spiral;
        uint64 scanDelay;
        mapping(uint256 => uint256) cellWords; // 128 cells per word, 2 bits each
        mapping(uint256 => Star) stars;
        mapping(uint256 => uint256) partnerPlusOne;
        mapping(uint256 => string) names;
        mapping(uint256 => address) keepers; // a star's owner (Planets.nameStar), once it has one
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.galaxy")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant GALAXY_SLOT = 0xfb2123573455c53eeac60d78329ceb2d58aace100441ceacb3bb05dcb327fe00;

    event Discovered(uint256 indexed cell, address indexed explorer, uint32 scanRound);
    event Arrived(uint256 indexed cell, address indexed pilot, uint256 from);
    event ScanResolved(uint256 indexed cell, uint8[6] neighborStates);
    event BlackHolePaired(uint256 indexed a, uint256 indexed b);
    event Renamed(uint256 indexed cell, string name);

    error NotAStar(uint256 cell);
    error OutOfRange(uint256 from, uint256 to, uint256 range);
    error NotScannable(uint256 cell);
    error NotABlackHole(uint256 cell);
    error RegionTooLarge(uint256 radius);
    error BadName();

    function _g() internal pure returns (GalaxyStorage storage g) {
        assembly {
            g.slot := GALAXY_SLOT
        }
    }

    /// Creates the universe: its seed fixes the spiral and every derived trait. Sol (cell 0) is
    /// charted at once, its ring decided from the seed alone (there's no explorer to bias it).
    function initialize(address admin, bytes32 seed, uint64 scanDelay) external initializer {
        __ModuleBase_init(admin);
        GalaxyStorage storage g = _g();
        g.seed = seed;
        g.spiral = Spiral.fromSeed(seed);
        g.scanDelay = scanDelay;
        _setState(0, STAR);
        g.stars[0] = Star(address(0), uint40(block.timestamp), 0, NO_ORIGIN, true, true);
        _applyScan(0, keccak256(abi.encode(seed, "sol")), NO_ORIGIN);
        // Genesis: Sol and the stars it charts get real names; later stars are named by players.
        g.names[0] = "Sol";
        uint256[6] memory around = HexMath.neighbors(0);
        uint256 given;
        g.keepers[0] = address(this);
        for (uint256 i = 0; i < 6; i++) {
            if (stateOf(around[i]) != STAR) continue;
            g.names[around[i]] = _genesisName(given++);
            // Owned by the Federation (this contract): renamed only by a pilot holding most of its planets.
            g.keepers[around[i]] = address(this);
        }
    }

    /// The stars nearest Sol, for the genesis ring.
    function _genesisName(uint256 i) internal pure returns (string memory) {
        return ["Alpha Centauri", "Barnard's Star", "Wolf 359", "Lalande 21185", "Sirius", "Ross 154"][i];
    }

    // ── moves (called by the Pilots module, which checks who's acting) ──────────────────────────

    /// A ship jumps from `from` to `to`, within `range` steps. Returns true if it's the star's first
    /// visit, in which case its scan waits for a drand round about scanDelay seconds away.
    function arrive(address pilot, uint256 from, uint256 to, uint256 range)
        external
        onlyRole(GAME_MODULE)
        returns (bool firstVisit)
    {
        uint8 state = stateOf(to);
        if (state != STAR && state != BLACK_HOLE) revert NotAStar(to);
        uint256 steps = HexMath.distance(from, to);
        if (steps > range) revert OutOfRange(from, to, range);
        firstVisit = _visit(pilot, to, _crowd(from));
        emit Arrived(to, pilot, from);
    }

    /// A ship at a black hole goes through to its partner. Returns the partner and whether it's a
    /// first visit.
    function traverse(address pilot, uint256 blackHole)
        external
        onlyRole(GAME_MODULE)
        returns (uint256 exit, bool firstVisit)
    {
        exit = partnerOf(blackHole);
        if (exit == 0 && blackHole != 0) revert NotABlackHole(blackHole);
        firstVisit = _visit(pilot, exit, NO_ORIGIN);
        emit Arrived(exit, pilot, blackHole);
    }

    /// Names a star and records its owner (`keeper`, or address(0) for none). Who may is decided by
    /// Planets.nameStar, which knows the star's planets and charges the fee.
    function setName(uint256 cell, string calldata name, address keeper) external onlyRole(GAME_MODULE) {
        bytes memory b = bytes(name);
        if (b.length == 0 || b.length > 24) revert BadName();
        _g().names[cell] = name;
        _g().keepers[cell] = keeper;
        emit Renamed(cell, name);
    }

    // ── scans (anyone) ──────────────────────────────────────────────────────────────────────────

    /// Resolves a visited star's long-range scan with its drand round's signature. Anyone may: the
    /// client sends it along with the next move, so the explorer never approves it separately.
    function resolveScan(uint256 cell, bytes calldata signature) public {
        Star storage s = _g().stars[cell];
        if (!s.visited || s.scanned) revert NotScannable(cell);
        bytes32 drand = Drand.verify(s.scanRound, signature);
        s.scanned = true;
        _applyScan(cell, _scanRandomness(drand, cell, s.discoverer), s.originCrowd);
    }

    /// Resolves several scans; ones already resolved are skipped.
    function resolveScans(uint256[] calldata cells, bytes[] calldata signatures) external {
        for (uint256 i = 0; i < cells.length; i++) {
            Star storage s = _g().stars[cells[i]];
            if (s.visited && !s.scanned) resolveScan(cells[i], signatures[i]);
        }
    }

    /// What a pending scan will decide, without writing it: the six neighbors' states, and a new
    /// black hole's partner (0 where none).
    function previewScan(uint256 cell, bytes calldata signature)
        external
        view
        returns (uint8[6] memory states, uint256[6] memory partners)
    {
        Star storage s = _g().stars[cell];
        if (!s.visited || s.scanned) revert NotScannable(cell);
        bytes32 drand = Drand.verify(s.scanRound, signature);
        return _scanOutcome(cell, _scanRandomness(drand, cell, s.discoverer), s.originCrowd);
    }

    // ── views ───────────────────────────────────────────────────────────────────────────────────

    function stateOf(uint256 cell) public view returns (uint8) {
        return uint8((_g().cellWords[cell / 128] >> ((cell % 128) * 2)) & 3);
    }

    function star(uint256 cell) external view returns (Star memory) {
        return _g().stars[cell];
    }

    function partnerOf(uint256 cell) public view returns (uint256) {
        uint256 p = _g().partnerPlusOne[cell];
        return p == 0 ? 0 : p - 1;
    }

    function nameOf(uint256 cell) external view returns (string memory) {
        return _g().names[cell];
    }

    /// A star's owner (who last named it holding its planets), or address(0).
    function keeperOf(uint256 cell) external view returns (address) {
        return _g().keepers[cell];
    }

    function universe()
        external
        view
        returns (bytes32 seed, Spiral.Params memory spiral, uint64 scanDelay, uint64 drandGenesis, uint64 drandPeriod)
    {
        GalaxyStorage storage g = _g();
        return (g.seed, g.spiral, g.scanDelay, Drand.GENESIS_TIME, Drand.PERIOD);
    }

    /// Spiral density at a cell, 0–1e9 (1 on an arm).
    function densityOf(uint256 cell) public view returns (int256) {
        (int256 x, int256 y) = HexMath.position(cell);
        return Spiral.density(_g().spiral, x, y);
    }

    /// Every decided cell within `radius` steps of `center`, in one call (D18, D43).
    function region(uint256 center, uint256 radius) external view returns (CellView[] memory out) {
        if (radius > MAX_REGION_RADIUS) revert RegionTooLarge(radius);
        (int256 cq, int256 cr) = HexMath.toAxial(center);
        int256 R = int256(radius);
        CellView[] memory found = new CellView[](uint256(3 * R * R + 3 * R + 1));
        uint256 n;
        for (int256 dq = -R; dq <= R; dq++) {
            int256 lo = dq < 0 ? -R - dq : -R;
            int256 hi = dq < 0 ? R : R - dq;
            for (int256 dr = lo; dr <= hi; dr++) {
                uint256 cell = HexMath.toIndex(cq + dq, cr + dr);
                uint8 state = stateOf(cell);
                if (state == UNDECIDED) continue;
                found[n++] = _view(cell, state);
            }
        }
        out = new CellView[](n);
        for (uint256 i = 0; i < n; i++) out[i] = found[i];
    }

    function _view(uint256 cell, uint8 state) internal view returns (CellView memory v) {
        Star storage s = _g().stars[cell];
        v = CellView(
            cell,
            state,
            s.visited,
            s.scanned,
            s.scanRound,
            s.discoverer,
            s.discoveredAt,
            partnerOf(cell),
            bytes(_g().names[cell]).length > 0
        );
    }

    // ── internals ───────────────────────────────────────────────────────────────────────────────

    function _visit(address pilot, uint256 cell, uint8 originCrowd) internal returns (bool) {
        Star storage s = _g().stars[cell];
        if (s.visited) return false;
        uint32 round = uint32(Drand.roundAt(block.timestamp + _g().scanDelay));
        _g().stars[cell] = Star(pilot, uint40(block.timestamp), round, originCrowd, true, false);
        emit Discovered(cell, pilot, round);
        return true;
    }

    function _scanRandomness(bytes32 drand, uint256 cell, address explorer) internal view returns (bytes32) {
        return keccak256(abi.encode(drand, _g().seed, cell, explorer));
    }

    /// How many of a cell's neighbors hold a star or black hole.
    function _crowd(uint256 cell) internal view returns (uint8 count) {
        uint256[6] memory around = HexMath.neighbors(cell);
        for (uint256 i = 0; i < 6; i++) {
            uint8 st = stateOf(around[i]);
            if (st == STAR || st == BLACK_HOLE) count++;
        }
    }

    function _applyScan(uint256 cell, bytes32 rnd, uint8 originCrowd) internal {
        (uint8[6] memory states, uint256[6] memory partners) = _scanOutcome(cell, rnd, originCrowd);
        uint256[6] memory around = HexMath.neighbors(cell);
        for (uint256 i = 0; i < 6; i++) {
            if (stateOf(around[i]) != UNDECIDED) continue;
            _setState(around[i], states[i]);
            if (states[i] == BLACK_HOLE) {
                _setState(partners[i], BLACK_HOLE);
                _g().partnerPlusOne[around[i]] = partners[i] + 1;
                _g().partnerPlusOne[partners[i]] = around[i] + 1;
                emit BlackHolePaired(around[i], partners[i]);
            }
        }
        emit ScanResolved(cell, states);
    }

    /// What a scan decides for each of the six neighbors (already-decided ones keep their state).
    function _scanOutcome(uint256 cell, bytes32 rnd, uint8 originCrowd)
        internal
        view
        returns (uint8[6] memory states, uint256[6] memory partners)
    {
        uint256[6] memory around = HexMath.neighbors(cell);
        uint256[6] memory open;
        uint256 openCount;
        uint256 have;
        for (uint256 i = 0; i < 6; i++) {
            uint8 st = stateOf(around[i]);
            states[i] = st;
            if (st == UNDECIDED) open[openCount++] = i;
            else if (st == STAR || st == BLACK_HOLE) have++;
        }
        uint256 need = ScanRules.newStars(rnd, densityOf(cell), openCount, have, originCrowd);

        // Which open slots fill: a shuffle fixed by the scan's randomness.
        for (uint256 i = openCount; i > 1; i--) {
            uint256 j = uint256(keccak256(abi.encode(rnd, "shuffle", i))) % i;
            (open[i - 1], open[j]) = (open[j], open[i - 1]);
        }
        for (uint256 i = 0; i < openCount; i++) {
            uint256 slot = open[i];
            if (i >= need) {
                states[slot] = EMPTY;
                continue;
            }
            states[slot] = STAR;
            if (ScanRules.draw(rnd, keccak256(abi.encode("black hole", slot))) < BLACK_HOLE_CHANCE) {
                (bool found, uint256 partner) = _findPartner(around[slot], rnd);
                if (found) {
                    states[slot] = BLACK_HOLE;
                    partners[slot] = partner;
                }
            }
        }
    }

    /// A partner for a new black hole at `hole`: a few candidate cells 8–24 steps away, each
    /// undecided with no charted star within 2 steps; the one deepest in the void wins (D28).
    function _findPartner(uint256 hole, bytes32 rnd) internal view returns (bool found, uint256 best) {
        int256 bestDensity = type(int256).max;
        for (uint256 c = 0; c < PARTNER_CANDIDATES; c++) {
            uint256 h = uint256(keccak256(abi.encode(rnd, "partner", hole, c)));
            uint256 steps = PARTNER_MIN + h % (PARTNER_MAX - PARTNER_MIN + 1);
            uint256 candidate = _ringCell(hole, steps, (h >> 64) % (6 * steps));
            if (!_isClear(candidate)) continue;
            int256 d = densityOf(candidate);
            if (d < bestDensity) {
                bestDensity = d;
                best = candidate;
                found = true;
            }
        }
    }

    /// The `pos`-th cell (0 to 6·steps−1) on the ring `steps` away from `center`.
    function _ringCell(uint256 center, uint256 steps, uint256 pos) internal pure returns (uint256) {
        (int256 cq, int256 cr) = HexMath.toAxial(center);
        int256 k = int256(steps);
        uint256 side = pos / steps;
        int256 along = int256(pos % steps);
        // Start at center + DIR[4]·k, then walk the sides (the same walk as the index scheme).
        int256[6] memory dq = [int256(1), 1, 0, -1, -1, 0];
        int256[6] memory dr = [int256(0), -1, -1, 0, 1, 1];
        int256 q = cq - k;
        int256 r = cr + k;
        for (uint256 s = 0; s < side; s++) {
            q += dq[s] * k;
            r += dr[s] * k;
        }
        return HexMath.toIndex(q + dq[side] * along, r + dr[side] * along);
    }

    /// Undecided, with nothing charted within PARTNER_CLEARANCE steps.
    function _isClear(uint256 cell) internal view returns (bool) {
        if (cell == 0 || stateOf(cell) != UNDECIDED) return false;
        (int256 cq, int256 cr) = HexMath.toAxial(cell);
        int256 R = int256(PARTNER_CLEARANCE);
        for (int256 dq = -R; dq <= R; dq++) {
            int256 lo = dq < 0 ? -R - dq : -R;
            int256 hi = dq < 0 ? R : R - dq;
            for (int256 dr = lo; dr <= hi; dr++) {
                uint8 st = stateOf(HexMath.toIndex(cq + dq, cr + dr));
                if (st == STAR || st == BLACK_HOLE) return false;
            }
        }
        return true;
    }

    function _setState(uint256 cell, uint8 state) internal {
        uint256 shift = (cell % 128) * 2;
        uint256 word = _g().cellWords[cell / 128];
        _g().cellWords[cell / 128] = (word & ~(uint256(3) << shift)) | (uint256(state) << shift);
    }
}
