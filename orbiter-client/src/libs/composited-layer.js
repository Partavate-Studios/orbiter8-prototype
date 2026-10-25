// Shows a layer that was rendered for one camera as if it had been rendered for the current one,
// using a CSS transform. Transforms are composited by the GPU, so moving the camera costs no
// repaint. Translation stays sharp; scaling is briefly soft, so the layer asks to be re-rendered
// ("committed") once the zoom settles or drifts too far. Map libraries like Leaflet do the same.

const SETTLE_FRAMES = 6 // ~100 ms without a zoom change counts as the end of a zoom gesture

export class CompositedLayer {
  /**
   * @param {HTMLElement | SVGElement} element  the element that gets the CSS transform
   * @param {object} options
   * @param {number} options.margin  extra pixels rendered beyond each screen edge; panning further needs a commit
   * @param {number} [options.maxScale]  re-render once the CSS scale grows past this (bounds the blur;
   *   a mouse-wheel step is 1.25x, so 2 lets a zoom-in gesture run a few steps between redraws)
   * @param {() => number} [options.minScale]  re-render once the CSS scale shrinks below this
   * @param {() => { width: number, height: number }} [options.mustCover]  for opaque layers: the screen
   *   size the layer must keep covering. If set, the layer re-renders as soon as shrinking or moving it
   *   would show one of its edges, however little it has shrunk.
   */
  constructor(element, { margin, maxScale = 2, minScale = () => 0.5, mustCover = null }) {
    this.element = element
    this.margin = margin
    this.maxScale = maxScale
    this.minScale = minScale
    this.mustCover = mustCover
    this.last = null
    this.stableFrames = 0
    this.active = false
  }

  /**
   * Applies the transform that maps the rendered layer onto the current camera.
   * @param {{ scale: number, x: number, y: number, originX: number, originY: number }} delta
   *   scale about (originX, originY), then translate by (x, y); all in CSS pixels of the element's box
   * @returns {boolean} true when the caller should re-render the layer for the current camera now
   *   (the transform has already been cleared, so render in this same frame)
   */
  update(delta) {
    // Whole device pixels keep translated content sharp.
    const dpr = window.devicePixelRatio || 1
    const x = Math.round(delta.x * dpr) / dpr
    const y = Math.round(delta.y * dpr) / dpr
    const scale = delta.scale

    // Only the zoom has to settle: a translated layer is already sharp, and a camera following a
    // moving sprite never stops translating, which would leave a zoomed layer soft indefinitely.
    const zoomChanged = !this.last || this.last.scale !== scale
    this.stableFrames = zoomChanged ? 0 : this.stableFrames + 1
    this.last = { x, y, scale }

    const isIdentity = scale === 1 && x === 0 && y === 0
    const needsCommit =
      scale > this.maxScale ||
      scale < this.minScale() ||
      Math.abs(x) > this.margin * 0.8 ||
      Math.abs(y) > this.margin * 0.8 ||
      (scale !== 1 && this.stableFrames >= SETTLE_FRAMES) ||
      (this.mustCover !== null && !this.coversScreen(delta, scale, x, y))

    if (needsCommit || isIdentity) {
      this.clear()
      return needsCommit
    }
    const style = this.element.style
    // Only promote the layer while it is actually being transformed: a permanently
    // promoted, scaled layer is what leaves browsers showing a blurry bitmap.
    if (!this.active) {
      style.willChange = 'transform'
      this.active = true
    }
    style.transformOrigin = `${delta.originX}px ${delta.originY}px`
    style.transform = `translate(${x}px, ${y}px) scale(${scale})`
    return false
  }

  /**
   * Whether the transformed layer still covers the whole screen. The layer's box is the screen plus
   * `margin` on each side; a point p of it lands at origin + scale * (p - origin) + translate.
   */
  coversScreen(delta, scale, x, y) {
    const { width, height } = this.mustCover()
    const m = this.margin
    const edge = (p, origin, shift) => origin + scale * (p - origin) + shift
    const left = edge(0, delta.originX, x)
    const right = edge(width + 2 * m, delta.originX, x)
    const top = edge(0, delta.originY, y)
    const bottom = edge(height + 2 * m, delta.originY, y)
    // The screen occupies [m, m + width] x [m, m + height] of the layer's own box.
    return left <= m && right >= m + width && top <= m && bottom >= m + height
  }

  clear() {
    this.last = null
    this.stableFrames = 0
    if (!this.active) return
    this.element.style.transform = ''
    this.element.style.willChange = ''
    this.active = false
  }
}
