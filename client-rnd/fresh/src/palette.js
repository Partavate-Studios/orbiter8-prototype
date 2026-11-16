// The night chart's colours (DESIGN.md, "Visual language"). Each means one thing.
export const COLORS = {
  ink: '#060d14',
  text: '#dbe7ee',
  dim: '#8aa2b1',
  orbit: 'rgba(138,162,177,0.16)',
  cyan: '#6fd3ff', // selection; things to look at
  amber: '#ffb454', // yours; anything that writes to the chain
  green: '#7be0a4', // gain; ready
  red: '#ff6b6b', // siege, damage, refusal
  violet: '#b79cff' // the unknown: uncharted, scans, black holes
}
/** Stars by spectral class, hottest to coolest. */
export const STAR_COLORS = { O: '#9db4ff', B: '#b6c8ff', A: '#dfe6ff', F: '#fff6e0', G: '#ffe08a', K: '#ffb872', M: '#ff8a6b' }
/** Planet classes, in the contracts' order (sdk/game/planet-types.js). */
export const PLANET_COLORS = ['#5fb58c', '#9c8f84', '#4a90d9', '#d9b36c', '#bfe6f2', '#d9603f', '#d9a066', '#b5573f', '#ff7a3c', '#6f8f4e']
