import Particle from './particle.js'
import _ from 'lodash'

export default class ParticleEmitter {
  constructor () {
    this.ticker = 0
    this.emmitRate = 150
    this.spriteType = 'dot'
    this.particles = []
  }
  setEmmitRate (rate) {
    this.emmitRate = rate
  }
  setSpriteType (type) {
    this.spriteType = type
  }
  setTimeToDeath (time) {
    this.timeToDeath = time
  }
  isAlive () {
    return this.timeToDeath > 0
  }
  emmit (position) {
    let particle = new Particle()
    particle.translatex = position.x
    particle.translatey = position.y
    this.particles.push(particle)
  }
  tickWork (position) {
    // tickle particles
    // remove dead particles
    _.remove(this.particles, function (particle) {
      particle.tickWork()
      return particle.isDead()
    })
    // emit new particles
    this.ticker++
    if (this.ticker > this.emmitRate) {
      this.ticker = 0
      this.emmit(position)
    }
  }
}
