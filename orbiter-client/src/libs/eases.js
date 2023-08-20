
export default class Eases {
  sqrtEase(val, buffer) {
    return Math.sign(val) * Math.sqrt(Math.max(Math.abs(val) - buffer, 0))
  }
}