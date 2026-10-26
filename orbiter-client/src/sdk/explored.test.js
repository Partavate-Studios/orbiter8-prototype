import { describe, expect, it } from 'vitest'
import { createExploredMap } from './explored'

function memoryStorage() {
  const items = {}
  return { getItem: (k) => items[k] ?? null, setItem: (k, v) => (items[k] = String(v)) }
}

describe('explored map', () => {
  it('remembers each visited system’s neighbors, per network and deployment', () => {
    const storage = memoryStorage()
    const sepolia = createExploredMap({ chainId: 11155111, game: '0xAB' }, storage)
    sepolia.record(7, [2, 0, '9', 0])
    expect(sepolia.neighborsOf(7)).toEqual([2, 9])
    expect(sepolia.neighborsOf(8)).toBe(null)
    // a new session on the same deployment sees it; another network doesn't
    expect(createExploredMap({ chainId: 11155111, game: '0xab' }, storage).neighborsOf('7')).toEqual([2, 9])
    expect(createExploredMap({ chainId: 1337, game: '0xab' }, storage).neighborsOf(7)).toBe(null)
  })

  it('works without storage', () => {
    const map = createExploredMap({ chainId: 1, game: '0x1' }, null)
    map.record(1, [2])
    expect(map.neighborsOf(1)).toEqual([2])
  })
})
