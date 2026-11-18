import { describe, it, expect } from 'vitest'
import { withGasMargin } from './gas.js'

describe('withGasMargin', () => {
  it("asks for 30% more than the node's estimate, once, and leaves read-only providers alone", async () => {
    const signer = { sendTransaction() {}, estimateGas: async () => 5_000n }
    withGasMargin(withGasMargin(signer))
    expect(await signer.estimateGas({})).toBe(6_500n)
    const provider = { estimateGas: async () => 5_000n }
    expect(withGasMargin(provider)).toBe(provider)
    expect(await provider.estimateGas({})).toBe(5_000n)
  })
})
