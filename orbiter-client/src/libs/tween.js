import { markRaw } from 'vue'

/**
 * A value moving from `origin` to `target` over `duration` ms, starting now: eased out (quintic) by
 * default, or linear. The camera and the menus use these for their animated moves.
 */
export default class Tween {
  constructor(origin, target, duration) {
    this.origin = origin
    this.target = target
    this.delta = target - origin
    this.duration = duration
    this.start = Date.now()
    this.method = 'ease'
    // Animation state: changes every frame, so keep it out of Vue's reactivity.
    return markRaw(this)
  }

  valueAt(time) {
    if (this.method == 'ease') {
      return this.easedValueAt(time)
    } else if (this.method == 'geometric') {
      return this.geometricValueAt(time)
    } else {
      return this.linearValueAt(time)
    }
  }

  /**
   * Multiply toward the target at a steady rate (eased in and out), as zooming does: each moment
   * changes the value by the same factor, so a zoom from 0.6 to 420 feels like steady scrolling
   * instead of rushing through the near range. Origin and target must be positive.
   */
  useGeometric() {
    this.method = 'geometric'
  }

  geometricValueAt(time) {
    if (this.isDone(time)) {
      return this.target
    }
    const t = (time - this.start) / this.duration
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    return this.origin * Math.pow(this.target / this.origin, eased)
  }

  useLinear() {
    this.method = 'linear'
  }

  useEase() {
    this.method = 'ease'
  }

  easedValueAt(time) {
    if (this.isDone(time)) {
      return this.target
    }
    let timeDelta = time - this.start
    let timeRatio = timeDelta / this.duration

    timeRatio = 1 - Math.pow(1 - timeRatio, 5)

    let progress = timeRatio * this.delta
    return this.origin + progress
  }

  linearValueAt(time) {
    if (this.isDone(time)) {
      return this.target
    }
    let timeDelta = time - this.start
    let timeRatio = timeDelta / this.duration
    let progress = timeRatio * this.delta
    return this.origin + progress
  }

  isDone(time) {
    if (time - this.start >= this.duration) {
      return true
    }
    return false
  }

  updateTarget(target) {
    this.target = target
    this.delta = target - this.origin
  }
}
