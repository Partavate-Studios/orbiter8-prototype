// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {DeedArt} from "../src/art/DeedArt.sol";
import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Galaxy} from "../src/galaxy/Galaxy.sol";
import {Pilots} from "../src/pilots/Pilots.sol";
import {Market} from "../src/market/Market.sol";
import {Credits} from "../src/tokens/Credits.sol";
import {Ships} from "../src/tokens/Ships.sol";
import {Deeds} from "../src/tokens/Deeds.sol";
import {Planets} from "../src/planets/Planets.sol";
import {Claims} from "../src/planets/Claims.sol";
import {Drones} from "../src/planets/Drones.sol";
import {IMiningHook} from "../src/pilots/Pilots.sol";
import {IDronePool} from "../src/battle/Battle.sol";
import {IDroneOutput} from "../src/planets/Planets.sol";
import {IPortSupply} from "../src/market/Market.sol";
import {Repairs} from "../src/battle/Repairs.sol";
import {Factory} from "../src/planets/Factory.sol";
import {Battle} from "../src/battle/Battle.sol";
import {Armory} from "../src/battle/Armory.sol";

/// Deploys every game module behind its proxy and wires them together. The deployer is the admin
/// and upgrader (a multisig takes these over for a public release, D14).
library Deployment {
    struct Game {
        Galaxy galaxy;
        Pilots pilots;
        Market market;
        Credits credits;
        Ships ships;
        Deeds deeds;
        Claims claims;
        Planets planets;
        Factory factory;
        Repairs repairs;
        Battle battle;
        Armory armory;
        Drones drones;
    }

    function _proxy(address implementation, bytes memory init) private returns (address) {
        return address(new ERC1967Proxy(implementation, init));
    }

    function deploy(address admin, bytes32 seed, uint64 scanDelay) internal returns (Game memory game) {
        game.credits = Credits(_proxy(address(new Credits()), abi.encodeCall(Credits.initialize, (admin))));
        game.ships = Ships(_proxy(address(new Ships()), abi.encodeCall(Ships.initialize, (admin))));
        game.galaxy =
            Galaxy(_proxy(address(new Galaxy()), abi.encodeCall(Galaxy.initialize, (admin, seed, scanDelay))));
        game.pilots = Pilots(
            _proxy(
                address(new Pilots()),
                abi.encodeCall(Pilots.initialize, (admin, game.galaxy, game.credits, game.ships))
            )
        );
        game.market = Market(
            _proxy(address(new Market()), abi.encodeCall(Market.initialize, (admin, game.pilots, game.credits)))
        );
        game.deeds = Deeds(_proxy(address(new Deeds()), abi.encodeCall(Deeds.initialize, (admin))));
        game.claims = Claims(
            _proxy(
                address(new Claims()),
                abi.encodeCall(Claims.initialize, (admin, game.galaxy, game.pilots, game.credits, game.deeds))
            )
        );
        game.planets = Planets(
            _proxy(
                address(new Planets()),
                abi.encodeCall(
                    Planets.initialize, (admin, game.galaxy, game.pilots, game.market, game.credits, game.claims)
                )
            )
        );
        game.factory = Factory(
            _proxy(
                address(new Factory()),
                abi.encodeCall(Factory.initialize, (admin, game.pilots, game.planets, game.credits))
            )
        );
        game.repairs =
            Repairs(_proxy(address(new Repairs()), abi.encodeCall(Repairs.initialize, (admin, game.pilots))));
        game.battle = Battle(
            _proxy(
                address(new Battle()),
                abi.encodeCall(Battle.initialize, (admin, game.pilots, game.planets, game.repairs))
            )
        );
        game.armory = Armory(
            _proxy(
                address(new Armory()),
                abi.encodeCall(
                    Armory.initialize,
                    (admin, game.pilots, game.planets, game.factory, game.market, game.credits, game.battle, game.repairs)
                )
            )
        );
        game.drones = Drones(
            _proxy(
                address(new Drones()),
                abi.encodeCall(
                    Drones.initialize,
                    (admin, game.pilots, game.claims, game.planets, game.battle, game.repairs, game.galaxy)
                )
            )
        );
    }

    /// Grants the modules the roles they need on each other (run by the admin).
    function wire(Game memory game) internal {
        bytes32 role = game.galaxy.GAME_MODULE();
        game.galaxy.grantRole(role, address(game.pilots));
        game.galaxy.grantRole(role, address(game.claims)); // star names (Claims.nameStar)
        game.ships.grantRole(role, address(game.pilots));
        game.credits.grantRole(role, address(game.pilots));
        game.credits.grantRole(role, address(game.market));
        game.pilots.grantRole(role, address(game.market));
        game.credits.grantRole(role, address(game.planets));
        game.credits.grantRole(role, address(game.factory));
        game.pilots.grantRole(role, address(game.planets));
        game.market.grantRole(role, address(game.planets));
        game.deeds.grantRole(role, address(game.claims));
        game.credits.grantRole(role, address(game.claims));
        game.claims.grantRole(role, address(game.planets)); // a siege's seizure (Claims.transfer)
        game.planets.grantRole(role, address(game.factory));
        game.battle.grantRole(role, address(game.pilots));
        game.battle.grantRole(role, address(game.armory));
        game.pilots.grantRole(role, address(game.battle));
        game.pilots.grantRole(role, address(game.repairs)); // a ship's damage (Pilots.setDamage)
        game.repairs.grantRole(role, address(game.battle)); // a siege's losses
        game.repairs.grantRole(role, address(game.armory)); // shipyard repairs
        game.pilots.grantRole(role, address(game.drones)); // landing and boarding drones
        game.drones.grantRole(role, address(game.pilots)); // a mining ship changing stops its mining
        game.pilots.setMiningHook(IMiningHook(address(game.drones)));
        game.drones.grantRole(role, address(game.battle)); // an asteroid's defense drones lost in a siege
        game.battle.setDrones(IDronePool(address(game.drones)));
        game.planets.setDrones(IDroneOutput(address(game.drones)));
        game.planets.grantRole(role, address(game.market)); // players' ports sell from storage
        game.market.setSupply(IPortSupply(address(game.planets)));
        game.pilots.grantRole(role, address(game.armory));
        game.planets.grantRole(role, address(game.battle));
        game.factory.grantRole(role, address(game.armory));
        game.credits.grantRole(role, address(game.armory));
        game.pilots.setBattle(game.battle);
        game.ships.setPilots(game.pilots);
    }

    /// Joining the game (Koda, 2026-11-19): the three corporations (names for now) and what the pilot
    /// program advances a new pilot: 3 Helium-3 (Earth buys it) and 2 Electronics (Ceres and others buy
    /// them), about 800 credits of goods, against the 45 carried over from Earth; no cash. Its own step
    /// after `wire`, as `wireDeeds` is.
    function wireJoining(Game memory game) internal {
        string[] memory names = new string[](3);
        (names[0], names[1], names[2]) = ("Corp X", "Corp Y", "Corp Z");
        game.pilots.setCorporations(names, 5_000);
        uint8[] memory goods = new uint8[](2);
        uint16[] memory units = new uint16[](2);
        (goods[0], units[0], goods[1], units[1]) = (3, 3, 7, 2);
        game.pilots.setStarterKit(Pilots.StarterKit(0, 45, goods, units));
    }

    /// Deeds draw themselves (D107): their sources, and the drawing. Its own step after `wire` (inside
    /// it, the tests' fixture runs out of stack).
    function wireDeeds(Game memory game) internal {
        game.deeds.setSources(game.galaxy, game.planets, game.claims, game.pilots, new DeedArt());
    }
}

/// forge script script/Deploy.s.sol --rpc-url <node> --broadcast  (SEED and SCAN_DELAY optional)
contract Deploy is Script {
    function run() external {
        bytes32 seed = vm.envOr("SEED", keccak256("orbiter8 demo 4"));
        uint64 scanDelay = uint64(vm.envOr("SCAN_DELAY", uint256(30)));
        vm.startBroadcast();
        (, address admin,) = vm.readCallers();
        Deployment.Game memory game = Deployment.deploy(admin, seed, scanDelay);
        Deployment.wire(game);
        Deployment.wireDeeds(game);
        Deployment.wireJoining(game);
        vm.stopBroadcast();
        console.log("Galaxy", address(game.galaxy));
        console.log("Pilots", address(game.pilots));
        console.log("Market", address(game.market));
        string memory json = "deployment";
        vm.serializeAddress(json, "galaxy", address(game.galaxy));
        vm.serializeAddress(json, "market", address(game.market));
        vm.serializeAddress(json, "credits", address(game.credits));
        vm.serializeAddress(json, "ships", address(game.ships));
        vm.serializeAddress(json, "deeds", address(game.deeds));
        vm.serializeAddress(json, "planets", address(game.planets));
        vm.serializeAddress(json, "claims", address(game.claims));
        vm.serializeAddress(json, "factory", address(game.factory));
        vm.serializeAddress(json, "battle", address(game.battle));
        vm.serializeAddress(json, "repairs", address(game.repairs));
        vm.serializeAddress(json, "drones", address(game.drones));
        vm.serializeAddress(json, "armory", address(game.armory));
        string memory out = vm.serializeAddress(json, "pilots", address(game.pilots));
        vm.writeJson(out, string.concat("deployments/", vm.toString(block.chainid), ".json"));
    }
}
