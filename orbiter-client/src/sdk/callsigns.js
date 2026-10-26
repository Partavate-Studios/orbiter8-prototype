// Every callsign in the game, for warning a new player that the name they're typing is taken. The
// contracts have no lookup by name and allow duplicates, so the only way to know is to read them all.
// That's fine while players are few; past MAX_CALLSIGNS it stops (see the contract wish list in
// UPGRADE_NOTES.md: a name lookup on chain is the real fix).
import AvatarControlsAbi from '@/sdk/chain/abi/AvatarControls.json'
import { readMany, readOnlyContract } from '@/sdk/chain/batch'

export const MAX_CALLSIGNS = 2000

/** A name as the game compares them: trimmed, inner runs of spaces collapsed. */
export function normalizeName(name) {
  return String(name).trim().replace(/\s+/g, ' ')
}

/**
 * The callsigns in use, lowercased, or null when there are too many to read.
 * @param {string} avatarsAddress  the AvatarControls contract
 * @returns {Promise<Set<string> | null>}
 */
export async function loadCallsigns(avatarsAddress) {
  const avatars = readOnlyContract(avatarsAddress, AvatarControlsAbi)
  const [count] = await readMany([{ contract: avatars, method: 'getAvatarCount' }])
  if (Number(count) > MAX_CALLSIGNS) return null
  const names = await readMany(
    Array.from({ length: Number(count) }, (_, id) => ({ contract: avatars, method: 'getAvatarNameById', args: [id] }))
  )
  return new Set(names.filter(Boolean).map((name) => normalizeName(name).toLowerCase()))
}
