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
