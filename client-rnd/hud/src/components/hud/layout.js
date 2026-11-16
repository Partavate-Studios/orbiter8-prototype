// The HUD's sizes that more than one part needs, in CSS pixels before the interface-size setting.

/** The HUD's distance from the screen's edges. */
export const EDGE = 16
/** The selection card on wide screens: the card's art is 160 by 230 units (a frame's margin included). */
export const CARD_WIDTH = 236
export const CARD_HEIGHT = Math.round((CARD_WIDTH * 230) / 160)
