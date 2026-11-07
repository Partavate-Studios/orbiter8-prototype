// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ModuleBase} from "../core/ModuleBase.sol";

/// @title Credits, the game's money (docs/demo4-plan.md, section 1)
/// @notice An ordinary ERC-20 in whole credits (no decimals), so balances read as the game shows
/// them. The Federation's ports and yards mint what they pay and burn what they're paid; fees are
/// burned too, as sinks (plan, section 4). Players can send credits to each other.
contract Credits is ERC20Upgradeable, ModuleBase {
    function initialize(address admin) external initializer {
        __ERC20_init("Orbiter 8 Credits", "O8C");
        __ModuleBase_init(admin);
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /// Pays `amount` new credits to `to` (the Federation paying for goods, a pilot's starting money).
    function mint(address to, uint256 amount) external onlyRole(GAME_MODULE) {
        _mint(to, amount);
    }

    /// Takes `amount` credits out of circulation (purchases from the Federation, fees). Reverts with
    /// ERC20InsufficientBalance if `from` hasn't enough.
    function burn(address from, uint256 amount) external onlyRole(GAME_MODULE) {
        _burn(from, amount);
    }

    /// Moves credits between players for the game (a port owner's cut), without an allowance.
    function move(address from, address to, uint256 amount) external onlyRole(GAME_MODULE) {
        _transfer(from, to, amount);
    }
}
