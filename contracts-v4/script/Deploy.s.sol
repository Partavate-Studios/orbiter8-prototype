// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Galaxy} from "../src/galaxy/Galaxy.sol";
import {Pilots} from "../src/pilots/Pilots.sol";

/// Deploys every game module behind its proxy and wires them together. The deployer is the admin
/// and upgrader (a multisig takes these over for a public release, D14).
library Deployment {
    struct Game {
        Galaxy galaxy;
        Pilots pilots;
    }

    function deploy(address admin, bytes32 seed, uint64 scanDelay) internal returns (Game memory game) {
        game.galaxy = Galaxy(
            address(
                new ERC1967Proxy(
                    address(new Galaxy()), abi.encodeCall(Galaxy.initialize, (admin, seed, scanDelay))
                )
            )
        );
        game.pilots = Pilots(
            address(new ERC1967Proxy(address(new Pilots()), abi.encodeCall(Pilots.initialize, (admin, game.galaxy))))
        );
    }

    /// Grants the modules the roles they need on each other (run by the admin).
    function wire(Game memory game) internal {
        game.galaxy.grantRole(game.galaxy.GAME_MODULE(), address(game.pilots));
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
        string memory json = "deployment";
        vm.serializeAddress(json, "galaxy", address(game.galaxy));
        string memory out = vm.serializeAddress(json, "pilots", address(game.pilots));
        vm.writeJson(out, string.concat("deployments/", vm.toString(block.chainid), ".json"));
    }
}
