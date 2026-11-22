// The HUD's sizes that more than one part needs, in CSS pixels before the interface-size setting.

/** The HUD's distance from the screen's edges. */
export const EDGE = 16
/**
 * The selection card on wide screens (selection-panel.vue): a spine of tabs, then the card's face (its
 * art is 140 by 188 units), under one heading and over one action row.
 */
export const SPINE_WIDTH = 58
export const FACE_WIDTH = 228
/** The whole card, for what points at it (selection-ring.svg.vue). */
export const CARD_WIDTH = SPINE_WIDTH + FACE_WIDTH + 18
export const CARD_HEIGHT = Math.round((FACE_WIDTH * 188) / 140) + 130
