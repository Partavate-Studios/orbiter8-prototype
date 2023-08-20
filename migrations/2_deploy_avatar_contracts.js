
var AvatarLibrary = artifacts.require("./Orbiter8/Avatar/AvatarLibrary.sol");
var AvatarControls = artifacts.require("./Orbiter8/Avatar/AvatarControls.sol");


module.exports = async function(deployer) {

  //Avatar
  deployer.deploy(AvatarLibrary);
  deployer.link(AvatarLibrary, AvatarControls);
  deployer.deploy(AvatarControls);
};
