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

  it('keeps only the most recently visited systems', () => {
    const map = createExploredMap({ chainId: 1, game: '0x1' }, memoryStorage())
    for (let id = 1; id <= 1000; id++) map.record(id, [id + 1])
    map.record(1, [2]) // revisiting system 1 makes it the most recent
    for (let id = 1001; id <= 1005; id++) map.record(id, [id + 1])
    expect(map.neighborsOf(1)).toEqual([2]) // kept: visited recently
    expect(map.neighborsOf(2)).toBe(null) // dropped: the oldest visits
    expect(map.neighborsOf(6)).toBe(null)
    expect(map.neighborsOf(7)).toEqual([8])
    expect(map.neighborsOf(1005)).toEqual([1006])
  })

  it('works without storage', () => {
    const map = createExploredMap({ chainId: 1, game: '0x1' }, null)
    map.record(1, [2])
    expect(map.neighborsOf(1)).toEqual([2])
  })
})
