export default class Rubber {
  constructor (origin, target, duration) {
    this.origin = origin
    this.target = target
    this.delta = target - origin
    this.duration = duration
    this.start = Date.now()
    this.method = 'ease'
  }

  getRubber (time) {
    if (this.method == 'ease') {
      return this.getRubberEase(time)
    } else {
      return this.getRubberLinear(time)
    }
  }

  setRubberMovementLinear () {
    this.method = 'linear'
  }

  setRubberMovementEase () {
    this.method = 'ease'
  }

  getRubberEase (time) {
    if (this.rubberComplete(time)) {
      return this.target
    }
    let timeDelta = (time - this.start)
    let timeRatio = (timeDelta / this.duration)

     timeRatio = 1 - Math.pow(1 - timeRatio, 5)
    // timeRatio = Math.sin((timeRatio * Math.PI) / 2)
    // timeRatio = Math.sqrt(1 - Math.pow(timeRatio - 1, 2))

    let progress = (timeRatio * this.delta)
    return (this.origin + progress)
  }

  getRubberLinear (time) {
    if (this.rubberComplete(time)) {
      return this.target
    }
    let timeDelta = (time - this.start)
    let timeRatio = (timeDelta / this.duration)
    let progress = (timeRatio * this.delta)
    return (this.origin + progress)
  }

  rubberComplete (time) {
    if ((time - this.start) >= this.duration) {
      return true;
    }
    return false;
  }

  updateTarget (target) {
    this.target = target
    this.delta = target - this.origin
  }
}

