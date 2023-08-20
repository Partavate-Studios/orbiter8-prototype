pragma solidity >=0.5.0 <0.6.0;

import "../../../Tokens/PlanetTokens.sol";

library PlanetLibrary {

    /**************************************
    *
    * MODELS
    *
    ***************************************/

    uint16 public constant costPerHold = 250;

    // Structures
    struct Planet {
        string name;
        uint256 star;
        uint8 size;
        uint8 class;
        uint8 rings;
        uint8 orbitSpeed;
    }
    struct Station {
        string name;
        uint8 size;
        //ship yards: modify ship
        PortOfTrade port; //port of trade: buy/sell goods
        //transport hub: transfer humans
    }
    //todo: these should become a libraries
    struct PortOfTrade {
        SupplyOfGood equipment;
        SupplyOfGood fuel;
        SupplyOfGood organics;
        uint256 lastTradeTime;
    }
    struct SupplyOfGood {
        int16 inventory;        //  100 = selling | -100 = buying
        int16 supplyCap; // -2000 = always needing more | 2000 = always producing more
    }
    struct TransportHub {
        SupplyOfGood people; // related to planet's population needs
    }
    struct ShipYard {
        uint8 size; // the larger they are, the more services they offer
    }

    struct PlanetStorage {
        address planetTokensAddress;
        Planet[] planets;
        mapping (uint256 => Station) stations;
        mapping (uint256 => TransportHub) hubs;
        mapping (uint256 => PortOfTrade) ports;
        mapping (uint256 => ShipYard) yards;
    }

    // Modifiers
    modifier mustBeUnclaimed (
        PlanetStorage storage self,
        uint256 planetId
    ) {
        require(PlanetTokens(self.planetTokensAddress).ownerOf(planetId) == address(this), 'Must be unclaimed planet.');
        _;
    }
    modifier mustOwnPlanet (
        PlanetStorage storage self,
        uint256 planetId
    ) {
        require(isMyPlanet(self, planetId), 'Must be your planet.');
        _;
    }
    modifier stationMustNotExist (
        PlanetStorage storage self,
        uint256 planetId
    ) {
        require(!stationExists(self, planetId), 'Station already exists.');
        _;
    }
    modifier stationMustExist (
        PlanetStorage storage self,
        uint256 planetId
    ) {
        require(stationExists(self, planetId), 'Station must exist.');
        _;
    }
    modifier stationMustNotHavePort (
        PlanetStorage storage self,
        uint256 planetId
    ) {
        require(stationHasPort(self, planetId) == false, 'Port must not exist.');
        _;
    }
    modifier stationMustHavePort (
        PlanetStorage storage self,
        uint256 planetId
    ) {
        require(stationHasPort(self, planetId), 'Port must not exist.');
        _;
    }

    /**************************************
    *
    * VIEWS
    *
    ***************************************/

    function isMyPlanet(
        PlanetStorage storage self,
        uint256 planetId
    ) internal view returns (bool) {
        if (PlanetTokens(self.planetTokensAddress).ownerOf(planetId) == msg.sender) return true;
        return false;
    }

    function stationExists(
        PlanetStorage storage self,
        uint256 planetId
    ) internal view returns (bool) {
        if (self.stations[planetId].size > 0) return true;
        return false;
    }
    function stationHasHub(
        PlanetStorage storage self,
        uint256 planetId
    ) internal view returns (bool) {
        if (self.hubs[planetId].people.supplyCap != 0) return true;
        return false;
    }
    function stationHasPort(
        PlanetStorage storage self,
        uint256 planetId
    ) internal view returns (bool) {
        if (self.ports[planetId].equipment.supplyCap != 0) return true;
        if (self.ports[planetId].fuel.supplyCap != 0) return true;
        if (self.ports[planetId].organics.supplyCap != 0) return true;
        return false;
    }
    function stationHasYard(
        PlanetStorage storage self,
        uint256 planetId
    ) internal view returns (bool) {
        if (self.yards[planetId].size > 0) return true;
        return false;
    }

    function getOwner(
        PlanetStorage storage self,
        uint256 planetId
    ) internal view returns (
        address
    ) {
        return PlanetTokens(self.planetTokensAddress).ownerOf(planetId);
    }

    function getPlanet(
        PlanetStorage storage self,
        uint256 planetId
    ) internal view returns (
        string memory,
        uint256,
        uint8[4] memory,
        address,
        bool
    ) {
        address owner = PlanetTokens(self.planetTokensAddress).ownerOf(planetId);
        if (owner == address(this)) {
            owner = address(0);
        }
        uint8[4] memory attribs = [
            self.planets[planetId].size,
            self.planets[planetId].class,
            self.planets[planetId].rings,
            self.planets[planetId].orbitSpeed
        ];

        return (
            self.planets[planetId].name,
            self.planets[planetId].star,
            attribs,
            owner,
            stationExists(self, planetId)
        );
    }

    function calculateInventoryCategoryGrowth (
        int256 secondsSinceLastTrade,
        int16 supplyCap,
        int16 inventory
    ) internal pure returns (
        int16
    ) {
        int256 secondsPerItemSpawn = 120;
        int16 itemsToSpawn = supplyCap - inventory; //could be negative
        int256 secondsUntilFull = int256(abs(itemsToSpawn) * secondsPerItemSpawn);

        if ((itemsToSpawn == 0) || (secondsSinceLastTrade >= secondsUntilFull)) {
            return supplyCap;
        }
        //from here we know that the time since the last trade does not amount to
        //enough time to produce enough inventory to hit the supply cap
        int16 itemsSpawned = int16(
          (secondsSinceLastTrade / secondsPerItemSpawn) * //absolute number of items times
          int256(supplyCap / abs(supplyCap))              //retain the sign of supplyCap
        );
        return inventory + itemsSpawned;
    }

    function getInventoryWithGrowth (
        PlanetStorage storage self,
        uint256 planetId
    ) internal view returns (
        int16[3] memory
    ) {
        PortOfTrade memory port = self.ports[planetId];
        require(port.lastTradeTime <= block.timestamp, "invalid timestamp");
        int256 secondsSinceLastTrade = int256(block.timestamp - port.lastTradeTime);

        return [
            calculateInventoryCategoryGrowth(secondsSinceLastTrade, port.equipment.supplyCap, port.equipment.inventory),
            calculateInventoryCategoryGrowth(secondsSinceLastTrade, port.fuel.supplyCap, port.fuel.inventory),
            calculateInventoryCategoryGrowth(secondsSinceLastTrade, port.organics.supplyCap, port.organics.inventory)
        ];

    }

    function getStation (
        PlanetStorage storage self,
        uint256 planetId
    ) external view stationMustExist(self, planetId) returns (
        string memory,
        uint8,
        int16[3] memory,
        uint16[4] memory
    ) {
        (uint16 equipmentPrice, uint16 fuelPrice, uint16 organicsPrice) = getPortPrices(self, planetId);
        return (
            self.stations[planetId].name,
            self.stations[planetId].size,
            getInventoryWithGrowth(self, planetId),
            //[
            //    self.ports[planetId].equipment.inventory,
            //    self.ports[planetId].fuel.inventory,
            //    self.ports[planetId].organics.inventory
            //],
            [
                equipmentPrice,
                fuelPrice,
                organicsPrice,
                costPerHold
            ]
        );
    }

    function getPlanetTokenizer(PlanetStorage storage self) internal view returns(address) {
        return self.planetTokensAddress;
    }

    function getPlanetLocation(
        PlanetStorage storage self,
        uint256 id
    ) internal view returns (
        uint256
    ) {
        return (
            self.planets[id].star
        );
    }

    /**************************************
    *
    * CONTROLS
    *
    ***************************************/

    function setPlanetTokenizer(
        PlanetStorage storage self,
        address tokenAddress
    ) public {
        self.planetTokensAddress = tokenAddress;
    }

    function createStation(
        PlanetStorage storage self,
        uint256 planetId,
        string memory name,
        uint8 size
    ) internal stationMustNotExist(self, planetId) { //todo: add planetMustExist
        self.stations[planetId].name = name;
        self.stations[planetId].size = size;
    }

    function calculatePrice(
        int16 inventory,
        int16 supplyCap,
        int16 foundationPrice,
        int16 liquidPrice
    ) internal pure returns (uint16) {
        require(supplyCap != 0, "invalid supply cap");
        int16 playerBias = liquidPrice / 10;
        //port is selling
        if (supplyCap > 0) {
            return uint16(liquidPrice * abs(supplyCap - inventory) / abs(supplyCap) + foundationPrice - playerBias);
        }
        return uint16(liquidPrice * abs(inventory) / abs(supplyCap) + foundationPrice + playerBias);
    }

    function getPortPrices (
        PlanetStorage storage self,
        uint256 planetId
    ) internal view stationMustExist(self, planetId) stationMustHavePort(self, planetId) returns (
        uint16,
        uint16,
        uint16
    ) {
        int16[3] memory inventory = getInventoryWithGrowth(self, planetId);
        uint16 equipmentPrice =  calculatePrice(
            inventory[0],
            self.ports[planetId].equipment.supplyCap,
            145,
            50
        );
        uint16 fuelPrice = calculatePrice(
            inventory[1],
            self.ports[planetId].fuel.supplyCap,
            65,
            50
        );
        uint16 organicsPrice = calculatePrice(
            inventory[2],
            self.ports[planetId].organics.supplyCap,
            90,
            50
        );
        return(equipmentPrice, fuelPrice, organicsPrice);
    }

    function getTradeValue (
        PlanetStorage storage self,
        uint256 planetId,
        int16 equipment,
        int16 fuel,
        int16 organics
    ) internal view stationMustExist(self, planetId) stationMustHavePort(self, planetId) returns (int256) {
        (uint16 equipmentPrice, uint16 fuelPrice, uint16 organicsPrice) = getPortPrices(self, planetId);
        return int256(
            (   int256(equipmentPrice) * int256(equipment) +
                int256(fuelPrice) * int256(fuel) +
                int256(organicsPrice) * int256(organics)
            ) * -1
        );
    }

    function updateInventoryWithGrowth(
        PlanetStorage storage self,
        uint256 planetId
    ) internal {
        int16[3] memory newInventory = getInventoryWithGrowth(self, planetId);
        self.ports[planetId].equipment.inventory = newInventory[0];
        self.ports[planetId].fuel.inventory = newInventory[1];
        self.ports[planetId].organics.inventory = newInventory[2];
        self.ports[planetId].lastTradeTime = block.timestamp;
    }


    function modifyPortInventory(
        PlanetStorage storage self,
        uint256 planetId,
        int16 equipment,
        int16 fuel,
        int16 organics
    ) internal stationMustExist(self, planetId) stationMustHavePort(self, planetId) returns (int256) {
        //record any newly generated inventory
        updateInventoryWithGrowth(self, planetId);
        //required stock exists
        require(abs(self.ports[planetId].equipment.inventory) >= abs(equipment), 'Inadequate equipment');
        require(abs(self.ports[planetId].fuel.inventory) >= abs(fuel), 'Inadequate fuel');
        require(abs(self.ports[planetId].organics.inventory) >= abs(organics), 'Inadequate organics');
        //both values have the same sign
        require(int256(self.ports[planetId].equipment.inventory) * int256(equipment) >= 0, 'Equipment clash');
        require(int256(self.ports[planetId].fuel.inventory) * int256(fuel) >= 0, 'Fuel clash');
        require(int256(self.ports[planetId].organics.inventory) * int256(organics) >= 0, 'Organics clash');

        int256 tradeValue = getTradeValue(self, planetId, equipment, fuel, organics);

        self.ports[planetId].equipment.inventory -= equipment;
        self.ports[planetId].fuel.inventory -= fuel;
        self.ports[planetId].organics.inventory -= organics;


        return tradeValue;
    }

    //todo: this should be in a library and I should be using safe math everywhere
    function abs(int16 x) private pure returns (int) {
        return x >= 0 ? x : -x;
    }

    function addPortToStation(
        PlanetStorage storage self,
        uint256 planetId
    ) internal stationMustExist(self, planetId) stationMustNotHavePort(self, planetId) {
        int16 equipment;
        int16 fuel;
        int16 organics;
        if (self.planets[planetId].class == 0) { //Terrestrial
          equipment = 500;  //S
          fuel = -1750;      // B
          organics = 1500;   //S
        } else if (self.planets[planetId].class == 1) { //Rocky
          equipment =  1000;//S
          fuel = -2000;     // B
          organics = -1000; // B
        } else if (self.planets[planetId].class == 2) { //Oceanic
          equipment = -1000;// B
          fuel = 1000;      //S
          organics = 2000;  //S
        } else if (self.planets[planetId].class == 3) { //Desert
          equipment = 750;  //S
          fuel = 2000;      //S
          organics = -1000; // B
        } else if (self.planets[planetId].class == 4) { //Ice
          equipment = 500;  //S
          fuel = -1000;     // B
          organics = 1000;  //S
        } else if (self.planets[planetId].class == 5) { //Volcanic
          equipment = -500; // B
          fuel = 2000;      //S
          organics = 500;   // B
        } else if (self.planets[planetId].class == 6) { //Gaseous
          equipment = -500; // B
          fuel = 2000;      //S
          organics = -500;  // B
        } else if (self.planets[planetId].class == 7) { //Ferrous
          equipment = 2000; //S
          fuel = -500;      // B
          organics = -2000; // B
        } else if (self.planets[planetId].class == 8) { //Lava
          equipment = -500; // B
          fuel = 1500;      //S
          organics = 500;   //S
        } else if (self.planets[planetId].class == 9) { //Swamp
          equipment = -1500;// B
          fuel = -1000;     // B
          organics = 2000;  //S
        }
        //e ssbssbbsbb 5 5
        //f bbssbssbss 6 4
        //o sbsbsbbbss 5 5

        self.ports[planetId].equipment.supplyCap = equipment;
        self.ports[planetId].fuel.supplyCap = fuel;
        self.ports[planetId].organics.supplyCap = organics;

        self.ports[planetId].equipment.inventory = equipment;
        self.ports[planetId].fuel.inventory = fuel;
        self.ports[planetId].organics.inventory = organics;

        //self.ports[planetId].lastTradeTime = block.timestamp;
    }

    function renameStation (
        PlanetStorage storage self,
        uint256 _planetId,
        string memory _newName
    ) internal stationMustExist(self, _planetId) {
        self.stations[_planetId].name = _newName;
    }

    function createRandomPlanet(
        PlanetStorage storage self,
        uint256 star,
        uint256 dna,
        uint8   distance
    ) internal returns (
        uint256
    ) {
        // todo: be smarter about what plants are likely at what distance
        uint8 size = uint8(dna % (20 + distance * 2)) + 1;
        uint8 class = uint8((dna / 50) % 10);
        uint8 rings = uint8((dna / 100) % 10);
        uint8 ringchance = uint8((dna / 1000) % 10);
        rings = (ringchance > 2) ? 0: rings;
        uint8 orbitSpeed = uint8(255 - ((dna / 1000) % 150)) / (distance + 1);
        return createPlanet(
            self,
            'Unexplored Planet',
            star,
            size,
            class,
            rings,
            orbitSpeed
        );
    }

    function createPlanet(
        PlanetStorage storage self,
        string memory name,
        uint256 star,
        uint8 size,
        uint8 class,
        uint8 rings,
        uint8 orbitSpeed
    ) internal returns (
        uint256
    ) {
        uint256 planetId = (self.planets.push(
            Planet(
                name,
                star,
                size,
                class,
                rings,
                orbitSpeed
            )
        )) - 1;
        PlanetTokens(self.planetTokensAddress).mintPlanet(planetId);

        return planetId;
    }

    function claimPlanet(
        PlanetStorage storage self,
        uint256 planetId
    ) internal mustBeUnclaimed(self, planetId) {
        PlanetTokens(self.planetTokensAddress).awardPlanet(msg.sender, planetId);
    }

    function renamePlanet(
        PlanetStorage storage self,
        uint256 planetId,
        string memory _newName
    ) internal mustOwnPlanet(self, planetId) {
        self.planets[planetId].name = _newName;
    }
}