// The Ethereum-style address (H160) pallet-revive gives a Substrate account: what a contract sees as
// msg.sender when that account calls it, and what the personhood precompile is asked about.
// Usage: node h160.mjs <ss58 address>
import { AccountId } from 'polkadot-api'
import { keccak256, getAddress, hexlify } from 'ethers'

/** pallet-revive's AccountId32Mapper::to_address. */
export function h160Of(accountId32) {
  const bytes = typeof accountId32 === 'string' ? AccountId().enc(accountId32) : accountId32
  // An account made from an Ethereum key ends in twelve 0xEE bytes: its first 20 bytes are the H160.
  if (bytes.slice(20).every((b) => b === 0xee)) return getAddress(hexlify(bytes.slice(0, 20)))
  return getAddress('0x' + keccak256(bytes).slice(26))
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(h160Of(process.argv[2]))
