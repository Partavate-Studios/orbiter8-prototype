var ShipLibrary = artifacts.require("./Orbiter8/StarSystems/SystemObjects/ShipLibrary.sol");
var PlanetLibrary = artifacts.require("./Orbiter8/StarSystems/SystemObjects/PlanetLibrary.sol");
var MoonLibrary = artifacts.require("./Orbiter8/StarSystems/SystemObjects/MoonLibrary.sol");
var PresetLibrary = artifacts.require("./Orbiter8/StarSystems/PresetLibrary.sol");
var StarSystemLibrary = artifacts.require("./Orbiter8/StarSystems/StarSystemLibrary.sol");
var Orbiter8 = artifacts.require("./Orbiter8/Orbiter8.sol");


module.exports = async function(deployer) {

  deployer.link(ShipLibrary,    [StarSystemLibrary, Orbiter8]);
  deployer.link(PlanetLibrary,  [StarSystemLibrary, Orbiter8]);
  deployer.link(MoonLibrary,    [StarSystemLibrary, Orbiter8]);
  deployer.link(PresetLibrary,  [StarSystemLibrary, Orbiter8]);

  deployer.deploy(StarSystemLibrary);

};
