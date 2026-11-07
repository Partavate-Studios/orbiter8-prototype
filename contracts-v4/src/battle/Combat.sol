// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

/// @title How a siege's rounds play out (docs/demo4-plan.md, section 6; D44–D54)
/// @notice No dice (D50): each 30-minute round, both sides fire with what they have at its start,
/// then the hits land. orbiter-client sdk/v4/combat.js mirrors it; the simulator tunes the numbers.
///
/// Hits land in layers, in order. A planet: orbital platforms, its shield, armor, its weapon
/// systems, then its hull (the defense grid its buildings support). A ship: its shield, then armor;
/// when both are gone it retreats (D52), and what's left of that round's hits disables weapons, then
/// costs engine range, then bays (D46).
///
/// The counters (D53), as multipliers on each layer (percent):
///
/// | Attack   | Platforms | Shields | Armor | Systems | Hull |
/// |----------|-----------|---------|-------|---------|------|
/// | Railgun  | 100       | 25      | 200   | 100     | 100  |
/// | Missile  | 200       | 200     | 100   | 100     | 100  |
/// | Drone    | 25        | 100     | 50    | 200     | 100  |
/// | BFG      | 100       | 100     | 100   | 100     | 100  |
///
/// Point defense stops missiles before they land; drones aren't stopped and destroy point defense
/// first. The BFG fires once its charge is full (D50).
library Combat {
    uint256 internal constant ROUND = 30 minutes;

    // Damage per round, per weapon.
    uint256 internal constant RAILGUN = 12;
    uint256 internal constant MISSILE = 12;
    uint256 internal constant DRONE = 2;
    uint256 internal constant BFG = 300;
    uint256 internal constant BFG_RECHARGE = 12; // rounds (6 hours)
    uint256 internal constant INTERCEPT = 15; // missile damage each point defense stops per round

    // Hit points.
    uint256 internal constant PLATFORM_HP = 150;
    uint256 internal constant SHIELD_HP = 60; // per level
    uint256 internal constant ARMOR_HP = 50; // per plate or level
    uint256 internal constant WEAPON_HP = 30; // point defense, railgun, missile rack
    uint256 internal constant DRONE_HP = 10;
    uint256 internal constant BOT_HP = 20;
    uint256 internal constant BFG_HP = 200;
    uint256 internal constant HULL_PER_LEVEL = 60;
    uint256 internal constant ENGINE_HP = 40; // per range level lost
    uint256 internal constant BAY_HP = 20; // per 10 bays lost

    uint256 internal constant SHIELD_REGEN = 10; // percent of the full shield, per round
    uint256 internal constant PLANET_REPAIR = 5; // armor per repair bot per round
    uint256 internal constant SHIP_REPAIR = 2;

    /// One side's state in a round.
    struct Side {
        uint32 platforms; // hit points
        uint32 shield;
        uint32 shieldMax;
        uint32 armor;
        uint32 armorMax;
        uint32 hull;
        uint16 pointDefense;
        uint16 railguns;
        uint16 missiles;
        uint16 drones;
        uint16 repairBots;
        uint16 bfg;
        uint16 bfgCharge;
        uint32 carry; // damage toward the next system
        // ship only: spilled into engines and bays when it retreats
        uint8 rangeLost;
        uint8 maxRangeLoss;
        uint16 baysLost;
        uint16 maxBaysLoss;
        bool retreated;
    }

    /// Extra fire on a side's behalf (ships joining the defense).
    struct Fire {
        uint256 railguns;
        uint256 missiles;
        uint256 drones;
    }

    function _mult(uint256 kind, uint256 layer) private pure returns (uint256) {
        // kind: 0 railgun, 1 missile, 2 drone, 3 BFG; layer: platforms, shields, armor, systems, hull
        if (kind == 0) return [uint256(100), 25, 200, 100, 100][layer];
        if (kind == 1) return [uint256(200), 200, 100, 100, 100][layer];
        if (kind == 2) return [uint256(25), 100, 50, 200, 100][layer];
        return 100;
    }

    /// Plays up to `rounds` rounds, stopping early if the attacker is spent. Returns how many were
    /// played and the first (1-based) that ended with the planet worn down (0: none). A linked
    /// library call, so Battle stays under the contract size limit.
    function play(Side memory attacker, Side memory planet, Fire memory allies, uint256 rounds)
        public
        pure
        returns (Side memory, Side memory, uint256 played, uint256 wornRound)
    {
        while (played < rounds && !spent(attacker)) {
            played++;
            if (round(attacker, planet, allies) && wornRound == 0) wornRound = played;
        }
        return (attacker, planet, played, wornRound);
    }

    /// Plays one round between an attacking ship and a defending planet (with allies' fire).
    /// Returns whether the planet ended it worn down; a worn-down planet doesn't recover.
    function round(Side memory attacker, Side memory planet, Fire memory allies) internal pure returns (bool worn) {
        // Both sides fire with what they have at the start of the round.
        // A ship that has retreated no longer fires.
        uint256[3] memory atPlanet = attacker.retreated
            ? [uint256(0), 0, 0]
            : _fire(attacker.railguns, attacker.missiles, attacker.drones, planet.pointDefense);
        uint256[3] memory atShip = _fire(
            planet.railguns + allies.railguns,
            planet.missiles + allies.missiles,
            planet.drones + allies.drones,
            attacker.pointDefense
        );
        bool bfgFires = planet.bfg > 0 && planet.bfgCharge + 1 >= BFG_RECHARGE;
        planet.bfgCharge = bfgFires ? 0 : (planet.bfg > 0 ? planet.bfgCharge + 1 : 0);

        for (uint256 kind = 0; kind < 3; kind++) {
            _hitPlanet(planet, kind, atPlanet[kind]);
            _hitShip(attacker, kind, atShip[kind]);
        }
        if (bfgFires) _hitShip(attacker, 3, BFG * planet.bfg);

        worn = wornDown(planet);
        if (!worn) _recover(planet, PLANET_REPAIR);
        if (!attacker.retreated) _recover(attacker, SHIP_REPAIR);
    }

    /// Damage by kind after point defense takes its share of the missiles.
    function _fire(uint256 railguns, uint256 missiles, uint256 drones, uint256 pointDefense)
        private
        pure
        returns (uint256[3] memory out)
    {
        uint256 missileDamage = missiles * MISSILE;
        uint256 stopped = pointDefense * INTERCEPT;
        out[0] = railguns * RAILGUN;
        out[1] = missileDamage > stopped ? missileDamage - stopped : 0;
        out[2] = drones * DRONE;
    }

    /// Lands `damage` of one kind on a planet, layer by layer.
    function _hitPlanet(Side memory p, uint256 kind, uint256 damage) private pure {
        damage = _absorb(damage, kind, 0, p, 0);
        damage = _absorb(damage, kind, 1, p, 1);
        damage = _absorb(damage, kind, 2, p, 2);
        damage = _systems(p, kind, damage);
        _absorb(damage, kind, 4, p, 5);
    }

    /// Lands `damage` of one kind on a ship: shield, armor, then (on retreat) systems, engines, bays.
    function _hitShip(Side memory s, uint256 kind, uint256 damage) private pure {
        if (damage == 0 || s.retreated) return;
        damage = _absorb(damage, kind, 1, s, 1);
        damage = _absorb(damage, kind, 2, s, 2);
        if (s.shield > 0 || s.armor > 0) return;
        s.retreated = true; // armor and shields are gone (D52): what's left of the hit spills over
        damage = _systems(s, kind, damage);
        uint256 engines = damage / ENGINE_HP;
        uint256 room = s.maxRangeLoss - s.rangeLost;
        engines = engines > room ? room : engines;
        s.rangeLost += uint8(engines);
        damage -= engines * ENGINE_HP;
        uint256 bays = (damage / BAY_HP) * 10;
        room = s.maxBaysLoss - s.baysLost;
        s.baysLost += uint16(bays > room ? room : bays);
    }

    /// Takes damage off one pool (field: 0 platforms, 1 shield, 2 armor, 5 hull) at the layer's
    /// multiplier; returns the damage left over, in the attack's own terms.
    function _absorb(uint256 damage, uint256 kind, uint256 layer, Side memory s, uint256 field)
        private
        pure
        returns (uint256)
    {
        if (damage == 0) return 0;
        uint256 pool = field == 0 ? s.platforms : field == 1 ? s.shield : field == 2 ? s.armor : s.hull;
        if (pool == 0) return damage;
        uint256 mult = _mult(kind, layer);
        uint256 effective = (damage * mult) / 100;
        uint256 left;
        if (effective >= pool) {
            left = damage - (pool * 100 + mult - 1) / mult;
            pool = 0;
        } else {
            pool -= effective;
        }
        if (field == 0) s.platforms = uint32(pool);
        else if (field == 1) s.shield = uint32(pool);
        else if (field == 2) s.armor = uint32(pool);
        else s.hull = uint32(pool);
        return left;
    }

    /// Destroys weapon systems in order (point defense, railguns, missile racks, drones, repair bots,
    /// the BFG); returns the damage left over.
    function _systems(Side memory s, uint256 kind, uint256 damage) private pure returns (uint256) {
        if (damage == 0) return 0;
        uint256 mult = _mult(kind, 3);
        uint256 hits = (damage * mult) / 100 + s.carry;
        s.carry = 0;
        uint16 n;
        (n, hits) = _destroy(s.pointDefense, WEAPON_HP, hits);
        s.pointDefense = n;
        (n, hits) = _destroy(s.railguns, WEAPON_HP, hits);
        s.railguns = n;
        (n, hits) = _destroy(s.missiles, WEAPON_HP, hits);
        s.missiles = n;
        (n, hits) = _destroy(s.drones, DRONE_HP, hits);
        s.drones = n;
        (n, hits) = _destroy(s.repairBots, BOT_HP, hits);
        s.repairBots = n;
        (n, hits) = _destroy(s.bfg, BFG_HP, hits);
        s.bfg = n;
        if (_systemCount(s) > 0) {
            s.carry = uint32(hits); // short of the next system: it carries to the next hit
            return 0;
        }
        return (hits * 100) / mult;
    }

    function _destroy(uint16 count, uint256 hp, uint256 hits) private pure returns (uint16, uint256) {
        uint256 lost = hits / hp;
        if (lost >= count) return (0, hits - uint256(count) * hp);
        return (count - uint16(lost), hits - lost * hp);
    }

    function _systemCount(Side memory s) private pure returns (uint256) {
        return uint256(s.pointDefense) + s.railguns + s.missiles + s.drones + s.repairBots + s.bfg;
    }

    function _recover(Side memory s, uint256 perBot) private pure {
        uint256 shield = s.shield + (uint256(s.shieldMax) * SHIELD_REGEN) / 100;
        s.shield = uint32(shield > s.shieldMax ? s.shieldMax : shield);
        uint256 armor = s.armor + uint256(s.repairBots) * perBot;
        s.armor = uint32(armor > s.armorMax ? s.armorMax : armor);
    }

    /// The planet's defenses are gone (D47): nothing left in any layer.
    function wornDown(Side memory p) internal pure returns (bool) {
        return p.platforms == 0 && p.shield == 0 && p.armor == 0 && p.hull == 0 && _systemCount(p) == 0;
    }

    /// The attacker can't go on: retreated, or nothing left to fire.
    function spent(Side memory a) internal pure returns (bool) {
        return a.retreated || uint256(a.railguns) + a.missiles + a.drones == 0;
    }
}
