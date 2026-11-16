// Numbers and times as the interface writes them.
export const num = (n) => Math.round(Number(n) || 0).toLocaleString('en-US')
/** Credits, compact past a million so the top bar never wraps. */
export const cr = (n, compact = false) => {
  const v = Number(n) || 0
  if (compact && Math.abs(v) >= 1e6) return (v / 1e6).toFixed(Math.abs(v) >= 1e7 ? 1 : 2) + 'M'
  return num(v)
}
export const signed = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + num(Math.abs(n))
/** A wait in words: "12 s", "4 min", "2 h 05", "1 d 3 h". */
export function wait(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  if (s < 60) return `${s} s`
  if (s < 3600) return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`
  if (s < 86400) return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`
  return `${Math.floor(s / 86400)} d ${Math.floor((s % 86400) / 3600)} h`
}
/** A build time from the rules: "10 min", "2 h". */
export function span(seconds) {
  if (seconds < 60) return `${seconds} s`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  return `${+(seconds / 3600).toFixed(1)} h`
}
export const short = (address) => (address ? address.slice(0, 6) + '…' + address.slice(-4) : '')
/** The contracts' naming rule (Pilots._nameKey), for checking as the player types. */
export function nameProblem(name) {
  if (name.length < 3) return 'At least 3 characters.'
  if (name.length > 24) return 'At most 24 characters.'
  if (!/^[A-Za-z0-9 ._-]+$/.test(name)) return 'Letters, digits, spaces, - _ . only.'
  if (/^ | $| {2}/.test(name)) return 'No leading, trailing or double spaces.'
  return null
}
