[AvatarControls]
================
** Vars **
** Methods **
  y getAvatarCount()
  y getAvatarIdByOwner()
  y getAvatarNameById()
  y getAvatarNameByOwner()
  y getMyAvatarId()
  y getMyAvatarName()
  y getMyAvatarSector() (has to get ship)
  y getMyAvatarShipId()
  y hasAvatar()
  y haveAvatar()

  [is-AvatarFactory]
----------------------
  ** Structs **
    Avatar
    -  name
    -  shipId
  ** Vars **
    Avatars[]
  ** Mappings **
    addressToAvatar
    AvatarCreated
  ** Methods **
    createAvatar()


[ShipControls]
==============
** Methods **
  createShip()
  boardShip()
  spawnEscapePod()
  moveMyShipTo()
  myShipId()
  myShipName()
  myShipLocation()

  [is-shipFactory]
--------------------
  ** Structs **
    Ship
    -  name
    -  sector
  ** Vars **
    Ships[]
  ** Mappings **
    addressToShip[]
    ShipToOwner[]

** Functions **
  in Sector
[is Ownable]*


[SectorO
bejcts]
===============
** Vars **
** Functions **
  [is-SectorFactory]
----------------------
    Vars -
      Ship
        name
        sector
    Methods -
    visitSector
    showSectorBodies
    showSectorCount
    showSectorName
    currentSector
    look02
    look04
    look06
    look08
    look10
    look12
  [has Sun]


SunFactory
==========
** Vars **
** Functions **
  in Sector
[is Ownable]*

PlanetFactory
=============
** Vars **
** Functions **
  orbits Sun
[is Ownable]*

MoonFactory
===========
** Vars **
** Functions **
- orbits Planet
[is Ownable]*

SpacePortFactory
================
** Vars **
** Functions **
- orbits Planet
[is Ownable]*



* Ownable
=========
** Vars **
  Owner
** Functions **
 - owner
 - isOwner
 - renounceOwnership
 - transferOwnership






