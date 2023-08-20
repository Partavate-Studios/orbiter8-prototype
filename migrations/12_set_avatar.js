
var AvatarControls = artifacts.require("./Orbiter8/Avatar/AvatarControls.sol");
var ShipTokens = artifacts.require("./Tokens/ShipTokens.sol");
var PlanetTokens = artifacts.require("./Tokens/PlanetTokens.sol");
var Orbiter8 = artifacts.require("./Orbiter8/Orbiter8.sol");
var Credits = artifacts.require("./Tokens/Credits.sol");

module.exports = async function(deployer) {

  Orbiter8.deployed().then(function(instance) {
    instance.setAvatarControls(AvatarControls.address)
  })

};
