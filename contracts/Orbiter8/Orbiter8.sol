pragma solidity >=0.5.0 <0.6.0;

import "./StarSystems/StarSystemLibrary.sol";
import "./StarSystems/Avatar/AvatarControls.sol";

//todo: should 'requires' be in this contact?

contract Orbiter8 {
    using StarSystemLibrary for StarSystemLibrary.Galaxy;
    using StarSystemLibrary for StarSystemLibrary.StarSystem;
    StarSystemLibrary.Galaxy galaxy;

    AvatarControls private avatarControls;


    event ChatLog(address _sender, string _message);
    function sendChat(string memory message) public {
        emit ChatLog(msg.sender, message);
    }

    /** connection to tokens contract for tracking planets */
    function setPlanetTokenizer(address tokenAddress) public {
        galaxy.setPlanetTokenizer(tokenAddress);
    }
    function getPlanetTokenizer() public view returns (address) {
        return galaxy.getPlanetTokenizer();
    }

    /** connection to tokens contract for tracking ships */
    function setShipTokenizer(address tokenAddress) public {
        galaxy.setShipTokenizer(tokenAddress);
    }
    function getShipTokenizer() public view returns (address) {
        return galaxy.getShipTokenizer();
    }


    /** connection to tokens contract for tracking credits */
    function setCreditTokenizer(address tokenAddress) public {
        galaxy.setCreditTokenizer(tokenAddress);
    }
    function getCreditTokenizer() public view returns (address) {
        return galaxy.getCreditTokenizer();
    }
    function myBalance() external view returns (uint256) {
        return galaxy.balanceOf(msg.sender);
    }

    function setAvatarControls(address avatarControlsAddress) public {
        avatarControls = AvatarControls(avatarControlsAddress);
        avatarControls.createAvatar('Great Daemon');
    }

    /** this method must be called to initialize the galaxy */
    function genesis() public {
        galaxy.genesis();
    }

    /** this method must be called to initialize the first solar system */
    function makeSolarSystem() public {
        galaxy.makeSolarSystem();
    }

    /** Avatars */
    // function createAvatar(string memory name) public {
    //    galaxy.createAvatar(name);
    // }

    /** Ship */
    function getShip(
        uint256 shipId
    ) external view returns (
        string memory,
        uint,
        uint,
        address
    ) {
        return galaxy.getShip(shipId);
    }

    event ShipLaunch(string _name);
    function launchShip(string memory name) public {
        galaxy.launchShip(name);
        //todo: this shouldn't stay here, just a way to inject some credits
        galaxy.awardCredits(msg.sender, 100);
        emit ShipLaunch(name);
    }

    function renameMyShip(string memory name) public {
        galaxy.renameMyShip(name);
    }

    /** Planets */

    function getPlanet(
        uint256 planetId
    ) external view returns (
        string memory,
        uint256,
        uint8[4] memory,
        address,
        bool[8] memory,
        bool
    ) {
        return galaxy.getPlanet(planetId);
    }

    function renamePlanet(uint256 id, string memory name) public {
        galaxy.renamePlanet(id, name);
    }

    function claimPlanet(
        uint256 planetId,
        string memory planetName
    ) public {
        return galaxy.claimPlanet(planetId, planetName);
    }

    function buildStation (
        uint256 planetId,
        string memory stationName
    ) public {
        galaxy.buildStation(planetId, stationName);
    }

    /** get planet by system's planet id rather than global planet id */
    function getLocalPlanet(
        uint256 orbitalId
    ) external view returns (
        string memory,
        uint256,
        uint8[4] memory,
        address,
        bool[8] memory,
        bool
    ) {
        return galaxy.getLocalPlanet(orbitalId);
    }

    /** moons */

    function getMoon(
        uint256 planetId,
        uint8 moonId
    ) external view returns (
        string memory,
        uint8,
        uint8,
        uint8
        //address
    ) {
        return galaxy.getMoon(planetId, moonId);
    }

    function renameMoon(
        uint256 planetId,
        uint8 moonId,
        string memory name
    ) public {
        galaxy.renameMoon(planetId, moonId, name);
    }

    /** Space Stations */

    function getStation(
        uint256 planetId
    ) external view returns (
        string memory,
        uint8,
        int16[3] memory,
        uint16[4] memory
    ) {
        return galaxy.getStation(planetId);
    }

    function renameStation(uint256 id, string memory name) public {
        galaxy.renameStation(id, name);
    }

    function addPortToStation(uint256 id) public {
        galaxy.addPortToStation(id);
    }

    event PortTrade(address _sender, uint _planetId, int16 _equipment, int16 _fuel, int16 _organics, int _value);
    function tradeAtPort(
        uint256 planetId,
        int16 equipment,
        int16 fuel,
        int16 organics
    ) public {
        int tradeValue = galaxy.tradeAtPort(planetId, equipment, fuel, organics);
        emit PortTrade(msg.sender, planetId, equipment, fuel, organics, tradeValue);
    }

    function addHoldsToShip(
        uint256 planetId,
        uint8 holds
    ) public {
        galaxy.addHoldsToShip(planetId, holds);
    }

    /** Galaxy */
    function moveToSystem(uint256 destinationSystemId) public  {
        galaxy.moveToSystem(destinationSystemId);
    }

    function getSystemCount() public view returns(uint256) {
        return galaxy.getStarSystemCount();
    }

    function getMyShipLocation() public view returns(uint256) {
        return galaxy.getMyShipLocation();
    }

    function getMyShipId() public view returns(uint256) {
        return galaxy.getMyShipId();
    }

    function getMyShip() public view returns(
        string memory, //name
        uint,          //star system
        uint,          //orbit
        uint8,         //cargo limit
        uint8,         //equipment
        uint8,         //fuel
        uint8          //organics
    ) {
        return galaxy.getMyShip();
    }

    function getPlayerSystemData() public view returns(
        uint256,
        string memory,
        uint8,
        uint256,
        address,
        uint256[12] memory,
        uint256[14] memory,
        uint256[30] memory
    ) {
        return galaxy.getSystemData(galaxy.getMyShipLocation());
    }

    function getSystemName(uint256 systemId) public view returns(
        string memory
    ) {
        return galaxy.getSystemName(systemId);
    }

    function renameStar(string memory name) public {
        galaxy.renameStar(name);
    }


}