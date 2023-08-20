var PresetLibrary = artifacts.require("./Orbiter8/StarSystems/PresetLibrary.sol");

module.exports = async function(deployer) {

  //Stars
  deployer.deploy(PresetLibrary);
};
