import { describe, expect, it } from 'vitest'
import { marketTokenUrl } from './networks'

const PLANETS = '0xc820005F1EEA88EF4541398F3305d620E5F441d0'

describe('NFT market links', () => {
  it('has no link on networks without a market, or before the token address is known', () => {
    expect(marketTokenUrl(97, PLANETS, 3)).toBe(null)
    expect(marketTokenUrl(11155111, null, 3)).toBe(null)
  })
})
