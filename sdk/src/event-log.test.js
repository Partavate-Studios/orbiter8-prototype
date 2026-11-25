import { describe, expect, it } from 'vitest'
import { createEventLog, queryChunked, CHUNK_BLOCKS } from './event-log'

describe('queryChunked', () => {
  it('splits a range into chunks a provider accepts, inclusive at both ends', async () => {
    const ranges = []
    const contract = { queryFilter: async (f, from, to) => (ranges.push([from, to]), []) }
    await queryChunked(contract, '*', 10, 10 + CHUNK_BLOCKS * 2 + 4)
    expect(ranges).toEqual([
      [10, 10 + CHUNK_BLOCKS - 1],
      [10 + CHUNK_BLOCKS, 10 + CHUNK_BLOCKS * 2 - 1],
      [10 + CHUNK_BLOCKS * 2, 10 + CHUNK_BLOCKS * 2 + 4]
    ])
  })

  it('reads a long range in one call where the network allows it', async () => {
    const ranges = []
    const contract = { queryFilter: async (f, from, to) => (ranges.push([from, to]), []) }
    await queryChunked(contract, '*', 0, 209_999, 100_000)
    expect(ranges).toEqual([
      [0, 99_999],
      [100_000, 199_999],
      [200_000, 209_999]
    ])
  })

  it('reads a long chunk the node refuses again in default chunks, keeping every event in order', async () => {
    const contract = {
      queryFilter: async (f, from, to) => {
        if (to - from + 1 > CHUNK_BLOCKS) throw new Error('block range too large')
        return [from]
      }
    }
    const logs = await queryChunked(contract, '*', 0, CHUNK_BLOCKS * 3 - 1, CHUNK_BLOCKS * 10)
    expect(logs).toEqual([0, CHUNK_BLOCKS, CHUNK_BLOCKS * 2])
  })
})

describe('createEventLog', () => {
  it('reads the window once, then only new blocks, and drops what falls out of the window', async () => {
    const reads = []
    const read = async (from, to) => {
      reads.push([from, to])
      return Array.from({ length: to - from + 1 }, (_, i) => ({ block: from + i }))
    }
    const log = createEventLog({ read, lookback: 5 })
    expect((await log.update(100)).map((e) => e.block)).toEqual([96, 97, 98, 99, 100])
    expect((await log.update(100)).length).toBe(5) // nothing new: no read
    expect((await log.update(102)).map((e) => e.block)).toEqual([98, 99, 100, 101, 102])
    expect(reads).toEqual([
      [96, 100],
      [101, 102]
    ])
  })
  it('never reads before the deployment', async () => {
    const reads = []
    const log = createEventLog({ read: async (from, to) => (reads.push([from, to]), []), lookback: 1000, startBlock: 500 })
    await log.update(700)
    expect(reads).toEqual([[500, 700]])
  })
})
