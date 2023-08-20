class fastTelemetry {

  constructor () {
    this.units = 360 * 1000
    for (let i = 0; i <= this.units; i++) {
      let theta = (i / this.units) * Math.PI * 2
      this.cos[i] = Math.cos(theta);
      this.sin[i] = Math.sin(theta);
    }
  }

  sin (theta) {
    let index = parseInt(theta / (Math.PI * 2) * this.units % this.units)
    return this.sin[index]
  }

  cos (theta) {
    let index = parseInt(theta / (Math.PI * 2) * this.units % this.units)
    return this.cos[index]
  }

}

const instance = new fastTelemetry();
Object.freeze(instance);

export default instance;