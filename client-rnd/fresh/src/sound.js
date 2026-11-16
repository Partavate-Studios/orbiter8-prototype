// Four synthesized cues, no assets. Silent until the player turns sound on (Minerva drawer).
let ctx = null
let on = false
export function setSound(enabled) {
  on = enabled
  if (on && !ctx) ctx = new (window.AudioContext ?? window.webkitAudioContext)()
}
const CUES = {
  sent: [[520, 0, 0.06]],
  stamped: [[660, 0, 0.07], [990, 0.08, 0.12]],
  refused: [[220, 0, 0.16], [165, 0.12, 0.2]],
  scan: [[880, 0, 0.05], [1320, 0.07, 0.05], [1760, 0.14, 0.14]]
}
export function cue(name) {
  if (!on || !ctx) return
  for (const [freq, at, length] of CUES[name] ?? []) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const t = ctx.currentTime + at
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + length + 0.02)
  }
}
