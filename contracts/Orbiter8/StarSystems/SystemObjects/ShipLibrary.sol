pragma solidity >=0.5.0 <0.6.0;

import "../../../Tokens/ShipTokens.sol";
//import "@openzeppelin/contracts/math/SafeMath.sol";

library ShipLibrary {

    /**************************************
    *
    * MODELS
    *
    ***************************************/

    uint8 public constant maxHolds = 250;

    // Structures
    struct Ship {
        string name;
        uint currentStarSystem;
        uint256 currentOrbit;
        uint8 cargoLimit;
        uint8 equipment;
        uint8 fuel;
        uint8 organics;
    }

    struct ShipStorage {
        address shipTokensAddress;
        Ship[] ships;
        mapping (address => uint) ownerToOccupiedShip;
        //todo: could be a value on the avatar instead of this mapping
    }

    // Modifiers
    modifier mustOwnShip (
        ShipStorage storage self,
        uint256 shipId
    ) {
        require(ShipTokens(self.shipTokensAddress).ownerOf(shipId) == msg.sender, 'Must be your ship.');
        _;
    }

    /**************************************
    *
    * VIEWS
    *
    ***************************************/

    function getMyShip(ShipStorage storage self) internal view returns(
        string memory, //name
        uint,          //star system
        uint,          //orbit
        uint8,         //cargo limit
        uint8,         //equipment
        uint8,         //fuel
        uint8          //organics
    )  {
        uint shipId = self.ownerToOccupiedShip[msg.sender];
        return (
            self.ships[shipId].name,
            self.ships[shipId].currentStarSystem,
            self.ships[shipId].currentOrbit,
            self.ships[shipId].cargoLimit,
            self.ships[shipId].equipment,
            self.ships[shipId].fuel,
            self.ships[shipId].organics
        );
    }

    function getMyShipId(ShipStorage storage self) internal view returns(uint)  {
        return self.ownerToOccupiedShip[msg.sender];
    }

    function getMyShipLocation(ShipStorage storage self) internal view returns(uint)  {
        uint shipId = self.ownerToOccupiedShip[msg.sender];
        return self.ships[shipId].currentStarSystem;
    }

    function getMyShipName(ShipStorage storage self) internal view returns(string memory) {
        uint shipId = self.ownerToOccupiedShip[msg.sender];
        return self.ships[shipId].name;
    }

    function getShipTokenizer(ShipStorage storage self) internal view returns(address) {
        return self.shipTokensAddress;
    }

    //todo: should probably only display cargo for own ship
    function getShip(
        ShipStorage storage self,
        uint256 shipId
    ) internal view returns(
        string memory, //name
        uint,          //star system
        uint,          //orbit
        address        //owner
    )  {
        return (
            self.ships[shipId].name,
            self.ships[shipId].currentStarSystem,
            self.ships[shipId].currentOrbit,
            ShipTokens(self.shipTokensAddress).ownerOf(shipId)
        );
    }

    /**************************************
    *
    * CONTROLS
    *
    ***************************************/

    function setShipTokenizer(
        ShipStorage storage self,
        address tokenAddress
    ) public {
        self.shipTokensAddress = tokenAddress;
    }

    function createMyShip(
        ShipStorage storage self,
        string memory _name
    ) internal returns (uint) {
        uint shipId = self.ships.push(Ship(
            _name,
            1, //sol
            3, //earth
            5,//holds
            1, //equipment
            1, //fuel
            1) //organics
        )-1;
        //auto occupy
        self.ownerToOccupiedShip[msg.sender] = shipId;
        //mint token
        ShipTokens(self.shipTokensAddress).mintShip(shipId, msg.sender);

        return shipId;
    }

    function addHolds(
        ShipStorage storage self,
        uint8 holds
    ) internal {
        uint shipId = self.ownerToOccupiedShip[msg.sender];
        require ((uint256(self.ships[shipId].cargoLimit) + uint256(holds)) <= maxHolds, "Maxed Out");
        self.ships[shipId].cargoLimit += holds;
        //TODO: replace this with safe math
    }

    function setMyShipOrbit (
        ShipStorage storage self,
        uint256 orbit
    ) internal  {
        uint shipId = self.ownerToOccupiedShip[msg.sender];
        self.ships[shipId].currentOrbit = orbit;
    }

    function boardShip(ShipStorage storage self, uint _shipId) internal mustOwnShip(self, _shipId) {
        self.ownerToOccupiedShip[msg.sender] = _shipId;
    }

    function moveMyShip(ShipStorage storage self, uint256 _systemId) internal {
        self.ships[self.ownerToOccupiedShip[msg.sender]].currentStarSystem = _systemId;
        self.ships[self.ownerToOccupiedShip[msg.sender]].currentOrbit = 0;
    }

    function renameMyShip(ShipStorage storage self, string memory _newName) internal {
        uint shipId = self.ownerToOccupiedShip[msg.sender];
        self.ships[shipId].name = _newName;
    }

    function modifyMyShipCargo(
        ShipStorage storage self,
        int16 equipment,
        int16 fuel,
        int16 organics
    ) internal {
        uint shipId = self.ownerToOccupiedShip[msg.sender];

        self.ships[shipId].equipment = modifiedCargo(self.ships[shipId].equipment, equipment);
        self.ships[shipId].fuel = modifiedCargo(self.ships[shipId].fuel, fuel);
        self.ships[shipId].organics = modifiedCargo(self.ships[shipId].organics, organics);
        uint newCargoLoad = uint(self.ships[shipId].equipment + self.ships[shipId].fuel + self.ships[shipId].organics);
        require(newCargoLoad <= self.ships[shipId].cargoLimit, 'Too much cargo.');
    }

    function modifiedCargo(uint16 current, int16 change) internal pure returns (uint8) {
        int256 finalVal = int256(current) + int256(change);
        require (finalVal >= 0, 'over sold');
        return uint8(finalVal);
    }

}