# The intro as one zoomable diorama

From Koda's notes on [`../intro-alternatives`](../intro-alternatives/README.md) (2026-11-20): the
isometric diorama (A) is the direction; no menus in the world (you click the thing itself, the vape
included; menus belong in Minerva's console); being zoomed out until you see your character, outlined,
is the point; using something is a zoom, not a change of scene; things are simple far away and full up
close; going through the glass door is a zoom past it into the full view of the city; a window can show
it too; and a busier city.

**See them together:** [`overview.png`](overview.png). **Remake them:** `node docs/mockups/intro-zoom/build.mjs` (Node 24).

## How it's built

`world.mjs` draws one isometric world through a camera (a scale and a point to center): the city
(deterministic blocks, lit windows, billboards with the corporations' ads, light trails, air traffic,
haze by distance), Block 7's slender tower on its podium, and unit 7-2216 cut open in it, the floors
above drawn as a ghost so you can see in. Each panel is that same world with another camera; what's
drawn follows the zoom (the TV is a glow far away and its full ad up close; the terminal's screen is her
emblem, then her face, then her console). `vista.mjs` is the city straight on, in perspective: what the
glass door and the window show, and what fills the screen once the camera goes through the glass.

## The panels

| | Zoom | What it shows |
|---|---|---|
| [1](1-block.svg) | All the way out | The city, the tower, your lit notch, and you as a speck with a yellow outline (ringed). The intro can open here and fall in. |
| [2](2-room.svg) | The room (where you play) | The cutaway in its tower. No labels or menus: things are clickable; the hovered one gets an outline and its name (the vape here). The glass door and the window show the city. |
| [3](3-tv.svg) | Into the TV | The set fills the screen with the full ad and Minerva's ticker; the room is still round the edges. It keeps the room's slant (an option: square up as it lands). |
| [4](4-terminal.svg) | Into the terminal | Her console lifts off the screen and squares up to you, the room still behind. Menus live here, as the card drawer's buttons (below). |
| [5](5-balcony.svg) | Through the glass | The camera passes the glass into the view: the busy city straight on, you at the rail from behind, the terminal on the rail. You're high up looking out level: no streets, the towers fall away below the rail into their glow. |
| [6](6-vape.svg) | The vape, clicked | No "Take a hit" button: click the vape on the mattress; you sit and take a hit, the vapor rises, Minerva notes the cost (pink). |

## Calls I made

- **Z1. The tower is a slender slab** (one unit wide), so your unit's outside wall can hold the glass
  door and the window with the city behind them, while the cut sides face the camera.
- **Z2. The floors above are a ghost** (outlines), the cutaway convention: in true isometric a ceiling
  would hide the whole back wall.
- **Z3. The view through the glass is a straight-on picture**, not more isometric city: isometric has no
  vista (everything behind just stacks up), so the glass works like the TV, a picture you zoom into.
- **Z4. The TV stays on the slant; the console squares up**, to compare. Text on the slant reads for an
  ad, not for a page of mail.
- **Z5. The city's colors** are the game's purples and blues with cyan, violet and amber signs; no pink
  (it means "needs you") and no yellow (it means you) in the city.
- Desktop only so far; on a phone the room panel needs no panning (the box fits the width).

## Second pass (2026-11-20)

- **No road under you** (Koda): the balcony looks out level from high up, so the streets are out of
  sight below the rail; the canyon walls and light trails are gone.
- **Minerva's buttons are the card drawer's** (Koda: the buttons that slide out from behind the selection
  card, `hud/selection-panel.vue` `.action`, are the ones he likes best): a plum gradient pill with a thin
  violet edge, its picture in a round well, bold pale text. The tab you're on gets the hover look (the
  edge lit lavender, a lighter plum) and the focus ring, not a lavender fill. Her letters are the same
  pills, as rows.
