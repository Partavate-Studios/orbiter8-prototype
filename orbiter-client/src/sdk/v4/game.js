// The Demo 4 contracts, read and written through ethers (docs/demo4-plan.md, section 8). No Vue: the
// stores decide what to do with the results. `runner` is a signer (to move) or a provider (to read).
import { Contract } from 'ethers'
import GalaxyAbi from './abi/Galaxy.json'
import PilotsAbi from './abi/Pilots.json'
import { fetchRound } from './drand'

export const STATE = { UNDECIDED: 0, EMPTY: 1, STAR: 2, BLACK_HOLE: 3 }
/** Cells per region read; the contracts cap it at 10. */
export const REGION_RADIUS = 10
/** At most this many pending scans are resolved along with one move (each costs about 400k gas). */
export const PROOFS_PER_MOVE = 3

const ZERO = '0x0000000000000000000000000000000000000000'

/** A cell from a region read, as plain data. */
function toCell(c) {
  return {
    cell: Number(c.cell),
    state: Number(c.state),
    visited: c.visited,
    scanned: c.scanned,
    scanRound: Number(c.scanRound),
    discoverer: c.discoverer === ZERO ? null : c.discoverer.toLowerCase(),
    discoveredAt: Number(c.discoveredAt),
    partner: Number(c.partner),
    named: c.named
  }
}

/**
 * @param {import('ethers').ContractRunner} runner
 * @param {{ galaxy: string, pilots: string }} addresses
 */
export function createGame(runner, addresses) {
  const galaxy = new Contract(addresses.galaxy, GalaxyAbi, runner)
  const pilots = new Contract(addresses.pilots, PilotsAbi, runner)

  const game = {
    galaxy,
    pilots,

    async universe() {
      const [seed, , scanDelay] = await galaxy.universe()
      return { seed, scanDelay: Number(scanDelay) }
    },

    /** The pilot flying from `address`, or null if they haven't registered. */
    async pilot(address) {
      const p = await pilots.pilotOf(address)
      if (!p.registered) return null
      return {
        callsign: p.callsign,
        ship: { name: p.ship.name, cell: Number(p.ship.cell), range: Number(p.ship.range) }
      }
    },

    /** Every decided cell within REGION_RADIUS of `center`, in one call. */
    async region(center) {
      return (await galaxy.region(center, REGION_RADIUS)).map(toCell)
    },

    async nameOf(cell) {
      return galaxy.nameOf(cell)
    },

    /** What a pending scan will decide, once its round is published (null before). */
    async previewScan(cell, scanRound) {
      const signature = await fetchRound(scanRound)
      if (!signature) return null
      const [states, partners] = await galaxy.previewScan(cell, signature)
      return { states: states.map(Number), partners: partners.map(Number) }
    },

    /**
     * Proofs for pending scans among `cells` (from region reads) whose rounds are published, to send
     * along with the next move: the explorer never approves a scan separately (D21).
     */
    async proofsFor(cells) {
      const pending = cells.filter((c) => c.visited && !c.scanned).sort((a, b) => a.scanRound - b.scanRound)
      const proofs = []
      for (const c of pending) {
        if (proofs.length >= PROOFS_PER_MOVE) break
        const signature = await fetchRound(c.scanRound).catch(() => null)
        if (signature) proofs.push({ cell: c.cell, signature })
      }
      return proofs
    },

    // Moves resolve after they're mined, with the receipt.
    async register(callsign, shipName) {
      return (await pilots.register(callsign, shipName)).wait()
    },
    async jump(to, proofs = []) {
      return (await pilots.jump(to, proofs)).wait()
    },
    async traverse(proofs = []) {
      return (await pilots.traverse(proofs)).wait()
    },
    async renameStar(cell, name, proofs = []) {
      return (await pilots.renameStar(cell, name, proofs)).wait()
    },
    async resolveScans(proofs) {
      return (await pilots.resolveScans(proofs)).wait()
    }
  }
  return game
}
