The following helps define the A.C. for smart contracts.

Constructs:
- Avatars
  - One per account
  - Is a wallet address's in-game peronna
  - Attributes
    - Name (Only customizable thing?)
    - On Ship (which ship is the avatar currently on)
    - Sector (method that checks the ships sector)
    - Total Battles Won
    - Total Battles Lost
    - Experience Points (xp)
    - Alignment (positive / negative) (changes value of some things, but no more value for higher/lower alignment)
- Ships
  - Are owned by 1 Avatar (account)
  - Can only be used when occupied
  - Are always in a Sector
  - Can move to an adjacent sector
  - Are transferable if unoccupied
  - Attributes:
    - Current Sector
    - Current Owner (follow NFT standard)
    - Max Hops (how many sectors it can move in a turn)
    - Cargo Holds (how many units it can carry)
    - Total Hops (lifetime hop count)
    - Total Battles (lifetime battle count)
    - Shield Points (defence points)
    - Fighters (offence and defence points)
- Solar Systems
  - Full of planets
  - Has Beacon (contains name of first person there, can provide info via minerva)
  - Attributes:
    - DNA (for generating things)
    - Sun 1 Size
    - Sun 2 Size
    - Neighbors
- Planet
  - Type: Glacial, Volcanic, Desert, Mountain, Earth, Oceanic, Vap
  - Size
  - Sector
  - Rings
- Moons
  - Belongs To Planet
  - Size
- Space Ports
  - Belong To Planets
  - Buy/Sell Stats
  - Size
-

Shared Contracts:
  Orbital: something can orbit around it
  Orbiter: can orbit something
  Manifest: last 10 accounts interacted with (can I just get this from blockchain?)