import { describe, expect, it, vi } from 'vitest'

vi.mock('@/sdk/chain/wallet', () => ({
  getSession: () => ({ chainId: 1337, provider: { getCode: async () => '0x' } }) // no Multicall3: plain calls
}))

const { rankPlayers, HOUSE_AVATAR_NAME } = await import('./leaderboard')
const { readMany } = await import('./chain/batch')

const player = (name, planets, credits) => ({ address: '0x' + name, name, planets, credits, ports: 0 })

describe('rankPlayers', () => {
  it('ranks by planets, then credits, then name; leaves the house account off', () => {
    const players = [
      player('Bo', 2, 50),
      player(HOUSE_AVATAR_NAME, 9, 0),
      player('Al', 2, 50),
      player('Cy', 3, 0),
      player('Di', 2, 90)
    ]
    expect(rankPlayers(players).map((p) => p.name)).toEqual(['Cy', 'Di', 'Al', 'Bo'])
  })

  it('can rank by credits instead', () => {
    const players = [player('Al', 5, 10), player('Bo', 1, 300), player('Cy', 0, 300)]
    expect(rankPlayers(players, 'credits').map((p) => p.name)).toEqual(['Bo', 'Cy', 'Al'])
  })
})

describe('readMany without Multicall3', () => {
  it('keeps results in order, unwraps single values, and gives null for a call that reverts', async () => {
    const contract = {
      double: async (n) => [BigInt(n * 2)],
      pair: async () => [1n, 'two'],
      broken: async () => {
        throw new Error('execution reverted')
      }
    }
    const results = await readMany([
      { contract, method: 'double', args: [21] },
      { contract, method: 'broken' },
      { contract, method: 'pair' }
    ])
    expect(results).toEqual([42, null, [1, 'two']])
  })
})
