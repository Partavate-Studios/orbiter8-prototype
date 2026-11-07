// Tuning numbers for the map, camera and timing, in one place.
// Camera "scale" is viewport.scale: world units per map unit, so bigger = zoomed further out.

/** Map units that fit the screen's height. */
export const MAP_RESOLUTION = 1200

/** The map's HUD and world are drawn in a group scaled by this much. */
export const MAP_GROUP_SCALE = 1.25

/** The world sits this many group units above the screen center. */
export const WORLD_OFFSET_Y = -100

export const CAMERA = {
  /** Zoom on first load (far out). */
  START_SCALE: 400,
  /** Most zoomed out the camera goes. */
  MAX_SCALE: 420,
  /** The jump animation plays at least this long, even when the new system loads at once. */
  // At least as long as Minerva's "fusion engines primed, initiating interstellar jump" (3.8 s), and a beat.
  MIN_JUMP_ANIMATION_MS: 4500,
  /** The star button's zoom from the system out to the neighbor view. */
  NEIGHBOR_ZOOM_MS: 1800,
  /** Wheeling out at or beyond this zoom (near MAX_SCALE) leaves the system for the neighbor-star view. */
  NEIGHBOR_VIEW_FROM_SCALE: 400,
  /** Most zoomed in the camera goes. */
  MIN_SCALE: 0.001,
  /** Below this the camera snaps to MIN_SCALE. */
  MIN_SCALE_SNAP: 0.0015,
  /** How far (world units) the camera can pan from the star. */
  MAX_PAN: 5200,
  /** Easing toward a newly selected sprite. */
  SELECT_TWEEN_MS: 2000,
  /** Arrow-key nudges and small rotations. */
  NUDGE_TWEEN_MS: 100,
  /** Arrow keys move the camera this far (screen units). */
  KEY_PAN: 100,
  /** Each wheel step multiplies the zoom by one of these, over WHEEL_TWEEN_MS. */
  WHEEL_ZOOM_IN: 0.8,
  WHEEL_ZOOM_OUT: 1.25,
  WHEEL_TWEEN_MS: 100,
  /** Arriving in a system: zoom to the player's ship, or to the system if they have none. */
  ARRIVAL_SHIP_SCALE: 0.05,
  ARRIVAL_SYSTEM_SCALE: 0.5,
  ARRIVAL_TWEEN_MS: 5000,
  /** Zoom behind the jump animation (so the new system starts far out). */
  JUMP_ANIMATION_SCALE: 1500,
  /** Mouse drags shorter than this (pixels) are clicks, not pans. */
  DRAG_THRESHOLD_PX: 20
}

export const TIMING = {
  /** How often to ask the chain for a new block. */
  BLOCK_POLL_MS: 2000,
  /** Low graphics tier: minimum ms between game ticks (~30 fps). Other tiers tick every frame. */
  LOW_TIER_TICK_MS: 32,
  /** Recent ship launches and trades: blocks to look back. */
  EVENT_LOOKBACK_BLOCKS: 10,
  /** Trades that decide which ships are drawn docked at stations (sdk/game/docking.js): blocks to look back. */
  DOCKING_LOOKBACK_BLOCKS: 950,
  /** Chat history: blocks to look back. */
  CHAT_LOOKBACK_BLOCKS: 950
}
