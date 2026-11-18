// The jump's slides (Koda, round 2, item 9; mockup: mockups/round2/jump.svg). The backdrop (nebula and
// far stars) never moves; over it:
// - away (JUMP_DEPART_MS): the system slides off to the left while the ship slides in from the left;
// - cruise: the streaking stars stream in from the right edge once the ship is in place (Koda,
//   2026-11-17: never with the ship, never from the left), then race past, the ship bobbing, until the
//   new system has loaded and the jump has played at least as long as Minerva's lines
//   (CAMERA.MIN_JUMP_ANIMATION_MS);
// - arrive (JUMP_ARRIVE_MS): the ship speeds off the right edge, the last streaks stream out to the
//   left, and the new system slides in from the right (Koda: "it should slide in from the right").
// The streaks never move as a field: `streaks` is the part of the screen they show in, so they always
// arrive from the right and leave to the left, as they fly.
// Offsets are in screen widths (+ is to the right); the ship's is from the screen's middle.

export const JUMP_DEPART_MS = 1000
export const JUMP_ARRIVE_MS = 1600
/** How long the streaks take to fill the screen from the right once the cruise begins. */
export const STREAKS_FILL_MS = 700

const clamp01 = (t) => Math.min(1, Math.max(0, t))
const easeIn = (t) => t * t * t
const easeOut = (t) => 1 - Math.pow(1 - t, 3)
/** The part of `t` between `from` and `to`, 0 to 1. */
const span = (t, from, to) => clamp01((t - from) / (to - from))

/**
 * Where each layer is at `elapsed` ms into a phase.
 * @param {'depart' | 'cruise' | 'arrive' | null} phase
 * @param {number} elapsed
 * @param {{ shipGone?: boolean }} [options]  shipGone: no ship to fly off (a stalled jump coming back)
 * @returns {{ system: number | null, streaks: { from: number, to: number }, ship: number | null, words: number }}
 *   system: the star system's offset, or null while it's hidden; streaks: the stretch of the screen
 *   the streaks show in, from its left to its right, in screen widths (0 to 1);
 *   ship: the ship's offset, or null when it's off screen; words: the travel words' opacity, 0 to 1
 */
export function jumpSlide(phase, elapsed, { shipGone = false } = {}) {
  if (phase === 'depart') {
    const t = clamp01(elapsed / JUMP_DEPART_MS)
    return {
      system: -easeIn(t) * 1.15,
      streaks: { from: 1, to: 1 },
      ship: -(1 - easeOut(span(t, 0.1, 1))) * 0.75,
      words: span(t, 0.7, 1)
    }
  }
  if (phase === 'arrive') {
    const t = clamp01(elapsed / JUMP_ARRIVE_MS)
    const flown = span(t, 0, 0.42)
    return {
      system: (1 - easeOut(span(t, 0.3, 1))) * 1.15,
      streaks: { from: 0, to: 1 - easeIn(span(t, 0.08, 0.6)) },
      ship: shipGone || flown >= 1 ? null : easeIn(flown) * 0.8,
      words: 1 - span(t, 0, 0.2)
    }
  }
  if (phase === 'cruise') {
    return { system: null, streaks: { from: 1 - easeOut(clamp01(elapsed / STREAKS_FILL_MS)), to: 1 }, ship: 0, words: 1 }
  }
  // not jumping (or no slides wanted): everything in place
  return { system: 0, streaks: { from: 0, to: 1 }, ship: 0, words: 1 }
}

/** Whether to slide at all: not for players who've asked their system for less motion. */
export function slidesWanted() {
  return !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}
