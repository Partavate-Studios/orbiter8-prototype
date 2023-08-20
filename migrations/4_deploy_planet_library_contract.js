
var PlanetLibrary = artifacts.require("./Orbiter8/StarSystems/SystemObjects/PlanetLibrary.sol");

module.exports = async function(deployer) {

  //Stars
  deployer.deploy(PlanetLibrary);
};
