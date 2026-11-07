import { game } from '@/sdk/client'

/**
 * A new pilot's first goals, ticked off from the pilot's own state (the Player store): shown by
 * the help menu (hud/menus/help-menu.svg.vue), and counted on the HUD's "?" button until done.
 */
export function firstSteps(player) {
  const ship = player.pilot.ship
  void player.cellsVersion
  const charted = [...game.state.cells.values()].some((c) => c.cell !== 0 && c.discoverer === player.account)
  return [
    {
      title: 'Start a session',
      lines: ['From your ship’s menu: one approval, then', 'no wallet popups for 4 hours.'],
      done: player.sessionLive
    },
    {
      title: 'Trade at a port',
      lines: ['Buy where it’s cheap; sell where the port', 'code shows a yellow B.'],
      done: player.credits > 1000 || ship.cargo > 0
    },
    {
      title: 'Fit more holds',
      lines: ['At the I.S.S. shipyard, orbiting Earth.'],
      done: ship.bays > 5
    },
    {
      title: 'Jump to a neighboring star',
      lines: ['And chart what’s around it.'],
      done: charted
    },
    {
      title: 'Claim a planet',
      lines: ['2,000 credits. Then found a Citadel from', 'its Colony menu.'],
      done: player.ownsPlanets
    }
  ]
}
