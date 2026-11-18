# Planet station proposals (2026-11-18)

Three systems for a planet's station, where its look shows what it has (Koda: "the space port should
look different depending on if it has an armory, a port of trade, etc."). Drawn by
`../gen-stations.py`; every system uses the same module shapes, so a port reads as a port everywhere:
pods on a docking collar (port), an open frame with a hull in it (yards), domed twin-barrel turrets
(armory), a vented block (autofactory). Citadel and Colony, which draw nothing today, get a citadel on
the planet's limb and city lights on its night side.

- **A, Ring:** a ring station that facilities clamp onto: pods left and right, turrets on top, the yard
  gantry below, factory blocks on the lower arcs. Symmetric and calm; reads as "bigger" as it fills in.
- **B, Hub and spokes:** a hexagonal hub with four spokes, one facility per spoke (port west, armory
  north, factory east, yards south). The clearest at a glance: each direction means one thing.
- **C, Spine:** a vertical spine that stacks: a docking bar on top for the port, turrets mid-ship, the
  factory block below, the yard cage at the foot. Grows tall rather than wide, like a ship's mast.

Files: `system-x.svg` (the sheet: every stage, at game size, the parts) and `system-x-<part>.svg`
(standalone, 120 units square, centered): `core`, `port`, `yards`, `armory`, `autofactory`, and
`colony` (the planet's marks, on a stand-in disc).
