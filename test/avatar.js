var Avatar = artifacts.require("AvatarControls");
var avatarName = "Todd";

contract('Avatar', function(accounts) {

    it("two avatars should exist", function() {
        return Avatar.deployed().then(function(Avatar) {
            return Avatar.getAvatarCount();
        }).then(function(count) {
            assert.equal(count, 2, "Avatar count not one");
        });
    });
    it("should create a Avatar", function() {
        return Avatar.deployed().then(function(Avatar) {
            return Avatar.createAvatar(avatarName, { from: accounts[3] });
        });
    });
    it("Three avatars should exist", function() {
        return Avatar.deployed().then(function(Avatar) {
            return Avatar.getAvatarCount();
        }).then(function(count) {
            assert.equal(count, 3, "Avatar count not two");
        });
    });
    it("Avatar id should be 2", function() {
        return Avatar.deployed().then(function(Avatar) {
            _avatar = Avatar.getAvatarIdByAddress(accounts[3]);
            return _avatar;
        }).then(function(id) {
            assert.equal(id, 2, "Avatar id incorrect: " + id);
        });
    });
    it("Avatar name should be " + avatarName, function() {
        return Avatar.deployed().then(function(Avatar) {
            return Avatar.getMyAvatarName({ from: accounts[3] });
        }).then(function(name) {
            assert.equal(name, avatarName, "Avatar name incorrect");
        });
    });

});