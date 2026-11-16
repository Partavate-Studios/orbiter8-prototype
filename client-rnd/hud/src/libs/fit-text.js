// Names can be long (24 characters for call signs, ships, planets, moons and stars), and SVG text
// neither wraps nor truncates. fitSize gives the font size at which a text fits a width: the size
// asked for, or smaller for a long text. Widths are measured once per text in the game's font
// (Ubuntu) on a canvas, never per frame.

const widths = new Map()
let context = null

/** The text's width at a font size of 100, in the same units. */
function widthAt100(text, weight) {
  const key = weight + '|' + text
  const known = widths.get(key)
  if (known !== undefined) return known
  let width = text.length * 62 // without a canvas (tests), a wide letter's estimate
  try {
    context ??= document.createElement('canvas').getContext('2d')
    if (context) {
      context.font = `${weight} 100px Ubuntu, 'Ubuntu Sans', sans-serif`
      width = context.measureText(text).width
    }
  } catch {
    // no canvas: keep the estimate
  }
  // Only remembered once the game's font is in, so an early measure in a fallback font isn't kept.
  if (typeof document === 'undefined' || document.fonts?.status === 'loaded') widths.set(key, width)
  return width
}

/**
 * The font size (in the units of `size` and `maxWidth`) at which `text` fits `maxWidth`: `size`, or
 * smaller for a long text.
 * @param {string} text
 * @param {number} size  the font size wanted
 * @param {number} maxWidth  the room it has, in the same units
 * @param {number|string} [weight]  the font weight (bold text is wider)
 */
export function fitSize(text, size, maxWidth, weight = 400) {
  if (!text) return size
  const width = (widthAt100(String(text), weight) * size) / 100
  return width <= maxWidth ? size : (size * maxWidth) / width
}

/**
 * A text that fits `maxWidth` without getting too small to read: shrunk down to `minScale` of `size`,
 * then cut with an ellipsis. Returns { text, size }.
 */
export function fitText(text, size, maxWidth, { weight = 400, minScale = 0.72 } = {}) {
  text = String(text ?? '')
  const fitted = fitSize(text, size, maxWidth, weight)
  if (fitted >= size * minScale) return { text, size: fitted }
  const small = size * minScale
  let cut = text
  while (cut.length > 1 && fitSize(cut + '…', small, maxWidth, weight) < small) cut = cut.slice(0, -1)
  return { text: cut.trimEnd() + '…', size: small }
}
