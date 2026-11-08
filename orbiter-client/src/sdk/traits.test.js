import { describe, expect, it } from 'vitest'
import { starTraits, genesisName, SPECTRAL, REAL_STARS } from './traits'
import { neighbors } from './hex'
import { STAR_CLASSES } from '@/libs/palette'

const seed = '0x' + '11'.repeat(32)

describe('star classes', () => {
  it('draws Sol yellow, as people know it', () => {
    expect(starTraits(seed, 0).spectral).toBe('G')
    expect(starTraits(seed, 0).color).toBe(STAR_CLASSES.G.mid)
  })

  it('keeps the genesis stars real, by their place around Sol, whatever they are called later', () => {
    // Sol's neighbors that are stars are named in order (Galaxy._genesisName); here, all but the second.
    const around = neighbors(0)
    const isStar = (cell) => around.includes(cell) && cell !== around[1]
    expect(genesisName(around[0], isStar)).toBe('Alpha Centauri')
    expect(genesisName(around[1], isStar)).toBeUndefined()
    expect(genesisName(around[2], isStar)).toBe("Barnard's Star")
    expect(genesisName(around[5], isStar)).toBe('Sirius')
    expect(genesisName(99, isStar)).toBeUndefined()
    expect(starTraits(seed, around[5], 'Sirius').spectral).toBe('A')
    expect(starTraits(seed, around[2], "Barnard's Star").spectral).toBe('M')
    for (const name of Object.keys(REAL_STARS)) expect(SPECTRAL).toContain(REAL_STARS[name])
  })

  it('makes red dwarfs commonest and blue stars rarest, and hotter stars bigger', () => {
    const counts = Object.fromEntries(SPECTRAL.map((c) => [c, 0]))
    const sizes = Object.fromEntries(SPECTRAL.map((c) => [c, []]))
    for (let cell = 7; cell < 2007; cell++) {
      const { spectral, size, color } = starTraits(seed, cell)
      counts[spectral]++
      sizes[spectral].push(size)
      expect(color).toBe(STAR_CLASSES[spectral].mid)
      expect(size).toBeGreaterThanOrEqual(0.25)
      expect(size).toBeLessThanOrEqual(1)
    }
    expect(counts.M).toBeGreaterThan(counts.G)
    expect(counts.G).toBeGreaterThan(counts.A)
    expect(counts.B).toBeGreaterThan(counts.O)
    const average = (list) => list.reduce((a, b) => a + b, 0) / list.length
    expect(average(sizes.O)).toBeGreaterThan(average(sizes.G))
    expect(average(sizes.G)).toBeGreaterThan(average(sizes.M))
  })
})
