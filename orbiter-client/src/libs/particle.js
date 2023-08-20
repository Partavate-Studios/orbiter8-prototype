import Sprite from './sprite.js'

export default class Particle extends Sprite {
  constructor () {
    super()
    this.type = 'dot'
    this.timeOfDeath = 1500
    this.ticker = 0
    this.lifeRate = 1
  }
  tickWork () {
    if (this.ticker < this.timeOfDeath) {
      this.ticker++
      this.lifeRate = Math.max(0, 1 - (this.ticker / this.timeOfDeath))
    }
  }
  isDead () {
    return (this.timeOfDeath <= this.ticker)
  }
}
