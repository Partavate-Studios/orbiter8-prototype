import { describe, expect, it } from 'vitest'
import { Interface } from 'ethers'
import { describeRevert } from './reverts'

const pilots = new Interface([
  'error BadName(string name)',
  'error NoRoom(uint256 free)',
  'error CallsignTaken(string callsign)',
  'error Unmapped(uint256 a, address b)'
])
const errorWith = (data) => ({ code: 'CALL_EXCEPTION', data })

describe('describeRevert', () => {
  it('puts a decodable custom error into words', () => {
    expect(describeRevert(errorWith(pilots.encodeErrorResult('CallsignTaken', ['Ada'])), [pilots])).toBe('Ada is taken.')
    expect(describeRevert(errorWith(pilots.encodeErrorResult('NoRoom', [2])), [pilots])).toBe('Only 2 free holds.')
    expect(describeRevert(errorWith(pilots.encodeErrorResult('NoRoom', [0])), [pilots])).toBe('No free holds.')
  })
  it('falls back to the error name and its arguments', () => {
    const data = pilots.encodeErrorResult('Unmapped', [7, '0x0000000000000000000000000000000000000001'])
    expect(describeRevert(errorWith(data), [pilots])).toBe('Unmapped (7, 0x0000000000000000000000000000000000000001)')
  })
  it('finds the data where ethers nests it, and leaves other errors alone', () => {
    const data = pilots.encodeErrorResult('BadName', ['Bo'])
    expect(describeRevert({ info: { error: { data } } }, [pilots])).toMatch(/^That name isn't allowed/)
    expect(describeRevert({ code: 'ACTION_REJECTED' }, [pilots])).toBe(null)
    expect(describeRevert(errorWith('0x12345678'), [pilots])).toBe(null)
  })
})
