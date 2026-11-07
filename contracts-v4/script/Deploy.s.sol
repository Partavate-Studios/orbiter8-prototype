// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Galaxy} from "../src/galaxy/Galaxy.sol";
import {Pilots} from "../src/pilots/Pilots.sol";
import {Market} from "../src/market/Market.sol";
import {Credits} from "../src/tokens/Credits.sol";
import {Ships} from "../src/tokens/Ships.sol";
import {Deeds} from "../src/tokens/Deeds.sol";
import {Planets} from "../src/planets/Planets.sol";
import {Factory} from "../src/planets/Factory.sol";

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
        Planets planets;
        Factory factory;
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
        game.planets = Planets(
            _proxy(
                address(new Planets()),
                abi.encodeCall(
                    Planets.initialize, (admin, game.galaxy, game.pilots, game.market, game.credits, game.deeds)
                )
            )
        );
        game.factory = Factory(
            _proxy(
                address(new Factory()),
                abi.encodeCall(Factory.initialize, (admin, game.pilots, game.planets, game.credits))
            )
        );
    }

    /// Grants the modules the roles they need on each other (run by the admin).
    function wire(Game memory game) internal {
        bytes32 role = game.galaxy.GAME_MODULE();
        game.galaxy.grantRole(role, address(game.pilots));
        game.ships.grantRole(role, address(game.pilots));
        game.credits.grantRole(role, address(game.pilots));
        game.credits.grantRole(role, address(game.market));
        game.pilots.grantRole(role, address(game.market));
        game.credits.grantRole(role, address(game.planets));
        game.credits.grantRole(role, address(game.factory));
        game.pilots.grantRole(role, address(game.planets));
        game.market.grantRole(role, address(game.planets));
        game.deeds.grantRole(role, address(game.planets));
        game.planets.grantRole(role, address(game.factory));
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
        vm.serializeAddress(json, "factory", address(game.factory));
        string memory out = vm.serializeAddress(json, "pilots", address(game.pilots));
        vm.writeJson(out, string.concat("deployments/", vm.toString(block.chainid), ".json"));
    }
}
