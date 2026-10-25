import { describe, expect, it } from 'vitest'
import { toPlain, toPlainEvent } from './convert'

describe('toPlain', () => {
  it('turns bigints into Numbers, recursively through arrays', () => {
    expect(toPlain(7n)).toBe(7)
    expect(toPlain(['Earth', 3n, [12n, 0n, 1n]])).toEqual(['Earth', 3, [12, 0, 1]])
  })

  it('leaves strings, booleans and addresses alone', () => {
    expect(toPlain('0xAbC')).toBe('0xAbC')
    expect(toPlain(true)).toBe(true)
  })

  it('refuses values that a Number cannot hold exactly', () => {
    expect(() => toPlain(2n ** 60n)).toThrow(RangeError)
  })
})

describe('toPlainEvent', () => {
  it('exposes event args as plain returnValues, like web3 did', () => {
    const log = {
      eventName: 'ChatLog',
      blockNumber: 42,
      transactionHash: '0x01',
      args: { toObject: () => ({ _sender: '0xabc', _message: 'hi', _value: 5n }) }
    }
    expect(toPlainEvent(log)).toEqual({
      event: 'ChatLog',
      blockNumber: 42,
      transactionHash: '0x01',
      returnValues: { _sender: '0xabc', _message: 'hi', _value: 5 }
    })
  })
})
