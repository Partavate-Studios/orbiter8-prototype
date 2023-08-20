pragma solidity >=0.5.0 <0.6.0;

import './SystemObjects/PlanetLibrary.sol';
import './SystemObjects/MoonLibrary.sol';
import './SystemObjects/ShipLibrary.sol';
import './Avatar/AvatarLibrary.sol';
import '../../libraries/HelperLibrary.sol';
import './SystemObjects/presets/PresetLibrary.sol';
import '../../Tokens/Credits.sol';

library StarSystemLibrary {

    using PlanetLibrary for PlanetLibrary.PlanetStorage;
    using PlanetLibrary for PlanetLibrary.Planet;

    using MoonLibrary for MoonLibrary.MoonStorage;
    using MoonLibrary for MoonLibrary.Moon;

    using ShipLibrary for ShipLibrary.ShipStorage;
    using ShipLibrary for ShipLibrary.Ship;

    using AvatarLibrary for AvatarLibrary.Avatar;
    using AvatarLibrary for AvatarLibrary.AvatarStorage;

    using HelperLibrary for HelperLibrary.Helper;


    struct StarSystem {
        string name;
        uint8 starSize;
        uint256 birthTime;
        address discoveredBy;
        uint256[12] neighbors;
        uint256[14] planets;
        uint256[30] shipLog;
        uint256 visitorIndex;
    }
    struct Galaxy {

        StarSystem[] systems;
        mapping(uint => bool) wasCreated;
        mapping(uint => bool) wasVisited;
        HelperLibrary.Helper helper;

        address creditTokenizerAddress;

        //storage
        AvatarLibrary.AvatarStorage avatars; //all avatars
        PlanetLibrary.PlanetStorage planets; //all planets
        MoonLibrary.MoonStorage moons;       //all moons
        ShipLibrary.ShipStorage ships;       //all ships
    }


    /** connection to tokens contract for tracking credits */
    function setCreditTokenizer(
        Galaxy storage galaxy,
        address tokenAddress)
    public {
        galaxy.creditTokenizerAddress = tokenAddress;
    }
    function getCreditTokenizer(Galaxy storage galaxy) internal view returns(address) {
        return galaxy.creditTokenizerAddress;
    }
    function balanceOf(Galaxy storage galaxy, address player) internal view returns (uint256) {
        return Credits(galaxy.creditTokenizerAddress).balanceOf(player);
    }
    function awardCredits(Galaxy storage galaxy, address player, uint256 amount) internal {
        return Credits(galaxy.creditTokenizerAddress).awardCredits(player, amount);
    }
    function spendCredits(Galaxy storage galaxy, address player, uint256 amount) internal {
        return Credits(galaxy.creditTokenizerAddress).spendCredits(player, amount);
    }

    /** PLANET */

    /** connection to tokens contract for tracking planets */
    function setPlanetTokenizer(
        Galaxy storage galaxy,
        address tokenAddress)
    public {
        galaxy.planets.setPlanetTokenizer(tokenAddress);
    }
    function getPlanetTokenizer(Galaxy storage galaxy) internal view returns(address) {
        //return galaxy.planets.getplanetTokens.owner();
        return galaxy.planets.getPlanetTokenizer();
    }

    function getPlanet(
        Galaxy storage galaxy,
        uint256 planetId
    ) internal view returns (
        string memory,
        uint256,
        uint8[4] memory,
        address,
        bool[8] memory,
        bool
    ) {
        (
            string memory name,
            uint256 sun,
            uint8[4] memory attributes,
            address owner,
            bool hasPort
        ) = galaxy.planets.getPlanet(planetId);

        bool[8] memory hasMoons;
        hasMoons = galaxy.moons.getHasMoons(planetId);

        return (
            name,
            sun,
            attributes,
            owner,
            hasMoons,
            hasPort
        );
    }

    function buildStation (
        Galaxy storage galaxy,
        uint256 planetId,
        string memory stationName
    ) public {
        // require ownership
        require(galaxy.planets.isMyPlanet(planetId),'Must Own Planet');

        galaxy.planets.createStation(
            planetId,
            stationName,
            1
        );
        galaxy.planets.addPortToStation(planetId);
        spendCredits(galaxy, msg.sender, 10000);
    }

    function getLocalPlanet(
        Galaxy storage galaxy,
        uint256 orbitalId
    ) internal view returns (
        string memory,
        uint256,
        uint8[4] memory,
        address,
        bool[8] memory,
        bool
    ) {
        uint256 currentSystemId = getMyShipLocation(galaxy);
        uint256 planetId = galaxy.systems[currentSystemId].planets[orbitalId];
        return getPlanet(galaxy, planetId);
    }

    function planetInSystem(
        Galaxy storage galaxy,
        uint256 planetId
    ) internal view returns (
        bool
    ) {
        uint256 currentSystemId = getMyShipLocation(galaxy);
        for (uint i = 0; i < galaxy.systems[currentSystemId].planets.length; i++) {
            if (galaxy.systems[currentSystemId].planets[i] == planetId) {
                return true;
            }
        }
        return false;
    }

    function claimPlanet(
        Galaxy storage galaxy,
        uint256 planetId,
        string memory planetName
    ) internal {
        require(planetInSystem(galaxy, planetId), "Must be in system.");
        galaxy.planets.claimPlanet(planetId);
        galaxy.planets.renamePlanet(planetId, planetName);
        //perhaps this belongs in the calling method?
        galaxy.ships.setMyShipOrbit(
            planetId
        );
    }

    function renamePlanet(
        Galaxy storage galaxy,
        uint256 planetId,
        string memory planetName
    ) internal {
        galaxy.planets.renamePlanet(planetId, planetName);
        galaxy.ships.setMyShipOrbit(
            planetId
        );
    }

    /** MOON */

    function getMoon(
        Galaxy storage galaxy,
        uint256 planetId,
        uint8 moonId
    ) internal view returns (
        string memory,
        uint8,
        uint8,
        uint8
    ) {
        return galaxy.moons.getMoon(planetId, moonId);
    }

    function renameMoon(
        Galaxy storage galaxy,
        uint256 planetId,
        uint8 moonId,
        string memory moonName
    ) internal {
        galaxy.moons.renameMoon(planetId, moonId, moonName);
        galaxy.ships.setMyShipOrbit(
            planetId
        );
    }

    /** Space Station */

    function getStation(
        Galaxy storage galaxy,
        uint256 _planetId
    ) internal view returns (
        string memory,
        uint8,
        int16[3] memory,
        uint16[4] memory
    ) {
        return galaxy.planets.getStation(_planetId);
    }

    function renameStation(
        Galaxy storage galaxy,
        uint256 _planetId,
        string memory _stationName
    ) internal {
        galaxy.planets.renameStation(_planetId, _stationName);
    }

    function addPortToStation(
        Galaxy storage galaxy,
        uint256 _planetId
    ) public {
        galaxy.planets.addPortToStation(_planetId);
    }

    function tradeAtPort(
        Galaxy storage galaxy,
        uint256 _planetId,
        int16 _equipment,
        int16 _fuel,
        int16 _organics
    ) public returns (int) {
        galaxy.ships.modifyMyShipCargo(_equipment, _fuel, _organics);
        int256 creditBalance = galaxy.planets.modifyPortInventory(_planetId, _equipment, _fuel, _organics);
        address portOwner = galaxy.planets.getOwner(_planetId);
        if (creditBalance > 0) {
          uint256 income = uint256(creditBalance);
          awardCredits(galaxy, msg.sender, income);
          if (portOwner != msg.sender) {
            awardCredits(galaxy, portOwner, uint256(income / 100));
          }
        }
        if (creditBalance < 0) {
          uint256 expense = uint256(creditBalance * -1);
          require (expense < balanceOf(galaxy, msg.sender), 'insufficient credits');
          spendCredits(galaxy, msg.sender, expense);
          if (portOwner != msg.sender) {
            awardCredits(galaxy, portOwner, uint256(expense / 100));
          }
        }

        galaxy.ships.setMyShipOrbit(
            _planetId
        );
        return creditBalance;
    }

    function addHoldsToShip(
        Galaxy storage galaxy,
        uint256 planetId,
        uint8 holds
    ) public {
        (,,,uint16[4] memory price) = galaxy.planets.getStation(planetId);
        uint256 expense = uint256(holds) * uint256(price[3]);
        galaxy.ships.addHolds(holds);
        require (expense < balanceOf(galaxy, msg.sender), 'insufficient credits');
        spendCredits(galaxy, msg.sender, expense);
    }

    /** SHIP */

    function setShipTokenizer(
        Galaxy storage galaxy,
        address tokenAddress)
    public {
        galaxy.ships.setShipTokenizer(tokenAddress);
    }
    function getShipTokenizer(Galaxy storage galaxy) internal view returns(address) {
        return galaxy.ships.getShipTokenizer();
    }

    function getMyShipLocation(Galaxy storage galaxy) internal view returns (uint256)  {
        return galaxy.ships.getMyShipLocation();
    }

    function getMyShip(
        Galaxy storage galaxy
    ) internal view returns (
        string memory, //name
        uint,          //star system
        uint,          //orbit
        uint8,         //cargo limit
        uint8,         //equipment
        uint8,         //fuel
        uint8          //organics
    )  {
        return galaxy.ships.getMyShip();
    }

    function getMyShipId(Galaxy storage galaxy) internal view returns (uint256)  {
        return galaxy.ships.getMyShipId();
    }

    function getShip(
        Galaxy storage galaxy,
        uint256 shipId
    ) external view returns (
        string memory,
        uint,
        uint,
        address
    ) {
        return galaxy.ships.getShip(shipId);
    }

    function renameMyShip(
        Galaxy storage galaxy,
        string memory _shipName
    ) internal {
        galaxy.ships.renameMyShip(_shipName);
    }

    function moveToSystem(Galaxy storage galaxy, uint256 destinationSystemId) internal {
        require(getMyShipLocation(galaxy) > 0, "Ship must already be launched.");
        require(_isCurrentNeighbor(galaxy, destinationSystemId) == true, "You can only move to neighboring star systems.");
        if (galaxy.wasVisited[destinationSystemId] == false) {
            populateStarSystem(
                galaxy,
                destinationSystemId,
                getMyShipLocation(galaxy)
            );
        }
        galaxy.ships.moveMyShip(destinationSystemId);
        recordNewVisit(galaxy, destinationSystemId, getMyShipId(galaxy));
    }

    function launchShip(Galaxy storage galaxy, string memory _shipName) internal {
        require(getMyShipId(galaxy) == 0, "Ship must be new.");
        require(galaxy.wasVisited[1], "You must first make the solar system");
        uint256 shipId = galaxy.ships.createMyShip(_shipName);
        recordNewVisit(galaxy, 1, shipId);
    }

    /** SYSTEM */

    function renameStar(Galaxy storage galaxy, string memory _newName) internal {
        uint256 currentSystemId = getMyShipLocation(galaxy);
        require((galaxy.systems[currentSystemId].discoveredBy == msg.sender), "Must have discovered star.");
        galaxy.systems[currentSystemId].name = _newName;
    }

    function getStarSystemCount(Galaxy memory galaxy) internal pure returns(uint256) {
        return galaxy.systems.length;
    }

    function getSystemData(Galaxy storage galaxy, uint256 systemId) internal view returns(
        uint256,            //id
        string memory,      //name
        uint8,              //starSize
        uint256,            //bithtime
        address,            //discoveredBy
        uint256[12] memory, //neighbors
        uint256[14] memory, //planets
        uint256[30] memory  //logs
    ) {
        require(galaxy.wasCreated[systemId] == true, "Sector does not exist.");
        StarSystem memory system = galaxy.systems[systemId];
        return(
            systemId,
            system.name,
            system.starSize,
            system.birthTime,
            system.discoveredBy,
            system.neighbors,
            system.planets,
            system.shipLog
        );
    }

    function getSystemName(Galaxy storage galaxy, uint256 systemId) internal view returns(
        string memory
    ) {
        require(galaxy.wasCreated[systemId] == true, "Sector does not exist.");
        if (galaxy.wasVisited[systemId]) {
            return galaxy.systems[systemId].name;
        }
        return 'Unexplored Star';
    }

    function recordNewVisit(Galaxy storage galaxy, uint256 systemId, uint256 shipId) internal {
        galaxy.systems[systemId].shipLog[galaxy.systems[systemId].visitorIndex] = shipId;
        galaxy.systems[systemId].visitorIndex = (galaxy.systems[systemId].visitorIndex + 1) % 30;
    }

    function genesis(Galaxy storage galaxy) internal {
        require(galaxy.systems.length == 0, "a galaxy already exists");

        //create the otherverse, the player spawning location
        uint256 otherverseId = _spawnStarSystem(galaxy);
        require(otherverseId == 0, "Otherverse should have been zero.");
        galaxy.systems[otherverseId].name = "Otherverse";

        //create a zero based planet in the otherverse
        uint256 planetId = galaxy.planets.createPlanet(
            'Nowhere',
            otherverseId,   //sun
            0,   //size
            0,   //class K, Desert Wasteland
            0,   //rings
            0    //orbital speed
        );
        require(planetId == 0, "Failed to burn planet zero.");

        uint256 shipId = galaxy.ships.createMyShip('Ghost Ship');
        require(shipId == 0, "Failed to burn space ship zero.");

        //create the solar system
        uint256 solId = _spawnStarSystem(galaxy);
        require(solId == 1, "Sol System should have been one.");
        galaxy.systems[solId].name = "Sol";

        //fill in the neighbors with new systems
        for (uint i = 0; i < galaxy.systems[solId].neighbors.length; i++) {
            if (galaxy.systems[solId].neighbors[i] == 0) {
                galaxy.systems[solId].neighbors[i] = _spawnStarSystem(galaxy);
            }
        }

        //create a link from otherverse into the solar system
        galaxy.systems[0].neighbors[0] = solId;
    }


    function _isCurrentNeighbor(Galaxy storage galaxy, uint256 destinationSystemId) internal view returns(bool){
        require (destinationSystemId != 0, "You can not travel back to the Otherverse");
        uint currentStarSystem = getMyShipLocation(galaxy);
        uint neighborCount = galaxy.systems[currentStarSystem].neighbors.length;

        //fill in the neighbors with   new systems
        for (uint i = 0; i < neighborCount; i++) {
            if (galaxy.systems[currentStarSystem].neighbors[i] == destinationSystemId) {
                return true;
            }
        }

        return false;
    }

    function _spawnStarSystem(Galaxy storage galaxy) internal returns(uint) {
        //every star system can have up to 12 reachable neighbors
        uint256[12] memory emptyNeighbors;
        uint256[14] memory emptyPlanets;
        uint256[30] memory emptyVisitors;

        uint256 systemId = (galaxy.systems.push(
            StarSystem(
                "Star",
                1,
                uint32(block.timestamp),
                address(0),
                emptyNeighbors,
                emptyPlanets,
                emptyVisitors,
                0
            )
        )) - 1;

        galaxy.wasCreated[systemId] = true;

        return systemId;
    }

    /**
     * used to build backlinks
     */
    function getNeighborCompliment(
        uint currentId,
        uint arrayLength
    ) internal pure returns(uint) {
        return (currentId + arrayLength / 2) % arrayLength;
    }

    /**
     * The first visit to a star system will populate it
     */
    function populateStarSystem(
        Galaxy storage galaxy,
        uint256 starSystemId,
        uint256 originSystemId
    ) internal {
        require(starSystemId > 1, "Populate should not run on system 1.");
        require(galaxy.wasCreated[starSystemId] == true, "Star System Does Not Exist");
        require(galaxy.wasVisited[starSystemId] == false, "Star System Already Visited");

        StarSystem storage newSystem = galaxy.systems[starSystemId];
        StarSystem memory originSystem = galaxy.systems[originSystemId];

        galaxy.systems[starSystemId].discoveredBy = msg.sender;

        uint8 connections = 0;
        uint8 neighborCount = uint8(originSystem.neighbors.length);

        uint rando = galaxy.helper.getRandom();

        //set random star size
        newSystem.starSize = uint8((rando % 6) + 1);

        // link back to visited sectors
        for (uint8 i = 0; i < neighborCount; i++) {
            if (originSystem.neighbors[i] == starSystemId) {
                if (((rando + i) % 8 > 0) || (connections < 2)) {
                    newSystem.neighbors[
                        getNeighborCompliment(i, neighborCount)
                    ] = originSystemId;
                }
            } else {
                if (((rando + i) % 3 == 0) && (originSystem.neighbors[i] != 0)) {
                    newSystem.neighbors[
                        getNeighborCompliment(i, neighborCount)
                    ] = originSystem.neighbors[i];
                    connections ++;
                } else if ((rando + i) % 6 == 0) {
                    uint randoSystemId = ((rando - i) % (starSystemId));
                    newSystem.neighbors[
                        getNeighborCompliment(i, neighborCount)
                    ] = randoSystemId;
                }
            }
        }

        // fill in the remaining neighbors with new systems
        for (uint8 i = 0; i < newSystem.neighbors.length; i++) {
            if (newSystem.neighbors[i] == 0) {
                if ((rando + i) % 2 == 0) {
                    newSystem.neighbors[i] = _spawnStarSystem(galaxy);
                }
            }
        }

        spawnPlanets(galaxy, newSystem, rando);

        galaxy.wasVisited[starSystemId] = true;
    }

    function spawnPlanets(Galaxy storage galaxy, StarSystem storage newSystem, uint256 rando) internal {
        //spawn planets
        uint8 orbitalCount = uint8(newSystem.planets.length);
        for (uint8 i = 0; i < orbitalCount; i++) {
            if (((rando * (i+2)) % 14) < (newSystem.starSize / 2 + 4)) {
                uint256 planetId = galaxy.planets.createRandomPlanet(
                    getMyShipLocation(galaxy),
                    rando * (i+11) - i,
                    uint8(i)
                );
                newSystem.planets[i] = planetId;
                //spawn moons
                for (uint8 j = 0; j < MoonLibrary.getMaxMoons(); j++) {
                    //todo: clean this up
                    if (((rando * (i+j+2)) % 25) < (3 + i/4)) {
                        galaxy.moons.createRandomMoon(
                            planetId,
                            j,
                            rando * (j+7) - j
                        );
                    }
                }
            }
        }
    }

    /**
     * The first star system created is modled after our own.
     */
    function makeSolarSystem(Galaxy storage galaxy) internal {
        uint256 solId = 1;
        require(galaxy.wasVisited[solId] == false, "Must never have been visited");
        galaxy.wasVisited[solId] = true;
        galaxy.systems[solId].discoveredBy = msg.sender;
        //Set Sun Size
        galaxy.systems[solId].starSize = 4;
        uint256 planetId = 0;
        uint8 objectCount = 0;
        do {
            if (PresetLibrary.isPlanet(objectCount)) {
                galaxy.systems[solId].planets[planetId] = galaxy.planets.createPlanet(
                    PresetLibrary.getName(objectCount),
                    solId,
                    PresetLibrary.getSize(objectCount),
                    PresetLibrary.getClass(objectCount),
                    PresetLibrary.getRings(objectCount),
                    PresetLibrary.getSpeed(objectCount)
                );
                planetId = galaxy.systems[solId].planets[planetId];
                galaxy.planets.claimPlanet(planetId);

            }
            if (PresetLibrary.isMoon(objectCount)) {
                galaxy.moons.createMoon(
                    planetId,
                    PresetLibrary.getSlot(objectCount),
                    PresetLibrary.getName(objectCount),
                    PresetLibrary.getSize(objectCount),
                    PresetLibrary.getClass(objectCount),
                    PresetLibrary.getSpeed(objectCount)
                );
            }
            if (PresetLibrary.isStation(objectCount)) {
                galaxy.planets.createStation(
                    planetId,
                    PresetLibrary.getName(objectCount),
                    PresetLibrary.getSize(objectCount)
                );
                galaxy.planets.addPortToStation(
                    planetId
                );
            }
            objectCount++;
        } while (!PresetLibrary.isNothing(objectCount));
    }
}