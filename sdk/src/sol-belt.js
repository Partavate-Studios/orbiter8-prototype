// Sol's belt, fixed (contracts/src/planets/BeltGen.sol): real asteroids between Mars and Jupiter, and
// two empty sections to mine near home. Kept apart from belt-gen.js, which hashes with ethers, so
// pure modules (market.js, run by Node tools too) can know Sol's stations without it.
export const SOL_SECTIONS = [
  { name: 'Ceres', composition: 0, size: 8 },
  { name: 'Vesta', composition: 1, size: 6 },
  null,
  { name: 'Pallas', composition: 1, size: 6 },
  { name: 'Hygiea', composition: 0, size: 5 },
  { name: 'Psyche', composition: 2, size: 5 },
  null,
  { name: 'Juno', composition: 1, size: 3 }
]
