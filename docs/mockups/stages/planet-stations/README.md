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

## Iteration 2 (Koda's feedback, 2026-11-18)

Koda liked B's hexagon (from the original station), A's attachments all the way round, and A's
"planet gun" (the citadel's dome and mast); and asked for the bold style of the original station and
the ship (thick, smooth, solid; few small details) instead of round 1's finer drawing.

- **D, Hex ring:** the original station, unchanged, at the center; bold parts on its faces all the way
  round: capsule pods left and right (port), two dome-and-barrel guns up top (armory, the planet gun's
  shape), a heavy cradle with the Orbiter 8 in it (yards), a vented block (autofactory). Laid out
  unevenly on purpose: a symmetric layout read as a face. The planet keeps A's citadel gun and lights.
  Sheet `system-d.svg`; parts `system-d-*.svg`.

## Iteration 3 (Koda, 2026-11-18: "a little too bold… scale the sections back… multiple ships docked")

- **E, Hex, three pads:** D with lighter parts (struts and barrels about half as thick) set closer to the
  hull. In the game a docked ship lies side-on at one of the station's six faces, about as long as the
  station is wide, up to three at once (`sdk/src/game/docking.js`), so parts on every face would collide
  with ships. E keeps **three alternate faces for docking** (0°, 120°, 240°: the Port's collars, with
  small cargo pods beside them) and puts the yards (180°), guns (300°) and factory (60°) on the other
  three. `../overview-3.svg` shows one, two and three ships docked. Building it means `PADS` in
  `docking.js` becomes those three faces (MAX_DOCKED is already 3).
