
var MoonLibrary = artifacts.require("./Orbiter8/StarSystems/SystemObjects/MoonLibrary.sol");

module.exports = async function(deployer) {

  //Stars
  deployer.deploy(MoonLibrary);
};
