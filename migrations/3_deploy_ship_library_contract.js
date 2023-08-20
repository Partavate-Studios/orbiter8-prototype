
var ShipLibrary = artifacts.require("./Orbiter8/StarSystems/SystemObjects/ShipLibrary.sol");

module.exports = async function(deployer) {

  //Stars
  deployer.deploy(ShipLibrary);
};
