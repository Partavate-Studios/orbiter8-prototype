import { describe, expect, it } from 'vitest'
import { marketTokenUrl } from './networks'
import { cardMenu } from '@/components/star-map/hud/card-ui/menus/card-menu'

const PLANETS = '0xc820005F1EEA88EF4541398F3305d620E5F441d0'

describe('NFT market links', () => {
  it('has no link on networks without a market, or before the token address is known', () => {
    expect(marketTokenUrl(97, PLANETS, 3)).toBe(null)
    expect(marketTokenUrl(11155111, null, 3)).toBe(null)
  })

  it("offers the market in a planet's card menu only when the network has one", () => {
    const planet = { type: 'planet', objectId: 259, owner: '0xabc', isMine: false, hasStation: false, moons: [] }
    const commands = (options) => cardMenu(planet, options).map((item) => item.text)
    expect(commands({ marketName: 'Rarible' })).toContain('View on Rarible')
    expect(commands({})).not.toContain('View on Rarible')
  })

  it('offers it for ships too, whoever owns them', () => {
    const ship = (isMine) => ({ type: 'ship', objectId: 5, owner: '0xabc', isMine, moons: [] })
    expect(cardMenu(ship(true), { marketName: 'Rarible' }).map((item) => item.text)).toContain('View on Rarible')
    expect(cardMenu(ship(false), { marketName: 'Rarible' }).map((item) => item.text)).toContain('View on Rarible')
  })
})
