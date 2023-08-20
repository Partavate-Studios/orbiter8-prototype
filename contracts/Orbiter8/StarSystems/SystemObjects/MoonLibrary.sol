pragma solidity >=0.5.0 <0.6.0;

library MoonLibrary {

    uint8 public constant maxMoons = 8;

    struct Moon {
        string name;
        uint8 size;
        uint8 class;
        uint8 velocity;
    }

    //moon system?
    struct MoonStorage {
        mapping (uint256 => mapping(uint8 => Moon)) moons;
    }

    function getMaxMoons() internal pure returns (uint8) {
        return maxMoons;
    }

    function getMoon(
        MoonStorage storage self,
        uint256 planetId,
        uint8 moonId
    ) internal view returns (
        string memory,
        uint8,
        uint8,
        uint8
    ) {
        require(self.moons[planetId][moonId].size > 0, "That's no moon");
        return (
            self.moons[planetId][moonId].name,
            self.moons[planetId][moonId].size,
            self.moons[planetId][moonId].class,
            self.moons[planetId][moonId].velocity
        );
    }

    function isMoon(
        MoonStorage storage self,
        uint256 planetId,
        uint8 moonId
    ) internal view returns (
        bool
    ) {
        if (self.moons[planetId][moonId].size > 0) {
            return true;
        }
        return false;
    }

    function getHasMoons (
        MoonStorage storage self,
        uint256 planetId
    ) internal view returns (
        bool[maxMoons] memory
    ) {
        bool[maxMoons] memory hasMoons;
        for (uint8 i = 0; i < maxMoons; i++) {
            if (isMoon(self, planetId, i)) {
                hasMoons[i] = true;
            } else {
              hasMoons[i] = false;
            }
        }
        return hasMoons;
    }

    /**
    * Creates all of the moons to accompany a solar system
    * returns array of ids
    */
    function createRandomMoon(
        MoonStorage storage self,
        uint256 planetId,
        uint8 moonId,
        uint256 seed
    ) internal {        
        //todo: this should be more intellegent 
        uint8 size = uint8(seed % (30 - moonId * 2)) + 1;
        uint8 class = uint8((seed / 50) % 10);
        uint8 velocity = uint8(((255 - moonId * 30) - ((seed / 2005) % 50)));
        createMoon(
            self,
            planetId,
            moonId,
            'Moon',
            size,
            class,
            velocity
        );
    }

    /**
    * Creates all of the moons to accompany a solar system
    * returns array of ids
    */
    function createMoon(
        MoonStorage storage self,
        uint256 planetId,
        uint8 moonId,
        string memory name,
        uint8 size,
        uint8 class,
        uint8 velocity
    ) internal {
        require(moonId < maxMoons, 'moon out of range');
        //todo: require no moon exists there already
        self.moons[planetId][moonId] = Moon(
            name,
            size,
            class,
            velocity
        );
    }

    function renameMoon(
        MoonStorage storage self, 
        uint256 planetId,
        uint8 moonId, 
        string memory newName
    ) internal {
        self.moons[planetId][moonId].name = newName;
    }
}