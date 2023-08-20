
var AvatarControls = artifacts.require("./Orbiter8/Avatar/AvatarControls.sol");
var Orbiter8 = artifacts.require("./Orbiter8/Orbiter8.sol");

module.exports = async function(deployer) {

    Orbiter8.deployed().then(function(instance) {
      instance.makeSolarSystem();
    });

};
