// Shows a layer that was rendered for one camera as if it had been rendered for the current one,
// using a CSS transform. Transforms are composited by the GPU, so moving the camera costs no
// repaint. Translation stays sharp; scaling is briefly soft, so the layer asks to be re-rendered
// ("committed") once the zoom settles or drifts too far. Map libraries like Leaflet do the same.

const SETTLE_FRAMES = 6 // ~100 ms without camera change counts as the end of a gesture

export class CompositedLayer {
  /**
   * @param {HTMLElement | SVGElement} element  the element that gets the CSS transform
   * @param {object} options
   * @param {number} options.margin  extra pixels rendered beyond each screen edge; panning further needs a commit
   * @param {number} [options.maxScaleDrift]  re-render once the CSS scale is this far from 1 (keeps blur bounded)
   */
  constructor (element, { margin, maxScaleDrift = 0.15 }) {
    this.element = element
    this.margin = margin
    this.maxScaleDrift = maxScaleDrift
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
  update (delta) {
    // Whole device pixels keep translated content sharp.
    const dpr = window.devicePixelRatio || 1
    const x = Math.round(delta.x * dpr) / dpr
    const y = Math.round(delta.y * dpr) / dpr
    const scale = delta.scale

    const changed = !this.last || this.last.x !== x || this.last.y !== y || this.last.scale !== scale
    this.stableFrames = changed ? 0 : this.stableFrames + 1
    this.last = { x, y, scale }

    const isIdentity = scale === 1 && x === 0 && y === 0
    const needsCommit =
      Math.abs(scale - 1) > this.maxScaleDrift ||
      Math.abs(x) > this.margin * 0.8 ||
      Math.abs(y) > this.margin * 0.8 ||
      (!isIdentity && this.stableFrames >= SETTLE_FRAMES)

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

  clear () {
    this.last = null
    this.stableFrames = 0
    if (!this.active) return
    this.element.style.transform = ''
    this.element.style.willChange = ''
    this.active = false
  }
}
