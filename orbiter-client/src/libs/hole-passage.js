// Going through a black hole (Koda, 2026-11-21): not the jump's tidy streaks but a dark passage, stretched
// and a little out of control. After the hole swallows the ship (black-hole-entry.vue):
// - the screen goes dark, and a throat of light sits ahead that never holds still;
// - rings and smeared stars pour out of the throat past you, wider than they are tall, twisting one
//   way and then the other, in surges, never at a steady speed;
// - the ship is pulled long and thin and let go again, yawing and sliding about, with echoes of itself
//   trailing a moment behind.
// Everything here is made of slow sines at unrelated rates, so it never repeats in a way you can
// learn. The canvas (background-canvas.vue drawHole) and the ship (jump-animation.svg.vue) both read
// these. `wild` is 0 for players who've asked their system for less motion: the passage still flows,
// but nothing sways, tilts or stretches.

const { sin } = Math

/** How fast you're falling at `s` seconds, around 1: it lurches, and never quite stops. */
export function holeSurge(s) {
  return Math.max(0.15, 1 + 0.55 * sin(s * 1.7) + 0.35 * sin(s * 4.3 + 1))
}

/**
 * The throat ahead at `s` seconds.
 * @returns {{ x: number, y: number, tilt: number, stretch: number, swirl: number }}
 *   x, y: where it is, from the screen's middle, in screen widths and heights; tilt: the whole view's
 *   roll, in radians; stretch: how much wider than tall the passage is; swirl: the twist of what pours
 *   out of it, in radians (it reverses)
 */
export function holeThroat(s, wild = 1) {
  return {
    x: wild * (0.15 * sin(s * 0.83) + 0.08 * sin(s * 1.9 + 1.3)),
    y: wild * (0.11 * sin(s * 1.21 + 2) + 0.06 * sin(s * 2.6)),
    tilt: wild * (0.1 * sin(s * 0.61 + 0.4) + 0.04 * sin(s * 1.7)),
    stretch: 1.7 + wild * (0.45 * sin(s * 0.7) + 0.2 * sin(s * 2.1 + 2)),
    swirl: 0.25 + wild * (1.1 * sin(s * 0.37) + 0.35 * sin(s * 1.3 + 1))
  }
}

/**
 * The ship at `s` seconds: pulled long and thin, yawing, sliding about.
 * @returns {{ x: number, y: number, turn: number, stretch: number, squeeze: number, flames: number }}
 *   x, y: its drift in the jump layer's units; turn: degrees; stretch and squeeze: its length and
 *   width against its own; flames: the engines' opacity
 */
export function holeShip(s, wild = 1) {
  const stretch = Math.max(1, 1.45 + wild * (0.55 * sin(s * 1.3) + 0.25 * sin(s * 3.1 + 1)))
  return {
    x: wild * (70 * sin(s * 0.7 + 1) + 28 * sin(s * 1.9)),
    y: wild * (48 * sin(s * 1.1) + 22 * sin(s * 2.7 + 2)),
    turn: wild * (10 * sin(s * 0.9) + 6 * sin(s * 2.3 + 0.7)),
    stretch,
    squeeze: 1 / Math.sqrt(stretch),
    flames: 0.6 + wild * 0.4 * sin(s * 9) * sin(s * 2.3)
  }
}

/** The ship's echoes: how far behind it each is drawn (ms), and how faintly. The last is the ship. */
export const HOLE_ECHOES = [
  [300, 0.1],
  [150, 0.22],
  [0, 1]
]
