
var AvatarControls = artifacts.require("./Orbiter8/Avatar/AvatarControls.sol");

module.exports = async function(deployer) {

    AvatarControls.deployed().then(function(instance) {
        return instance.createAvatar('The Federation');
    });

};
