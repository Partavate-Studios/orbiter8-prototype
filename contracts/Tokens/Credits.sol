pragma solidity ^0.5.16;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract Credits is ERC20, ERC20Detailed, Ownable {
    constructor() ERC20Detailed("Pan-Galactic Credits -Orbiter 8 Alpha 3.4", "", 0) public {
    }

    function awardCredits(address player, uint256 amount) public onlyOwner {
        _mint(player, amount);
    }

    function spendCredits(address player, uint256 amount) public onlyOwner {
        _burn(player, amount);
    }

    function tokenURI() external pure returns (string memory) {
        return "https://orbiter8.com/tokens/credits";
    }
}
