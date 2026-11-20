// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ModuleBase} from "../core/ModuleBase.sol";

/// @title Credits, the game's money (docs/demo4-plan.md, section 1)
/// @notice An ordinary ERC-20 in whole credits (no decimals), so balances read as the game shows
/// them. The Federation's ports and yards mint what they pay and burn what they're paid; fees are
/// burned too, as sinks (plan, section 4). Players can send credits to each other.
contract Credits is ERC20Upgradeable, ModuleBase {
    /// @custom:storage-location erc7201:orbiter8.credits.debts
    struct DebtStorage {
        mapping(address => uint256) debt;
    }

    // keccak256(abi.encode(uint256(keccak256("orbiter8.credits.debts")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant DEBT_SLOT = 0x1c78acd357d63c51f261a9ad54e92631fbf66a863e0cf9bf2ef714b6bdd8d500;

    event Cheated(address indexed to, uint256 amount);
    event DebtChanged(address indexed account, uint256 debt);

    function _debts() private pure returns (DebtStorage storage d) {
        assembly {
            d.slot := DEBT_SLOT
        }
    }

    /// What `account` owes (Koda, 2026-11-19: a new pilot starts in debt, carried over from Earth). A
    /// balance can't go below zero, so the debt is kept beside it: what the game pays the account clears
    /// it first. The game shows balance minus debt.
    function debtOf(address account) external view returns (uint256) {
        return _debts().debt[account];
    }

    /// Adds to what `account` owes (a new pilot's carried-over balance).
    function addDebt(address account, uint256 amount) external onlyRole(GAME_MODULE) {
        uint256 debt = _debts().debt[account] + amount;
        _debts().debt[account] = debt;
        emit DebtChanged(account, debt);
    }

    function initialize(address admin) external initializer {
        __ERC20_init("Orbiter 8 Credits", "O8C");
        __ModuleBase_init(admin);
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /// Pays `amount` new credits to `to` (Minerva's ports paying for goods, a pilot's starting money).
    /// Any debt is paid off first; only the rest reaches the balance.
    function mint(address to, uint256 amount) external onlyRole(GAME_MODULE) {
        uint256 debt = _debts().debt[to];
        if (debt > 0) {
            uint256 paid = amount < debt ? amount : debt;
            _debts().debt[to] = debt - paid;
            amount -= paid;
            emit DebtChanged(to, debt - paid);
        }
        if (amount > 0) _mint(to, amount);
    }

    /// A cheat for test deployments (Koda, 2026-11-18: "a cheat button that gives me a huge amount of
    /// game credits"): the admin pays `amount` new credits to `to`. Logged, so it's never hidden. Admin
    /// only; remove it, or hand the admin role to a multisig that never uses it, before mainnet.
    function cheat(address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(to, amount);
        emit Cheated(to, amount);
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
