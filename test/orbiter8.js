var O8 = artifacts.require("Orbiter8");

contract('O8', function(accounts) {


    it("14 systems should exist", function() {
        return O8.deployed().then(function(System) {
            //System.genesis();
            //System.makeSolarSystem();
            return System.getSystemCount();
        }).then(function(count) {
            assert.equal(count, 14, "System count not 14: " + count);
        });
    });

    it("Create Ship", function() {
        return O8.deployed().then(function(System) {
            return System.launchShip("Test Ship");
        });
    });

    it("14 systems should exist", function() {
        return O8.deployed().then(function(System) {
            return System.getSystemCount();
        }).then(function(count) {
            assert.equal(count, 14, "System count " + count + " not 14");
        });
    });
    it("Ship ID should be 1", function() {
        return O8.deployed().then(function(System) {
            return System.getMyShipId()
        }).then(function(id) {
            assert.equal(id, 1, "Ship id is " + id + " not 1");
        });
    });
    it("System id should be 1", function() {
        return O8.deployed().then(function(System) {
            _System = System.getMyShipLocation();
            return _System;
        }).then(function(id) {
            assert.equal(id, 1, "System id incorrect");
        });
    });


    //This test needs to be improved
    it("Check Mercury", function() {
        return O8.deployed().then(function(System) {
            _System = System.getLocalPlanet(0);
            return _System;
        }).then(function(id) {
            assert.equal(id[0], 'Mercury', "Check Mercury");
        });
    });

    it("Check Moon", function() {
        return O8.deployed().then(function(System) {
            moon = System.getMoon(3, 1);
            return moon;
        }).then(function(moon) {
            assert.equal(moon[0], 'Luna', "Check Moon");
        });
    });

    //Need to check ports

    it("Trade At Port", function() {
        return O8.deployed().then(function(System) {
            return System.tradeAtPort(9, 0, 0 , -1); //pluto
        });
    });

    it("Trade At Mars Port", function() {
        return O8.deployed().then(function(System) {
            return System.tradeAtPort(4, 0, -1 , 0); //mars
        });
    });

    it("Trade At Venus Port", function() {
        return O8.deployed().then(function(System) {
            return System.tradeAtPort(2, -1, 0 , 0); //venus
        });
    });

//    it("Trade At Earth Port", function() {
//        return O8.deployed().then(function(System) {
//            return System.tradeAtPort(3, 1, 1 , 1); //earth
//        });
//    });

    //This test needs to be improved
//    it("Check Earth", function() {
//        return O8.deployed().then(function(System) {
//            _System = System.getLocalPlanet(2);
//            return _System;
//        }).then(function(id) {
//            assert.equal(id[0], 'Earth', "Check Earth");
//        });
//    });

    it("should visit a System", function() {
        return O8.deployed().then(function(System) {
            return System.moveToSystem("2");
        });
    });


    it("claim", function() {
        return O8.deployed().then(function(System) {
            return System.claimPlanet(10, 'New Planet');
        }).then(function() {
        });
    });

    it("More than 14 systems should exist", function() {
        return O8.deployed().then(function(System) {
            return System.getSystemCount();
        }).then(function(count) {
            assert.isAbove(parseInt(count), 14, "System count " + count + " instead of greater than 14");
        });
    });
    it("System id should be 2", function() {
        return O8.deployed().then(function(System) {
            _System = System.getMyShipLocation();
            return _System;
        }).then(function(id) {
            assert.equal(id, 2, "System id incorrect");
        });
    });

    it("Test player system data", function() {
        return O8.deployed().then(function(System) {
            return System.getPlayerSystemData()
        }).then(function(data) {
            assert.equal(data[1], "Star", "System name incorrect")
        });
    });

    it("Back to 1", function() {
        return O8.deployed().then(function(System) {
            return System.moveToSystem("1");
        });
    });

    it("Back to 2", function() {
        return O8.deployed().then(function(System) {
            return System.moveToSystem("2");
        });
    });

});