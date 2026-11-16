// Orders: the next sensible step for a pilot, from where they stand. Not a tutorial that has to be
// clicked through; a single line that changes as the pilot does, and goes quiet once they're established.

/**
 * @param {{ pilot: object, credits: number, deeds: number, traded: boolean, holdings: object[], rangePrice: number | null }} s
 * @returns {{ title: string, hint: string, tab: string } | null}
 */
export function nextOrder(s) {
  const ship = s.pilot?.ship
  if (!ship) return null
  const armed = ship.loadout.railguns + ship.loadout.missiles + ship.loadout.drones > 0
  const citadel = s.holdings.some((p) => p.level >= 1 || p.building === 1)
  if (ship.bays <= 5 && !s.traded && ship.cargo === 0)
    return { title: 'Make your first trade', hint: 'Sol’s nine stations are all in reach from here. Market lists the runs that pay.', tab: 'market' }
  if (ship.bays < 20)
    return { title: 'Fit more bays', hint: 'Every bay is another unit per run. The I.S.S. shipyard at Earth fits them: Ship → Shipyard.', tab: 'ship' }
  if (ship.range < 2)
    return {
      title: 'Reach range 2',
      hint: `Engines that jump two cells open the galaxy. ${s.rangePrice?.toLocaleString('en-US') ?? ''} credits at the shipyard; keep trading, keep adding bays.`,
      tab: s.credits >= (s.rangePrice ?? Infinity) ? 'ship' : 'market'
    }
  if (s.deeds === 0)
    return { title: 'Chart a star and claim a planet', hint: 'Open rings on the Galaxy chart are stars nobody has visited. First there has first claim for ten minutes.', tab: 'galaxy' }
  if (!citadel)
    return { title: 'Raise a Citadel', hint: 'Your planet’s project lists what it needs: people from Earth, equipment and organics from the ports.', tab: 'domain' }
  if (!armed) return { title: 'Arm your ship', hint: 'A planet without defenses can be taken. The I.S.S. armory fits railguns and missile racks.', tab: 'ship' }
  return null
}
