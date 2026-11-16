// Names on the map that would overlap each other. Every sprite showing a name offers it here each frame
// (offerLabel); a few times a second the map lays them all out (placeLabels): most important first,
// each below its sprite if there's room, else above it, else hidden until there's room again.

/**
 * @typedef {object} LabelOffer
 * @property {number} x       the sprite's center, in pixels (any origin, the same for every offer)
 * @property {number} y
 * @property {number} radius  how far the sprite reaches from its center, in pixels
 * @property {number} width   the label's size, in pixels
 * @property {number} height
 * @property {number} priority  higher is placed first
 */

/** @type {Map<string, LabelOffer>} sprite key → its label, as of the last frame it was shown */
const offers = new Map()

/** A sprite showing its name this frame (pixel positions, see LabelOffer). */
export function offerLabel(key, offer) {
  offers.set(key, offer)
}

/** A sprite no longer showing its name (hidden, off screen, unmounted). */
export function withdrawLabel(key) {
  offers.delete(key)
}

/** Every current offer laid out: see placeLabels. */
export function placeOfferedLabels() {
  return placeLabels(offers)
}

/**
 * Where each label goes so that none overlap: 'below' or 'above' its sprite, or 'hidden'.
 * @param {Map<string, LabelOffer>} labels
 * @returns {Record<string, 'below' | 'above' | 'hidden'>}
 */
export function placeLabels(labels) {
  const placed = []
  const placements = {}
  const order = [...labels.entries()].sort(([, a], [, b]) => b.priority - a.priority)
  for (const [key, label] of order) {
    const box = (top) => ({
      left: label.x - label.width / 2,
      right: label.x + label.width / 2,
      top,
      bottom: top + label.height
    })
    const below = box(label.y + label.radius)
    const above = box(label.y - label.radius - label.height)
    const free = (candidate) =>
      !placed.some(
        (other) =>
          candidate.left < other.right &&
          other.left < candidate.right &&
          candidate.top < other.bottom &&
          other.top < candidate.bottom
      )
    if (free(below)) {
      placed.push(below)
      placements[key] = 'below'
    } else if (free(above)) {
      placed.push(above)
      placements[key] = 'above'
    } else {
      placements[key] = 'hidden'
    }
  }
  return placements
}
