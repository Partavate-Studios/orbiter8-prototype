var StarSystemLibrary = artifacts.require("./Orbiter8/StarSystems/StarSystemLibrary.sol");
var Orbiter8 = artifacts.require("./Orbiter8/Orbiter8.sol");

module.exports = async function(deployer) {

  deployer.link(StarSystemLibrary, Orbiter8);
  deployer.deploy(Orbiter8);

};
