pragma solidity ^0.5.16;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
//import './NFTs.sol';

contract ShipTokens is ERC721Full, Ownable {

    constructor() ERC721Full("Starships - Orbiter 8 Alpha 3.4", "O8SHIPS") public {
        //_setBaseURI("https://orbiter8.com/tokens/");
    }

    /**
     * overriding method
     */
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return string(abi.encodePacked("https://orbiter8.com/tokens/ship/", uint2str(tokenId)));
    }

    function mintShip(uint256 shipId, address owner) public onlyOwner {
        _mint(owner, shipId);
        _setTokenURI(shipId, uint2str(shipId));
    }

    // todo: move to a library or something
    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }
}
