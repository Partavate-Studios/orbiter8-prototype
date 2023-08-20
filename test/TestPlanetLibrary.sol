pragma solidity >=0.5.0 <0.6.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Orbiter8/StarSystems/SystemObjects/PlanetLibrary.sol";

contract TestPlanetLibrary {
  using PlanetLibrary for PlanetLibrary.PlanetStorage;

  PlanetLibrary.PlanetStorage public planetStore;

  event TestEvent(bool indexed result, string message);

  constructor() public {
  }

  function testPlanet() public returns (uint16) {
    uint planetId;

    planetId = addFreshPlanet('first test', 1);
    Assert.equal(planetId, 0, "Planet ID should be zero");

    (uint16 equipmentPrice, uint16 fuelPrice, uint16 organicsPrice) = planetStore.getPortPrices(planetId);

    uint16 zero = 0;

    Assert.notEqual(uint(equipmentPrice), uint(zero), "Equipment should not be zero");
    emit TestEvent(equipmentPrice == zero, "Equipment price greater than zero.");
    emit TestEvent(fuelPrice > zero, "Fuel price greater than zero.");
    emit TestEvent(organicsPrice > zero, "Organics price greater than zero.");

    int16[3] memory inventory = planetStore.getInventoryWithGrowth(planetId);

    Assert.notEqual(0, int(inventory[0]), "Equipment count should not be zero.");
    Assert.notEqual(0, int(inventory[1]), "Fuel count should not be zero.");
    Assert.notEqual(0, int(inventory[2]), "Organics count not zero.");

    int equipmentSign = int(inventory[0]) / abs(int(inventory[0]));
    int fuelSign = int(inventory[1]) / abs(int(inventory[1]));
    int organicsSign = int(inventory[2]) / abs(int(inventory[2]));

    int256 tradeValue;

    tradeValue = planetStore.modifyPortInventory(planetId, 0, 0, 0);
    Assert.equal(tradeValue, 0, "Trade value for zero should be zero");

    tradeValue = planetStore.modifyPortInventory(planetId, int16(equipmentSign), 0, 0);
    Assert.equal(tradeValue, int(equipmentPrice) * equipmentSign * -1, "Trade value should be worth 1 equipment");

    tradeValue = planetStore.modifyPortInventory(planetId, 0, int16(fuelSign), 0);
    Assert.equal(tradeValue, int(fuelPrice) * fuelSign * -1, "Trade value should be worth 1 fuel");

    tradeValue = planetStore.modifyPortInventory(planetId, 0, 0, int16(organicsSign));
    Assert.equal(tradeValue, int(organicsPrice) * organicsSign * -1, "Trade value should be worth 1 organic");


    inventory = planetStore.getInventoryWithGrowth(planetId);
    (equipmentPrice, fuelPrice, organicsPrice) = planetStore.getPortPrices(planetId);

    tradeValue = planetStore.modifyPortInventory(planetId, inventory[0], 0, 0);
    Assert.equal(tradeValue, int(equipmentPrice) * int(inventory[0]) * -1, "Trade value should be worth all equipment");

    tradeValue = planetStore.modifyPortInventory(planetId, 0, inventory[1], 0);
    Assert.equal(tradeValue, int(fuelPrice) * int(inventory[1]) * -1, "Trade value should be worth all fuel");

    tradeValue = planetStore.modifyPortInventory(planetId, 0, 0, inventory[2]);
    Assert.equal(tradeValue, int(organicsPrice) * int(inventory[2]) * -1, "Trade value should be worth all organic");


    inventory = planetStore.getInventoryWithGrowth(planetId);

    Assert.equal(0, int(inventory[0]), "Equipment count should be zero.");
    Assert.equal(0, int(inventory[1]), "Fuel count should be zero.");
    Assert.equal(0, int(inventory[2]), "Organics not zero.");


    planetId = addFreshPlanet('second test', 0);
    Assert.equal(planetId, 1, "Planet ID should be 1");
    testFullTrade(planetId);

    for (uint8 i=0; i<10; i++) {
      planetId = addFreshPlanet('test', i);
      testFullTrade(planetId);
    }

  }

  function testFullTrade(uint planetId) internal {
    int16[3] memory inventory = planetStore.getInventoryWithGrowth(planetId);
    (uint16 equipmentPrice, uint16 fuelPrice, uint16 organicsPrice) = planetStore.getPortPrices(planetId);

    int256 tradeValue = planetStore.modifyPortInventory(planetId, inventory[0], inventory[1], inventory[2]);
    Assert.equal(
      tradeValue,
      int(equipmentPrice) * int(inventory[0]) * -1 +
      int(fuelPrice) * int(inventory[1]) * -1 +
      int(organicsPrice) * int(inventory[2]) * -1,
      "Trade value should be worth all goods combined."
    );
  }

  function addFreshPlanet(string memory name, uint8 class) internal returns (uint) {
    uint planetId = planetStore.planets.push(
        PlanetLibrary.Planet(
            name,
            0, //star
            1, //size
            class,
            1, //rings
            1  //speed
        )
    ) - 1;

    planetStore.createStation(
        planetId,
        name,
        1
    );

    planetStore.addPortToStation(planetId);

    return planetId;
  }


  //todo: this should be in a library and I should be using safe math everywhere
  function abs(int x) private pure returns (int) {
    return x >= 0 ? x : -x;
  }

}
