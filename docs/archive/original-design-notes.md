## Design Goals

On-chain turn-based gameplay with all game logic handled via Ethereum smart contracts.

Web based game client with no external depdencies other than access to Ethereum.

Dynamically generated game board (galaxy) democratizing the cost of recording the map data to the chain.

## Token Economics

Tokens are minted by NPCs in the game world. Vendors at space ports generate new currency every time you sell them something. Currency is burned every time you buy something from them. Vendors can produce unlimited currency. However, their inventory can run out.

Vendor inventory will have a "recharge" time. A port will only be buying or selling any particular item. The amount that they can buy/sell will gradually got up until it hits the cap. This may be a bit challenging to implement.

## Music

Under the music folder exist folders for each scenarior where a unique piece of music is called for.

i.e.

-music
--title
--space
--port

The music engine will play through all songs in each directory when that scenarior happens.